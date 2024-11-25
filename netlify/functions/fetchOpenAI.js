const fetch = require('node-fetch');

exports.handler = async function(event, context) {
const apiKey = process.env.OPENAI_API_KEY;
const requestBody = JSON.parse(event.body);

try {
  const response = await fetch('https://api.openai.com/v1/your-endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
} catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Failed to fetch data from OpenAI' })
  };
}
};
