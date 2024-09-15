const fetch = require('node-fetch');

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
    const threadResponse = await fetch(`https://discord.com/api/v10/channels/${NEW_CUSTOMER_CHANNEL}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `New Customer - ${discordName}`,
        type: 11,  // Private thread
        auto_archive_duration: 1440  // Auto archive after 24 hours
      })
    });

    if (!threadResponse.ok) {
      const errorData = await threadResponse.text();
      console.error('Discord API Error:', threadResponse.status, errorData);
      throw new Error(`Discord API responded with status ${threadResponse.status}: ${errorData}`);
    }

    const threadData = await threadResponse.json();
    console.log('Thread created successfully:', threadData.id);

    console.log('Posting initial message to thread...');
    const messageResponse = await fetch(`${WEBHOOK_URL}?thread_id=${threadData.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `New Customer Request:
        Discord Name: ${discordName}
        Email: ${email}
        Server: ${server}
        Script Type: ${scriptType}
        Referral: ${referral || 'N/A'}
        Description: ${description}`
      })
    });

    if (!messageResponse.ok) {
      console.error('Failed to post initial message:', await messageResponse.text());
    }

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