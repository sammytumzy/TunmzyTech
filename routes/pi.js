const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const { ensurePiAuthenticated, createOrUpdatePiUser } = require('../middlewares/piAuth');
const piPaymentController = require('../controllers/piPaymentController');

// Pi Network authentication routes
router.post('/auth', createOrUpdatePiUser, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Pi Network authentication successful',
    user: {
      username: req.user.piUsername,
      name: req.user.name,
      subscriptionActive: req.user.subscriptionActive || false,
      subscriptionEndDate: req.user.subscriptionEndDate || null
    }
  });
});

// Create a payment (get payment details for the client)
router.post('/create-payment', ensurePiAuthenticated, piPaymentController.createPayment);

// Approve a payment
router.post('/approve', ensurePiAuthenticated, piPaymentController.approvePayment);

// Complete a payment
router.post('/complete', ensurePiAuthenticated, piPaymentController.completePayment);

// Get payment history for the authenticated user
router.get('/payment-history', ensurePiAuthenticated, piPaymentController.getPaymentHistory);

// Check subscription status
router.get('/subscription-status', ensurePiAuthenticated, (req, res) => {
  res.json({
    success: true,
    subscriptionActive: req.user.subscriptionActive || false,
    subscriptionEndDate: req.user.subscriptionEndDate || null
  });
});

module.exports = router;
