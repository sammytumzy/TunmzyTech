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
            // First authenticate the user
            const scopes = ['payments'];
            console.log("Authenticating user...");
            const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
            console.log("User authenticated:", auth);

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
        payButton.className = 'mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition';
        payButton.onclick = async function() {
            try {
                console.log("Payment button clicked");
                await handlePayment();
            } catch (error) {
                console.error('Payment error:', error);
                alert('Payment failed: ' + error.message);
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