const axios = require('axios');
const User = require('../models/User');
const ServiceUsage = require('../models/ServiceUsage');

// Configuration for different AI services
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const MAX_FREE_TRIALS = 5;

// Check if user has trial credits or premium status
const checkUserAccess = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.isPremium) {
    return true;
  }
  
  if (user.trialCount < MAX_FREE_TRIALS) {
    return true;
  }
  
  return false;
};

// Increment user trial count
const incrementTrialCount = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { trialCount: 1 } });
};

// Record service usage
const recordServiceUsage = async (userId, serviceType, requestData, responseData, successful) => {
  await ServiceUsage.create({
    user: userId,
    serviceType,
    requestData,
    responseData,
    successful
  });
};

// Chatbot service
exports.chatbot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check user access
    const hasAccess = await checkUserAccess(req.user.id);
    if (!hasAccess) {
      return res.status(402).json({
        error: 'Payment required',
        message: 'You have used all your free trials. Please upgrade to continue.'
      });
    }

    // Configure OpenAI API request
    const aiResponse = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant for TumzyTech. Provide clear and concise answers." },
          { role: "user", content: message }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const response = aiResponse.data.choices[0].message.content;
    
    // Record usage and increment trial count for free users
    await recordServiceUsage(req.user.id, 'chatbot', { message }, { response }, true);
    
    if (!req.user.isPremium) {
      await incrementTrialCount(req.user.id);
    }

    res.json({ response });
  } catch (error) {
    console.error('Error in chatbot service:', error);
    
    // Record failed attempt
    if (req.user && req.user.id) {
      await recordServiceUsage(
        req.user.id, 
        'chatbot', 
        req.body, 
        { error: error.message }, 
        false
      );
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Error processing chatbot request',
      message: error.response?.data?.error?.message || error.message
    });
  }
};

// Image generation service
exports.generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check user access
    const hasAccess = await checkUserAccess(req.user.id);
    if (!hasAccess) {
      return res.status(402).json({
        error: 'Payment required',
        message: 'You have used all your free trials. Please upgrade to continue.'
      });
    }

    // Configure OpenAI Image Generation API request
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt,
        n: 1,
        size: "1024x1024"
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const imageUrl = aiResponse.data.data[0].url;
    
    // Record usage and increment trial count for free users
    await recordServiceUsage(req.user.id, 'image-generation', { prompt }, { imageUrl }, true);
    
    if (!req.user.isPremium) {
      await incrementTrialCount(req.user.id);
    }

    res.json({ imageUrl });
  } catch (error) {
    console.error('Error in image generation service:', error);
    
    // Record failed attempt
    if (req.user && req.user.id) {
      await recordServiceUsage(
        req.user.id, 
        'image-generation', 
        req.body, 
        { error: error.message }, 
        false
      );
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Error processing image generation request',
      message: error.response?.data?.error?.message || error.message
    });
  }
};

// Get user usage stats
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const usageStats = await ServiceUsage.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      user: {
        name: user.name,
        email: user.email,
        trialCount: user.trialCount,
        isPremium: user.isPremium,
        remainingTrials: Math.max(0, MAX_FREE_TRIALS - user.trialCount)
      },
      recentActivity: usageStats.map(usage => ({
        serviceType: usage.serviceType,
        timestamp: usage.timestamp,
        successful: usage.successful
      }))
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Error fetching user stats',
      message: error.message
    });
  }
};
