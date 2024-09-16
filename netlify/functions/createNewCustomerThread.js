const axios = require('axios');

exports.handler = async (event) => {
  const { DISCORD_TOKEN, NEW_CUSTOMER_CHANNEL, WEBHOOK_URL } = process.env;
  
  if (!DISCORD_TOKEN || !NEW_CUSTOMER_CHANNEL || !WEBHOOK_URL) {
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
    const { referral, discordName, email, server, scriptType, description } = JSON.parse(event.body);
    
    console.log('Attempting to create Discord thread...');
    const threadResponse = await axios.post(
      `https://discord.com/api/v10/channels/${NEW_CUSTOMER_CHANNEL}/threads`,
      {
        name: `New Customer - ${discordName}`,
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
    await axios.post(
      `${WEBHOOK_URL}?thread_id=${threadData.id}`,
      {
        content: `New Customer Request:
        Discord Name: ${discordName}
        Email: ${email}
        Server: ${server}
        Script Type: ${scriptType}
        Referral: ${referral || 'N/A'}
        Description: ${description}`
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Send an initial welcome message from Lua Services APP
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
        chatTitle: 'New Customer Chat'
      })
    };
  } catch (error) {
    console.error('Error in createNewCustomerThread:', error);
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