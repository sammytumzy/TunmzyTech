/**
 * Pi Network Payment Integration for TumzyTech AI Tools
 * Handles Pi Network authentication and payment flows
 */

class PiPaymentManager {
    constructor() {
        this.isAuthenticated = false;
        this.userInfo = null;
        this.isProcessing = false;
        this.paymentButton = null;
        this.token = localStorage.getItem('token'); // Store token for API calls
        // Check if we're in a Pi Browser environment
        this.isPiBrowser = this.checkPiBrowserEnvironment();
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    checkPiBrowserEnvironment() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isPiBrowser = userAgent.includes('pi browser') || userAgent.includes('pi network');
        // For development/testing purposes, also allow localhost and github pages
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname.includes('github.io') ||
                             window.location.hostname.includes('127.0.0.1');
        if (!isPiBrowser && isDevelopment) {
            console.warn('Development environment detected - Pi payments may not work fully');
        }
        return isPiBrowser || isDevelopment;
    }

    async initialize() {
        console.log('Initializing Pi Payment Manager...');
        // Check for token and use Pi Network authentication if not found
        if (!this.token) {
            console.warn('No authentication token found. Initiating Pi Network authentication.');
            await this.authenticateUser(); // Use Pi Network authentication instead of redirecting
            // After authentication, update token if available
            this.token = localStorage.getItem('token');
            if (!this.token) {
                this.showNotification('Authentication failed: No token received. Please try again in Pi Browser.', 'error');
                this.setUnauthenticatedState();
                return;
            }
        }
        // Wait for Pi SDK to be available with timeout
        const waitForPiSDK = () => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Pi SDK loading timeout'));
                }, 10000); // 10 second timeout
                const checkSDK = () => {
                    if (typeof window.Pi !== 'undefined') {
                        clearTimeout(timeout);
                        resolve(window.Pi);
                    } else {
                        setTimeout(checkSDK, 100);
                    }
                };
                checkSDK();
            });
        };
        try {
            await waitForPiSDK();
            // Initialize Pi SDK with proper error handling
            if (window.Pi && !window.Pi.isInitialized) { 
                await Promise.race([
                    window.Pi.init({ version: "2.0", sandbox: true }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Pi SDK init timeout')), 15000)
                    )
                ]);
            }
            console.log('Pi SDK initialized successfully (or was already initialized).');
            // If the modal placeholder exists, use it for the payment button
            const modalPlaceholder = document.getElementById('pi-payment-button-placeholder-modal');
            if (modalPlaceholder) {
                this.paymentButton = null; // Remove any previous button
                this.createPaymentButton(modalPlaceholder);
            } else {
                this.createPaymentButton();
            }
        } catch (error) {
            console.warn('Pi SDK initialization failed:', error.message);
            this.createFallbackButton();
        } finally {
            try {
                await this.getUserData();
            } catch (userDataError) {
                console.warn('Failed to get user data during initialization:', userDataError);
            }
        }
    }

    async authenticateUser() {
        if (typeof window.Pi === 'undefined') {
            this.showNotification('Pi SDK not found. Please open this app in Pi Browser.', 'error');
            this.setUnauthenticatedState();
            throw new Error('Pi SDK not found');
        }
        if (this.isAuthenticated && this.userInfo) {
            console.log('User already authenticated');
            return this.userInfo;
        }
        try {
            console.log('Authenticating Pi user...');
            // As per Pi Network docs: https://developers.minepi.com/docs/pi-platform/pi-apps/authentication
            const scopes = ['payments', 'username'];
            const authResult = await Promise.race([
                window.Pi.authenticate(scopes, this.onIncompletePaymentFound.bind(this)),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Authentication timeout')), 30000)
                )
            ]);
            this.isAuthenticated = true;
            this.userInfo = authResult.user;
            // Store token if provided by Pi SDK (as per latest docs)
            if (authResult.accessToken) {
                this.token = authResult.accessToken;
                localStorage.setItem('token', this.token);
            }
            localStorage.setItem('piUser', JSON.stringify(this.userInfo));
            localStorage.setItem('piAuthenticated', 'true');
            console.log('Pi user authenticated successfully:', this.userInfo);
            return this.userInfo;
        } catch (error) {
            console.error('Pi authentication failed:', error);
            this.isAuthenticated = false;
            this.userInfo = null;
            localStorage.removeItem('piUser');
            localStorage.removeItem('piAuthenticated');
            this.setUnauthenticatedState();
            if (error.message && error.message.includes('timeout')) {
                throw new Error('Authentication timed out. Please try again or ensure you are using Pi Browser.');
            } else if (error.message && error.message.includes('User cancelled')) {
                throw new Error('Authentication was cancelled.');
            } else {
                throw new Error('Authentication failed. Please ensure you are using Pi Browser.');
            }
        }
    }

    setUnauthenticatedState() {
        if (this.paymentButton) {
            this.paymentButton.disabled = true;
            this.updateButtonText('Pi Authentication Required');
        }
        const piAuthStatusEl = document.getElementById('pi-auth-status');
        if (piAuthStatusEl) {
            piAuthStatusEl.textContent = 'Not authenticated with Pi';
            piAuthStatusEl.className = 'status-not-authenticated';
        }
    }

    async onIncompletePaymentFound(payment) {
        console.log('Incomplete payment found:', payment);
        this.showNotification('Incomplete payment found, attempting to complete...', 'info');
        try {
            this.updateButtonText('Completing previous payment...');
            const response = await fetch('/api/pi-payments/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    paymentId: payment.identifier,
                    txid: payment.transaction ? payment.transaction.txid : null,
                    userId: this.userInfo?.uid 
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to complete incomplete payment on server.');
            }
            const completedPaymentData = await response.json();
            console.log('Incomplete payment server completion response:', completedPaymentData);
            this.handlePaymentSuccess({ paymentId: payment.identifier, txid: payment.transaction ? payment.transaction.txid : completedPaymentData.txid });
            return completedPaymentData;
        } catch (error) {
            console.error('Failed to complete incomplete payment:', error);
            this.handlePaymentError(new Error(`Failed to process incomplete payment: ${error.message}`));
            throw error;
        }
    }

    async createPayment() {
        await this.authenticateUser();
        if (!this.userInfo) {
            this.handlePaymentError(new Error('User not authenticated. Please sign in with Pi.'));
            this.setUnauthenticatedState();
            throw new Error('User not authenticated.');
        }
        try {
            const paymentData = {
                amount: 1,
                memo: "TumzyTech Premium Access - Unlock advanced AI features",
                metadata: {
                    orderId: `order_${Date.now()}`,
                    productId: 'premium_access',
                    userId: this.userInfo?.uid || 'anonymous',
                    username: this.userInfo?.username || 'anonymous_pi_user',
                    timestamp: new Date().toISOString()
                }
            };
            console.log('Creating Pi payment:', paymentData);
            const payment = await Promise.race([
                window.Pi.createPayment(paymentData, {
                    onReadyForServerApproval: async (paymentId) => {
                        console.log('Payment ready for server approval:', paymentId);
                        this.updateButtonText('Approving payment...');
                        try {
                            const approveResponse = await fetch('/api/pi-payments/approve', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${this.token}`
                                },
                                body: JSON.stringify({ 
                                    paymentId: paymentId,
                                    amount: paymentData.amount,
                                    productId: paymentData.metadata.productId
                                })
                            });
                            if (!approveResponse.ok) {
                                const errorData = await approveResponse.json();
                                throw new Error(errorData.message || 'Server approval failed');
                            }
                            console.log('Payment approved by server:', await approveResponse.json());
                            this.showNotification('Payment approved, awaiting completion.', 'info');
                        } catch (approvalError) {
                            console.error('Server approval error:', approvalError);
                            this.handlePaymentError(new Error(`Approval failed: ${approvalError.message}`));
                        }
                    },
                    onReadyForServerCompletion: async (paymentId, txid) => {
                        console.log('Payment ready for server completion:', paymentId, txid);
                        this.updateButtonText('Completing payment...');
                        try {
                            const completeResponse = await fetch('/api/pi-payments/complete', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${this.token}`
                                },
                                body: JSON.stringify({
                                    paymentId: paymentId,
                                    txid: txid,
                                    userId: this.userInfo?.uid
                                })
                            });
                            if (!completeResponse.ok) {
                                const errorData = await completeResponse.json();
                                throw new Error(errorData.message || 'Server completion failed');
                            }
                            console.log('Payment completed by server:', await completeResponse.json());
                            this.handlePaymentSuccess({ paymentId, txid });
                        } catch (completionError) {
                            console.error('Server completion error:', completionError);
                            this.handlePaymentError(new Error(`Completion failed: ${completionError.message}`));
                        }
                    },
                    onCancel: (paymentId) => {
                        console.log('Payment cancelled by user:', paymentId);
                        fetch('/api/pi-payments/cancel', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({ paymentId: paymentId, userId: this.userInfo?.uid })
                        }).catch(err => console.error('Failed to notify server of cancellation:', err));
                        this.handlePaymentCancel();
                    },
                    onError: (error, payment) => {
                        console.error('Pi SDK Payment error occurred:', error, payment);
                        fetch('/api/pi-payments/error', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({
                                paymentId: payment ? payment.identifier : 'unknown',
                                error: error.message,
                                userId: this.userInfo?.uid
                            })
                        }).catch(err => console.error('Failed to notify server of payment error:', err));
                        this.handlePaymentError(error);
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Payment creation timeout')), 45000)
                )
            ]);
            console.log('Payment created successfully:', payment);
            return payment;
        } catch (error) {
            console.error('Failed to create payment:', error);
            if (error.message.includes('timeout')) {
                this.handlePaymentError(new Error('Payment timed out. This may happen if you\'re not in Pi Browser or if there\'s a network issue.'));
            } else {
                this.handlePaymentError(error);
            }
            throw error;
        }
    }

    async handlePaymentSuccess(payment) {
        console.log('Payment completed successfully:', payment);
        localStorage.setItem('premiumAccess', 'true');
        localStorage.setItem('premiumActivatedAt', new Date().toISOString());
        this.updateButtonText('✓ Premium Activated!');
        this.paymentButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        this.paymentButton.classList.add('bg-green-600');
        this.paymentButton.disabled = true;
        this.showNotification('Premium features unlocked! Enjoy advanced AI capabilities.', 'success');
        setTimeout(() => {
            this.updateButtonText('Premium Active');
        }, 3000);
        await this.getUserData();
    }

    handlePaymentCancel() {
        console.log('Payment was cancelled');
        this.showNotification('Payment cancelled. You can try again anytime.', 'info');
        this.resetButton();
    }

    handlePaymentError(error) {
        console.error('Payment error:', error);
        let errorMessage = 'Payment failed. Please try again.';
        if (error.message) {
            if (error.message.includes('insufficient')) {
                errorMessage = 'Insufficient Pi balance. Please check your wallet.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
        }
        this.showNotification(errorMessage, 'error');
        this.resetButton();
    }

    createPaymentButton(overrideContainer) {
        const placeholder = document.getElementById('pi-payment-button-placeholder');
        const chatContainer = document.querySelector('.chat-container');
        const targetContainer = overrideContainer || placeholder || chatContainer;
        if (!targetContainer) {
            console.error('Pi payment button container not found (expected #pi-payment-button-placeholder or .chat-container).');
            return;
        }
        const hasPremium = localStorage.getItem('premiumAccess') === 'true';
        this.paymentButton = document.createElement('button');
        this.paymentButton.className = `mt-4 w-full px-4 py-3 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
            hasPremium ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'
        }`;
        this.updateButtonText(hasPremium ? 'Premium Active' : '🚀 Unlock Premium Features (1π)');
        this.paymentButton.disabled = hasPremium;
        this.paymentButton.addEventListener('click', async () => {
            if (this.isProcessing || this.paymentButton.disabled) {
                return;
            }
            this.isProcessing = true;
            this.updateButtonText('Connecting...');
            const maxProcessingTime = setTimeout(() => {
                if (this.isProcessing) {
                    console.warn('Payment processing took too long, resetting...');
                    this.handlePaymentError(new Error('Payment took too long to process. Please try again.'));
                }
            }, 60000);
            try {
                await this.createPayment();
            } catch (error) {
                console.error('Payment process failed:', error);
            } finally {
                clearTimeout(maxProcessingTime);
                this.isProcessing = false;
            }
        });
        if (placeholder && targetContainer === placeholder) {
            placeholder.innerHTML = '';
        }
        targetContainer.appendChild(this.paymentButton);
        console.log('Pi payment button created and added.');
    }

    createFallbackButton() {
        const placeholder = document.getElementById('pi-payment-button-placeholder');
        const chatContainer = document.querySelector('.chat-container');
        const targetContainer = placeholder || chatContainer;
        if (!targetContainer) {
            console.error('Pi fallback button container not found (expected #pi-payment-button-placeholder or .chat-container).');
            return;
        }
        this.paymentButton = document.createElement('div');
        this.paymentButton.className = 'mt-4 w-full p-4 bg-gray-700 text-white rounded-lg text-center';
        this.paymentButton.innerHTML = `
            <div class="mb-2">
                <span class="text-yellow-400">⚠️</span>
                <strong>Pi Browser Required</strong>
            </div>
            <p class="text-sm text-gray-300 mb-3">
                To unlock premium features with Pi payments, please:
            </p>
            <ol class="text-sm text-gray-300 text-left space-y-1 mb-3">
                <li>1. Download Pi Browser from the Pi Network app</li>
                <li>2. Open this website in Pi Browser</li>
                <li>3. Return here to make your payment</li>
            </ol>
            <div class="text-xs text-gray-400">
                Current browser: ${navigator.userAgent.includes('Pi') ? 'Pi Browser' : 'Regular Browser'}
            </div>
        `;
        if (placeholder && targetContainer === placeholder) {
            placeholder.innerHTML = '';
        }
        targetContainer.appendChild(this.paymentButton);
        console.log('Fallback payment info created.');
    }

    updateButtonText(text) {
        if (this.paymentButton) {
            this.paymentButton.textContent = text;
        }
    }

    resetButton() {
        this.isProcessing = false;
        // Only enable if user does not have premium
        const hasPremium = localStorage.getItem('premiumAccess') === 'true';
        if (!hasPremium) {
            this.updateButtonText('🚀 Unlock Premium Features (1π)');
            if (this.paymentButton) this.paymentButton.disabled = false;
        } else {
            this.updateButtonText('Premium Active');
            if (this.paymentButton) this.paymentButton.disabled = true;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-50 transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            'bg-blue-600'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    async getUserData() {
      if (!this.token) {
        console.log('No token found, skipping getUserData.');
        return null;
      }
      try {
        const response = await fetch('/api/services/user-stats', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user data and parse error' }));
          throw new Error(errorData.message || 'Failed to fetch user data');
        }
        const userData = await response.json();
        console.log('User data fetched:', userData);
        const userNameEl = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');
        const premiumStatusEl = document.getElementById('premium-status');
        const remainingTrialsEl = document.getElementById('remaining-trials');
        const upgradeContainerEl = document.getElementById('upgrade-container');
        if (userNameEl && userData.user && userData.user.name) userNameEl.textContent = userData.user.name;
        if (userEmailEl && userData.user && userData.user.email) userEmailEl.textContent = userData.user.email;
        if (premiumStatusEl) {
            if (userData.user && userData.user.isPremium) {
                premiumStatusEl.textContent = 'Premium';
                premiumStatusEl.className = 'status-premium';
                if (upgradeContainerEl) upgradeContainerEl.style.display = 'none';
                if (this.paymentButton && this.paymentButton.parentElement === upgradeContainerEl) {
                    this.updateButtonText('✓ Premium Activated!');
                    this.paymentButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                    this.paymentButton.classList.add('bg-green-600');
                    this.paymentButton.disabled = true;
                }
            } else {
                premiumStatusEl.textContent = 'Basic';
                premiumStatusEl.className = 'status-basic';
                if (remainingTrialsEl && userData.user && userData.user.remainingTrials !== undefined) {
                    remainingTrialsEl.textContent = `${userData.user.remainingTrials} trials remaining`;
                }
                if (upgradeContainerEl) upgradeContainerEl.style.display = 'block';
                 if (this.paymentButton && this.paymentButton.parentElement === upgradeContainerEl) {
                    this.resetButton();
                }
            }
        }
        const piUsernameEl = document.getElementById('pi-username');
        const piAuthStatusEl = document.getElementById('pi-auth-status');
        if (this.userInfo && this.userInfo.username) {
            if (piUsernameEl) piUsernameEl.textContent = `Pi User: ${this.userInfo.username}`;
            if (piAuthStatusEl) {
                 piAuthStatusEl.textContent = 'Authenticated with Pi';
                 piAuthStatusEl.className = 'status-authenticated';
            }
        } else {
            if (piAuthStatusEl) {
                piAuthStatusEl.textContent = 'Not authenticated with Pi';
                piAuthStatusEl.className = 'status-not-authenticated';
            }
        }
        return userData;
      } catch (error) {
        console.error('Error fetching user data:', error);
        const premiumStatusEl = document.getElementById('premium-status');
        if (premiumStatusEl) {
            premiumStatusEl.textContent = 'Error loading status';
            premiumStatusEl.className = 'status-error';
        }
        return null;
      }
    }
}

// Initialize the PiPaymentManager if on a page that needs it.
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.chat-container') || 
        document.getElementById('premium-status') || 
        document.getElementById('pi-payment-button-placeholder')) {
        new PiPaymentManager();
    }
});
