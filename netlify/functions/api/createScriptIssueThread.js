const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { DISCORD_TOKEN, ISSUE_CHANNEL, WEBHOOK_URL } = process.env;
  
  if (!DISCORD_TOKEN || !ISSUE_CHANNEL || !WEBHOOK_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const { scriptName, discordName, email, server, scriptType, issueDescription } = JSON.parse(event.body);
    
    // Create a thread in Discord
    const threadResponse = await fetch(`https://discord.com/api/v10/channels/${ISSUE_CHANNEL}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Script Issue - ${scriptName}`,
        type: 11,  // Private thread
        auto_archive_duration: 1440  // Auto archive after 24 hours
      })
    });

    if (!threadResponse.ok) {
      throw new Error('Failed to create Discord thread');
    }

    const threadData = await threadResponse.json();

    // Post initial message in the thread
    await fetch(`${WEBHOOK_URL}?thread_id=${threadData.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `Script Issue Report:
        Script Name: ${scriptName}
        Discord Name: ${discordName}
        Email: ${email}
        Server: ${server}
        Script Type: ${scriptType}
        Issue Description: ${issueDescription}`
      })
    });

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