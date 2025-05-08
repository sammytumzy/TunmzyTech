const mongoose = require('mongoose');

// Payment history schema
const paymentHistorySchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  txid: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['subscription', 'single'], required: true }
});

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  piUsername: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  trialCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  // Pi Network related fields
  subscriptionActive: { type: Boolean, default: false },
  subscriptionEndDate: { type: Date },
  paymentHistory: [paymentHistorySchema],
  // User preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    notifications: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('User', userSchema);
