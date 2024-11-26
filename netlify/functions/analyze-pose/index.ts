import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  // Log the incoming request for debugging
  console.log('Received request:', {
    method: event.httpMethod,
    headers: event.headers,
  });

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // For initial testing, return a mock response
    const mockAnalysis = {
      score: 75,
      feedback: "Good attempt. Your form shows proper alignment but there's room for improvement.",
      recommendations: [
        "Keep your back straight throughout the movement",
        "Focus on maintaining balance and control"
      ],
      isGoodForm: true
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockAnalysis)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to analyze pose',
        message: error.message,
      }),
    };
  }
};

export { handler };
