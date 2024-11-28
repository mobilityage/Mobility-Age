// netlify/functions/analyze-pose.ts

import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
  exercises: {
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    sets?: number;
    reps?: number;
    steps: string[];
    frequency: string;
    targetMuscles: string[];
    progressionMetrics?: string;
  }[];
  poseName: string;
  comparativeAge?: {
    difference: number;
    assessment: string;
  };
}

class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const parseContent = (content: string, poseName: string, biologicalAge?: number): AnalysisResult => {
  // Existing parsing logic...
};

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AnalysisError('API key not configured');
    }

    const openai = new OpenAI({ apiKey });
    let { photo, poseName, biologicalAge } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    // Remove data:image prefix if it exists
    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    const systemPrompt = `You are a physiotherapist analyzing a mobility pose. Please provide a detailed analysis, focusing on the following aspects:
- Ensure to identify key body positions and movements.
- Provide constructive feedback on the pose.
- Suggest improvements and exercises tailored to the individual's mobility.
Respond EXACTLY in this format:
Age: [number between 20-80]
Form: [good/needs improvement]
Feedback: [2-3 sentences about their form]
Recommendations:
- [improvement 1]
- [improvement 2]
- [improvement 3]
Exercise 1:
Name: [specific exercise name]
Description: [1-2 sentences]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Steps:
- [step 1]
- [step 2]
- [step 3]
Target Muscles: [main muscle groups]
Frequency: [how often to perform]
Progression Metrics: [how to progress]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this ${poseName} pose.${biologicalAge ? ` The person's biological age is ${biologicalAge}.` : ''}`,
          image_url: { url: `data:image/jpeg;base64,${photo}` }
        }
      ],
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    const result = parseContent(content, poseName, biologicalAge);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    // Error handling...
  }
};

export { handler };
