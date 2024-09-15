const axios = require('axios');
const WebSocket = require('ws');

let wss;

exports.handler = async (event, context) => {
    if (event.httpMethod === 'GET' && event.path === '/.netlify/functions/fetchDiscordMessages') {
        // WebSocket upgrade
        const { awsContext } = context.clientContext || {};
        if (awsContext && awsContext.websocket) {
            if (!wss) {
                wss = new WebSocket.Server({ noServer: true });
                setupWebSocketServer(wss);
            }
            return awsContext.websocket.upgrade();
        }
    }

    // Handle HTTP requests
    const { threadId, userName } = JSON.parse(event.body);
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

    try {
        const messages = await fetchMessagesFromDiscord(threadId, userName);
        return {
            statusCode: 200,
            body: JSON.stringify(messages),
        };
    } catch (error) {
        console.error('Error details:', error);
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch messages', 
                details: error.message || 'Unknown error'
            }),
        };
    }
};

function setupWebSocketServer(wss) {
    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            if (data.type === 'joinThread') {
                await handleJoinThread(ws, data.threadId, data.userName);
            } else if (data.type === 'message') {
                await handleMessage(ws, data.threadId, data.userName, data.content);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

async function handleJoinThread(ws, threadId, userName) {
    console.log(`User ${userName} joined thread ${threadId}`);
    await fetchAndSendMessages(ws, threadId, userName);
}

async function handleMessage(ws, threadId, userName, content) {
    try {
        console.log('Received message:', { threadId, userName, content });
        await sendMessageToDiscord(threadId, userName, content);
        console.log('Message sent to Discord');
        await fetchAndSendMessages(ws, threadId, userName);
    } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }));
    }
}

async function fetchAndSendMessages(ws, threadId, userName) {
    try {
        const messages = await fetchMessagesFromDiscord(threadId, userName);
        ws.send(JSON.stringify({ type: 'message', messages }));
    } catch (error) {
        console.error('Error fetching and sending messages:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch messages' }));
    }
}

async function fetchMessagesFromDiscord(threadId, userName) {
    const discordBotToken = process.env.DISCORD_TOKEN;
    const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
    
    try {
        const response = await axios.get(discordApiUrl, {
            headers: {
                Authorization: `Bot ${discordBotToken}`,
                'Content-Type': 'application/json'
            },
            params: { limit: 100 }
        });

        return response.data
            .filter(msg => msg.author.username !== 'Lua Script Services' && msg.content.trim() !== '')
            .map(msg => ({
                id: msg.id,
                sender: msg.author.username,
                content: msg.content,
                isDiscord: true,
                isDiscordUser: msg.author.username !== userName
            }));
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