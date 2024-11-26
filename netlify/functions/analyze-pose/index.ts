import { Handler } from '@netlify/functions';

interface AIResponse {
  score: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
}

const handler: Handler = async (event) => {
  console.log('Function started');
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.error('Invalid or missing API key');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'API configuration error',
        message: 'Invalid or missing API key configuration'
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { photo, poseName, poseDescription } = body;

    console.log('Processing image for pose:', poseName);

    if (!photo) {
      throw new Error('No photo data provided');
    }

    // Format the image data correctly for OpenAI
    // If it's a base64 string, convert it to a data URL if it isn't already
    const imageUrl = photo.startsWith('data:image/') 
      ? photo 
      : `data:image/jpeg;base64,${photo}`;

    const openaiRequestBody = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `As an experienced physiotherapist, analyze this ${poseName} mobility test. 
          Focus on form, alignment, and technique.`
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
              text: "Analyze this pose and provide: 1) A score out of 100, 2) Specific feedback on form, 3) Recommendations for improvement, and 4) Whether the form is acceptable (true/false)"
            }
          ]
        }
      ],
      max_tokens: 1000
    };

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequestBody)
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const aiResponse = await response.json();
    console.log('Received OpenAI response');

    // Parse the AI response content
    const aiContent = aiResponse.choices[0].message.content;
    console.log('AI content:', aiContent);

    // Extract the relevant information using regex or simple parsing
    const score = aiContent.match(/(\d+)(?=\s*(?:\/100|out of 100))/)?.[1] || "75";
    const isGoodForm = /acceptable|good|correct|proper/i.test(aiContent.toLowerCase());

    // Split the content into sections
    const sections = aiContent.split(/\n\n|\.\s+/);
    const feedback = sections[0];
    const recommendations = sections
      .filter(s => s.includes('should') || s.includes('recommend') || s.includes('try to'))
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const result: AIResponse = {
      score: parseInt(score),
      feedback: feedback || aiContent,
      recommendations: recommendations.length ? recommendations : ["Focus on maintaining proper form"],
      isGoodForm: isGoodForm
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to analyze pose',
        message: error.message,
        trace: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};

export { handler };
