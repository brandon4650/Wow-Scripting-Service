const axios = require('axios');

exports.handler = async (event, context) => {
    const { threadId, userName, content } = JSON.parse(event.body);
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;

    if (!discordBotToken) {
        console.error('DISCORD_BOT_TOKEN is not set');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: Missing bot token' }),
        };
    }

    if (!threadId || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing threadId or message content' }),
        };
    }

    const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;

    try {
        console.log(`Attempting to send message to thread ${threadId}`);
        const response = await axios.post(
            discordApiUrl,
            { content: `${userName}: ${content}` },
            { 
                headers: { 
                    Authorization: `Bot ${discordBotToken}`,
                    'Content-Type': 'application/json'
                } 
            }
        );

        console.log('Message sent successfully:', response.status, response.statusText);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent successfully' }),
        };
    } catch (error) {
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ 
                error: 'Failed to send message', 
                details: error.response?.data || error.message 
            }),
        };
    }
};