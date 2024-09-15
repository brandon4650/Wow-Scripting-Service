const axios = require('axios');

exports.handler = async (event, context) => {
    const { threadId, after } = JSON.parse(event.body);
  const discordBotToken = process.env.DISCORD_TOKEN;

  if (!discordBotToken) {
    console.error('DISCORD_TOKEN is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Missing bot token' }),
    };
  }

  console.log('Attempting to fetch messages for threadId:', threadId);

  const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages?after=${after}&limit=100`;

  try {
    const response = await axios.get(discordApiUrl, {
      headers: { 
        Authorization: `Bot ${discordBotToken}`,
        'Content-Type': 'application/json'
      },
    });

    const messages = response.data
      .filter(msg => msg.author.username !== 'Lua Script Services') // Filter out bot messages
      .map(msg => ({
        sender: msg.author.username,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
        isDiscord: true // All messages from this endpoint are from Discord
      }));

    return {
      statusCode: 200,
      body: JSON.stringify(messages),
    };
    } catch (error) {
    console.error('Detailed error:', error.response ? error.response.data : error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch messages', 
        details: error.response?.data || error.message 
      }),
    };
  }
};