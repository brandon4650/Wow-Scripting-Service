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
    const scriptTypeSelect = document.querySelector('select[name="scriptType"]');
    const otherScriptTypeInput = document.querySelector('input[name="otherScriptType"]');

    let currentThreadId, currentChatTitle, currentUserName;
    let socket;

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
    
        chatWindow.style.display = 'flex';
        const chatTitleElement = document.getElementById('chatTitle');
        chatTitleElement.textContent = currentChatTitle;
    
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    
        connectWebSocket(threadId, userName);

        setTimeout(() => {
            addMessageToChat('Support', `Welcome to ${currentChatTitle}! How can we assist you today?`);
        }, 1000);
    }

    function connectWebSocket(threadId, userName) {
        socket = new WebSocket(`wss://${window.location.hostname}/.netlify/functions/fetchDiscordMessages`);
        
        socket.onopen = () => {
            console.log('Connected to server');
            socket.send(JSON.stringify({ type: 'joinThread', threadId, userName }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
                data.messages.forEach(message => {
                    addMessageToChat(message.sender, message.content, false, message.isDiscord, message.isDiscordUser);
                });
            } else if (data.type === 'error') {
                console.error('Socket error:', data.message);
                addMessageToChat('System', 'An error occurred. Please try again.');
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            addMessageToChat('System', 'Connection error. Attempting to reconnect...');
            setTimeout(() => connectWebSocket(threadId, userName), 5000);
        };

        socket.onclose = (event) => {
            console.log('WebSocket closed:', event);
            if (!event.wasClean) {
                addMessageToChat('System', 'Connection lost. Attempting to reconnect...');
                setTimeout(() => connectWebSocket(threadId, userName), 5000);
            }
        };
    }
    
    async function sendMessage(message) {
        try {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'message',
                    threadId: currentThreadId,
                    userName: currentUserName,
                    content: message
                }));

                addMessageToChat(currentUserName, message, true);
                chatInput.value = '';
            } else {
                console.error('WebSocket is not open');
                addMessageToChat('System', 'Connection is not ready. Please try again.');
            }
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
    
    function addMessageToChat(sender, message, isUser = false, isDiscord = false, isDiscordUser = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        
        if (isUser) {
            messageElement.classList.add('user-message');
        } else if (isDiscordUser) {
            messageElement.classList.add('discord-user-message');
            sender = `DiscordUser (${sender})`;
        } else if (isDiscord) {
            messageElement.classList.add('discord-message');
        } else {
            messageElement.classList.add('support-message');
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