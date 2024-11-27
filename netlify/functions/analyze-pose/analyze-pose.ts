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
    targetMuscles: string[];
  }[];
  poseName: string;
}

class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const parseContent = (content: string, poseName: string): AnalysisResult => {
  console.log('Starting to parse content:', content);

  try {
    // Extract mobility age
    const ageMatch = content.match(/Age:\s*(\d+)/i);
    if (!ageMatch) {
      console.log('Failed to find age in:', content);
      return {
        mobilityAge: 30,
        feedback: "Unable to determine specific feedback from the pose.",
        recommendations: ["Consult with a physiotherapist for proper form assessment"],
        isGoodForm: false,
        exercises: [{
          name: 'Basic Form Practice',
          description: 'Practice the basic movement pattern',
          difficulty: 'beginner',
          targetMuscles: ['full body']
        }],
        poseName
      };
    }

    const mobilityAge = parseInt(ageMatch[1]);

    // Extract form assessment
    const isGoodForm = content.toLowerCase().includes('form: good') || 
                      content.toLowerCase().includes('good form');

    // Extract feedback
    const feedbackMatch = content.match(/Feedback:\s*([^]*?)(?=\n\s*(?:Recommendations:|$))/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Form assessment needed';

    // Extract recommendations
    const recommendationsMatch = content.match(/Recommendations:\s*([^]*?)(?=\n\s*(?:$|Exercise))/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['Practice proper form'];

    // Default exercise
    const defaultExercise = {
      name: 'Form Practice',
      description: 'Practice the movement with proper form',
      difficulty: 'beginner' as const,
      targetMuscles: ['full body']
    };

    return {
      mobilityAge,
      feedback,
      recommendations,
      isGoodForm,
      exercises: [defaultExercise],
      poseName
    };
  } catch (error) {
    console.error('Parse error:', error);
    console.error('Raw content:', content);
    // Return default values instead of throwing
    return {
      mobilityAge: 30,
      feedback: "Unable to analyze the pose properly.",
      recommendations: ["Consult with a physiotherapist for proper form assessment"],
      isGoodForm: false,
      exercises: [{
        name: 'Basic Form Practice',
        description: 'Practice the basic movement pattern',
        difficulty: 'beginner',
        targetMuscles: ['full body']
      }],
      poseName
    };
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
    let { photo, poseName } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    // Remove data:image prefix if it exists
    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are a physiotherapist analyzing a mobility pose. Respond EXACTLY in this format:

Age: [number between 20-80]
Form: [good/needs improvement]
Feedback: [2-3 sentences about their form]
Recommendations:
- [improvement 1]
- [improvement 2]
- [improvement 3]`;

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
              text: `Analyze this ${poseName} pose.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${photo}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    console.log('Received response from OpenAI');

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);

    const result = parseContent(content, poseName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    // Provide more detailed error information
    const errorResponse = {
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
      // Include the original error for debugging
      originalError: process.env.NODE_ENV === 'development' ? error : undefined
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

export { handler };
