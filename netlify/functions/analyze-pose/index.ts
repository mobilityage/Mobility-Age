import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('Function started');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('API key missing');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Configuration error',
          message: 'API key not found'
        })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    const { photo, poseName, poseDescription } = JSON.parse(event.body);

    if (!photo || !poseName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Format the base64 image properly for OpenAI
    const base64ImageData = photo.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log('Calling OpenAI API...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an experienced physiotherapist analyzing the ${poseName} test.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64ImageData}`,
                  detail: "low"
                }
              },
              {
                type: "text",
                text: `Analyze this ${poseName} and provide:
                1. A score (0-100) for form quality
                2. Specific feedback about technique
                3. Key recommendations for improvement
                4. Whether the form is acceptable (yes/no)`
              }
            ]
          }
        ]
      })
    });

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'AI analysis failed',
          message: errorData.error?.message || 'Unknown error'
        })
      };
    }

    const aiResult = await openaiResponse.json();
    const content = aiResult.choices[0].message.content;

    // Parse the response
    const score = parseInt(content.match(/\d+(?=\s*\/\s*100|\s*out of\s*100)?/)?.[0] || "75");
    const feedback = content.split('.')[0] + '.';
    const recommendations = content
      .split(/[.!?]/)
      .filter(s => /should|recommend|try|improve/i.test(s))
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3);
    const isGoodForm = /acceptable|good|correct|proper|yes/i.test(content);

    const result = {
      score,
      feedback,
      recommendations: recommendations.length ? recommendations : ["Maintain proper form"],
      isGoodForm
    };

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
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };
