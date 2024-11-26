import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('Function started');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('No API key found');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'API configuration error',
        message: 'API key not configured'
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { photo, poseName, poseDescription } = body;

    console.log('Processing request for:', poseName);

    if (!photo) {
      throw new Error('No photo data provided');
    }

    // Format the image data correctly
    const base64Image = photo.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an experienced physiotherapist analyzing a ${poseName} mobility test.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: `data:image/jpeg;base64,${base64Image}`
              },
              {
                type: "text",
                text: `Analyze this ${poseName} pose and provide:
                1. A score (0-100) based on form quality
                2. Specific feedback about alignment and technique
                3. Clear recommendations for improvement
                4. Whether the form is acceptable (yes/no)`
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    // Parse the response
    const score = content.match(/\d+(?=\s*\/\s*100|\s*out of\s*100)?/)?.[0] || "75";
    const isGoodForm = /acceptable|good|correct|proper|yes/i.test(content);
    const feedback = content.split('.')[0] + '.';
    const recommendations = content
      .split(/[.!?]/)
      .filter(s => s.toLowerCase().includes('should') || s.toLowerCase().includes('recommend'))
      .map(s => s.trim())
      .filter(Boolean);

    const result = {
      score: parseInt(score),
      feedback,
      recommendations: recommendations.length ? recommendations : ["Focus on maintaining proper form"],
      isGoodForm
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to analyze pose',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };
