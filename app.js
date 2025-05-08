const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;node app.js

// Import Passport.js configuration
require('./config/passport');

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/auth', authRoutes);
app.use('/api/services', serviceRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to TumzyTech API!');
});

// Database connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected to MongoDB')).catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));