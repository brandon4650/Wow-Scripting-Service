document.addEventListener('DOMContentLoaded', () => {
    const newCustomerBtn = document.getElementById('newCustomerBtn');
    const luaScriptIssueBtn = document.getElementById('luaScriptIssueBtn');
    const newCustomerModal = document.getElementById('newCustomerModal');
    const luaScriptIssueModal = document.getElementById('luaScriptIssueModal');
    const newCustomerForm = document.getElementById('newCustomerForm');
    const issueForm = document.getElementById('issueForm');
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const scriptTypeSelect = document.querySelector('#issueScriptType');
    const otherScriptTypeInput = document.querySelector('#issueOtherScriptType');

    let currentThreadId, currentChatTitle, currentUserName;
    let lastMessageId = null;
    let pollingInterval;

    newCustomerBtn.addEventListener('click', () => {
        newCustomerModal.style.display = 'block';
    });

    luaScriptIssueBtn.addEventListener('click', () => {
        luaScriptIssueModal.style.display = 'block';
    });

    scriptTypeSelect.addEventListener('change', () => {
        otherScriptTypeInput.style.display = scriptTypeSelect.value === 'other' ? 'block' : 'none';
    });

    newCustomerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(newCustomerForm);
        const customerData = Object.fromEntries(formData.entries());
    
        try {
            const response = await fetch('/.netlify/functions/createNewCustomerThread', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to create chat');
            }
    
            const result = await response.json();
            newCustomerModal.style.display = 'none';
            initializeChat(result.threadId, result.chatTitle, customerData.discordName);
        } catch (error) {
            console.error('Error:', error);
            alert(`There was an error: ${error.message}. Please try again.`);
        }
    });

    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(issueForm);
        const issueData = Object.fromEntries(formData.entries());
        
        // Log the form data
        console.log('Submitting issue data:', issueData);
    
        try {
            const response = await fetch('/.netlify/functions/createScriptIssueThread', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(issueData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create chat');
            }
            
            const result = await response.json();
            luaScriptIssueModal.style.display = 'none';
            initializeChat(result.threadId, result.chatTitle, issueData.discordName);
        } catch (error) {
            console.error('Error:', error);
            alert(`There was an error starting the chat: ${error.message}. Please try again.`);
        }
    });

    function initializeChat(threadId, chatTitle, userName) {
        currentThreadId = threadId;
        currentChatTitle = chatTitle;
        currentUserName = userName;
        lastMessageId = null; // Reset lastMessageId when initializing chat
    
        chatWindow.style.display = 'flex';
        const chatTitleElement = document.getElementById('chatTitle');
        chatTitleElement.textContent = currentChatTitle;
    
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    
        startPolling();
    
        setTimeout(() => {
            addMessageToChat('Support', `Welcome to ${currentChatTitle}! How can we assist you today?`);
        }, 1000);
    }
    
    function startPolling() {
        fetchMessages();
        clearInterval(pollingInterval); // Clear any existing interval
        pollingInterval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    }
    
    async function fetchMessages() {
        try {
            const response = await fetch('/.netlify/functions/fetchDiscordMessages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: currentThreadId, userName: currentUserName, lastMessageId })
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
    
            const messages = await response.json();
            messages.forEach(message => {
                if (!message.isLuaServices) {
                    addMessageToChat(message.sender, message.content, false, message.isDiscord, message.isDiscordUser);
                    lastMessageId = message.id;
                }
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
            addMessageToChat('System', 'Failed to fetch messages. Please try again later.');
        }
    }    
    
    async function sendMessage(message) {
        try {
            const response = await fetch('/.netlify/functions/fetchDiscordMessages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: currentThreadId,
                    userName: currentUserName, // Use currentUserName here
                    content: message,
                    sendMessage: true
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
    
            addMessageToChat(currentUserName, message, true);
            chatInput.value = '';
            fetchMessages(); // Fetch messages immediately after sending
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChat('System', 'Failed to send message. Please try again later.');
        }
    }
    
    sendChatBtn.onclick = () => {
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    };

    const fileUpload = document.getElementById('fileUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadedFiles = document.getElementById('uploadedFiles');

    uploadBtn.addEventListener('click', () => {
        fileUpload.click();
    });

    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                const fileName = file.name;
                addFileToChat(fileName, fileContent);
            };
            reader.readAsText(file);
        }
    });

    function addFileToChat(fileName, fileContent) {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        fileItem.innerHTML = `
            <span>${fileName}</span>
            <button onclick="sendFile('${fileName}', '${encodeURIComponent(fileContent)}')">Send</button>
        `;
        uploadedFiles.appendChild(fileItem);
    }

    window.sendFile = async (fileName, fileContent) => {
        try {
            const response = await fetch('/.netlify/functions/sendFileToDiscord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: currentThreadId,
                    userName: currentUserName,
                    fileName: fileName,
                    fileContent: decodeURIComponent(fileContent)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send file');
            }

            addMessageToChat(currentUserName, `Sent file: ${fileName}`, true);
        } catch (error) {
            console.error('Error sending file:', error);
            addMessageToChat('System', 'Failed to send file. Please try again later.');
        }
    };
    
    function addMessageToChat(sender, message, isUser = false, isDiscord = false, isDiscordUser = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        
        if (isUser) {
            messageElement.classList.add('user-message');
            sender = currentUserName;
        } else if (sender === 'Support') {
            messageElement.classList.add('support-message');
        } else if (isDiscordUser) {
            messageElement.classList.add('discord-user-message');
            sender = `DiscordUser (${sender})`;
        } else if (isDiscord) {
            messageElement.classList.add('discord-message');
        }
        
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal, .chat-window').style.display = 'none';
        }
    });

    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});