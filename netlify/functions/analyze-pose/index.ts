import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('=== Function Start ===');
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('API Key exists:', !!apiKey);

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
    const body = JSON.parse(event.body || '{}');
    const { photo, poseName, poseDescription } = body;
    console.log('Analyzing pose:', poseName);

    if (!photo) {
      throw new Error('No photo data received');
    }

    console.log('Preparing OpenAI API call...');

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
                image_url: photo
              },
              {
                type: "text",
                text: `Analyze this ${poseName} and provide:
                1. A score (0-100) for form quality
                2. Specific feedback about technique and alignment
                3. Key recommendations for improvement
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

    const result = await response.json();
    console.log('Successfully received OpenAI response');
    
    // Parse the content
    const aiContent = result.choices[0].message.content;
    
    // Extract score
    const scoreMatch = aiContent.match(/(\d+)(?:\s*\/\s*100|\s*out of\s*100)?/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    // Check if form is acceptable
    const isGoodForm = /acceptable|good|correct|proper|yes/i.test(aiContent.toLowerCase());

    // Extract recommendations
    const recommendations = aiContent
      .split(/\.|!|\?/)
      .filter(sentence => 
        sentence.toLowerCase().includes('should') || 
        sentence.toLowerCase().includes('recommend') || 
        sentence.toLowerCase().includes('improve')
      )
      .map(rec => rec.trim())
      .filter(rec => rec.length > 0);

    const analysisResult = {
      score,
      feedback: aiContent.split('.')[0] + '.',  // First sentence as feedback
      recommendations: recommendations.length ? recommendations : ["Focus on maintaining proper form"],
      isGoodForm
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisResult)
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
