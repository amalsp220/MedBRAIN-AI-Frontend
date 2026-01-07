// MedBRAIN AI - Frontend JavaScript
// Purple Theme - Connected to Hugging Face Backend

const API_BASE = "https://amalsp-medbrain-ai.hf.space";
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const suggestionsContainer = document.querySelector('.suggestions');
let conversationHistory = [];

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
        messageContent.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.classList.add('show');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    typingIndicator.classList.remove('show');
}

// Send message to API
async function sendMessage(message) {
    if (!message) message = userInput.value.trim();
    if (!message) return;

        // Hide suggestions after first interaction
    if (suggestionsContainer) {
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
    sendMessage();
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
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


    // Add event listeners to suggestion pills
    document.querySelectorAll('.suggestion-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            const text = this.textContent.trim();
            if (text === 'Symptoms of diabetes') {
                sendSuggestion('What are the symptoms of diabetes?');
            } else if (text === 'Blood pressure tips') {
                sendSuggestion('How to manage high blood pressure?');
            } else if (text === 'Headache causes') {
                sendSuggestion('Common causes of headaches');
            }
        });
    });

// Make functions globally accessible for inline onclick handlers
window.sendMessage = sendMessage;

                // New Chat button functionality
const newChatBtn = document.getElementById('newChatBtn');
if (newChatBtn) {
    newChatBtn.addEventListener('click', function() {
        // Clear chat messages
        const firstMessage = chatMessages.querySelector('.message.bot');
        chatMessages.innerHTML = '';
        if (firstMessage) {
            chatMessages.appendChild(firstMessage.cloneNode(true));
        }
        // Clear input
        userInput.value = '';
                // Show suggestions again
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'flex';
        }
    });
}
window.sendSuggestion = sendSuggestion;
