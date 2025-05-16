/**
 * API test utilities for TumzyBot
 * This script provides functionality to test API connections
 */

// Test the OpenRouter API connection
async function testOpenRouterConnection() {
  const statusElement = document.getElementById('api-status');
  if (statusElement) {
    statusElement.textContent = 'Testing connection to OpenRouter API...';
    statusElement.className = 'text-center text-xs text-yellow-300 p-1 rounded';
  }

  // Define backend endpoints to try (local, production, current origin)
  const endpoints = [
    window.location.origin + '/api/services/test-openrouter',
    'http://localhost:5000/api/services/test-openrouter',
    'http://127.0.0.1:5000/api/services/test-openrouter'
  ];

  let response = null;
  let connected = false;
  let lastError = null;

  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        connected = true;
        break;
      }
    } catch (endpointError) {
      lastError = endpointError;
      // Continue to next endpoint
    }
  }

  if (!connected) {
    // Show error in chat window and status
    updateApiStatus('OpenRouter API: Unreachable ✗', 'text-red-400');
    showApiErrorInChat('Could not test OpenRouter API:<br>Cannot connect to the backend server. Make sure the server is running.');
    return {
      success: false,
      apiStatus: 'unreachable',
      message: 'Cannot test OpenRouter API - backend server unreachable',
      error: lastError ? lastError.message : 'No backend connection'
    };
  }

  // Parse response
  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    updateApiStatus('OpenRouter API: Response Error ✗', 'text-red-400');
    showApiErrorInChat('OpenRouter API responded, but the response could not be parsed.');
    return {
      success: false,
      apiStatus: 'response_error',
      message: 'Could not parse backend response',
      error: jsonError.message
    };
  }

  // Update the status element based on the response
  if (statusElement) {
    if (data.success) {
      statusElement.textContent = 'OpenRouter API: Online ✓';
      statusElement.className = 'text-center text-xs text-green-400 p-1 rounded bg-gray-800';
    } else {
      statusElement.textContent = `OpenRouter API: Error - ${data.errorType || 'Connection failed'}`;
      statusElement.className = 'text-center text-xs text-red-400 p-1 rounded bg-gray-800';
      showOpenRouterTroubleshooting();
    }
  }
  return data;
}

// Helper: update API status element
function updateApiStatus(text, colorClass) {
  const statusElement = document.getElementById('api-status');
  if (statusElement) {
    statusElement.textContent = text;
    statusElement.className = `text-center text-xs ${colorClass} p-1 rounded bg-gray-800`;
  }
}

// Helper: show error in chat window (avoid duplicates)
function showApiErrorInChat(html) {
  const chatWindow = document.getElementById('chat-window');
  if (chatWindow) {
    // Avoid duplicate troubleshooting messages
    if (!chatWindow.querySelector('.api-test-error')) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'chat-message bot api-test-error';
      errorDiv.innerHTML = `<strong class="text-red-400">${html}</strong>`;
      chatWindow.appendChild(errorDiv);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }
}

// Function to show OpenRouter connection troubleshooting tips
function showOpenRouterTroubleshooting() {
  const chatWindow = document.getElementById('chat-window');
  if (chatWindow) {
    // Avoid duplicate troubleshooting messages
    if (!chatWindow.querySelector('.api-troubleshooting')) {
      const helpDiv = document.createElement('div');
      helpDiv.className = 'chat-message bot api-troubleshooting';
      helpDiv.innerHTML = `
        <strong class="text-yellow-300">OpenRouter Connection Troubleshooting:</strong>
        <ol class="list-decimal pl-5 mt-2">
          <li>Make sure you have a stable internet connection</li>
          <li>Check if your network allows outbound connections to <code>api.openrouter.ai</code></li>
          <li>Try changing your DNS server to Google DNS (8.8.8.8) or Cloudflare (1.1.1.1)</li>
          <li>Verify that your OpenRouter API key is valid (ask your admin if unsure)</li>
          <li>Check if OpenRouter service is operational by visiting <a href="https://openrouter.ai/status" target="_blank" class="text-blue-400 underline">OpenRouter Status</a></li>
        </ol>
      `;
      chatWindow.appendChild(helpDiv);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    // Show the API help section visually
    const apiHelp = document.getElementById('api-help');
    if (apiHelp) {
      apiHelp.classList.remove('hidden');
      apiHelp.classList.add('bg-purple-900', 'p-2', 'rounded', 'border', 'border-yellow-300');
    }
  }
}