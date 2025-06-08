const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
<<<<<<< HEAD
const { applySecurityMiddleware } = require('./middlewares/security');
=======
const mongoose = require('mongoose');
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Apply security middleware first
applySecurityMiddleware(app);

// Middleware
app.use(express.json());
const cors = require('cors');

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000', // React development server
  'http://127.0.0.1:3000',
  'https://tumzytech.com',
  'https://fast-areas-shave.loca.lt' // New localtunnel URL
];

app.use(cors({
  origin: function(origin, callback) {
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

// Session support
const session = require('express-session');
const sessionStore = require('./config/sessionStore');

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
const passport = require('passport');
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Import routes
<<<<<<< HEAD
const piRoutes = require('./routes/pi');
const servicesRoutes = require('./routes/services');
=======
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const piPaymentRoutes = require('./routes/pi-payment'); // Added Pi Payment Routes
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799

// Static file serving
app.use('/assets', express.static(path.join(__dirname, 'assets')));

<<<<<<< HEAD
// Use routes
app.use('/api/pi', piRoutes);
app.use('/api/services', servicesRoutes);
=======
// Routes
app.use('/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/payments', piPaymentRoutes); // Fixed to match frontend calls
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API status endpoint
app.get('/api/', (req, res) => {
  res.json({
    success: true,
    message: 'TumzyTech API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

<<<<<<< HEAD
app.get('/pi-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'pi-test.html'));
});

// Error handling middleware
=======
app.get('/privacy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.get('/terms.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

app.get('/callback.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'callback.html'));
});

// Error handling
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Generic 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

<<<<<<< HEAD
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`
App URLs:
- Main app: http://localhost:${PORT}
- Pi Sandbox: https://sandbox.minepi.com/mobile-app-ui/app/tumzytech
  `);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill existing processes or use a different port.`);
    console.error('To kill Node processes on Windows: taskkill /F /IM node.exe');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
=======
// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
});

// Set up localtunnel for HTTPS access
if (process.env.NODE_ENV !== 'production') {
  const setupTunnel = require('./config/tunnel');
  setupTunnel()
    .then(tunnel => {
      console.log(`Localtunnel established at ${tunnel.url}`);
    })
    .catch(err => {
      console.error('Error setting up localtunnel:', err);
    });
}
