const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  console.log(`New message in channel ${message.channel.id}: ${message.content}`);
  // Implement your message handling logic here
});

client.login(process.env.DISCORD_TOKEN);

exports.handler = async function(event, context) {
  // This function will be called by Netlify, but we're using it to keep the bot running
  return {
    statusCode: 200,
    body: JSON.stringify({message: "Discord bot is running"})
  };
};