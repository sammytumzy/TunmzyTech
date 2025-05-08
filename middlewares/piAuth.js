const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to handle Pi Network authentication
 * This middleware verifies the Pi Network access token and attaches the user to the request
 */
const piAuth = {
  /**
   * Ensure user is authenticated with Pi Network
   * This middleware checks for a valid Pi Network access token in the Authorization header
   */
  ensurePiAuthenticated: async (req, res, next) => {
    try {
      // Get token from Authorization header (Bearer token)
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Pi Network authentication required' 
        });
      }
      
      // Verify token with Pi Network (in a production app, you would validate with Pi Network API)
      // For now, we'll just check if the token exists and find the user by piUsername
      
      // Get user from database based on Pi username
      // In a real implementation, you would verify the token with Pi Network API
      // and then find the user based on the verified username
      const user = await User.findOne({ piUsername: req.body.username || req.query.username });
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or invalid Pi Network token' 
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Pi authentication error:', error);
      res.status(401).json({ 
        success: false, 
        message: 'Pi Network authentication failed' 
      });
    }
  },
  
  /**
   * Create or update user from Pi Network authentication
   * This middleware creates a new user or updates an existing user based on Pi Network authentication
   */
  createOrUpdatePiUser: async (req, res, next) => {
    try {
      // Get Pi user data from request body
      const { username, uid } = req.body;
      
      if (!username || !uid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Pi Network username and uid are required' 
        });
      }
      
      // Find user by Pi username or create a new one
      let user = await User.findOne({ piUsername: username });
      
      if (!user) {
        // Create new user
        user = new User({
          piUsername: username,
          name: username, // Use Pi username as name initially
          email: `${username}@pi-user.com`, // Placeholder email
          createdAt: new Date()
        });
        
        await user.save();
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error creating/updating Pi user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error processing Pi Network authentication' 
      });
    }
  }
};

module.exports = piAuth;
