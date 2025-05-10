const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Pi Network payment endpoints
app.post('/api/pi/create-payment', (req, res) => {
  try {
    const paymentData = {
      amount: 0.5,
      memo: "TumzyTech AI Tool Access",
      metadata: { productId: "ai-tools-access" }
    };
    res.json({ success: true, paymentData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/pi/approve', (req, res) => {
  const { paymentId } = req.body;
  console.log('Payment approved:', paymentId);
  res.json({ success: true });
});

app.post('/api/pi/complete', (req, res) => {
  const { paymentId, txid } = req.body;
  console.log('Payment completed:', paymentId, txid);
  res.json({ success: true });
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
