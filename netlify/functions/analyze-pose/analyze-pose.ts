import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

export interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
}

export interface PoseAnalysis {
  photo: string;
  poseName: string;
  poseDescription: string;
}

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const openai = new OpenAI({ apiKey: apiKey });
    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new Error('Missing required fields');
    }

    console.log('Starting analysis for:', poseName);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an elite physiotherapist specializing in mobility assessment and exercise prescription. You have extensive experience creating personalized exercise programs that directly target mobility limitations.

For each exercise you prescribe, you must include:
- Clear name of the exercise
- Detailed setup instructions
- Specific movement instructions
- Sets and repetitions
- Key form cues
- Signs of proper execution
- When to progress difficulty`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this ${poseName} pose and provide a detailed mobility report.

Your response must follow this exact format:

1. Form Analysis:
- Evaluate visible joint positions and alignment
- Note any limitations or compensations
- Score overall form quality

2. Mobility Age (20-80):
- Provide specific age based on observed movement quality
- Explain key factors influencing this age assessment

3. Exercise Prescription:
EXERCISE 1:
- Name:
- Setup:
- Movement:
- Sets/Reps:
- Form Cues:
- Progress When:

EXERCISE 2:
- Name:
- Setup:
- Movement:
- Sets/Reps:
- Form Cues:
- Progress When:

Both exercises should directly address limitations observed in the pose assessment.`
            },
            {
              type: "image_url",
              image_url: {
                url: photo,
              },
            }
          ],
        },
      ],
      max_tokens: 500
    });

    console.log('Raw API response:', completion.choices[0].message.content);
    
    const content = completion.choices[0].message.content || '';
    
    // Extract mobility age
    const mobilitySection = content.split('Mobility Age')[1]?.split('Exercise')[0] || '';
    console.log('Mobility section:', mobilitySection);
    const ageMatch = mobilitySection.match(/\b([2-8][0-9]|20)\b/);
    console.log('Age match:', ageMatch);
    const mobilityAge = ageMatch ? parseInt(ageMatch[0]) : 35;
    
    // Extract main feedback
    const formSection = content.split('Form Analysis')[1]?.split('Mobility Age')[0] || '';
    console.log('Form section:', formSection);
    const feedback = formSection.split('.')[0] + '.';

    // Extract exercises
    const exerciseSection = content.split('Exercise Prescription:')[1] || '';
    console.log('Exercise section:', exerciseSection);
    const exercises = exerciseSection
      .split(/EXERCISE \d+:/i)
      .filter(Boolean)
      .map(ex => {
        const parts = ex.split(/\n-\s*/);
        const relevantParts = parts
          .filter(p => p.trim().length > 0)
          .map(p => p.trim());
        return relevantParts.join('. ');
      })
      .filter(ex => ex.length > 20);

    console.log('Parsed exercises:', exercises);

    const recommendations = exercises.length ? exercises : [
      "Exercise 1: Perform mobility-specific stretches focusing on identified limitations. 3 sets of 30 seconds each.",
      "Exercise 2: Practice the movement pattern with controlled tempo. 3 sets of 8-10 repetitions."
    ];

    const isGoodForm = mobilityAge <= 40;

    const result = {
      mobilityAge,
      feedback,
      recommendations,
      isGoodForm
    };

    console.log('Final result:', result);

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
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      })
    };
  }
};

export { handler };
