const fetch = require('node-fetch');

exports.handler = async function(event) {
  const OPENAI_API_KEY = process.env.GPT_API_KEY;
  
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const requestBody = JSON.parse(event.body);
    
    // Set a timeout for the OpenAI request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9 seconds

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
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
        max_tokens: 1000 // Reduced from 3000 to help with timeout
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: error.name === 'AbortError' ? 504 : 500,
      body: JSON.stringify({ 
        error: error.name === 'AbortError' ? 'Request timed out' : error.message
      })
    };
  }
};
