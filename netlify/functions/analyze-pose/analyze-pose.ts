// netlify/functions/analyze-pose.ts

import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

// ... (keep existing interfaces)

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

    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    const systemPrompt = `You are an expert physiotherapist analyzing a mobility pose. Consider the person's biological age of ${biologicalAge} years when assessing their mobility age. Be strict and realistic in your assessment. A mobility age should reflect how their performance compares to typical mobility at their biological age.

If the image quality is poor or the pose is not clearly visible, respond with RETRY: followed by specific instructions for better image capture. Otherwise, provide the analysis in EXACTLY this format:

Age: [mobility age relative to biological age. Be strict - good form should match biological age, poor form should be higher]
Form: [good/needs improvement]

Assessment: [detailed analysis of form quality, joint angles, and mobility relative to their biological age]

Recommendations:
- [specific improvement 1 with clear guidance]
- [specific improvement 2 with clear guidance]
- [specific improvement 3 with clear guidance]

Specific Exercises:

Exercise 1:
Name: [specific exercise name]
Description: [clear description]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Target Muscles: [primary and secondary muscles]

Exercise 2:
[same format as Exercise 1]`;

    // ... (rest of the existing code remains the same, including the API call)
    
    // Add handling for RETRY responses in parseContent
    if (content.startsWith('RETRY:')) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: 'Image quality issue',
          retryMessage: content.substring(7).trim()
        })
      };
    }

    const result = parseContent(content, poseName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    const errorResponse = {
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

export { handler };
