// MedBRAIN AI - Frontend JavaScript
// Connects to Hugging Face Space API using Gradio client

const API_BASE = "https://amalsp-medbrain-ai.hf.space";
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Store conversation history
let conversationHistory = [];

// Format text: remove markdown, add proper line breaks and spacing
function formatText(text) {
    // Remove markdown bold formatting (**text**)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Add line breaks after numbered items (1. 2. 3. etc.)
    text = text.replace(/(\d+\.\s[^\n]+)/g, '$1\n\n');
    
    // Add line breaks after colons followed by text
    text = text.replace(/:\s+/g, ':\n');
    
    // Convert newlines to <br> tags
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${formatText(content)}</p>`;    
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

// Send message to API using Gradio's two-step process
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
        // Step 1: POST request to initiate prediction
        const callResponse = await fetch(`${API_BASE}/gradio_api/call/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [message, conversationHistory]
            })
        });
        
        if (!callResponse.ok) {
            throw new Error('Failed to initiate API call');
        }
        
        const callData = await callResponse.json();
        const eventId = callData.event_id;
        
        // Step 2: GET request to retrieve the result using Server-Sent Events
        const eventSource = new EventSource(`${API_BASE}/gradio_api/call/chat/${eventId}`);
        
        eventSource.addEventListener('complete', (event) => {
            const data = JSON.parse(event.data);
            const botResponse = data[0];
            
            removeLoading();
            addMessage(botResponse);
            
            // Update conversation history
            conversationHistory.push([message, botResponse]);
            
            eventSource.close();
            sendBtn.disabled = false;
        });
        
        eventSource.addEventListener('error', (event) => {
            console.error('EventSource error:', event);
            removeLoading();
            addMessage('Sorry, I encountered an error. Please try again.');
            eventSource.close();
            sendBtn.disabled = false;
        });
        
    } catch (error) {
        console.error('Error:', error);
        removeLoading();
        addMessage('Sorry, I encountered an error. Please try again or check if the service is available.');
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
console.log('Connected to:', API_BASE);
