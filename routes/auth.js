const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { validateRegistration } = require('../middlewares/validation');
const authController = require('../controllers/authController');

const router = express.Router();

// Google OAuth login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google OAuth callback
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
}), (req, res) => {
  // Generate JWT with more user information
  const token = jwt.sign({ 
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  }, process.env.JWT_SECRET, { expiresIn: '24h' });
  
  // Redirect to frontend with token
  res.redirect(`/callback.html?token=${token}`);
});

// Get authentication status
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? {
      name: req.user.name,
      email: req.user.email
    } : null
  });
});

// Pi Network authentication verification
router.post('/verify', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the access token with Pi Network API
    const piResponse = await axios.get('https://api.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const piUser = piResponse.data;
    
    // Find or create user in our database
    let user = await User.findOne({ piUserId: piUser.uid });
    
    if (!user) {
      user = new User({
        piUserId: piUser.uid,
        username: piUser.username,
        name: piUser.username || 'Pi User',
        email: `${piUser.username}@pi.network`,
        authProvider: 'pi'
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({
      id: user._id,
      name: user.name,
      username: user.username,
      piUserId: user.piUserId
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      user: {
        uid: user.piUserId,
        username: user.username,
        name: user.name,
        isPremium: user.isPremium
      },
      token
    });

  } catch (error) {
    console.error('Pi authentication verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Pi Network access token',
      error: error.response?.data || error.message
    });
  }
});

// Local authentication
router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);

// Logout
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;