const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const piRoutes = require('./routes/pi');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import Passport.js configuration
require('./config/passport');

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pi', piRoutes);

// Pi Network app metadata for ecosystem listing
app.get('/.well-known/pi-app.json', (req, res) => {
  res.json({
    app_name: "TumzyTech",
    app_description: "AI-driven services including content creation, graphics, market analysis, and financial assistance",
    app_url: "https://tumzytech.com",
    app_categories: ["AI & Machine Learning", "Productivity", "Finance"],
    app_developer_name: "TumzyTech Team",
    app_developer_email: "contact@tumzytech.com",
    app_version: "1.0.0",
    app_payment_options: ["subscription", "one-time"],
    app_supported_platforms: ["web", "mobile"],
    app_logo_url: "https://tumzytech.com/assets/pictures/favicon/android-chrome-512x512.png"
  });
});

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
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection - temporarily disabled for development
console.log('Running without MongoDB in development mode');

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
