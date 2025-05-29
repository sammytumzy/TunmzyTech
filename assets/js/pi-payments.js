
/**
 * Pi Network Payment Integration
 * Handles premium feature payments through Pi Network SDK
 */

class PiPaymentManager {
    constructor() {
        this.isAuthenticated = false;
        this.userInfo = null;
        this.isProcessing = false;
        this.paymentButton = null;
        
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
            if (!window.Pi.isInitialized) {
                await Promise.race([
                    window.Pi.init({ version: "2.0", sandbox: true }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Pi SDK init timeout')), 15000)
                    )
                ]);
                console.log('Pi SDK initialized successfully');
            }
            
            this.createPaymentButton();
            
        } catch (error) {
            console.warn('Pi SDK initialization failed:', error.message);
            this.createFallbackButton();
        }
    }
      async authenticateUser() {
        if (this.isAuthenticated && this.userInfo) {
            console.log('User already authenticated');
            return this.userInfo;
        }
        
        try {
            console.log('Authenticating Pi user...');
            
            const scopes = ['payments'];
            
            // Add timeout to authentication
            const authResult = await Promise.race([
                window.Pi.authenticate(scopes, this.onIncompletePaymentFound.bind(this)),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Authentication timeout')), 30000)
                )
            ]);
            
            this.isAuthenticated = true;
            this.userInfo = authResult.user;
            
            // Store user info for session
            localStorage.setItem('piUser', JSON.stringify(this.userInfo));
            localStorage.setItem('piAuthenticated', 'true');
            
            console.log('Pi user authenticated successfully:', this.userInfo);
            return this.userInfo;
            
        } catch (error) {
            console.error('Pi authentication failed:', error);
            this.isAuthenticated = false;
            this.userInfo = null;
            
            // Clean up storage on failed auth
            localStorage.removeItem('piUser');
            localStorage.removeItem('piAuthenticated');
            
            // Handle specific error types
            if (error.message.includes('timeout')) {
                throw new Error('Authentication timed out. Please try again or ensure you are using Pi Browser.');
            } else if (error.message.includes('User cancelled')) {
                throw new Error('Authentication was cancelled.');
            } else {
                throw new Error('Authentication failed. Please ensure you are using Pi Browser.');
            }
        }
    }
    
    async onIncompletePaymentFound(payment) {
        console.log('Incomplete payment found:', payment);
        
        try {
            // Complete the incomplete payment
            const completedPayment = await payment.complete();
            console.log('Incomplete payment completed:', completedPayment);
            
            // Handle successful payment
            this.handlePaymentSuccess(completedPayment);
            
            return completedPayment;
        } catch (error) {
            console.error('Failed to complete incomplete payment:', error);
            throw error;
        }
    }
      async createPayment() {
        try {
            // Ensure user is authenticated first
            await this.authenticateUser();
            
            const paymentData = {
                amount: 1,
                memo: "TumzyTech Premium Access - Unlock advanced AI features",
                metadata: {
                    orderId: `order_${Date.now()}`,
                    productId: 'premium_access',
                    userId: this.userInfo?.uid || 'anonymous',
                    timestamp: new Date().toISOString()
                }
            };
            
            console.log('Creating Pi payment:', paymentData);
            
            // Add timeout to payment creation
            const payment = await Promise.race([
                window.Pi.createPayment(paymentData, {
                    onReadyForServerApproval: (paymentId) => {
                        console.log('Payment ready for server approval:', paymentId);
                        this.updateButtonText('Approving payment...');
                        
                        // Simulate server approval for GitHub Pages (no backend)
                        setTimeout(() => {
                            console.log('Simulating server approval for payment:', paymentId);
                        }, 1000);
                    },
                    
                    onReadyForServerCompletion: (paymentId, txid) => {
                        console.log('Payment ready for server completion:', paymentId, txid);
                        this.updateButtonText('Completing payment...');
                        
                        // Simulate server completion for GitHub Pages
                        setTimeout(() => {
                            console.log('Simulating server completion for payment:', paymentId);
                            this.handlePaymentSuccess({ paymentId, txid });
                        }, 1000);
                    },
                    
                    onCancel: (paymentId) => {
                        console.log('Payment cancelled by user:', paymentId);
                        this.handlePaymentCancel();
                    },
                    
                    onError: (error, payment) => {
                        console.error('Payment error occurred:', error, payment);
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
            
            // Handle specific timeout errors
            if (error.message.includes('timeout')) {
                this.handlePaymentError(new Error('Payment timed out. This may happen if you\'re not in Pi Browser or if there\'s a network issue.'));
            } else {
                this.handlePaymentError(error);
            }
            throw error;
        }
    }
    
    handlePaymentSuccess(payment) {
        console.log('Payment completed successfully:', payment);
        
        // Store premium access
        localStorage.setItem('premiumAccess', 'true');
        localStorage.setItem('premiumActivatedAt', new Date().toISOString());
        
        // Update UI
        this.updateButtonText('✓ Premium Activated!');
        this.paymentButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        this.paymentButton.classList.add('bg-green-600');
        this.paymentButton.disabled = true;
        
        // Show success message
        this.showNotification('Premium features unlocked! Enjoy advanced AI capabilities.', 'success');
        
        // Reset button after delay
        setTimeout(() => {
            this.updateButtonText('Premium Active');
        }, 3000);
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
    
    createPaymentButton() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) {
            console.error('Chat container not found');
            return;
        }
        
        // Check if premium is already active
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
            
            // Add a maximum processing time to prevent getting stuck
            const maxProcessingTime = setTimeout(() => {
                if (this.isProcessing) {
                    console.warn('Payment processing took too long, resetting...');
                    this.handlePaymentError(new Error('Payment took too long to process. Please try again.'));
                }
            }, 60000); // 60 seconds max
            
            try {
                await this.createPayment();
            } catch (error) {
                console.error('Payment process failed:', error);
                this.handlePaymentError(error);
            } finally {
                clearTimeout(maxProcessingTime);
                this.isProcessing = false;
            }
        });
        
        chatContainer.appendChild(this.paymentButton);
        console.log('Pi payment button created and added to chat container');
    }
      createFallbackButton() {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;
        
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
        
        chatContainer.appendChild(this.paymentButton);
        console.log('Fallback payment info created (Pi SDK not available)');
    }
    
    updateButtonText(text) {
        if (this.paymentButton) {
            this.paymentButton.textContent = text;
        }
    }
    
    resetButton() {
        this.isProcessing = false;
        this.updateButtonText('🚀 Unlock Premium Features (1π)');
        this.paymentButton.disabled = false;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-50 transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 
            'bg-blue-600'
        }`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize Pi Payment Manager when script loads
new PiPaymentManager();