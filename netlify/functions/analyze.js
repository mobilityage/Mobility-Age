const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.OPENAI_API_KEY; // Access the environment variable

  const requestBody = JSON.parse(event.body); // Get the request body

  try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          return {
              statusCode: response.status,
              body: JSON.stringify({ error: 'Failed to fetch from OpenAI API' })
          };
      }

      const data = await response.json();
      return {
          statusCode: 200,
          body: JSON.stringify(data)
      };
  } catch (error) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Server error' })
      };
  }
};
