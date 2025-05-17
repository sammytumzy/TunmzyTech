/**
 * Mock Pi SDK for local testing outside Pi Browser
 * This mock simulates basic Pi SDK methods and callbacks
 */

window.Pi = {
  init: function(config) {
    console.log('Mock Pi.init called with config:', config);
  },

  authenticate: function(scopes, onIncompletePayment) {
    console.log('Mock Pi.authenticate called with scopes:', scopes);
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate authenticated user
        resolve({
          user: {
            username: 'mockuser'
          }
        });
      }, 500);
    });
  },

  createPayment: function(paymentDetails, callbacks) {
    console.log('Mock Pi.createPayment called with:', paymentDetails);
    // Simulate payment lifecycle
    setTimeout(() => {
      if (callbacks && callbacks.onReadyForServerApproval) {
        callbacks.onReadyForServerApproval('mock-payment-id');
      }
      setTimeout(() => {
        if (callbacks && callbacks.onReadyForServerCompletion) {
          callbacks.onReadyForServerCompletion('mock-payment-id', 'mock-txid');
        }
      }, 1000);
    }, 1000);

    return {
      id: 'mock-payment-id',
      status: 'created'
    };
  }
};
