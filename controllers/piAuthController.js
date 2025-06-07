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
