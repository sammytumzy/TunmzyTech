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
      
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'Payment ID is required' });
      }
      
      // Verify the payment with Pi Network
      const paymentData = await piPaymentController.verifyPaymentWithPi(paymentId);
      
      if (!paymentData) {
        return res.status(400).json({ success: false, message: 'Unable to verify payment with Pi Network' });
      }
      
      // Check if payment is in the correct state
      if (paymentData.status !== 'created') {
        return res.status(400).json({ 
          success: false, 
          message: `Payment is in ${paymentData.status} state, not ready for approval` 
        });
      }
      
      // Approve the payment with Pi Network
      const approvalResponse = await axios.post(
        `${piConfig.apiEndpoints.approvals}/${paymentId}`,
        {},
        { headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` } }
      );
      
      if (approvalResponse.status !== 200) {
        return res.status(400).json({ success: false, message: 'Failed to approve payment with Pi Network' });
      }
      
      res.json({ success: true, message: 'Payment approved successfully' });
    } catch (error) {
      console.error('Error approving payment:', error);
      res.status(500).json({ success: false, message: 'Error approving payment' });
    }
  },

  /**
   * Complete a payment
   * This is called by the client when a payment is ready for server completion
   */
  completePayment: async (req, res) => {
    try {
      const { paymentId, txid } = req.body;
      
      if (!paymentId || !txid) {
        return res.status(400).json({ success: false, message: 'Payment ID and transaction ID are required' });
      }
      
      // Verify the payment with Pi Network
      const paymentData = await piPaymentController.verifyPaymentWithPi(paymentId);
      
      if (!paymentData) {
        return res.status(400).json({ success: false, message: 'Unable to verify payment with Pi Network' });
      }
      
      // Check if payment is in the correct state
      if (paymentData.status !== 'approved') {
        return res.status(400).json({ 
          success: false, 
          message: `Payment is in ${paymentData.status} state, not ready for completion` 
        });
      }
      
      // Complete the payment with Pi Network
      const completionResponse = await axios.post(
        `${piConfig.apiEndpoints.completions}/${paymentId}`,
        { txid },
        { headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` } }
      );
      
      if (completionResponse.status !== 200) {
        return res.status(400).json({ success: false, message: 'Failed to complete payment with Pi Network' });
      }
      
      // Update user subscription status if payment is for subscription
      if (paymentData.metadata && paymentData.metadata.productId === 'chatbot-subscription') {
        try {
          // Find user by Pi username
          const user = await User.findOne({ piUsername: paymentData.user_uid });
          if (user) {
            // Set subscription end date to 30 days from now
            const subscriptionEndDate = new Date();
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
            
            user.subscriptionActive = true;
            user.subscriptionEndDate = subscriptionEndDate;
            user.paymentHistory = user.paymentHistory || [];
            user.paymentHistory.push({
              paymentId,
              txid,
              amount: paymentData.amount,
              date: new Date(),
              type: 'subscription'
            });
            
            await user.save();
          }
        } catch (userError) {
          console.error('Error updating user subscription:', userError);
          // Continue with payment completion even if user update fails
        }
      }
      
      res.json({ success: true, message: 'Payment completed successfully' });
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({ success: false, message: 'Error completing payment' });
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
