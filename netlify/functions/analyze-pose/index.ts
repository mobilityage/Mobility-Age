import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('Function started');
  
  try {
    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Validate request method
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const { photo, poseName } = body;

    if (!photo || !poseName) {
      throw new Error('Missing required fields');
    }

    // Make sure the photo is a base64 string
    const imageUrl = photo.startsWith('data:image/') 
      ? photo 
      : `data:image/jpeg;base64,${photo}`;

    // Call OpenAI API
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
            content: `As an expert physiotherapist, analyze this ${poseName} mobility test.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: imageUrl
              },
              {
                type: "text",
                text: `Please analyze this ${poseName} and provide:
                1. A score from 0-100 based on form quality
                2. Brief, specific feedback about technique
                3. Two or three key recommendations for improvement
                4. A clear yes/no on whether the form is acceptable`
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to analyze pose');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    // Parse the AI response
    const score = content.match(/\d+/)?.[0] || "75";
    const feedback = content.split('.')[0] + '.';
    const recommendations = content
      .split(/[.!?]/)
      .filter(s => /should|recommend|try|improve/i.test(s))
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3);
    const isGoodForm = /acceptable|good|correct|yes/i.test(content);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        score: parseInt(score),
        feedback,
        recommendations: recommendations.length ? recommendations : ["Maintain proper form"],
        isGoodForm
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };
