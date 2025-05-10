// Pi Network Configuration
const piConfig = {
  // Pi Network API endpoints
  apiEndpoints: {
    base: 'https://api.minepi.com',
    sandbox: 'https://api.minepi.com/v2/payments',
    mainnet: 'https://api.minepi.com/v2/payments',
    completions: '/completions',
    approvals: '/approvals',
  },
  
  // Pi payment options
  paymentOptions: {
    chatSubscription: {
      amount: 0.5, // 0.5 Pi for access
      memo: 'TumzyTech AI Tool Access',
      metadata: { 
        productId: 'ai-tools-access',
        type: 'service-access',
        features: ['AI Chat', 'Content Generation', 'Image Generation']
      }
    },
    singleSession: {
      amount: 1, // 1 Pi for single session
      memo: 'TumzyTech Chatbot Single Session',
      metadata: { 
        productId: 'chatbot-single',
        usage: '1 session',
        features: 'One-time AI chatbot access'
      }
    }
  },
  
  // Pi SDK configuration
  sdkConfig: {
    version: "2.0",
    sandbox: true, // Set to true for testing
  },
  
  // Pi wallet address for receiving payments
  walletAddress: 'GD5XOGYAAVODXKBIJXFGZUQXA3VDHYT5NX2OIUFG4IRDPL3SLXH5O5KM'
};

module.exports = piConfig;
