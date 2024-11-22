const fetch = require('node-fetch');

exports.handler = async function(event) {
  const OPENAI_API_KEY = process.env.GPT_API_KEY;
  
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const requestBody = JSON.parse(event.body);

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
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    // Return just the content part that script.js is expecting
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: data.choices[0].message.content
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        analysis: ["Error analyzing image: " + error.message],
        technicalDetails: {
          rangeOfMotion: "Error occurred",
          compensation: "Error occurred",
          stability: "Error occurred",
          implications: "Error occurred"
        },
        mobilityAge: 0,
        exercises: [{
          name: "Error occurred",
          description: "Please try again",
          steps: ["Error occurred"],
          frequency: "N/A",
          tips: ["Please try again"],
          progression: "N/A",
          regressions: "N/A"
        }]
      })
    };
  }
};
