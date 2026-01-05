// MedBRAIN AI - Frontend JavaScript
// New Turquoise Theme - Connected to Hugging Face Backend
// Rollback Code: 8123023

const API_BASE = "https://amalsp-medbrain-ai.hf.space";
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionsContainer = document.getElementById('suggestionsContainer');

let conversationHistory = [];

// Get current timestamp
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = text;
    
    const timeStamp = document.createElement('div');
    timeStamp.className = 'message-time';
    timeStamp.textContent = getTimestamp();
    
    content.appendChild(messageText);
    content.appendChild(timeStamp);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-brain"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    
    content.appendChild(typingIndicator);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send message to API
async function sendMessage(message) {
    if (!message.trim()) return;
    
    // Hide suggestions after first message
    if (conversationHistory.length === 0) {
        suggestionsContainer.style.display = 'none';
    }
    
    // Add user message
    addMessage(message, true);
    conversationHistory.push({ role: 'user', content: message });
    
    // Clear input
    userInput.value = '';
    sendBtn.disabled = true;
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call Hugging Face API
        const response = await fetch(`${API_BASE}/gradio_api/call/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [message, conversationHistory]
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to initiate API call');
        }
        
        const callData = await response.json();
        const eventId = callData.event_id;
        
        // Get the response using Server-Sent Events
        const eventSource = new EventSource(`${API_BASE}/gradio_api/call/chat/${eventId}`);
        
        eventSource.addEventListener('complete', async (event) => {
            const data = JSON.parse(event.data);
            const aiResponse = data[0];
            
            removeTypingIndicator();
            addMessage(aiResponse, false);
            conversationHistory.push({ role: 'assistant', content: aiResponse });
            
            eventSource.close();
            sendBtn.disabled = false;
        });
        
        eventSource.addEventListener('error', (error) => {
            console.error('EventSource error:', error);
            removeTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', false);
            eventSource.close();
            sendBtn.disabled = false;
        });
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage('Sorry, I am having trouble connecting to the server. Please try again later.', false);
        sendBtn.disabled = false;
    }
}

// Handle suggestion chip click
function sendSuggestion(text) {
    userInput.value = text;
    sendMessage(text);
}

// Event Listeners
sendBtn.addEventListener('click', () => {
    const message = userInput.value;
    sendMessage(message);
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = userInput.value;
        sendMessage(message);
    }
});

userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Disable send button initially
    sendBtn.disabled = true;
    
    console.log('MedBRAIN AI initialized');
    console.log('Connected to:', API_BASE);
});
