const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.MESSAGE_CONTENT
    ] 
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Register the /pay command
    const command = {
        name: 'pay',
        description: 'Send a PayPal payment link',
        options: [{
            name: 'amount',
            type: 'NUMBER',
            description: 'The amount to be paid',
            required: true
        }]
    };

    try {
        await client.application.commands.create(command);
        console.log('Successfully registered /pay command');
    } catch (error) {
        console.error('Error registering /pay command:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user, channel } = interaction;

    if (commandName === 'pay') {
        // Check if the user is authorized
        if (user.id !== '643915314329026561') {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        // Check if it's a new customer chat
        if (!channel.name.startsWith('New Customer - ')) {
            return interaction.reply({ content: 'This command can only be used in new customer chats.', ephemeral: true });
        }

        const amount = options.getNumber('amount');
        const paypalLink = `https://www.paypal.me/short4650/$${amount}`;

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Payment Request')
            .setDescription(`Please click the link below to make a payment of $${amount}`)
            .addField('PayPal Link', paypalLink);

        await interaction.reply({ embeds: [embed] });
    }
});

exports.handler = async function(event, context) {
    // This function will be called by Netlify, but we're using it to keep the bot running
    return {
        statusCode: 200,
        body: JSON.stringify({message: "Discord bot is running"})
    };
};