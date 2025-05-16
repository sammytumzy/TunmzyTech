const axios = require('axios');
const User = require('../models/User');
const piConfig = require('../config/pi-network');

/**
 * Pi Network Payment Controller
 * Handles all Pi Network payment operations following Pi Network guidelines
 */
const piPaymentController = {
  /**
   * Create a payment
   * This function is called from the client side
   */
  createPayment: async (req, res) => {
    try {
      const { paymentType = 'singleSession', uid } = req.body;
      
      // Get payment options based on payment type
      const paymentOption = piConfig.paymentOptions[paymentType];
      if (!paymentOption) {
        return res.status(400).json({ success: false, message: 'Invalid payment type' });
      }
      
      // Return payment details to be used by the Pi SDK on the client
      res.json({
        success: true,
        paymentData: {
          amount: paymentOption.amount,
          memo: paymentOption.memo,
          metadata: paymentOption.metadata,
          uid: uid || null,
          to: piConfig.walletAddress
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ success: false, message: 'Error creating payment' });
    }
  },

  /**
   * Approve a payment
   * This is called by the client when a payment is ready for server approval
   */
  approvePayment: async (req, res) => {
    try {
      const { paymentId } = req.body;
      console.log('Approving payment:', paymentId);

      // In sandbox mode, we auto-approve all payments
      res.json({
        success: true,
        message: 'Payment approved'
      });
    } catch (error) {
      console.error('Error approving payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Complete a payment
   * This is called by the client when a payment is ready for server completion
   */
  completePayment: async (req, res) => {
    try {
      const { paymentId, txid } = req.body;
      console.log('Completing payment:', paymentId, 'txid:', txid);

      // 1. Verify the transaction on the Pi blockchain (to be implemented in production)
      
      // 2. Update user subscription status (sandbox mode - auto approve)
      const username = req.piUser?.username; // From Pi auth middleware
      if (username) {
        const user = await User.findOneAndUpdate(
          { piUsername: username },
          {
            subscriptionActive: true,
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            lastPaymentId: paymentId,
            lastPaymentTxid: txid
          },
          { new: true, upsert: true }
        );

        res.json({
          success: true,
          message: 'Payment completed',
          subscription: {
            active: user.subscriptionActive,
            endDate: user.subscriptionEndDate
          }
        });
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Handle incomplete payments
   */
  handleIncompletePayment: async (req, res) => {
    try {
      const { payment } = req.body;
      console.log('Handling incomplete payment:', payment);

      // Verify the payment status and take appropriate action
      if (payment.status === 'completed') {
        // Payment was completed but our server didn't record it
        await piPaymentController.completePayment(payment);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error handling incomplete payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Handle cancelled payment
   */
  cancelPayment: async (req, res) => {
    try {
      const { paymentId } = req.body;
      console.log('Payment cancelled:', paymentId);

      res.json({
        success: true,
        message: 'Payment cancellation recorded'
      });
    } catch (error) {
      console.error('Error handling cancelled payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Verify payment with Pi Platform API
   * Helper function to verify payment status with Pi Network
   */
  verifyPaymentWithPi: async (paymentId) => {
    try {
      const response = await axios.get(
        `${piConfig.apiEndpoints.payments}/${paymentId}`,
        { headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying payment with Pi Platform:', error.response?.data || error.message);
      return null;
    }
  },

  /**
   * Get payment history for a user
   */
  getPaymentHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      res.json({
        success: true,
        paymentHistory: user.paymentHistory || [],
        subscriptionActive: user.subscriptionActive || false,
        subscriptionEndDate: user.subscriptionEndDate || null
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      res.status(500).json({ success: false, message: 'Error getting payment history' });
    }
  },

  /**
   * Check payment status
   * Determines user access based on payment status
   */
  checkPaymentStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      const response = await fetch(`${piConfig.apiEndpoints.base}/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const paymentData = await response.json();

      // If payment is completed, update user access
      if (paymentData.status === 'completed') {
        // Update user access in database
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            subscriptionActive: true,
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        });
      }

      return res.json({
        success: true,
        payment: paymentData
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  }
};

module.exports = piPaymentController;
