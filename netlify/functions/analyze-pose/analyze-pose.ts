import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

export interface AnalysisResult {
mobilityAge: number;
feedback: string;
recommendations: string[];
isGoodForm: boolean;
}

export class AnalysisError extends Error {
constructor(message: string) {
  super(message);
  this.name = 'AnalysisError';
}
}

const parseContent = (content: string): AnalysisResult => {
// Parsing logic remains the same
// ...
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
  const { photo, poseName } = JSON.parse(event.body || '{}');

  if (!photo || !poseName) {
    throw new AnalysisError('Missing required fields: photo or poseName');
  }

  console.log('Starting analysis for:', poseName);

  const systemPrompt = `You are an elite physiotherapist...`; // Your system prompt here

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // Keeping original model as requested
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

  // Validate result
  if (!result.feedback || result.feedback.length < 10) {
    throw new AnalysisError('Invalid feedback received');
  }

  if (result.recommendations.length === 0) {
    throw new AnalysisError('No exercise recommendations generated');
  }

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
