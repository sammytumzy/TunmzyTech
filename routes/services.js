const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const aiServicesController = require('../controllers/aiServicesController');

// Welcome endpoint
router.get('/', ensureAuthenticated, (req, res) => {
  res.json({ message: 'Welcome to the TumzyTech AI services API!' });
});

// Chatbot endpoint
router.post('/chatbot', ensureAuthenticated, aiServicesController.chatbot);

// Image generation endpoint
router.post('/generate-image', ensureAuthenticated, aiServicesController.generateImage);

// User stats endpoint
router.get('/user-stats', ensureAuthenticated, aiServicesController.getUserStats);

module.exports = router;
