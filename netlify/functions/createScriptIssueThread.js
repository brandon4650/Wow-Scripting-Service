const axios = require('axios');
const FormData = require('form-data');

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

    // Validate required fields
    if (!payload.scriptName || !payload.discordName || !payload.email || !payload.server || !payload.scriptType || !payload.issueDescription) {
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
        name: `Script Issue - ${payload.scriptName}`,
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
      `${WEBHOOK_ISSUE}?thread_id=${threadData.id}`,
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
        chatTitle: `Script Issue - ${payload.scriptName}`
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