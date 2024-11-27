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

const parseContent = (content: string): AnalysisResult => {
  try {
    const lines = content.split('\n');
    let currentSection = '';
    const result: Partial<AnalysisResult> = {
      recommendations: [],
      exercises: []
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('MOBILITY_AGE:')) {
        result.mobilityAge = parseInt(trimmed.split(':')[1]);
      } else if (trimmed.startsWith('GOOD_FORM:')) {
        result.isGoodForm = trimmed.split(':')[1].trim().toLowerCase() === 'true';
      } else if (trimmed.startsWith('FEEDBACK:')) {
        currentSection = 'feedback';
        result.feedback = '';
      } else if (trimmed.startsWith('RECOMMENDATIONS:')) {
        currentSection = 'recommendations';
      } else if (trimmed.startsWith('EXERCISES:')) {
        currentSection = 'exercises';
      } else if (trimmed && currentSection === 'feedback') {
        result.feedback = (result.feedback || '') + trimmed;
      } else if (trimmed && currentSection === 'recommendations' && !trimmed.startsWith('-')) {
        result.recommendations?.push(trimmed);
      } else if (trimmed && currentSection === 'exercises' && trimmed.includes('|')) {
        const [name, description, difficulty, setsReps, muscles] = trimmed.split('|').map(s => s.trim());
        const [sets, reps] = setsReps.split('x').map(n => parseInt(n));
        result.exercises?.push({
          name,
          description,
          difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
          sets,
          reps,
          targetMuscles: muscles.split(',').map(m => m.trim())
        });
      }
    }

    if (!result.mobilityAge || !result.feedback || !result.isGoodForm === undefined) {
      throw new Error('Missing required fields in analysis result');
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error('Error parsing content:', error);
    throw new AnalysisError('Failed to parse analysis result');
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

    const result = parseContent(content);
    result.poseName = poseName;

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
