const { body, validationResult } = require('express-validator');

// Validation middleware for user registration
exports.validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain a number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validation middleware for payment requests
exports.validatePayment = [
    body('amount')
        .isFloat({ min: 0.1 })
        .withMessage('Amount must be greater than 0.1'),
    body('productId')
        .trim()
        .notEmpty()
        .withMessage('Product ID is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validation middleware for service requests
exports.validateServiceRequest = [
    body('serviceType')
        .trim()
        .notEmpty()
        .isIn(['AI_CONTENT', 'AI_IMAGE', 'AI_ANALYSIS', 'AI_FINANCIAL'])
        .withMessage('Invalid service type'),
    body('parameters')
        .isObject()
        .withMessage('Parameters must be an object'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
]; 