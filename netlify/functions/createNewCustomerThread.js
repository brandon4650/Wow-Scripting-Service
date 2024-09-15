import fetch from 'node-fetch';

export const handler = async (event) => {
  const { DISCORD_TOKEN, NEW_CUSTOMER_CHANNEL, WEBHOOK_URL } = process.env;
  
  if (!DISCORD_TOKEN || !NEW_CUSTOMER_CHANNEL || !WEBHOOK_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const { referral, discordName, email, server, scriptType, description } = JSON.parse(event.body);
    
    // Create a thread in Discord
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
      throw new Error('Failed to create Discord thread');
    }

    const threadData = await threadResponse.json();

    // Post initial message in the thread
    await fetch(`${WEBHOOK_URL}?thread_id=${threadData.id}`, {
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
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Failed to process request' }) 
    };
  }
};