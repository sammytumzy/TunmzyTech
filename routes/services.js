const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const User = require('../models/User');

// Example service endpoint
router.get('/', ensureAuthenticated, (req, res) => {
  res.json({ message: 'Welcome to the services API!' });
});

// Chatbot endpoint
router.post('/chatbot', ensureAuthenticated, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple response for now
    res.json({
      response: "Thank you for your message. The chatbot service is being reconfigured."
    });

  } catch (error) {
    console.error('Error in chatbot service:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
