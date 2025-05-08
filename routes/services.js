const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const { ensurePiAuthenticated } = require('../middlewares/piAuth');
const axios = require('axios');
const User = require('../models/User');

// Example service endpoint
router.get('/', ensureAuthenticated, (req, res) => {
  res.json({ message: 'Welcome to the services API!' });
});

const GEMINI_API_KEY = 'AIzaSyDvAkL_FYVFLXdBGnQSk3lrNpLrLJoKoCw';

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
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: message }]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    const aiReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    
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
    if (error.response) {
      console.error('Gemini API error:', error.response.status, error.response.data);
      res.json({ response: `Gemini API error: ${error.response.status} - ${JSON.stringify(error.response.data)}` });
    } else {
      console.error('Gemini API error:', error.message);
      res.json({ response: 'Sorry, there was an error connecting to Gemini AI.' });
    }
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
