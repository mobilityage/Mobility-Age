import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    const response = await fetch('https://api.openai.com/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are an experienced physiotherapist analyzing mobility tests. 
            For the ${poseName} test (which ${poseDescription}), analyze the image and provide:
            1. A score from 0-100 based on form quality
            2. Specific feedback about the user's form
            3. 2-3 clear recommendations for improvement
            4. A boolean indicating if the form is good enough to proceed
            Format your response as a JSON object with these exact keys: score, feedback, recommendations (array), isGoodForm`
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
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    const aiResponse = await response.json();
    
    // For initial testing, return a mock response
    return {
      statusCode: 200,
      body: JSON.stringify({
        score: 75,
        feedback: "Good attempt at the " + poseName + ". Your form shows proper alignment but there's room for improvement.",
        recommendations: [
          "Keep your back straight throughout the movement",
          "Focus on maintaining balance and control"
        ],
        isGoodForm: true
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to analyze pose' }),
    };
  }
};

export { handler };
