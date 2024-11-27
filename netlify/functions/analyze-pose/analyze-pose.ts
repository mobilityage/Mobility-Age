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
    console.log('Raw content to parse:', content);

    // Extract mobility age
    const ageMatch = content.match(/Age:\s*(\d+)/i) || content.match(/Mobility Age:\s*(\d+)/i);
    if (!ageMatch) {
      throw new Error('Unable to find mobility age in response');
    }
    const mobilityAge = parseInt(ageMatch[1]);

    // Extract feedback
    const feedbackMatch = content.match(/Feedback:\s*([^]*?)(?=\n\s*(?:Recommendations:|$))/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
    if (!feedback) {
      throw new Error('Unable to find feedback in response');
    }

    // Extract recommendations
    const recommendationsMatch = content.match(/Recommendations:\s*([^]*?)(?=\n\s*$)/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split(/\n/)
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['Maintain current form'];

    // Determine if form is good
    const isGoodForm = content.toLowerCase().includes('good form') || 
                      content.toLowerCase().includes('form: good');

    const result: AnalysisResult = {
      mobilityAge,
      feedback,
      recommendations,
      isGoodForm
    };

    // Log the parsed result
    console.log('Parsed result:', result);

    return result;
  } catch (error) {
    console.error('Error parsing content:', error);
    console.error('Raw content:', content);
    throw new AnalysisError('Failed to parse analysis response');
  }
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
    const { photo, poseName } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are an elite physiotherapist analyzing mobility poses. You must respond in exactly this format:

Age: [number between 20-80]
Form: [good/needs improvement]
Feedback: [2-3 sentences about their form]
Recommendations:
- [specific improvement suggestion]
- [specific improvement suggestion]
- [specific improvement suggestion]

Do not include any other text or deviate from this format.`;

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
              text: `Analyze this ${poseName} pose and provide a detailed mobility report.`
            },
            {
              type: "image_url",
              image_url: {
                "url": photo
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);
    const result = parseContent(content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof AnalysisError ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      })
    };
  }
};

export { handler };
