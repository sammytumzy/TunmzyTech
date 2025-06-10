const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const piAuthController = require('../controllers/piAuthController');

// Public endpoint: get subscription status
router.get('/subscription-status', piAuthController.subscriptionStatus);

// Public endpoint: Pi authentication alias
router.post('/auth', piAuthController.verifyPiAuth);

// Protected endpoint: create payment requires JWT auth
router.post('/create-payment', authMiddleware.ensureAuthenticated, piAuthController.createPayment);

module.exports = router;
