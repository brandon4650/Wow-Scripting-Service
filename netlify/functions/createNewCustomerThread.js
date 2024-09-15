const axios = require('axios');
const FormData = require('form-data');

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
    const formData = new FormData();
    const payload = JSON.parse(event.body);

    // Append form fields to the FormData object
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Check if a file was uploaded
    if (payload.fileUpload) {
      formData.append('fileUpload', payload.fileUpload);
    }

    console.log('Attempting to create Discord thread...');
    const threadResponse = await axios.post(
      `https://discord.com/api/v10/channels/${NEW_CUSTOMER_CHANNEL}/threads`,
      {
        name: `New Customer - ${payload.discordName}`,
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

    console.log('Posting initial message to thread...');
    const messageResponse = await axios.post(
      `${WEBHOOK_URL}?thread_id=${threadData.id}`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    if (!messageResponse.data) {
      console.error('Failed to post initial message');
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