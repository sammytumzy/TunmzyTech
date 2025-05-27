// TumzyTech Pi Network Payment Integration

// Initialize Pi SDK
function initPiSDK() {
  const Pi = window.Pi;
  if (!Pi) {
    console.error('Pi SDK is not available. Make sure you are in the Pi Browser.');
    document.getElementById('pi-payment-status').textContent = 'Pi SDK not found. Please use Pi Browser.';
    return null;
  }

  Pi.init({ version: "2.0" });
  console.log('Pi SDK initialized');
  return Pi;
}

// Authenticate user with Pi Network
async function authenticateWithPi() {
  const Pi = initPiSDK();
  if (!Pi) return;

  try {
    const auth = await Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
    console.log('Pi authentication successful:', auth);
    document.getElementById('pi-username').textContent = auth.user.username;
    document.getElementById('pi-auth-status').textContent = 'Connected';
    document.getElementById('pi-auth-status').className = 'connected';
    return auth;
  } catch (error) {
    console.error('Pi authentication error:', error);
    document.getElementById('pi-auth-status').textContent = 'Error: ' + error.message;
    document.getElementById('pi-auth-status').className = 'error';
    return null;
  }
}

// Handle incomplete payments (if any)
function onIncompletePaymentFound(payment) {
  console.log('Incomplete payment found:', payment);
  // Implement recovery logic for incomplete payment
  return handlePayment(payment);
}

// Handle the payment process
async function handlePayment(payment) {
  try {
    // Call server to handle payment approval
    const approveResponse = await fetch('/api/pi-payments/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ paymentId: payment.identifier })
    });

    if (!approveResponse.ok) {
      throw new Error('Failed to approve payment');
    }

    const approveData = await approveResponse.json();
    console.log('Payment approved:', approveData);

    // Complete the payment
    const paymentCompletion = await payment.complete();
    console.log('Payment completed locally:', paymentCompletion);

    // Notify server about the completed payment
    const completeResponse = await fetch('/api/pi-payments/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        paymentId: payment.identifier,
        txid: paymentCompletion.transaction.txid,
        userId: localStorage.getItem('userId')
      })
    });

    if (!completeResponse.ok) {
      throw new Error('Failed to register payment with server');
    }

    const completeData = await completeResponse.json();
    console.log('Payment registered with server:', completeData);

    // Update UI
    document.getElementById('pi-payment-status').textContent = 'Payment successful!';
    document.getElementById('pi-payment-status').className = 'success';
    
    // Refresh user data to show premium status
    getUserData();
    
    return completeData;
  } catch (error) {
    console.error('Payment error:', error);
    document.getElementById('pi-payment-status').textContent = 'Payment error: ' + error.message;
    document.getElementById('pi-payment-status').className = 'error';
    
    // Notify server about the error
    try {
      await fetch('/api/pi-payments/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentId: payment ? payment.identifier : 'unknown',
          error: error.message
        })
      });
    } catch (notifyError) {
      console.error('Failed to notify server about payment error:', notifyError);
    }
    
    return null;
  }
}

// Create a payment
async function createPiPayment() {
  const Pi = initPiSDK();
  if (!Pi) return;
  
  document.getElementById('pi-payment-status').textContent = 'Processing payment...';
  document.getElementById('pi-payment-status').className = 'processing';

  try {
    const payment = await Pi.createPayment({
      amount: 1,
      memo: "TumzyTech Premium Subscription",
      metadata: { userId: localStorage.getItem('userId') }
    });
    
    console.log('Payment created:', payment);
    
    // Handle the payment
    return await handlePayment(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    document.getElementById('pi-payment-status').textContent = 'Error creating payment: ' + error.message;
    document.getElementById('pi-payment-status').className = 'error';
    return null;
  }
}

// Get user data from the server
async function getUserData() {
  try {
    const response = await fetch('/api/services/user-stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await response.json();
    
    // Update UI with user data
    document.getElementById('user-name').textContent = userData.user.name;
    document.getElementById('user-email').textContent = userData.user.email;
    
    if (userData.user.isPremium) {
      document.getElementById('premium-status').textContent = 'Premium';
      document.getElementById('premium-status').className = 'premium';
      document.getElementById('upgrade-container').style.display = 'none';
    } else {
      document.getElementById('premium-status').textContent = 'Free Trial';
      document.getElementById('premium-status').className = 'free';
      document.getElementById('remaining-trials').textContent = userData.user.remainingTrials;
      document.getElementById('upgrade-container').style.display = 'block';
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  // Get user data
  getUserData();
  
  // Setup event listeners
  document.getElementById('pi-auth-button').addEventListener('click', authenticateWithPi);
  document.getElementById('pi-payment-button').addEventListener('click', createPiPayment);
});
