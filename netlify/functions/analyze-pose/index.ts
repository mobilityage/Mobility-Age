import { Handler } from '@netlify/functions';
import OpenAI from "openai";

const handler: Handler = async (event) => {
  console.log('Function started');
  
  try {
    // Initialize OpenAI with environment variable API key
    const openai = new OpenAI();

    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new Error('Missing required fields');
    }

    console.log('Making OpenAI request...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `As an experienced physiotherapist, analyze this ${poseName} and provide:
              1. An estimated mobility age based on form quality as it relates to biological age
              2. Specific feedback about technique
              3. Key recommendations for improvement
              4. Example exercises with succinct instructions the user should perform in order to improve their form` 
            },
            {
              type: "image_url",
              image_url: {
                url: photo,
              },
            }
          ],
        },
      ],
      max_tokens: 500
    });

    console.log('OpenAI response received');
    const content = completion.choices[0].message.content;

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score,
        feedback,
        recommendations: recommendations.length ? recommendations : ["Maintain proper form"],
        isGoodForm
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      })
    };
  }
};

export { handler };
