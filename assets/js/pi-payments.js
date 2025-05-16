// Wrap entire Pi payments script to avoid duplicate loads
(function() {
  if (window.__piPaymentsLoaded) return;
  window.__piPaymentsLoaded = true;

  // Pi Network Integration
  var Pi = window.Pi;
  var piInitialized = false;

  // Helper to detect Pi Browser environment
  function isRunningInPiBrowser() {
      return navigator.userAgent.includes('PiBrowser');
  }

  // Alias incomplete payment callback for Pi SDK
  var onIncompletePaymentFound = handleIncompletePayment;

  // Initialize when document is ready
  document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded (pi-payments.js), Pi:', Pi);
      // Initialize Pi SDK
      initializePi();
      
      // Setup payment button
      var payButton = document.getElementById('pay-button');
      console.log('payButton element:', payButton);
      if (payButton) {
          payButton.addEventListener('click', handlePiPayment);
          console.log('Payment button listener added');
      }
  });

  // Initialize Pi SDK with sandbox mode and proper host
  var piConfig = {
      version: "2.0",
      sandbox: true,            // Always true for testing
      host: "https://sandbox.minepi.com"  // Use Pi Browser sandbox host
  };

  // Initialize Pi SDK
  function initializePi() {
      console.log('initializePi() called');
      if (!Pi) {
          console.error('Pi SDK not available');
          showPaymentStatus('Pi SDK not available', 'error');
          return;
      }
      try {
          Pi.init(piConfig);
          piInitialized = true;
          console.log('Pi SDK initialized successfully');
          showPaymentStatus('Pi SDK initialized (sandbox mode)', 'info');
      } catch (error) {
          console.error('Failed to initialize Pi SDK:', error);
          showPaymentStatus('Failed to initialize Pi SDK', 'error');
      }
  }

  // Show payment status to user
  function showPaymentStatus(message, type = 'info') {
      const statusElement = document.getElementById('pi-sandbox-status');
      if (!statusElement) return;

      statusElement.textContent = message;
      statusElement.className = 'text-center mb-1 text-xs ' + 
          (type === 'error' ? 'text-red-400' : 
           type === 'success' ? 'text-green-400' : 
           'text-yellow-300');
  }

  // Handle incomplete payments
  async function handleIncompletePayment(payment) {
      console.log("Incomplete payment found:", payment);
      showPaymentStatus('Found incomplete payment. Attempting to complete...', 'info');
      
      try {
          const response = await fetch('/api/pi/payments/incomplete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payment })
          });
          
          if (!response.ok) {
              throw new Error('Failed to handle incomplete payment');
          }
          
          return true;
      } catch (error) {
          console.error('Error handling incomplete payment:', error);
          showPaymentStatus('Error handling incomplete payment', 'error');
          return false;
      }
  }

  // Payment callbacks
  const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId) => {
          console.log("Ready for server approval:", paymentId);
          try {
              const response = await fetch('/api/pi/payments/approve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId })
              });
              
              if (!response.ok) {
                  throw new Error('Payment approval failed');
              }
              
              showPaymentStatus('Payment approved!', 'success');
              return true;
          } catch (error) {
              console.error('Error approving payment:', error);
              showPaymentStatus('Payment approval failed', 'error');
              return false;
          }
      },

      onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Ready for server completion:", paymentId, txid);
          try {
              const response = await fetch('/api/pi/payments/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid })
              });
              
              if (!response.ok) {
                  throw new Error('Payment completion failed');
              }

              const data = await response.json();
              if (data.subscription) {
                  updateSubscriptionUI(data.subscription);
              }
              
              showPaymentStatus('Payment completed successfully!', 'success');
              return true;
          } catch (error) {
              console.error('Error completing payment:', error);
              showPaymentStatus('Payment completion failed', 'error');
              return false;
          }
      },

      onCancel: async (paymentId) => {
          console.log("Payment cancelled:", paymentId);
          showPaymentStatus('Payment cancelled', 'info');
          
          try {
              await fetch('/api/pi/payments/cancelled', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId })
              });
          } catch (error) {
              console.error('Error handling cancelled payment:', error);
          }
      },

      onError: (error, payment) => {
          console.error("Payment error:", error);
          if (payment) {
              console.error("Payment details:", payment);
          }
          showPaymentStatus(`Payment error: ${error.message}`, 'error');
      }
  };

  // Create and handle payment
  async function handlePiPayment() {
      console.log('handlePiPayment() called');
      try {
          if (!Pi || !piInitialized) {
              throw new Error('Pi SDK not available. Please use Pi Browser.');
          }

          showPaymentStatus('Starting payment process...', 'info');

          // 1. Authenticate user
          let auth;
          try {
              auth = await Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
          } catch (authErr) {
              console.error('Pi authentication error:', authErr);
              showPaymentStatus('Authentication failed. Use Pi Browser sandbox.', 'error');
              return;
          }
          if (!auth) {
              showPaymentStatus('Authentication returned no user. Please try again in Pi Browser.', 'error');
              return;
          }

          console.log("Authenticated with Pi:", auth.user.username);
          showPaymentStatus('Authenticated! Creating payment...', 'info');

          // Update chat header with username
          const chatHeader = document.querySelector('.chat-header');
          if (chatHeader) {
              chatHeader.textContent = `Chat with TumzyBot (${auth.user.username})`;
          }

          // 2. Create payment
          const payment = await Pi.createPayment({
              amount: 0.5, // 0.5 Pi for subscription
              memo: "TumzyBot AI Assistant Subscription",
              metadata: {
                  type: "subscription",
                  productId: "tumzybot_monthly",
                  userId: auth.user.username
              }
          }, paymentCallbacks);

          console.log('Payment created:', payment);
          showPaymentStatus('Payment created, waiting for approval...', 'info');

      } catch (error) {
          console.error('Payment process failed:', error);
          showPaymentStatus(error.message, 'error');
          
          if (error.message.includes('Pi SDK not available')) {
              const piHelp = document.getElementById('pi-help');
              if (piHelp) {
                  piHelp.classList.remove('hidden');
                  piHelp.classList.add('bg-purple-900', 'p-2', 'rounded', 'border', 'border-yellow-300');
              }
          }
      }
  }

})();