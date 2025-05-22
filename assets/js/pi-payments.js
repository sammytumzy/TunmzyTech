// Wait for the DOM to be fully loaded before trying to interact with it
document.addEventListener('DOMContentLoaded', (event) => {
    // Pi Network SDK Initialization and Authentication
    const scopes = ['payments', 'username']; // Request payments and username permissions

    function onIncompletePaymentFound(payment) {
        console.log('Incomplete payment found by SDK:', payment);
        // alert('We found an incomplete payment. We will try to complete it.');
        // Option 1: Try to complete it automatically
        fetch('/api/pi-payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                paymentId: payment.identifier, 
                txid: payment.transaction.txid 
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Attempt to complete incomplete payment:', data);
            if (data.message && data.message.includes('Complete endpoint hit')) {
                // Or if the Pi API confirms completion
                alert('An incomplete payment was successfully completed.');
                // Potentially update UI or grant access
            } else {
                // alert('Could not automatically complete the pending payment. Please try again or contact support.');
            }
        })
        .catch(error => {
            console.error('Error trying to complete incomplete payment:', error);
            // alert('An error occurred while trying to complete a pending payment.');
        });
        // Option 2: Notify user and ask them to retry or contact support
        // Option 3: Call your backend to just cancel it via Pi API if appropriate
    }

    Pi.authenticate(scopes, onIncompletePaymentFound)
        .then(auth => {
            console.log('Pi authentication successful:', auth);
            // You can display the username if needed: auth.user.username
            // Store auth.accessToken if your application needs to make calls to your backend,
            // which in turn might call Pi API endpoints requiring user context (not typical for basic payments).
            const subscriptionStatusDiv = document.getElementById('subscription-status');
            if (subscriptionStatusDiv) {
                subscriptionStatusDiv.textContent = `Authenticated with Pi as: ${auth.user.username}`;
            }
            // TODO: Add a button or UI element to trigger a payment
            addPaymentButton(); // Call a function to add a payment button dynamically
        })
        .catch(err => {
            console.error('Pi authentication failed:', err);
            const subscriptionStatusDiv = document.getElementById('subscription-status');
            if (subscriptionStatusDiv) {
                subscriptionStatusDiv.textContent = 'Pi authentication failed. Please try again.';
            }
            // Potentially show a retry button for authentication
        });

    // Function to create and handle a Pi Payment
    function makePiPayment(amount, memo, metadata) {
        const paymentData = {
            amount: parseFloat(amount), // Ensure amount is a number
            memo: memo,                 // A description for the payment, shown to the user
            metadata: metadata          // Extra data for your backend (e.g., { productId: 'item123' })
        };

        const callbacks = {
            onReadyForServerApproval: function(paymentId) {
                console.log('onReadyForServerApproval - Payment ID:', paymentId);
                fetch('/api/pi-payments/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId: paymentId })
                })
                .then(response => response.json())
                .then(data => console.log('Approval request sent to backend:', data))
                .catch(error => console.error('Error sending approval to backend:', error));
            },
            onReadyForServerCompletion: function(paymentId, txid) {
                console.log('onReadyForServerCompletion - Payment ID:', paymentId, 'TXID:', txid);
                fetch('/api/pi-payments/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId: paymentId, txid: txid })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Completion request sent to backend:', data);
                    alert('Payment successful! TXID: ' + txid);
                    // TODO: Update UI, grant access to features, etc.
                })
                .catch(error => {
                    console.error('Error sending completion to backend:', error);
                    alert('Payment completed, but there was an issue notifying our server. Please contact support if features are not unlocked.');
                });
            },
            onCancel: function(paymentId) {
                console.log('onCancel - Payment ID:', paymentId);
                alert('Payment cancelled.');
                // Optionally, notify your backend about the cancellation
                fetch('/api/pi-payments/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId: paymentId })
                });
            },
            onError: function(error, payment) {
                console.error('onError - Error:', error, 'Payment:', payment);
                alert('An error occurred during the payment process. Please try again.');
                // Optionally, notify your backend about the error
                if (payment && payment.identifier) {
                    fetch('/api/pi-payments/error', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId: payment.identifier, error: error.message || error })
                    });
                }
            }
        };

        Pi.createPayment(paymentData, callbacks);
    }

    // Function to dynamically add a payment button (example)
    function addPaymentButton() {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            const payButton = document.createElement('button');
            payButton.textContent = 'Unlock Premium Features (0.01 Pi)';
            payButton.className = 'mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition'; // Basic styling
            payButton.onclick = function() {
                makePiPayment(0.01, 'Premium Feature Unlock', { feature: 'premiumChatAccess' });
            };
            chatContainer.appendChild(payButton);
        }
    }

    // Example: Expose makePiPayment globally if you need to call it from inline HTML event handlers
    // window.makePiPayment = makePiPayment;
});