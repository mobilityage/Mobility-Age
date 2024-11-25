const { Configuration, OpenAIApi } = require('openai');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.VITE_OPENAI_API_KEY
  }));

  try {
    const { base64Data, currentPose } = JSON.parse(event.body);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `I am performing a ${currentPose} test...` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` }}
        ]
      }]
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
