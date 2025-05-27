const mongoose = require('mongoose');

const serviceUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['chatbot', 'image-generation', 'text-to-speech', 'speech-to-text']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  requestData: {
    type: Object
  },
  responseData: {
    type: Object
  },
  successful: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('ServiceUsage', serviceUsageSchema);
