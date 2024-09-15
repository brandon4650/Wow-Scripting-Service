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
    let lastMessageTimestamp = 0;

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
    
        console.log('Form data:', customerData);
        console.log('Discord Name:', customerData.discordName);
        
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
          const response = await fetch('/.netlify/functions/createNewCustomerThread', {
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
        console.log('Thread ID:', threadId);
        console.log('Chat Title:', chatTitle);
        console.log('User Name:', userName);

        currentThreadId = threadId;
        currentChatTitle = chatTitle;
        currentUserName = userName;
    
        chatWindow.style.display = 'flex';
        const chatTitleElement = document.getElementById('chatTitle');
        chatTitleElement.textContent = chatTitle;
    
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    
        fetchMessages();
        setInterval(fetchMessages, 5000);
    
        setTimeout(() => {
            addMessageToChat('Support', `Welcome to ${chatTitle}! How can we assist you today?`);
        }, 1000);
    }
    
    async function sendMessage(message) {
        try {
            console.log('Sending message:', message);
            const response = await fetch('/.netlify/functions/sendMessageToDiscord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: currentThreadId,
                    userName: currentUserName,
                    content: message
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from sendMessageToDiscord:', errorData);
                throw new Error(errorData.error || 'Failed to send message');
            }
    
            const result = await response.json();
            console.log('Message sent successfully:', result);
            
            addMessageToChat(currentUserName, message, true);
            chatInput.value = '';
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

    async function fetchMessages() {
        try {
            console.log('Fetching messages for threadId:', currentThreadId);
            const response = await fetch('/.netlify/functions/fetchDiscordMessages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    threadId: currentThreadId, 
                    after: lastMessageTimestamp, 
                    userName: currentUserName 
                }),
            });
     
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from fetchDiscordMessages:', errorData);
                throw new Error(errorData.error || 'Failed to fetch messages');
            }
     
            const messages = await response.json();
            if (messages.length > 0) {
                console.log('Fetched new messages:', messages);
                messages.forEach(msg => {
                    addMessageToChat(msg.sender, msg.content, false, msg.isDiscord, msg.isDiscordUser);
                    lastMessageTimestamp = Math.max(lastMessageTimestamp, msg.timestamp);
                });
            }
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying fetch... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
                return fetchMessages(retries - 1);
            }
            console.error('Error in fetchMessages after all retries:', error);
        }
    }
    
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