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

const parseContent = (content: string): AnalysisResult => {
// More robust section splitting
const sections = {
  form: content.match(/Form Analysis:?([\s\S]*?)(?=Mobility Age|$)/i)?.[1]?.trim() || '',
  mobility: content.match(/Mobility Age:?([\s\S]*?)(?=Exercise Prescription|$)/i)?.[1]?.trim() || '',
  exercises: content.match(/Exercise Prescription:?([\s\S]*?)$/i)?.[1]?.trim() || ''
};

// Extract mobility age more reliably
const ageMatch = sections.mobility.match(/\b([2-8][0-9]|20)\b/);
const mobilityAge = ageMatch ? parseInt(ageMatch[0]) : 35;

// Better feedback extraction
const feedback = sections.form
  .split(/\n|-/)
  .filter(line => line.trim().length > 0)
  .join(' ')
  .trim();

// More structured exercise parsing
const exercises = sections.exercises
  .split(/EXERCISE \d+:/i)
  .filter(Boolean)
  .map(ex => {
    return ex
      .split(/\n-\s*/)
      .filter(line => line.trim().length > 0)
      .map(line => line.trim())
      .join('. ');
  })
  .filter(ex => ex.length > 20);

return {
  mobilityAge,
  feedback,
  recommendations: exercises.length ? exercises : [
    "Exercise 1: Perform mobility-specific stretches focusing on identified limitations. 3 sets of 30 seconds each.",
    "Exercise 2: Practice the movement pattern with controlled tempo. 3 sets of 8-10 repetitions."
  ],
  isGoodForm: mobilityAge <= 40
};
};

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
  console.log('Input payload:', { poseName, photoLength: photo?.length });

  const systemPrompt = `You are an elite physiotherapist specializing in mobility assessment and exercise prescription. Analyze the provided image and respond ONLY in this exact format:

1. Form Analysis:
- Point by point analysis of visible joint positions
- Specific limitations observed
- Clear form quality score (1-10)

2. Mobility Age (20-80):
- Specific numerical age
- Key factors for age assessment

3. Exercise Prescription:
EXERCISE 1:
- Name: [specific exercise name]
- Setup: [clear setup instructions]
- Movement: [specific movement pattern]
- Sets/Reps: [exact numbers]
- Form Cues: [3-4 specific cues]
- Progress When: [clear progression criteria]

EXERCISE 2:
[same format as Exercise 1]

Do not deviate from this format. Be specific and detailed in your analysis.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // Keeping original model as requested
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
            text: `Analyze this ${poseName} pose and provide a detailed mobility report.`
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
    max_tokens: 1500 // Increased token limit
  });

  console.log('Raw API response:', completion.choices[0].message.content);

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new AnalysisError('No content received from API');
  }

  const result = parseContent(content);

  // Validate result
  if (!result.feedback || result.feedback.length < 10) {
    throw new AnalysisError('Invalid feedback received');
  }

  if (result.recommendations.length === 0) {
    throw new AnalysisError('No exercise recommendations generated');
  }

  console.log('Final result:', result);

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Add CORS headers if needed
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST'
    },
    body: JSON.stringify(result)
  };

} catch (error) {
  console.error('Function error:', error);
  return {
    statusCode: 500,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Add CORS headers if needed
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST'
    },
    body: JSON.stringify({ 
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    })
  };
}
};

export { handler };
