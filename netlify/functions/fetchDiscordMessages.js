const axios = require('axios');

exports.handler = async (event) => {
    console.log('Received event:', event.httpMethod, event.path);

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { threadId, userName, lastMessageId, sendMessage, content } = JSON.parse(event.body);
    const discordBotToken = process.env.DISCORD_TOKEN;
    const repUserId = '643915314329026561'; // Your Discord user ID

    if (!discordBotToken) {
        console.error('DISCORD_TOKEN is not set');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: Missing bot token' }),
        };
    }

    try {
        if (sendMessage) {
            await sendMessageToDiscord(threadId, userName, content);
        }
        
        const messages = await fetchMessagesFromDiscord(threadId, userName, lastMessageId, repUserId);
        return {
            statusCode: 200,
            body: JSON.stringify(messages),
        };
    } catch (error) {
        console.error('Error details:', error);
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch or send messages', 
                details: error.message || 'Unknown error'
            }),
        };
    }
};

async function fetchMessagesFromDiscord(threadId, userName, lastMessageId, repUserId) {
    const discordBotToken = process.env.DISCORD_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
    
    try {
        const params = { limit: 100 };
        if (lastMessageId) {
            params.after = lastMessageId;
        }
        
        const response = await axios.get(discordApiUrl, {
            headers: {
                Authorization: `Bot ${discordBotToken}`,
                'Content-Type': 'application/json'
            },
            params: params
        });

        return response.data
            .filter(msg => msg.content.trim() !== '')
            .map(msg => ({
                id: msg.id,
                sender: msg.author.id === repUserId ? 'Support' : msg.author.username,
                content: msg.content,
                isDiscord: true,
                isDiscordUser: msg.author.id !== repUserId && msg.author.username !== 'Lua Services',
                isLuaServices: msg.author.username === 'Lua Services'
            }))
            .reverse(); // Reverse the order to get oldest messages first
    } catch (error) {
        console.error('Error fetching messages from Discord:', error);
        throw error;
    }
}

async function sendMessageToDiscord(threadId, userName, content) {
    const discordBotToken = process.env.DISCORD_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
    
    try {
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

        console.log('Message sent to Discord:', response.data);
    } catch (error) {
        console.error('Error sending message to Discord:', error);
        throw error;
    }
}