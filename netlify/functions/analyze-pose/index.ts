import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
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
    console.log('Request method:', event.httpMethod);
    
    const body = JSON.parse(event.body || '{}');
    console.log('Request body keys:', Object.keys(body));

    if (!body.photo) {
      throw new Error('No photo data received');
    }

    console.log('Attempting OpenAI API call...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",  // Updated to use GPT-4 Turbo
        messages: [
          {
            role: "system",
            content: "You are an expert physiotherapist analyzing mobility tests."
          },
          {
            role: "user",
            content: `Analyze this mobility test for ${body.poseName}. Provide:
            1. A numerical score (0-100) based on form quality
            2. Specific feedback about technique
            3. Clear recommendations for improvement
            4. A yes/no assessment of whether the form is acceptable
            
            Format your response with clear sections for each component.`
          }
        ],
        max_tokens: 500
      })
    });

    console.log('OpenAI API response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const openaiResult = await openaiResponse.json();
    console.log('Successfully received OpenAI response');

    // Parse the AI response
    const aiContent = openaiResult.choices[0].message.content;
    console.log('AI content:', aiContent);

    // Extract score (looking for numbers followed by /100 or similar patterns)
    const scoreMatch = aiContent.match(/(\d+)(?:\s*\/\s*100|\s*out of\s*100)?/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    // Check if form is acceptable (looking for positive indicators)
    const isGoodForm = /acceptable|good|correct|proper|yes/i.test(aiContent.toLowerCase());

    // Extract recommendations (looking for sentences with action words)
    const recommendations = aiContent
      .split(/\.|!|\?/)
      .filter(sentence => 
        sentence.toLowerCase().includes('should') || 
        sentence.toLowerCase().includes('recommend') || 
        sentence.toLowerCase().includes('try') ||
        sentence.toLowerCase().includes('improve')
      )
      .map(rec => rec.trim())
      .filter(rec => rec.length > 0);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score,
        feedback: aiContent.split('.')[0] + '.',  // First sentence as feedback
        recommendations: recommendations.length ? recommendations : ["Focus on maintaining proper form"],
        isGoodForm
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
