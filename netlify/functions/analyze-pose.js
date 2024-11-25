const axios = require('axios');

exports.handler = async (event) => {
if (event.httpMethod !== 'POST') {
  return { statusCode: 405, body: 'Method Not Allowed' };
}

try {
  const { image, pose } = JSON.parse(event.body);

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: `I am performing a ${pose} test. Please analyze my form and return a JSON object containing:
            {
              "analysis": [3 specific observations about form],
              "mobilityAge": estimated mobility age as a number,
              "exercises": [
                {
                  "name": "exercise name",
                  "description": "brief description",
                  "steps": ["step1", "step2", "step3"],
                  "frequency": "how often to do it",
                  "tips": ["tip1", "tip2", "tip3"]
                }
              ] (2 exercises total)
            }`
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify(response.data)
  };
} catch (error) {
  console.error('Error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Failed to analyze pose' })
  };
}
};
