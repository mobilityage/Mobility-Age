import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  // Add detailed logging
  console.log('=== Function Start ===');
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key starts with:', apiKey?.substring(0, 4));

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'No API key found',
        debug: 'OPENAI_API_KEY environment variable is missing'
      })
    };
  }

  try {
    // Log incoming request details
    console.log('Request method:', event.httpMethod);
    console.log('Request headers:', event.headers);
    
    const body = JSON.parse(event.body || '{}');
    console.log('Request body keys:', Object.keys(body));

    if (!body.photo) {
      throw new Error('No photo data received');
    }

    // Log before API call
    console.log('Attempting OpenAI API call...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4", // Changed from gpt-4-vision-preview
        messages: [
          {
            role: "user",
            content: `Analyze this mobility test for ${body.poseName}. Consider:
            1. Form quality (score out of 100)
            2. Technique assessment
            3. Areas for improvement
            4. Overall acceptability (yes/no)`
          }
        ]
      })
    });

    // Log API response status
    console.log('OpenAI API response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const result = await openaiResponse.json();
    console.log('Successfully received OpenAI response');

    // For testing, return a mock response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: 75,
        feedback: "Test analysis complete",
        recommendations: ["Test recommendation 1", "Test recommendation 2"],
        isGoodForm: true
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

export { handler };
