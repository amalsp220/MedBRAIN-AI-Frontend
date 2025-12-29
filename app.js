// MedBRAIN AI - Frontend JavaScript
// Connects to Hugging Face Space API

const API_URL = "https://amalsp-medbrain-ai.hf.space/api/predict";
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Store conversation history
let conversationHistory = [];

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${content}</p>`;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add loading indicator
function addLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.id = 'loading-message';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = '<div class="loading"></div>';
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove loading indicator
function removeLoading() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// Send message to API
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    userInput.value = '';
    
    // Disable send button
    sendBtn.disabled = true;
    addLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [message, conversationHistory]
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        const botResponse = result.data[0];
        
        removeLoading();
        addMessage(botResponse);
        
        // Update conversation history
        conversationHistory.push([message, botResponse]);
        
    } catch (error) {
        console.error('Error:', error);
        removeLoading();
        addMessage('Sorry, I encountered an error. Please try again or check if the service is available.');
    } finally {
        sendBtn.disabled = false;
    }
}

// Send example question
function sendExample(question) {
    userInput.value = question;
    sendMessage();
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initial greeting
console.log('MedBRAIN AI Frontend loaded successfully');
console.log('Connected to:', API_URL);
