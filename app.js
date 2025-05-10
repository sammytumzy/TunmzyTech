const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Import routes
const piRoutes = require('./routes/pi');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Use Pi Network routes
app.use('/api/pi', piRoutes);

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
