const axios = require('axios');

exports.handler = async (event, context) => {
  const { threadId } = JSON.parse(event.body);
  const discordBotToken = process.env.DISCORD_BOT_TOKEN;

  if (!discordBotToken) {
    console.error('DISCORD_BOT_TOKEN is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Missing bot token' }),
    };
  }

  console.log('Attempting to fetch messages for threadId:', threadId);

  const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;

  try {
    const response = await axios.get(discordApiUrl, {
      headers: { 
        Authorization: `Bot ${discordBotToken}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Discord API Response:', response.status, response.statusText);

    const messages = response.data.map(msg => ({
      sender: msg.author.username,
      content: msg.content,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(messages),
    };
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch messages', 
        details: error.response?.data || error.message 
      }),
    };
  }
};