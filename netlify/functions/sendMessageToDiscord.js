// netlify/functions/sendMessageToDiscord.js

const axios = require('axios');

exports.handler = async (event, context) => {
    const { threadId, userName, content } = JSON.parse(event.body);

    if (!threadId || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing threadId or message content' }),
        };
    }

    const discordApiUrl = `https://discord.com/api/v9/channels/${threadId}/messages`;
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;

    try {
        await axios.post(
            discordApiUrl,
            { content: content },
            { headers: { Authorization: `Bot ${discordBotToken}` } }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent successfully' }),
        };
    } catch (error) {
        console.error('Error sending message to Discord:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send message' }),
        };
    }
};
