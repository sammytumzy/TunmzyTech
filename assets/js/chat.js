document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const piModal = document.getElementById('pi-payment-modal');
  const closePiModalBtn = document.getElementById('close-pi-modal');
  const piPaymentPlaceholderModal = document.getElementById('pi-payment-button-placeholder-modal');
  const piPaymentPlaceholder = document.getElementById('pi-payment-button-placeholder');
  let messageCount = 0;
  let isPremium = false;

  // Helper to check premium status from localStorage or DOM
  function checkPremiumStatus() {
    // Try to get from localStorage or DOM
    if (localStorage.getItem('premiumAccess') === 'true') return true;
    const premiumStatusEl = document.getElementById('premium-status');
    if (premiumStatusEl && premiumStatusEl.textContent.trim().toLowerCase().includes('premium')) return true;
    return false;
  }

  // Show Pi payment modal
  function showPiModal() {
    if (piModal) piModal.classList.remove('hidden');
    // Move the payment button into the modal
    if (piPaymentPlaceholder && piPaymentPlaceholderModal) {
      piPaymentPlaceholderModal.appendChild(piPaymentPlaceholder);
      piPaymentPlaceholder.classList.remove('hidden');
    }
  }

  // Hide Pi payment modal
  function hidePiModal() {
    if (piModal) piModal.classList.add('hidden');
  }

  if (closePiModalBtn) closePiModalBtn.onclick = hidePiModal;

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
    // Count free messages and check premium
    isPremium = checkPremiumStatus();
    if (!isPremium) {
      messageCount++;
      if (messageCount > 3) {
        showPiModal();
        addMessage('You have reached your free message limit. Please pay with Pi to continue.', true);
        return;
      }
    }
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
