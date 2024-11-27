import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

export interface Exercise {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sets?: number;
  reps?: number;
  targetMuscles: string[];
}

export interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
  exercises: Exercise[];
  poseName: string;
}

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const parseContent = (content: string, poseName: string): AnalysisResult => {
  try {
    console.log('Parsing content:', content); // Debug log

    const lines = content.split('\n');
    const result: Partial<AnalysisResult> = {
      recommendations: [],
      exercises: [],
      feedback: '',
      poseName: poseName
    };

    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) continue;

      // Try to parse mobility age
      if (trimmed.toLowerCase().includes('mobility_age')) {
        const match = trimmed.match(/\d+/);
        if (match) {
          result.mobilityAge = parseInt(match[0]);
        }
        continue;
      }

      // Try to parse good form
      if (trimmed.toLowerCase().includes('good_form')) {
        result.isGoodForm = trimmed.toLowerCase().includes('true');
        continue;
      }

      // Identify sections
      if (trimmed.toLowerCase().startsWith('feedback:')) {
        currentSection = 'feedback';
        continue;
      }
      if (trimmed.toLowerCase().startsWith('recommendations:')) {
        currentSection = 'recommendations';
        continue;
      }
      if (trimmed.toLowerCase().startsWith('exercises:')) {
        currentSection = 'exercises';
        continue;
      }

      // Parse content based on current section
      switch (currentSection) {
        case 'feedback':
          result.feedback += (result.feedback ? ' ' : '') + trimmed;
          break;
        case 'recommendations':
          if (!trimmed.startsWith('-') && !trimmed.toLowerCase().includes('recommendations')) {
            result.recommendations?.push(trimmed);
          }
          break;
        case 'exercises':
          if (trimmed.includes('|')) {
            try {
              const [name, description, difficulty, setsReps, muscles] = trimmed.split('|').map(s => s.trim());
              let sets = undefined;
              let reps = undefined;
              
              if (setsReps) {
                const [s, r] = setsReps.split('x').map(n => parseInt(n));
                if (!isNaN(s)) sets = s;
                if (!isNaN(r)) reps = r;
              }

              const exercise: Exercise = {
                name,
                description,
                difficulty: (difficulty?.toLowerCase() as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
                sets,
                reps,
                targetMuscles: muscles ? muscles.split(',').map(m => m.trim()) : []
              };

              result.exercises?.push(exercise);
            } catch (error) {
              console.error('Error parsing exercise:', trimmed, error);
            }
          }
          break;
      }
    }

    // Validate required fields with better error messages
    if (result.mobilityAge === undefined) {
      throw new Error('Missing mobility age in analysis result');
    }
    if (!result.feedback) {
      throw new Error('Missing feedback in analysis result');
    }
    if (result.isGoodForm === undefined) {
      throw new Error('Missing good form indicator in analysis result');
    }
    if (!result.recommendations?.length) {
      console.warn('No recommendations provided');
      result.recommendations = ['Focus on maintaining proper form'];
    }
    if (!result.exercises?.length) {
      console.warn('No exercises provided');
      result.exercises = [{
        name: 'Basic Mobility Exercise',
        description: 'Practice the movement with proper form',
        difficulty: 'beginner',
        targetMuscles: ['full body']
      }];
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error('Error parsing content:', error);
    console.error('Raw content:', content);
    throw new AnalysisError(`Failed to parse analysis result: ${error.message}`);
  }
};

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AnalysisError('API key not configured');
    }

    const openai = new OpenAI({ apiKey: apiKey });
    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are an elite physiotherapist and mobility expert. Analyze the provided pose image and provide a detailed assessment including:

1. Overall mobility score as an equivalent "mobility age" (where younger is better)
2. Whether the form is good enough to proceed
3. Detailed feedback on form and alignment
4. Specific recommendations for improvement
5. 2-3 targeted exercises to improve this specific movement, including:
   - Exercise name
   - Clear description
   - Difficulty level (beginner/intermediate/advanced)
   - Recommended sets and reps
   - Target muscle groups

Format your response exactly as follows:

MOBILITY_AGE: [age]
GOOD_FORM: [true/false]
FEEDBACK: [detailed feedback]
RECOMMENDATIONS:
[recommendation 1]
[recommendation 2]
EXERCISES:
[name]|[description]|[difficulty]|[sets]x[reps]|[target muscles]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this ${poseName} pose and provide a detailed mobility report.`,
        },
      ],
      max_tokens: 1500
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content); // Debug log

    const result = parseContent(content, poseName);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof AnalysisError ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      })
    };
  }
};

export { handler };
