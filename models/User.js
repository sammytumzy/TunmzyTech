const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  piUserId: { type: String, unique: true, sparse: true },
  username: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  trialCount: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  lastPaymentDate: { type: Date },
  paymentTxid: { type: String },
  authProvider: { type: String, enum: ['google', 'pi'], default: 'google' },
  createdAt: { type: Date, default: Date.now },
  // User preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    notifications: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('User', userSchema);
