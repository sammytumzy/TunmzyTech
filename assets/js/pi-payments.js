// Pi Network Integration
let Pi = window.Pi;
let piInitialized = false;

// Pi SDK configuration
const piConfig = {
    version: "2.0",
    sandbox: true, // Always true for testing
};

// Initialize Pi SDK
function initializePi() {
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

// Authenticate with Pi Network
async function authenticateWithPi() {
    try {
        const auth = await Pi.authenticate(['username', 'payments'], handleIncompletePayment);
        if (!auth) {
            throw new Error('Authentication failed');
        }

        const { user } = auth;
        console.log("Authenticated with Pi:", user.username);
        showPaymentStatus(`Welcome back, ${user.username}!`, 'success');

        // Update chat header with username
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.textContent = `Chat with TumzyBot (${user.username})`;
        }

        return auth;
    } catch (error) {
        console.error('Pi authentication failed:', error);
        showPaymentStatus('Authentication failed', 'error');
        return null;
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
    try {
        if (!Pi || !piInitialized) {
            throw new Error('Pi SDK not available. Please use Pi Browser.');
        }

        showPaymentStatus('Starting payment process...', 'info');

        // 1. Authenticate user
        const auth = await authenticateWithPi();
        if (!auth) {
            throw new Error('Authentication failed');
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
        showPaymentStatus('Processing payment...', 'info');

    } catch (error) {
        console.error('Payment process failed:', error);
        showPaymentStatus(error.message, 'error');
        
        // Show Pi Browser help if SDK is not available
        if (error.message.includes('Pi SDK not available')) {
            const piHelp = document.getElementById('pi-help');
            if (piHelp) {
                piHelp.classList.remove('hidden');
                piHelp.classList.add('bg-purple-900', 'p-2', 'rounded', 'border', 'border-yellow-300');
            }
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Pi SDK
    initializePi();
    
    // Setup payment button
    const payButton = document.getElementById('pay-button');
    if (payButton) {
        payButton.addEventListener('click', handlePiPayment);
    }
    
    // Try initial authentication if in Pi Browser
    if (window.Pi) {
        authenticateWithPi().catch(console.error);
    }
});