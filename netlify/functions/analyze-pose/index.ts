import { Handler } from '@netlify/functions';

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

    console.log('Request data:', {
      poseName,
      poseDescription,
      hasPhoto: !!photo
    });

    if (!photo) {
      throw new Error('No photo data provided');
    }

    const openaiRequestBody = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an experienced physiotherapist analyzing the ${poseName} test. 
          Evaluate the image and provide:
          1. A score (0-100) based on form quality
          2. Specific feedback about alignment and technique
          3. Clear recommendations for improvement
          4. A boolean indicating if the form is acceptable
          
          Format your response as a JSON object with these exact keys:
          {
            "score": number,
            "feedback": string,
            "recommendations": string[],
            "isGoodForm": boolean
          }`
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
    };

    console.log('Making OpenAI API request');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequestBody)
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received:', JSON.stringify(aiResponse, null, 2));

    const formattedResponse = {
      score: 75,
      feedback: aiResponse.choices[0].message.content,
      recommendations: ["Keep your form stable", "Maintain proper alignment"],
      isGoodForm: true
    };

    try {
      const parsedContent = JSON.parse(aiResponse.choices[0].message.content);
      if (parsedContent.score && parsedContent.feedback && parsedContent.recommendations) {
        formattedResponse = parsedContent;
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedResponse)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to analyze pose',
        message: error.message
      }),
    };
  }
};

export { handler };
