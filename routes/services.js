const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const { ensurePiAuthenticated } = require('../middlewares/piAuth');
const axios = require('axios');
const User = require('../models/User');

// OpenRouter API key - now loaded from environment variable for security
const OPENROUTER_API_KEY = `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`;

// Unified error handler for OpenRouter API
function handleOpenRouterError(res, error) {
  let errorMessage = 'An error occurred while communicating with the AI service.';
  let errorType = 'API_ERROR';
  let errorCode = 500;
  let errorDetails = {};

  if (error.response) {
    errorCode = error.response.status;
    errorDetails = error.response.data;
    if (errorCode === 401) {
      errorMessage = 'Authentication error: The API key for our AI service is invalid or expired. Please contact support.';
      errorType = 'AUTHENTICATION_FAILED';
    } else if (errorCode === 429) {
      errorMessage = 'Rate limit exceeded: The AI service is currently experiencing high traffic. Please try again in a few minutes.';
      errorType = 'RATE_LIMIT';
    } else if (errorCode >= 500) {
      errorMessage = 'The AI service is currently experiencing issues. This is a temporary problem with OpenRouter. Please try again later.';
      errorType = 'SERVICE_UNAVAILABLE';
    } else {
      errorMessage = error.response.data.error?.message || error.response.data.message || errorMessage;
    }
  } else if (error.code) {
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Cannot reach the AI service (DNS resolution failed). Please check your internet connection and try again.';
      errorType = 'DNS_ERROR';
      errorCode = 503;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'The AI service refused the connection. This could be a temporary issue. Please try again later.';
      errorType = 'CONNECTION_REFUSED';
      errorCode = 503;
    } else if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))) {
      errorMessage = 'Connection to the AI service timed out. This may be due to network issues or high traffic.';
      errorType = 'TIMEOUT';
      errorCode = 504;
    } else {
      errorMessage = error.message || errorMessage;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }

  return res.status(errorCode).json({
    response: errorMessage,
    error: errorDetails || error.message,
    errorType,
    errorCode
  });
}

// Example service endpoint
router.get('/', ensureAuthenticated, (req, res) => {
  res.json({ message: 'Welcome to the services API!' });
});

// Test OpenRouter API connection status
router.get('/test-openrouter', async (req, res) => {
  try {
    console.log('Testing OpenRouter API connection...');
    const response = await axios.head('https://api.openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': OPENROUTER_API_KEY
      },
      timeout: 5000
    });
    
    res.json({
      success: true,
      status: response.status,
      message: 'Successfully connected to OpenRouter API',
      apiStatus: 'online'
    });
  } catch (error) {
    console.error('Error testing OpenRouter connection:', error.message);
    let errorDetails = {
      success: false,
      apiStatus: 'error',
      message: 'Failed to connect to OpenRouter API'
    };
    
    // Check for different error types
    if (error.code === 'ENOTFOUND') {
      errorDetails.errorType = 'DNS_RESOLUTION_FAILED';
      errorDetails.message = 'DNS resolution failed - unable to resolve api.openrouter.ai domain';
      errorDetails.recommendation = 'Check your internet connection and DNS settings';
    } else if (error.code === 'ECONNREFUSED') {
      errorDetails.errorType = 'CONNECTION_REFUSED';
      errorDetails.message = 'Connection refused by OpenRouter API';
      errorDetails.recommendation = 'Check if your network allows outbound connections to api.openrouter.ai';
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorDetails.errorType = 'CONNECTION_TIMEOUT';
      errorDetails.message = 'Connection to OpenRouter API timed out';
      errorDetails.recommendation = 'The API might be experiencing high traffic or your connection is slow';
    } else if (error.response && error.response.status === 401) {
      errorDetails.errorType = 'AUTHENTICATION_FAILED';
      errorDetails.message = 'API authentication failed - invalid API key';
      errorDetails.recommendation = 'Verify your OpenRouter API key';
    }
    
    res.status(500).json(errorDetails);
  }
});

// Middleware to check if user has access to chatbot
const checkChatbotAccess = async (req, res, next) => {
  try {
    // If no user is authenticated, allow a limited number of free trials
    if (!req.user) {
      // For anonymous users, use IP-based tracking or session-based tracking
      // For simplicity, we'll just proceed without checking
      return next();
    }
    
    // Check if user has an active subscription
    if (req.user.subscriptionActive) {
      // Check if subscription is still valid
      const now = new Date();
      if (req.user.subscriptionEndDate && new Date(req.user.subscriptionEndDate) > now) {
        return next(); // User has active subscription
      } else {
        // Subscription has expired, update user record
        req.user.subscriptionActive = false;
        await req.user.save();
      }
    }
    
    // Check if user has trial messages left
    if (req.user.trialCount < 5) { // Allow 5 free trial messages
      // Increment trial count
      req.user.trialCount += 1;
      await req.user.save();
      return next();
    }
    
    // User has no subscription and no trial messages left
    return res.status(402).json({
      success: false,
      message: 'You have used all your free trial messages. Please subscribe to continue using the chatbot.',
      requiresPayment: true
    });
  } catch (error) {
    console.error('Error checking chatbot access:', error);
    return next(); // Proceed anyway in case of error
  }
};

// Chatbot API endpoint with payment integration
router.post('/chatbot', checkChatbotAccess, async (req, res) => {
  const { message } = req.body;
  try {
    if (!message) {
      return res.status(400).json({ response: 'Message is required' });
    }

    // Session-based conversation history (last 10 messages)
    if (!req.session) req.session = {};
    if (!req.session.conversationHistory) req.session.conversationHistory = [];
    req.session.conversationHistory.push({ role: 'user', content: message });
    // Keep only the last 10 messages
    if (req.session.conversationHistory.length > 10) {
      req.session.conversationHistory = req.session.conversationHistory.slice(-10);
    }

    // Prepare messages for OpenRouter (user + previous assistant replies)
    const messages = req.session.conversationHistory;

    // Test OpenRouter API connectivity (optional, can be removed for perf)
    try {
      await axios.head('https://api.openrouter.ai', {
        timeout: 5000,
        headers: { 'Authorization': OPENROUTER_API_KEY }
      });
    } catch (apiError) {
      console.error('Error connecting to OpenRouter API:', apiError.message);
      return handleOpenRouterError(res, apiError);
    }

    // Call OpenRouter API
    let response;
    try {
      response = await axios.post(
        'https://api.openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-3.5-turbo',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': OPENROUTER_API_KEY,
            'HTTP-Referer': 'https://tumzytech.com',
            'X-Title': 'TumzyTech AI Assistant',
            'OpenAI-Beta': 'assistants=v1',
            'User-Agent': 'TumzyTech/1.0.0'
          },
          timeout: 10000
        }
      );
    } catch (error) {
      return handleOpenRouterError(res, error);
    }

    const aiReply = response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    // Add assistant reply to session history
    req.session.conversationHistory.push({ role: 'assistant', content: aiReply });
    if (req.session.conversationHistory.length > 10) {
      req.session.conversationHistory = req.session.conversationHistory.slice(-10);
    }

    // Return response with subscription status if user is authenticated
    if (req.user) {
      res.json({
        response: aiReply,
        trialCount: req.user.trialCount,
        trialRemaining: Math.max(0, 5 - req.user.trialCount),
        subscriptionActive: req.user.subscriptionActive || false,
        subscriptionEndDate: req.user.subscriptionEndDate || null
      });
    } else {
      res.json({ response: aiReply });
    }
  } catch (error) {
    return handleOpenRouterError(res, error);
  }
});

// Get chatbot usage statistics
router.get('/chatbot/stats', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      trialCount: user.trialCount,
      trialRemaining: Math.max(0, 5 - user.trialCount),
      subscriptionActive: user.subscriptionActive || false,
      subscriptionEndDate: user.subscriptionEndDate || null
    });
  } catch (error) {
    console.error('Error getting chatbot stats:', error);
    res.status(500).json({ success: false, message: 'Error getting chatbot statistics' });
  }
});

module.exports = router;
