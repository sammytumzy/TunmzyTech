const express = require('express');
const router = express.Router();
const piAuthController = require('../controllers/piAuthController');
const authMiddleware = require('../middlewares/auth');

// Route to link Pi account with application user account
router.post('/link-account', authMiddleware.ensureAuthenticated, piAuthController.linkAccount);

module.exports = router;
