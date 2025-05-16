const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
const cors = require('cors');

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://tumzytech.com' // Add your production domain here
];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// Add session support for conversation history
const session = require('express-session');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Import routes
const piRoutes = require('./routes/pi');
const piPaymentRoutes = require('./routes/pi-payment');
const servicesRoutes = require('./routes/services');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Use routes
app.use('/api/pi', piRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/pi/payments', piPaymentRoutes);

// Serve static files for the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Send JSON response instead of HTML error page
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message // Including error message for both dev and prod for now
  });
});

// Health check endpoint for connectivity testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Add catch-all route for API endpoints to avoid HTML responses for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Database connection - temporarily disabled for development
console.log('Running without MongoDB in development mode');

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`
App URLs:
- Main app: http://localhost:${PORT}
- Pi Sandbox: https://sandbox.minepi.com/mobile-app-ui/app/tumzytech
  `);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1);
  } else {
    console.error('Server error:', err);
  }
});
