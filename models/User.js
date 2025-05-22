const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  trialCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  // User preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    notifications: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('User', userSchema);
