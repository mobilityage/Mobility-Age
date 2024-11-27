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
try {
  // Extract mobility age (look for numbers followed by "years" or similar)
  const ageMatch = content.match(/(\d+)(?:\s*(?:years|yrs|yr|y))/i);
  const mobilityAge = ageMatch ? parseInt(ageMatch[1]) : 35;

  // Extract feedback (first substantial paragraph)
  const feedbackMatch = content.match(/[^.!?]+[.!?]+/g);
  const feedback = feedbackMatch ? feedbackMatch[0].trim() : '';

  // Extract recommendations (look for bullet points or numbered lists)
  const recommendations = content
    .split(/[\n\r]+/)
    .filter(line => line.match(/^[-•*\d.]\s+/))
    .map(line => line.replace(/^[-•*\d.]\s+/, '').trim());

  // Determine if form is good (look for positive indicators)
  const isGoodForm = content.toLowerCase().includes('good form') || 
                    content.toLowerCase().includes('excellent') ||
                    content.toLowerCase().includes('perfect');

  return {
    mobilityAge,
    feedback,
    recommendations: recommendations.length ? recommendations : ['Maintain current form'],
    isGoodForm
  };
} catch (error) {
  console.error('Error parsing content:', error);
  throw new AnalysisError('Failed to parse analysis response');
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

  const openai = new OpenAI({ apiKey });
  const { photo, poseName } = JSON.parse(event.body || '{}');

  if (!photo || !poseName) {
    throw new AnalysisError('Missing required fields: photo or poseName');
  }

  console.log('Starting analysis for:', poseName);

  const systemPrompt = `You are an elite physiotherapist analyzing mobility poses. For each pose:
1. Assess the form and technique
2. Provide a mobility age (20-80 years)
3. Give specific feedback on form
4. List 2-3 recommendations for improvement
5. Indicate if the overall form is good

Format your response as:
Age: [number] years
Form: [good/needs improvement]
Feedback: [1-2 sentences]
Recommendations:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Analyze this ${poseName} pose and provide a detailed mobility report.`
      }
    ],
    max_tokens: 1500,
    temperature: 0.7
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new AnalysisError('No content received from API');
  }

  const result = parseContent(content);

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(result)
  };

} catch (error) {
  console.error('Function error:', error);
  return {
    statusCode: 500,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({ 
      error: 'Analysis failed',
      message: error instanceof AnalysisError ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  };
}
};

export { handler };
