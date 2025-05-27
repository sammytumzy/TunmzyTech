const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000 || 15 * 60 * 1000, // 15 minutes default
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

// Apply security middleware to app
const applySecurityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(helmet());

    // Rate limiting
    app.use('/api', limiter);

    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());

    // Data sanitization against XSS
    app.use(xss());

    // Prevent parameter pollution
    app.use(hpp());

    // Enable CORS
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        next();
    });

    // Add security headers
    app.use((req, res, next) => {
        res.header('X-Frame-Options', 'DENY');
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Referrer-Policy', 'same-origin');
        next();
    });
};

// API specific rate limiters
const createServiceLimiter = (maxRequests = 50, windowMinutes = 60) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            status: 'error',
            message: `You can only make ${maxRequests} requests per ${windowMinutes} minutes`
        }
    });
};

module.exports = {
    applySecurityMiddleware,
    createServiceLimiter,
    // Export specific limiters for different services
    aiContentLimiter: createServiceLimiter(50, 60),
    aiImageLimiter: createServiceLimiter(30, 60),
    aiAnalysisLimiter: createServiceLimiter(20, 60),
    aiFinancialLimiter: createServiceLimiter(100, 60)
}; 