// Pi Network Configuration
const piConfig = {
  // Pi Network API endpoints
  apiEndpoints: {
    base: 'https://api.minepi.com',
    payments: 'https://api.minepi.com/v2/payments',
    completions: 'https://api.minepi.com/v2/payments/completions',
    approvals: 'https://api.minepi.com/v2/payments/approvals',
  },
  
  // Pi payment options
  paymentOptions: {
    chatSubscription: {
      amount: 5, // 5 Pi for monthly subscription
      memo: 'TumzyTech Chatbot Monthly Subscription',
      metadata: { 
        productId: 'chatbot-subscription',
        period: '1 month',
        features: 'Unlimited AI chatbot access'
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
