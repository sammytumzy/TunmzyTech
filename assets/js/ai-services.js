// TumzyTech AI Services Integration

// Send message to chatbot
async function sendChatMessage(message) {
  try {
    const response = await fetch('/api/services/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      if (response.status === 402) {
        // Payment required - user has used all free trials
        showUpgradePrompt();
        return {
          error: true,
          message: 'You have used all your free trials. Please upgrade to continue.'
        };
      }
      throw new Error('Error from server: ' + response.statusText);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      error: true,
      message: error.message
    };
  }
}

// Generate image from prompt
async function generateImage(prompt) {
  try {
    const response = await fetch('/api/services/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
      if (response.status === 402) {
        // Payment required - user has used all free trials
        showUpgradePrompt();
        return {
          error: true,
          message: 'You have used all your free trials. Please upgrade to continue.'
        };
      }
      throw new Error('Error from server: ' + response.statusText);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      error: true,
      message: error.message
    };
  }
}

// Show upgrade prompt when trial limit is reached
function showUpgradePrompt() {
  const upgradeModal = document.getElementById('upgrade-modal');
  if (upgradeModal) {
    upgradeModal.style.display = 'block';
  } else {
    // Create a modal if it doesn't exist
    const modal = document.createElement('div');
    modal.id = 'upgrade-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Trial Limit Reached</h2>
        <p>You've used all your free trials. Upgrade to premium to continue using TumzyTech AI services.</p>
        <button id="upgrade-button" class="primary-button">Upgrade Now</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Setup event listeners
    document.querySelector('#upgrade-modal .close').addEventListener('click', function() {
      document.getElementById('upgrade-modal').style.display = 'none';
    });
<<<<<<< HEAD
      document.getElementById('upgrade-button').addEventListener('click', function() {
      window.location.href = '/chat.html';
=======
    
    document.getElementById('upgrade-button').addEventListener('click', function() {
      window.location.href = '/pricing.html';
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
    });
    
    modal.style.display = 'block';
  }
}

// Check user's trial status
async function checkUserStatus() {
  try {
    const response = await fetch('/api/services/user-stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user status');
    }
    
    const userData = await response.json();
    
    // Update trial count display if element exists
    const trialCountElement = document.getElementById('trial-count');
    if (trialCountElement) {
      trialCountElement.textContent = userData.user.remainingTrials;
    }
    
    // Show premium badge if user is premium
    const premiumBadge = document.getElementById('premium-badge');
    if (premiumBadge) {
      premiumBadge.style.display = userData.user.isPremium ? 'inline-block' : 'none';
    }
    
    return userData;
  } catch (error) {
    console.error('Error checking user status:', error);
    return null;
  }
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token && !window.location.pathname.includes('index.html')) {
    window.location.href = '/index.html';
    return;
  }
  
  if (token) {
    // Check user status
    checkUserStatus();
    
    // Setup chat form if it exists
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
      chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const messageInput = document.getElementById('chat-input');
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Display user message
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML += `
          <div class="message user-message">
            <div class="message-content">${message}</div>
          </div>
        `;
        
        // Clear input
        messageInput.value = '';
        
        // Show loading indicator
        chatMessages.innerHTML += `
          <div class="message ai-message loading" id="loading-message">
            <div class="message-content">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        `;
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send message to server
        const response = await sendChatMessage(message);
        
        // Remove loading indicator
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
          loadingMessage.remove();
        }
        
        // Display AI response
        if (response.error) {
          chatMessages.innerHTML += `
            <div class="message error-message">
              <div class="message-content">${response.message}</div>
            </div>
          `;
        } else {
          chatMessages.innerHTML += `
            <div class="message ai-message">
              <div class="message-content">${response.response}</div>
            </div>
          `;
        }
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }
    
    // Setup image generation form if it exists
    const imageForm = document.getElementById('image-form');
    if (imageForm) {
      imageForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const promptInput = document.getElementById('prompt-input');
        const prompt = promptInput.value.trim();
        if (!prompt) return;
        
        // Show loading indicator
        const imageResult = document.getElementById('image-result');
        imageResult.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Generating image...</p>
          </div>
        `;
        
        // Send request to server
        const response = await generateImage(prompt);
        
        // Display result
        if (response.error) {
          imageResult.innerHTML = `
            <div class="error-message">
              <p>${response.message}</p>
            </div>
          `;
        } else {
          imageResult.innerHTML = `
            <div class="image-container">
              <img src="${response.imageUrl}" alt="Generated image">
            </div>
            <div class="image-prompt">
              <p><strong>Prompt:</strong> ${prompt}</p>
            </div>
          `;
        }
      });
    }
  }
});
