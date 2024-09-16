const axios = require('axios');

exports.handler = async (event) => {
  const { DISCORD_TOKEN, ISSUE_CHANNEL, WEBHOOK_ISSUE } = process.env;
  
  if (!DISCORD_TOKEN || !ISSUE_CHANNEL || !WEBHOOK_ISSUE) {
    console.error('Missing environment variables');
    return { 
      statusCode: 500, 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Server configuration error' }) 
    };
  }

  try {
    const { scriptName, discordName, email, server, scriptType, issueDescription } = JSON.parse(event.body);
    
    // Validate required fields
    if (!scriptName || !discordName || !email || !server || !scriptType || !issueDescription) {
      console.error('Missing required fields');
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    console.log('Attempting to create Discord thread for script issue...');
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
    console.log('Thread created successfully:', threadData.id);

    console.log('Posting initial messages to thread...');
    const messageResponse = await axios.post(
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

    if (!messageResponse.data) {
      console.error('Failed to post initial message');
    }

    // Send an initial message from Lua Services APP
    await axios.post(
      `https://discord.com/api/v10/channels/${threadData.id}/messages`,
      {
        content: `${discordName}: Your thread ID is ${threadData.id}. Please copy this ID to restore your chat if you exit. [INVISIBLE_MESSAGE]`
      },
      {
        headers: {
          'Authorization': `Bot ${DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ 
        threadId: threadData.id,
        chatTitle: `Script Issue - ${scriptName}`
      })
    };
  } catch (error) {
    console.error('Error in createScriptIssueThread:', error);
    return { 
      statusCode: 500, 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: error.message || 'Failed to process request' }) 
    };
  }
};