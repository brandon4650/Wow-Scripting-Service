// netlify/functions/fetchDiscordMessages.js

const axios = require('axios');

exports.handler = async (event, context) => {
    const { threadId } = JSON.parse(event.body);

    if (!threadId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing threadId' }),
        };
    }

    const discordApiUrl = `https://discord.com/api/v9/channels/${threadId}/messages`;
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;

    try {
        const response = await axios.get(discordApiUrl, {
            headers: { Authorization: `Bot ${discordBotToken}` },
        });

        const messages = response.data.map(msg => ({
            sender: msg.author.username,
            content: msg.content,
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(messages),
        };
    } catch (error) {
        console.error('Error fetching messages from Discord:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch messages' }),
        };
    }
};
