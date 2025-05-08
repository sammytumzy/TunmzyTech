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
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

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

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to TumzyTech API!');
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
