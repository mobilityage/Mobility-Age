const fetch = require('node-fetch');

exports.handler = async function(event) {
  const OPENAI_API_KEY = process.env.GPT_API_KEY;
  
  try {
    console.log('Function called with method:', event.httpMethod);
    console.log('Event body:', event.body);

    if (event.httpMethod !== 'POST') {
      return { 
        statusCode: 405, 
        body: JSON.stringify({
          error: 'Method not allowed',
          method: event.httpMethod,
          allowedMethod: 'POST'
        })
      };
    }

    const requestBody = JSON.parse(event.body);
    
    // Log to help debug
    console.log('Image data received:', requestBody.imageData ? 'Yes (length: ' + requestBody.imageData.length + ')' : 'No');
    console.log('Prompt received:', requestBody.prompt ? 'Yes' : 'No');

    const openAIRequestBody = {
      model: "gpt-4o-mini",
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

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(openAIRequestBody)
    });

    const data = await response.json();

    console.log('OpenAI response status:', response.status);

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
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};
