document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');

  // Update chat window with message
  function addMessage(message, isBot = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isBot ? 'bot' : 'user'}`;
    messageDiv.textContent = message;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Handle form submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    
    if (!message) return;

    // Add user's message to chat
    addMessage(message, false);
    userInput.value = '';

    try {
      const response = await fetch('/api/services/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      addMessage(data.response, true);

    } catch (error) {
      console.error('Error:', error);
      addMessage('Sorry, I am having trouble connecting to the server. Please try again later.', true);
    }
  });
});
