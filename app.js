// MedBRAIN AI - Frontend JavaScript
// Connects to Hugging Face Space API using Gradio client

const API_BASE = "https://amalsp-medbrain-ai.hf.space";
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');

// Store conversation history
let conversationHistory = [];

// Get current timestamp
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show copied notification
        showNotification('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Format text: remove markdown, add proper line breaks and spacing
function formatText(text) {
    // Remove markdown bold formatting (**text**)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Add line breaks after numbered items (1. 2. 3. etc.)
    text = text.replace(/(\d+\.\s[^\n]+)/g, '$1\n');
    
    // Add line breaks after colons followed by text
    text = text.replace(/:\s+/g, ':\n');
    
    // Convert newlines to <br> tags
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Add message to chat with timestamp and copy button
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const textContent = document.createElement('p');
    textContent.innerHTML = `${formatText(content)}`;
    messageContent.appendChild(textContent);
    
    // Add timestamp
    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = getTimestamp();
    messageContent.appendChild(timestamp);
    
    // Add copy button for bot messages
    if (!isUser) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy message';
        copyBtn.onclick = () => copyToClipboard(content);
        messageContent.appendChild(copyBtn);
    }
    
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

// Clear chat function
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        // Keep only the initial greeting
        const messages = chatMessages.querySelectorAll('.message');
        messages.forEach((message, index) => {
            if (index > 0) { // Keep first message (greeting)
                message.remove();
            }
        });
        conversationHistory = [];
        showNotification('Chat cleared!');
    }
}

// Update character counter
function updateCharCounter() {
    const maxLength = 500;
    const currentLength = userInput.value.length;
    const counter = document.getElementById('charCounter');
    if (counter) {
        counter.textContent = `${currentLength}/${maxLength}`;
        if (currentLength > maxLength * 0.9) {
            counter.style.color = '#e74c3c';
        } else {
            counter.style.color = '#7f8c8d';
        }
    }
}

// Send message to API using Gradio's two-step process
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;

        // Hide welcome container when first message is sent
    const welcomeContainer = document.getElementById('welcomeContainer');
    if (welcomeContainer) {
        welcomeContainer.style.display = 'none';
    }
    
    // Add user message
    addMessage(message, true);
    userInput.value = '';
    updateCharCounter();
    
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

    // Quick question buttons
document.querySelectorAll('.quick-question-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const question = this.dataset.question;
        sendExampleQuestion(question);
        // Hide welcome container
        const welcomeContainer = document.getElementById('welcomeContainer');
        if (welcomeContainer) {
            welcomeContainer.style.display = 'none';
        }
    });
});
});

// Update character counter
userInput.addEventListener('input', () => {
    const length = userInput.value.length;
    charCount.textContent = `${length}/500`;
});
userInput.addEventListener('input', updateCharCounter);

// Add clear chat button listener
const clearChatBtn = document.getElementById('clearChatBtn');
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', clearChat);
}

// Initialize character counter
updateCharCounter();

// Initial greeting
console.log('MedBRAIN AI Frontend loaded successfully');

// Voice Recognition Feature
let recognition = null;
let isListening = false;

// Check if browser supports Web Speech API
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        voiceBtn.classList.add('listening');
        voiceBtn.title = 'Listening...';
        console.log('Voice recognition started');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        console.log('Recognized:', transcript);
        updateCharCounter();
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        voiceBtn.classList.remove('listening');
        voiceBtn.title = 'Voice Input';
        
        let errorMessage = 'Voice recognition error';
        if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
        } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access denied. Please allow microphone access.';
        }
        alert(errorMessage);
    };
    
    recognition.onend = () => {
        isListening = false;
        voiceBtn.classList.remove('listening');
        voiceBtn.title = 'Voice Input';
        console.log('Voice recognition ended');
    };
    
    // Voice button click handler
    voiceBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                alert('Could not start voice recognition. Please try again.');
            }
        }
    });
} else {
    // Browser doesn't support Speech Recognition
    voiceBtn.disabled = true;
    voiceBtn.title = 'Voice input not supported in this browser';
    console.warn('Speech Recognition not supported in this browser');
}
console.log('Connected to:', API_BASE);
