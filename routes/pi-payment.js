const express = require('express');
const router = express.Router();
const { ensurePiAuthenticated } = require('../middlewares/piAuth');
const piPaymentController = require('../controllers/piPaymentController');

// Handle all payment related endpoints
router.post('/incomplete', piPaymentController.handleIncompletePayment);
router.post('/approve', ensurePiAuthenticated, piPaymentController.approvePayment);
router.post('/complete', ensurePiAuthenticated, piPaymentController.completePayment);
router.post('/cancelled', ensurePiAuthenticated, piPaymentController.cancelPayment);

// New endpoints for payment management
router.post('/create', ensurePiAuthenticated, piPaymentController.createPayment);
router.get('/history', ensurePiAuthenticated, piPaymentController.getPaymentHistory);
router.get('/status/:paymentId', ensurePiAuthenticated, piPaymentController.checkPaymentStatus);

// Error handler specific to payment routes
router.use((err, req, res, next) => {
  console.error('Pi Payment Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Payment processing error'
  });
});

module.exports = router;