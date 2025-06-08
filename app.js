const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { applySecurityMiddleware } = require('./middlewares/security');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Apply security middleware first
applySecurityMiddleware(app);

// Middleware
app.use(express.json());

// Import routes
const piRoutes = require('./routes/pi');
const servicesRoutes = require('./routes/services');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Use routes
app.use('/api/pi', piRoutes);
app.use('/api/services', servicesRoutes);

// Serve static files for the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/pi-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'pi-test.html'));
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
});
