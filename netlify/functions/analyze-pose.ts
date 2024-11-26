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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a physiotherapist specializing in mobility assessment. Analyze the provided still image of a person performing a mobility pose. Provide feedback on the following aspects:

Posture and Alignment:
Assess the alignment of the spine, hips, knees, and ankles. Note any deviations from optimal posture.
Joint Positioning:
Evaluate the positioning of key joints (shoulders, hips, knees, and ankles) in the pose. Identify any signs of stiffness or restricted range of motion.
Balance and Stability:
Assess the individual’s balance and stability as depicted in the image. Does the pose suggest a stable base of support?
Overall Mobility Age:
Based on your analysis, estimate a "mobility age" for the individual, reflecting their mobility and physical capabilities compared to normative data for different age groups.
Provide your feedback clearly and constructively, while acknowledging the limitations of assessing mobility from a still image.`
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
