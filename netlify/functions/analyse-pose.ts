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
            content: `You are an experienced physiotherapist analyzing mobility tests. You are currently assessing the ${poseName} test which ${poseDescription}. Provide specific feedback on form and recommendations for improvement.`
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
    
    // For testing, return a mock response
    const analysis = {
      score: 75,
      feedback: "Good attempt at the pose. Your form shows proper alignment but there's room for improvement.",
      recommendations: [
        "Try to maintain a more neutral spine position",
        "Focus on keeping your weight evenly distributed"
      ],
      isGoodForm: true
    };

    return {
      statusCode: 200,
      body: JSON.stringify(analysis),
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
