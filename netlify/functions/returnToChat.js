const axios = require('axios');

exports.handler = async (event) => {
  const { DISCORD_TOKEN } = process.env;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { threadId } = JSON.parse(event.body);

  if (!threadId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Thread ID is required' }),
    };
  }

  try {
    const response = await axios.get(`https://discord.com/api/v10/channels/${threadId}`, {
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
    });

    const threadInfo = response.data;
    const threadName = threadInfo.name;

    // Extract Discord name and chat type from thread name
    let discordName, chatType;
    if (threadName.startsWith('New Customer - ')) {
      chatType = 'New Customer Chat';
      discordName = threadName.replace('New Customer - ', '');
    } else if (threadName.startsWith('Script Issue - ')) {
      chatType = 'Script Issue Chat';
      discordName = threadName.replace('Script Issue - ', '');
    } else {
      chatType = 'Unknown Chat Type';
      discordName = 'Unknown User';
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        threadId,
        chatTitle: chatType,
        discordName,
      }),
    };
  } catch (error) {
    console.error('Error retrieving thread info:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve thread information' }),
    };
  }
};