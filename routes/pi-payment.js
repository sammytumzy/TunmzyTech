const express = require('express');
const router = express.Router();
const { ensurePiAuthenticated } = require('../middlewares/piAuth');
const piPaymentController = require('../controllers/piPaymentController');

// Handle incomplete payments (no auth required as it's coming from Pi SDK)
router.post('/incomplete', piPaymentController.handleIncompletePayment);

// Payment lifecycle endpoints
router.post('/approve', ensurePiAuthenticated, piPaymentController.approvePayment);
router.post('/complete', ensurePiAuthenticated, piPaymentController.completePayment);
router.post('/cancelled', ensurePiAuthenticated, piPaymentController.cancelPayment);

module.exports = router;