const express = require('express');
const router = express.Router();
const piPaymentController = require('../controllers/piPaymentController');

// Route to handle payment approval initiation
router.post('/approve', piPaymentController.approvePayment);

// Route to handle payment completion
router.post('/complete', piPaymentController.completePayment);

// Route to handle payment cancellation
router.post('/cancel', piPaymentController.cancelPayment);

// Route to handle payment errors
router.post('/error', piPaymentController.handlePaymentError);

module.exports = router;