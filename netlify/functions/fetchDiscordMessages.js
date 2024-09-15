const axios = require('axios');

exports.handler = async (event, context) => {
    try {
        const { threadId, after, userName } = JSON.parse(event.body);
        const discordBotToken = process.env.DISCORD_TOKEN;

        if (!discordBotToken) {
            console.error('DISCORD_TOKEN is not set');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing bot token' }),
            };
        }

        if (!userName) {
            console.error('userName is not provided');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Bad request: userName is required' }),
            };
        }

        console.log('Fetching messages for threadId:', threadId, 'User:', userName);

        const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
        const params = { after, limit: 100 };

        const response = await axios.get(discordApiUrl, {
            headers: { 
                Authorization: `Bot ${discordBotToken}`,
                'Content-Type': 'application/json'
            },
            params: params
        });

        console.log('Raw Discord response:', JSON.stringify(response.data, null, 2));

        const messages = response.data
            .filter(msg => msg.author.username !== 'Lua Script Services')
            .map(msg => ({
                sender: msg.author.username,
                content: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
                isDiscord: true,
                isDiscordUser: msg.author.username !== userName
            }));

        console.log(`Processed ${messages.length} messages:`, JSON.stringify(messages, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify(messages),
        };
    } catch (error) {
        console.error('Error details:', error);
        if (error.response) {
            console.error('Discord API response:', error.response.data);
        }
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch messages', 
                details: error.message || 'Unknown error'
            }),
        };
    }
};