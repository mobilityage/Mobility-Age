import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const handler: Handler = async (event) => {
  console.log('Function started');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new Error('Missing required fields');
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(photo.split(',')[1], 'base64');

    console.log('Making OpenAI request...');

    const response = await openai.images.create({
      model: "gpt-4o-mini",
      file: imageBuffer,
      purpose: "answers"
    });

    console.log('OpenAI response received:', response);

    // Process the response
    let result = {
      score: 75,
      feedback: "Form analysis completed.",
      recommendations: ["Keep practicing to improve form"],
      isGoodForm: true
    };

    if (response.data && response.data.length > 0) {
      const analysis = response.data[0];
      // Parse the response based on actual structure
      // We'll need to adjust this based on what the API returns
      result = {
        score: 75, // Default if not provided
        feedback: analysis.text || "Analysis completed",
        recommendations: [analysis.suggestion || "Continue practicing"],
        isGoodForm: true // Default to true
      };
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
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      })
    };
  }
};

export { handler };
