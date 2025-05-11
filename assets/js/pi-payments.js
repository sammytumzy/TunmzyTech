// Pi Network Integration
const Pi = window.Pi;

// Initialize Pi SDK with sandbox mode
const piConfig = {
    version: "2.0",
    sandbox: true,
    onIncompletePaymentFound: handleIncompletePayment
};

// Initialize Pi SDK
function initializePi() {
    try {
        Pi.init(piConfig);
        console.log('Pi SDK initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Pi SDK:', error);
        showPaymentStatus('Failed to initialize Pi SDK', 'error');
    }
}

// Show payment status to user
function showPaymentStatus(message, type = 'info') {
    const statusElement = document.getElementById('payment-status');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.style.display = 'block';
    statusElement.className = `payment-status ${type}`;

    // Hide status after 5 seconds
    setTimeout(() => {
        statusElement.style.opacity = '0';
        statusElement.style.transition = 'opacity 1s';
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 1000);
    }, 5000);
}

// Handle incomplete payments
function handleIncompletePayment(payment) {
    console.log("Incomplete payment found:", payment);
    showPaymentStatus('Incomplete payment found. Attempting to complete...', 'info');
    
    // Attempt to complete the payment
    if (payment.status === 'created') {
        approvePayment(payment.identifier);
    } else if (payment.status === 'approved') {
        completePayment(payment.identifier, payment.transaction && payment.transaction.txid);
    }
}

// Authenticate with Pi Network
async function authenticateWithPi() {
    try {
        const scopes = ['username', 'payments'];
        const auth = await Pi.authenticate(scopes, handleIncompletePayment);
        window.piUser = auth.user;
        window.piAccessToken = auth.accessToken;

        console.log("Authenticated with Pi Network:", auth.user.username);
        showPaymentStatus(`Welcome, ${auth.user.username}!`, 'success');
        return auth;
    } catch (error) {
        console.error('Pi authentication failed:', error);
        showPaymentStatus('Authentication failed', 'error');
        return null;
    }
}

// Create payment with Pi
async function createPayment(paymentType = 'chatSubscription') {
    try {
        showPaymentStatus('Creating payment...', 'info');

        // Get payment data from server
        const response = await fetch('/api/pi/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.piAccessToken}`
            },
            body: JSON.stringify({
                paymentType,
                uid: window.piUser ? window.piUser.uid : null
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to create payment');
        }

        // Define payment callbacks
        const paymentCallbacks = {
            onReadyForServerApproval: function(paymentId) {
                console.log('Payment ready for approval:', paymentId);
                showPaymentStatus('Payment approved!', 'success');
                return approvePayment(paymentId);
            },
            onReadyForServerCompletion: function(paymentId, txid) {
                console.log('Payment ready for completion:', paymentId, txid);
                showPaymentStatus('Payment completed successfully!', 'success');
                return completePayment(paymentId, txid);
            },
            onCancel: function(paymentId) {
                console.log('Payment cancelled:', paymentId);
                showPaymentStatus('Payment cancelled', 'error');
            },
            onError: function(error, payment) {
                console.error('Payment error:', error, payment);
                showPaymentStatus(`Payment error: ${error}`, 'error');
            }
        };

        // Create payment with Pi SDK
        const payment = await Pi.createPayment(data.paymentData, paymentCallbacks);
        console.log('Payment created:', payment);
        return payment;

    } catch (error) {
        console.error('Error creating payment:', error);
        showPaymentStatus(`Payment failed: ${error.message}`, 'error');
        throw error;
    }
}

// Approve payment with server
async function approvePayment(paymentId) {
    try {
        const response = await fetch('/api/pi/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.piAccessToken}`
            },
            body: JSON.stringify({ paymentId })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to approve payment');
        }

        console.log('Payment approved:', paymentId);
        return true;
    } catch (error) {
        console.error('Error approving payment:', error);
        showPaymentStatus('Error approving payment', 'error');
        throw error;
    }
}

// Complete payment with server
async function completePayment(paymentId, txid) {
    try {
        const response = await fetch('/api/pi/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.piAccessToken}`
            },
            body: JSON.stringify({ paymentId, txid })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to complete payment');
        }

        console.log('Payment completed:', paymentId);
        showPaymentStatus('Payment completed successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error completing payment:', error);
        showPaymentStatus('Error completing payment', 'error');
        throw error;
    }
}

// Handle Pi payment process
async function handlePiPayment() {
    try {
        // 1. Authenticate user
        const auth = await authenticateWithPi();
        if (!auth) {
            throw new Error('Authentication failed');
        }

        // 2. Create and process payment
        const payment = await createPayment();
        return payment;

    } catch (error) {
        console.error('Payment process failed:', error);
        showPaymentStatus(`Payment failed: ${error.message}`, 'error');
        throw error;
    }
}

// Initialize Pi SDK when the script loads
initializePi();

// Export functions for use in other files
window.piPayments = {
    handlePiPayment,
    authenticateWithPi,
    createPayment,
    approvePayment,
    completePayment
};