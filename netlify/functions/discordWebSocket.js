const { Client, Intents } = require('discord.js');
const WebSocket = require('ws');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.MESSAGE_CONTENT
    ] 
});

const wss = new WebSocket.Server({ port: 8080 });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return; // Ignore messages from bots
    console.log(`New message in channel ${message.channel.id}: ${message.content}`);
    // Implement your message handling logic here
});

client.on('typingStart', (typing) => {
    if (typing.user.bot) return; // Ignore typing events from bots
    
    const typingData = {
        type: 'typing',
        threadId: typing.channel.id,
        user: typing.user.username
    };
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(typingData));
        }
    });
});

client.login(process.env.DISCORD_TOKEN);

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        console.log('Received message:', message);
        // Handle incoming messages if needed
    });
});

exports.handler = async function(event, context) {
    // This function will be called by Netlify, but we're using it to keep the bot running
    return {
        statusCode: 200,
        body: JSON.stringify({message: "Discord bot is running"})
    };
};