const axios = require('axios');
const FormData = require('form-data');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { threadId, userName, fileName, fileContent } = JSON.parse(event.body);
    const discordBotToken = process.env.DISCORD_TOKEN;

    if (!discordBotToken) {
        console.error('DISCORD_TOKEN is not set');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: Missing bot token' }),
        };
    }

    try {
        const discordApiUrl = `https://discord.com/api/v10/channels/${threadId}/messages`;
        
        // Determine file type
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
        
        // Create a buffer from the file content
        const buffer = isImage 
            ? Buffer.from(fileContent.split(',')[1], 'base64')
            : Buffer.from(fileContent, 'utf-8');

        // Create a FormData object
        const form = new FormData();
        form.append('file', buffer, { filename: fileName });
        form.append('content', `${userName} sent a file: ${fileName}`);

        const response = await axios.post(discordApiUrl, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bot ${discordBotToken}`,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File sent successfully' }),
        };
    } catch (error) {
        console.error('Error sending file to Discord:', error);
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({ 
                error: 'Failed to send file', 
                details: error.message || 'Unknown error'
            }),
        };
    }
};