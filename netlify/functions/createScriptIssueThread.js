const axios = require('axios');

exports.handler = async (event) => {
  const { DISCORD_TOKEN, ISSUE_CHANNEL, WEBHOOK_ISSUE } = process.env;
  
  if (!DISCORD_TOKEN || !ISSUE_CHANNEL || !WEBHOOK_ISSUE) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const { scriptName, discordName, email, server, scriptType, issueDescription } = JSON.parse(event.body);
    
    // Create a thread in Discord
    const threadResponse = await axios.post(
      `https://discord.com/api/v10/channels/${ISSUE_CHANNEL}/threads`,
      {
        name: `Script Issue - ${scriptName}`,
        type: 11,  // Private thread
        auto_archive_duration: 1440  // Auto archive after 24 hours
      },
      {
        headers: {
          'Authorization': `Bot ${DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const threadData = threadResponse.data;

    // Post initial message in the thread
    await axios.post(
      `${WEBHOOK_ISSUE}?thread_id=${threadData.id}`,
      {
        content: `Script Issue Report:
        Script Name: ${scriptName}
        Discord Name: ${discordName}
        Email: ${email}
        Server: ${server}
        Script Type: ${scriptType}
        Issue Description: ${issueDescription}`
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        threadId: threadData.id,
        chatTitle: 'Script Issue'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
  }
};