const axios = require('axios');
const User = require('../models/User');
require('dotenv').config();

const PI_API_BASE_URL = 'https://api.minepi.com/v2';

exports.linkAccount = async (req, res) => {
    const { piAccessToken, piUserId, piUsername } = req.body;
    const applicationUserId = req.user.id; // Extracted from JWT by your authMiddleware

    if (!piAccessToken || !piUserId) {
        return res.status(400).json({ success: false, message: 'Pi accessToken and userId are required.' });
    }
    if (!applicationUserId) {
        return res.status(401).json({ success: false, message: 'User not authenticated in the application.' });
    }
    try {
        // 1. Verify the Pi Access Token with Pi Server's /me endpoint
        let piUserDetails;
        try {
            const meResponse = await axios.get(`${PI_API_BASE_URL}/me`, {
                headers: { 'Authorization': `Bearer ${piAccessToken}` }
            });
            piUserDetails = meResponse.data;
            if (piUserDetails.uid !== piUserId) {
                return res.status(403).json({ success: false, message: 'Pi user ID mismatch or invalid token.' });
            }
        } catch (piError) {
            return res.status(401).json({ success: false, message: 'Invalid Pi access token or failed to verify with Pi server.' });
        }
        // 2. Find the application user
        const user = await User.findById(applicationUserId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Application user not found.' });
        }
        // 3. Update the user model with Pi user ID and potentially username
        user.piUserId = piUserId;
        user.piUsername = piUsername || piUserDetails.username;
        await user.save();
        res.json({
            success: true,
            message: 'Pi account linked successfully.',
            data: {
                applicationUserId: user._id,
                piUserId: user.piUserId,
                piUsername: user.piUsername
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while linking Pi account.',
            error: error.message
        });
    }
};

// Verify Pi Network authentication and issue JWT
exports.verifyPiAuth = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token is required' });
    }
    const meResponse = await axios.get(`${PI_API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const piUser = meResponse.data;
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
    const token = require('jsonwebtoken').sign(
      { id: user._id, name: user.name, piUserId: user.piUserId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ success: true, user: { uid: user.piUserId, username: user.username, name: user.name, isPremium: user.isPremium }, token });
  } catch (error) {
    console.error('Pi auth verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid Pi Network access token', error: error.response?.data || error.message });
  }
};

// Get subscription status (trial and premium)
exports.subscriptionStatus = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const remainingTrials = Math.max(0, 5 - user.trialCount);
    res.json({ success: true, isPremium: user.isPremium, trialCount: user.trialCount, remainingTrials });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Create a Pi Network payment via Pi API
exports.createPayment = async (req, res) => {
  try {
    const { amount, memo, metadata } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });
    const response = await axios.post(
      `${PI_API_BASE_URL}/payments`,
      { amount, memo, metadata },
      { headers: { Authorization: `Key ${process.env.PI_API_KEY}` } }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(error.response?.status || 500).json({ success: false, message: 'Payment creation failed', error: error.response?.data || error.message });
  }
};
