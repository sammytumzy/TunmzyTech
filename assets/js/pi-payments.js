// Check if Pi Network environment is available
function checkPiEnvironment() {
    if (typeof Pi === 'undefined') {
        console.warn('Pi SDK not available - not in Pi Browser environment');
        return false;
    }
    
    // Check user agent for Pi Browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isPiBrowser = userAgent.includes('pi browser') || userAgent.includes('pi network');
    
    if (!isPiBrowser) {
        console.warn('Not detected as Pi Browser - payments may not work');
    }
    
    return true;
}

// Wait for the DOM to be fully loaded before trying to interact with it
document.addEventListener('DOMContentLoaded', async (event) => {
    // Initialize Pi SDK
    const Pi = window.Pi;
    if (!Pi) {
        console.error('Pi SDK not found. Please use Pi Browser.');
        return;
    }

    // Handle incomplete payments
    function onIncompletePaymentFound(payment) {
        console.log("Incomplete payment found:", payment);
        return handlePayment(payment);
    }

    // Main payment handling function
    async function handlePayment(incompletePiPayment) {
        try {
            // Check if Pi SDK is available
            if (typeof Pi === 'undefined') {
                console.error('Pi SDK not loaded');
                alert('Pi Network SDK not available. Please try again later.');
                return;
            }

            // First authenticate the user
            const scopes = ['payments'];
            console.log("Authenticating user...");
            
            try {
                const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
                console.log("User authenticated:", auth);
                
                // Store authentication info
                localStorage.setItem('piUser', JSON.stringify(auth.user));
                
            } catch (authError) {
                console.error('Authentication failed:', authError);
                alert('Authentication failed. Please ensure you have Pi Browser or Pi Network app.');
                return;
            }

            // Payment variables
            const paymentData = {
                amount: 1, // Amount of π to be paid
                memo: "Premium Access", // Memo to display to the user
                metadata: { 
                    orderId: Date.now().toString(), // Dynamic order ID
                    type: "premium_access"
                }
            };

            // If there's an incomplete payment, complete it
            if (incompletePiPayment) {
                console.log("Completing incomplete payment:", incompletePiPayment);
                const paymentCompletion = await incompletePiPayment.complete();
                console.log("Payment completed:", paymentCompletion);
                return paymentCompletion;
            }

            // Create new payment
            console.log("Creating payment with data:", paymentData);
            const payment = await Pi.createPayment({
                amount: paymentData.amount,
                memo: paymentData.memo,
                metadata: paymentData.metadata
            }, {
                // Callbacks you need to implement
                onReadyForServerApproval: function(paymentId) {
                    console.log("Ready for server approval", paymentId);
                    // For testing, we'll simulate server approval
                    alert('Payment is being processed...');
                },
                onReadyForServerCompletion: function(paymentId, txid) {
                    console.log("Ready for server completion", paymentId, txid);
                    // For testing, we'll simulate server completion
                    alert('Payment completed successfully!');
                },
                onCancel: function(paymentId) {
                    console.log("Payment cancelled:", paymentId);
                    alert('Payment was cancelled');
                },
                onError: function(error, payment) {
                    console.error("Payment error:", error);
                    alert('Payment error: ' + error.message);
                }
            });

            console.log("Payment created:", payment);
            return payment;

        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + error.message);
            throw error;
        }
    }

    // Add payment button
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        const payButton = document.createElement('button');
        payButton.textContent = 'Unlock Premium Features (1 Pi)';
        payButton.className = 'mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition';        payButton.onclick = async function() {
            try {
                console.log("Payment button clicked");
                
                // Prevent multiple clicks
                if (payButton.disabled) {
                    console.log("Payment already in progress");
                    return;
                }
                
                payButton.disabled = true;
                payButton.textContent = 'Processing...';
                
                await handlePayment();
                
            } catch (error) {
                console.error('Payment error:', error);
                alert('Payment failed: ' + error.message);
            } finally {
                // Re-enable button after process completes
                payButton.disabled = false;
                payButton.textContent = 'Unlock Premium Features (1 Pi)';
            }
        };
        chatContainer.appendChild(payButton);
        console.log("Payment button added to chat container");
    } else {
        console.error("Chat container not found");
    }

    // Log Pi SDK initialization
    console.log("Pi SDK initialized in sandbox mode");
});