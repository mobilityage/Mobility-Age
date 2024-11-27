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
    console.log('Parsing content:', content);
    const lines = content.split('\n');
    console.log('Content lines:', lines.map(line => line.trim()).filter(Boolean));

    // If the content is an error message from GPT, throw an error
    if (content.toLowerCase().includes("without an image") || content.toLowerCase().includes("cannot provide")) {
      throw new Error("Image analysis failed. Please try again.");
    }

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

      console.log('Processing line:', trimmed);

      // Try to parse mobility age
      if (trimmed.toLowerCase().includes('mobility_age')) {
        const match = trimmed.match(/\d+/);
        if (match) {
          result.mobilityAge = parseInt(match[0]);
          console.log('Found mobility age:', result.mobilityAge);
        } else {
          console.log('Failed to extract number from mobility age line:', trimmed);
        }
        continue;
      }

      // Try to parse good form
      if (trimmed.toLowerCase().includes('good_form')) {
        result.isGoodForm = trimmed.toLowerCase().includes('true');
        console.log('Found good form:', result.isGoodForm);
        continue;
      }

      // Identify sections
      if (trimmed.toLowerCase().startsWith('feedback:')) {
        currentSection = 'feedback';
        console.log('Entering feedback section');
        continue;
      }
      if (trimmed.toLowerCase().startsWith('recommendations:')) {
        currentSection = 'recommendations';
        console.log('Entering recommendations section');
        continue;
      }
      if (trimmed.toLowerCase().startsWith('exercises:')) {
        currentSection = 'exercises';
        console.log('Entering exercises section');
        continue;
      }

      // Parse content based on current section
      switch (currentSection) {
        case 'feedback':
          result.feedback += (result.feedback ? ' ' : '') + trimmed;
          console.log('Added feedback:', trimmed);
          break;
        case 'recommendations':
          if (!trimmed.startsWith('-') && !trimmed.toLowerCase().includes('recommendations')) {
            result.recommendations?.push(trimmed);
            console.log('Added recommendation:', trimmed);
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
              console.log('Added exercise:', exercise);
            } catch (error) {
              console.error('Error parsing exercise:', trimmed, error);
            }
          }
          break;
      }
    }

    console.log('Final result before validation:', result);

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

    const systemPrompt = `You are an elite physiotherapist and mobility expert. You must respond in exactly this format using these exact labels:

MOBILITY_AGE: [number between 20-80]
GOOD_FORM: [true or false]
FEEDBACK: [2-3 sentences about their form]
RECOMMENDATIONS:
[single line recommendation 1]
[single line recommendation 2]
EXERCISES:
[exercise name]|[2-3 sentence description]|[beginner or intermediate or advanced]|[sets]x[reps]|[muscle1, muscle2]
[exercise name]|[2-3 sentence description]|[beginner or intermediate or advanced]|[sets]x[reps]|[muscle1, muscle2]

Important:
- MOBILITY_AGE must be a number
- GOOD_FORM must be true or false
- Each exercise must follow the exact format with | separators
- Don't add any additional text or labels
- Don't deviate from this format`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this ${poseName} pose. ${poseDescription}`
            },
            {
              type: "image_url",
              image_url: {
                "url": photo
              }
            }
          ]
        },
      ],
      max_tokens: 1500
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);

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
