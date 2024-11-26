import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // First, test if we can access the API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'API key not configured',
        debug: 'OPENAI_API_KEY environment variable is missing' 
      }),
    };
  }

  try {
    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    // Test the OpenAI API connection with a minimal request
    const testResponse = await fetch('https://api.openai.com/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert physiotherapist analyzing the ${poseName} mobility test. 
            Evaluate the image for:
            1. Overall form quality (score 0-100)
            2. Specific observations about:
               - Joint alignment
               - Range of motion
               - Stability and control
               - Common compensations or errors
            3. Key areas for improvement
            4. Whether the form is acceptable to proceed (true/false)
            
            Consider these specific criteria for ${poseName}:
            - Proper joint alignment throughout the movement
            - Full range of motion appropriate for the test
            - Stability and balance maintenance
            - Absence of compensation patterns
            
            Provide detailed, actionable feedback that a physiotherapist would give in a clinical setting.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: photo
              }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await testResponse.json();
    
    // Parse the AI response and format it for our needs
    let formattedResponse;
    try {
      // Attempt to parse the AI's response
      const parsedResponse = typeof aiResponse.choices[0].message.content === 'string' 
        ? JSON.parse(aiResponse.choices[0].message.content)
        : aiResponse.choices[0].message.content;

      formattedResponse = {
        score: parsedResponse.score || 75,
        feedback: parsedResponse.feedback || "AI analysis completed.",
        recommendations: Array.isArray(parsedResponse.recommendations) 
          ? parsedResponse.recommendations 
          : ["Maintain proper form", "Focus on controlled movement"],
        isGoodForm: parsedResponse.isGoodForm ?? true
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(formattedResponse),
      headers: {
        'Content-Type': 'application/json'
      }
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to analyze pose',
        message: error.message,
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};

export { handler };
