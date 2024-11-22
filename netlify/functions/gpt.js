const fetch = require('node-fetch');

exports.handler = async function(event) {
  const OPENAI_API_KEY = process.env.GPT_API_KEY;
  
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const requestBody = JSON.parse(event.body);
    
    // Log to help debug (these will appear in your Netlify function logs)
    console.log('Image data length:', requestBody.imageData.length);
    console.log('Prompt length:', requestBody.prompt.length);

    // Make sure the image data exists and is properly formatted
    if (!requestBody.imageData) {
      throw new Error('No image data provided');
    }

    const openAIRequestBody = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: requestBody.prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${requestBody.imageData}`
              }
            }
          ]
        }
      ],
      max_tokens: 3000
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(openAIRequestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
