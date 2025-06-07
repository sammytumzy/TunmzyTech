/**
 * Pi Network Payment Integration for TumzyTech AI Tools
 * Handles Pi Network authentication and payment flows
 */

class PiPaymentManager {
    constructor() {
        this.piSDK = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.accessToken = null;
        this.paymentInProgress = false;
    }

    /**
     * Initialize Pi Network SDK
     */
    async init() {
        try {
            if (typeof window.Pi === 'undefined') {
                throw new Error('Pi Network SDK not loaded');
            }

            this.piSDK = window.Pi;
            await this.piSDK.init({
                version: "2.0",
                sandbox: true, // Set to false for production
                onIncompletePaymentFound: this.handleIncompletePayment.bind(this)
            });

            this.isInitialized = true;
            console.log('Pi Network SDK initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Pi Network SDK:', error);
            return false;
        }
    }

    /**
     * Authenticate user with Pi Network
     */
    async authenticate() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            const scopes = ['username', 'payments'];
            const auth = await this.piSDK.authenticate(scopes, this.handleIncompletePayment.bind(this));
            
            this.currentUser = auth.user;
            this.accessToken = auth.accessToken;
            
            // Store globally for other scripts
            window.piUser = auth.user;
            window.piAccessToken = auth.accessToken;

            // Send authentication data to backend
            await this.sendAuthToBackend(auth);

            console.log('Pi Network authentication successful:', auth.user.username);
            return auth;
        } catch (error) {
            console.error('Pi Network authentication failed:', error);
            throw error;
        }
    }

    /**
     * Send authentication data to backend
     */
    async sendAuthToBackend(auth) {
        try {
            const response = await fetch('/api/pi/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.accessToken}`
                },
                body: JSON.stringify({
                    user: auth.user,
                    accessToken: auth.accessToken
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Backend authentication failed:', result.message);
            }
            return result;
        } catch (error) {
            console.error('Error sending auth to backend:', error);
            throw error;
        }
    }

    /**
     * Create and process a payment
     */
    async createPayment(paymentType = 'singleSession') {
        try {
            if (!this.currentUser) {
                await this.authenticate();
            }

            if (this.paymentInProgress) {
                throw new Error('Payment already in progress');
            }

            this.paymentInProgress = true;

            // Get payment details from backend
            const paymentData = await this.getPaymentDetails(paymentType);
            
            // Create payment with Pi SDK
            const payment = await this.piSDK.createPayment({
                amount: paymentData.amount,
                memo: paymentData.memo,
                metadata: paymentData.metadata
            });

            console.log('Payment created:', payment);

            // Approve payment
            await this.approvePayment(payment.identifier);

            // Complete payment
            await this.completePayment(payment.identifier);

            this.paymentInProgress = false;
            return payment;
        } catch (error) {
            this.paymentInProgress = false;
            console.error('Payment creation failed:', error);
            throw error;
        }
    }

    /**
     * Get payment details from backend
     */
    async getPaymentDetails(paymentType) {
        try {
            const response = await fetch('/api/pi/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    paymentType,
                    uid: this.currentUser?.uid
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            return result.paymentData;
        } catch (error) {
            console.error('Error getting payment details:', error);
            throw error;
        }
    }

    /**
     * Approve payment with backend
     */
    async approvePayment(paymentId) {
        try {
            const response = await fetch('/api/pi/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({ paymentId })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            console.log('Payment approved:', paymentId);
            return result;
        } catch (error) {
            console.error('Payment approval failed:', error);
            throw error;
        }
    }

    /**
     * Complete payment with backend
     */
    async completePayment(paymentId, txid = null) {
        try {
            // If no txid provided, get it from the payment
            if (!txid) {
                const paymentDetails = await this.piSDK.getPayment(paymentId);
                txid = paymentDetails.transaction?.txid;
            }

            const response = await fetch('/api/pi/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({ paymentId, txid })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            console.log('Payment completed:', paymentId);
            return result;
        } catch (error) {
            console.error('Payment completion failed:', error);
            throw error;
        }
    }

    /**
     * Handle incomplete payments found during initialization
     */
    async handleIncompletePayment(payment) {
        try {
            console.log('Handling incomplete payment:', payment);

            if (payment.status === 'created') {
                await this.approvePayment(payment.identifier);
            } else if (payment.status === 'approved') {
                await this.completePayment(
                    payment.identifier, 
                    payment.transaction?.txid
                );
            }
        } catch (error) {
            console.error('Error handling incomplete payment:', error);
        }
    }

    /**
     * Check subscription status
     */
    async checkSubscriptionStatus() {
        try {
            if (!this.accessToken) {
                return { subscriptionActive: false };
            }

            const response = await fetch('/api/pi/subscription-status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return { subscriptionActive: false };
        }
    }

    /**
     * Get payment history
     */
    async getPaymentHistory() {
        try {
            if (!this.accessToken) {
                return { paymentHistory: [] };
            }

            const response = await fetch('/api/pi/payment-history', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error getting payment history:', error);
            return { paymentHistory: [] };
        }
    }

    /**
     * Show payment modal with options
     */
    showPaymentModal() {
        const modal = document.createElement('div');
        modal.className = 'pi-payment-modal';
        modal.innerHTML = `
            <div class="pi-payment-content">
                <div class="pi-payment-header">
                    <h3>Choose Your Access Plan</h3>
                    <button class="pi-close-btn">&times;</button>
                </div>
                <div class="pi-payment-options">
                    <div class="pi-payment-option" data-type="singleSession">
                        <h4>Single Session</h4>
                        <p class="pi-price">1 π</p>
                        <p>One-time access to AI tools</p>
                        <button class="pi-pay-btn">Pay with Pi</button>
                    </div>
                    <div class="pi-payment-option" data-type="chatSubscription">
                        <h4>Full Access</h4>
                        <p class="pi-price">0.5 π</p>
                        <p>Complete access to all AI tools</p>
                        <button class="pi-pay-btn">Pay with Pi</button>
                    </div>
                </div>
                <div class="pi-payment-status" style="display: none;">
                    <p>Processing payment...</p>
                </div>
            </div>
        `;

        // Add styles
        const styles = `
            .pi-payment-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .pi-payment-content {
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .pi-payment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 15px;
            }
            .pi-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
            }
            .pi-payment-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .pi-payment-option {
                border: 2px solid #e0e0e0;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                transition: all 0.3s ease;
            }
            .pi-payment-option:hover {
                border-color: #ffc72c;
                transform: translateY(-2px);
            }
            .pi-price {
                font-size: 24px;
                font-weight: bold;
                color: #ffc72c;
                margin: 10px 0;
            }
            .pi-pay-btn {
                background: #ffc72c;
                color: black;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                margin-top: 10px;
            }
            .pi-pay-btn:hover {
                background: #e6b329;
            }
            .pi-payment-status {
                text-align: center;
                padding: 20px;
                font-weight: bold;
            }
        `;

        // Add styles to document
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Add event listeners
        modal.querySelector('.pi-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        modal.querySelectorAll('.pi-pay-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const paymentType = e.target.closest('.pi-payment-option').dataset.type;
                const statusDiv = modal.querySelector('.pi-payment-status');
                
                try {
                    statusDiv.style.display = 'block';
                    statusDiv.innerHTML = '<p>Processing payment...</p>';
                    
                    await this.createPayment(paymentType);
                    
                    statusDiv.innerHTML = '<p style="color: green;">Payment successful! Redirecting...</p>';
                    
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        window.location.href = '/chat.html';
                    }, 2000);
                } catch (error) {
                    statusDiv.innerHTML = `<p style="color: red;">Payment failed: ${error.message}</p>`;
                }
            });
        });

        document.body.appendChild(modal);
    }

    /**
     * Check if user has access to AI tools
     */
    async hasAccess() {
        try {
            const status = await this.checkSubscriptionStatus();
            return status.subscriptionActive;
        } catch (error) {
            console.error('Error checking access:', error);
            return false;
        }
    }
}

// Create global instance
window.piPaymentManager = new PiPaymentManager();

// Auto-initialize when Pi SDK is available
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.Pi !== 'undefined') {
        try {
            await window.piPaymentManager.init();
        } catch (error) {
            console.error('Failed to auto-initialize Pi Payment Manager:', error);
        }
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PiPaymentManager;
}