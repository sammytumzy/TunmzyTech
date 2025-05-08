const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const axios = require('axios');

// Helper: Verify payment with Pi Platform API
async function verifyPaymentWithPi(paymentId) {
  try {
    const response = await axios.get(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment with Pi Platform:', error.response?.data || error.message);
    return null;
  }
}

// Example service endpoint
router.get('/', ensureAuthenticated, (req, res) => {
  res.json({ message: 'Welcome to the services API!' });
});

const GEMINI_API_KEY = 'AIzaSyDvAkL_FYVFLXdBGnQSk3lrNpLrLJoKoCw';

// Chatbot API endpoint (Gemini only, cleaned up)
router.post('/chatbot', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${GEMINI_API_KEY}`,
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
    res.json({ response: aiReply });
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