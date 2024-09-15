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
            body: JSON.stringify(customerData)
          });
        
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create chat');
          }
        
          const result = await response.json();
          newCustomerModal.style.display = 'none';
          initializeChat(result.threadId, result.chatTitle, customerData.discordName);
        } catch (error) {
          console.error('Error:', error);
          alert(`There was an error starting the chat: ${error.message}. Please try again.`);
        }
    });

    function initializeChat(threadId, chatTitle, userName) {
        console.log('Thread ID:', threadId);
        console.log('Chat Title:', chatTitle);
        console.log('User Name:', userName);
    
        chatWindow.style.display = 'flex'; // Show the chat window
        const chatTitleElement = document.getElementById('chatTitle');
        chatTitleElement.textContent = chatTitle;
    
        // Clear previous messages
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
    
        // Function to send messages to Discord via Netlify Function
        async function sendMessage(message) {
            try {
                console.log('Sending message:', message);
                const response = await fetch('/.netlify/functions/sendMessageToDiscord', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threadId: threadId,
                        userName: userName,
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
                
                addMessageToChat(userName, message, true);
                chatInput.value = '';
            }   catch (error) {
                console.error('Error sending message:', error);
                addMessageToChat('System', 'Failed to send message. Please try again later.');
            }
        }
        
        // Update the event listener for the send button
        sendChatBtn.onclick = () => {
            const message = chatInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        };
    
        // Function to fetch messages from Discord and update chat
        let lastMessageTimestamp = 0;

        async function fetchMessages() {
            try {
              console.log('Fetching messages for threadId:', threadId);
              const response = await fetch('/.netlify/functions/fetchDiscordMessages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: threadId, after: lastMessageTimestamp }),
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
                 addMessageToChat(msg.sender, msg.content, !msg.isDiscord);
                 lastMessageTimestamp = Math.max(lastMessageTimestamp, msg.timestamp);
               });
             }
           } catch (error) {
             console.error('Error in fetchMessages:', error);
           }
        }
        fetchMessages();
        // Fetch messages every 5 seconds
        setInterval(fetchMessages, 5000);
    
        // Simulate initial greeting message
        setTimeout(() => {
            addMessageToChat('Support', `Welcome to ${chatTitle}! How can we assist you today?`);
        }, 1000);
    }
    
    function addMessageToChat(sender, message, isUser = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        
        if (isUser) {
            messageElement.classList.add('user-message');
        } else {
            messageElement.classList.add('discord-message');
        }
        
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Close modals and chat window
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = function() {
            this.closest('.modal, .chat-window').style.display = 'none';
        }
    });

    // Close modal when clicking outside of it
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});