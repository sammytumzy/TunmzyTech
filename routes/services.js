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

// Chatbot API endpoint
router.post('/chatbot', (req, res) => {
  const { message } = req.body;

  // Simulate chatbot response
  const botResponse = `You said: ${message}`;

  res.json({ response: botResponse });
});

// Payment API endpoint
router.post('/payment', async (req, res) => {
  const { amount, memo, metadata } = req.body;

  try {
    const payment = await pi.createPayment({
      amount,
      memo,
      metadata,
    });

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, error: 'Payment failed' });
  }
});

// Pi Network payment approval endpoint
router.post('/pi/approve', async (req, res) => {
  const { paymentId } = req.body;
  const payment = await verifyPaymentWithPi(paymentId);
  if (payment && payment.status === 'pending') {
    // Approve payment
    try {
      await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
        headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
      });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to approve payment' });
    }
  }
  res.status(400).json({ success: false, error: 'Invalid or non-pending payment' });
});

// Pi Network payment completion endpoint
router.post('/pi/complete', async (req, res) => {
  const { paymentId, txid } = req.body;
  const payment = await verifyPaymentWithPi(paymentId);
  if (payment && payment.status === 'pending' && payment.transaction && payment.transaction.txid === txid) {
    // Complete payment
    try {
      await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {}, {
        headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
      });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to complete payment' });
    }
  }
  res.status(400).json({ success: false, error: 'Invalid payment or txid' });
});

module.exports = router;