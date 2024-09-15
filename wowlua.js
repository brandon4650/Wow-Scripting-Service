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
    const scriptTypeSelect = document.getElementById('scriptType');
    const otherScriptTypeInput = document.getElementById('otherScriptType');

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
                throw new Error('Failed to create ticket');
            }

            const result = await response.json();
            luaScriptIssueModal.style.display = 'none';
            initializeChat(result.threadId, result.chatTitle, issueData.discordName);
        } catch (error) {
            console.error('Error:', error);
            alert(`There was an error: ${error.message}. Please try again.`);
        }
    });

    function initializeChat(threadId, chatTitle, userName) {
        chatWindow.style.display = 'block';
        const chatTitleElement = document.getElementById('chatTitle');
        chatTitleElement.textContent = chatTitle;

        // Clear previous messages
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        // Here you would set up the WebSocket connection using the threadId
        // For now, we'll use a simple simulation
        
        sendChatBtn.onclick = () => {
            const message = chatInput.value.trim();
            if (message) {
                addMessageToChat(userName, message);
                chatInput.value = '';
                // Here you would send the message to the Discord thread
            }
        };

        // Simulate receiving a message (in reality, this would come from the WebSocket)
        setTimeout(() => {
            addMessageToChat('Support', `Welcome to ${chatTitle}! How can we assist you today?`);
        }, 1000);
    }

    function addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
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