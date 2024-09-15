const axios = require('axios');
const { Server } = require('socket.io');

let io;

exports.handler = async (event, context) => {
    const { threadId, after, userName } = JSON.parse(event.body);
    const discordBotToken = process.env.DISCORD_TOKEN;

    if (!io) {
        io = new Server(event.port);
        io.on('connection', (socket) => {
            console.log('Client connected');

            socket.on('joinThread', async ({ threadId, userName }) => {
                console.log(`User ${userName} joined thread ${threadId}`);
                socket.join(threadId);
                await fetchAndEmitMessages(threadId, userName);
            });

            socket.on('message', async ({ threadId, userName, content }) => {
                try {
                  console.log('Received message:', { threadId, userName, content });
                  await sendMessageToDiscord(threadId, userName, content);
                  console.log('Message sent to Discord');
                  await fetchAndEmitMessages(threadId, userName);
                } catch (error) {
                  console.error('Error handling message:', error);
                  socket.emit('error', { message: 'Failed to send message' });
                }
              });
            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }

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

    try {
        const messages = await fetchMessagesFromDiscord(threadId, userName);
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

    async function fetchAndEmitMessages(threadId, userName) {
        try {
            const messages = await fetchMessagesFromDiscord(threadId, userName);
            io.to(threadId).emit('message', messages);
        } catch (error) {
            console.error('Error fetching and emitting messages:', error);
        }
    }

    async function fetchMessagesFromDiscord(threadId, userName) {
        try {
            const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
            const params = { after, limit: 100 };

            const response = await axios.get(discordApiUrl, {
                headers: {
                    Authorization: `Bot ${discordBotToken}`,
                    'Content-Type': 'application/json'
                },
                params: params
            });

            const messages = response.data
                .filter(msg => msg.author.username !== 'Lua Script Services' && msg.content.trim() !== '')
                .map(msg => ({
                    id: msg.id,
                    sender: msg.author.username,
                    content: msg.content,
                    isDiscord: true,
                    isDiscordUser: msg.author.username !== userName
                }));

            return messages;
        } catch (error) {
            console.error('Error fetching messages from Discord:', error);
            throw error;
        }
    }

    async function sendMessageToDiscord(threadId, userName, content) {
        try {
          const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
      
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
};