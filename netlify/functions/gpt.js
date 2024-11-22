const fetch = require('node-fetch');

exports.handler = async function(event) {
  const OPENAI_API_KEY = process.env.GPT_API_KEY;
  
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const requestBody = JSON.parse(event.body);
    
    // Add JSON requirement to the prompt
    const modifiedPrompt = requestBody.prompt + " Provide your analysis in JSON format.";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: modifiedPrompt
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
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify(error)
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
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
