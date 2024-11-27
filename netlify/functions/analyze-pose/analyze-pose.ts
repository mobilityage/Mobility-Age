import { Handler } from '@netlify/functions';
import OpenAI from "openai";

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  console.log('Function started');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

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
              text: `You are a physiotherapist specializing in mobility assessment. Analyze the provided still image of a person performing a mobility pose. Provide feedback on the following aspects:

Posture and Alignment:
Assess the alignment of the spine, hips, knees, and ankles. Note any deviations from optimal posture.
Joint Positioning:
Evaluate the positioning of key joints (shoulders, hips, knees, and ankles) in the pose. Identify any signs of stiffness or restricted range of motion.
Balance and Stability:
Assess the individual's balance and stability as depicted in the image. Does the pose suggest a stable base of support?
Overall Mobility Age:
Based on your analysis, estimate a "mobility age" for the individual, reflecting their mobility and physical capabilities compared to normative data for different age groups.
Provide your feedback clearly and constructively, while acknowledging the limitations of assessing mobility from a still image.` 
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
    
    // More robust response parsing
    const content = completion.choices[0].message.content || '';
    const scoreMatch = content.match(/\d+(?=\s*\/\s*100|\s*out of\s*100|\s*percent|\%)?/);
    const score = scoreMatch ? Math.min(parseInt(scoreMatch[0]), 100) : 75;
    
    // Get first complete sentence for feedback
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const feedback = sentences[0] || 'Analysis completed.';

    // Extract recommendations more reliably
    const recommendations = sentences
      .filter(s => /should|recommend|try|improve|can|could/i.test(s))
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 100)
      .slice(0, 3);

    const isGoodForm = /excellent|good|proper|correct|well|perfect|great/i.test(content.toLowerCase());

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
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      })
    };
  }
};

export { handler };
