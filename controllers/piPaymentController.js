const axios = require('axios');
const User = require('../models/User');

// Load environment variables
require('dotenv').config(); 

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE_URL = 'https://api.minepi.com/v2';

// Payment amounts configuration
const PAYMENT_CONFIG = {
    PREMIUM_SERVICE: 1.0,
    BASIC_SERVICE: 0.5
};

// Validate Pi API key on startup
if (!PI_API_KEY) {
    console.error('CRITICAL: PI_API_KEY is not defined in your .env file. Payment processing will fail.');
}

// Helper function to validate payment amount
const validatePaymentAmount = (amount, expectedAmount) => {
    const parsedAmount = parseFloat(amount);
    return !isNaN(parsedAmount) && parsedAmount === expectedAmount;
};

exports.approvePayment = async (req, res) => {
    const { paymentId, amount, productId } = req.body;
    
    if (!paymentId) {
        return res.status(400).json({ 
            success: false,
            message: 'Payment ID is required' 
        });
    }

    if (!PI_API_KEY) {
        return res.status(500).json({ 
            success: false,
            message: 'Server configuration error: Pi API Key not set.' 
        });
    }

    try {
        // Verify the payment details with Pi servers first
        const verifyResponse = await axios.get(
            `${PI_API_BASE_URL}/payments/${paymentId}`,
            {
                headers: { 'Authorization': `Key ${PI_API_KEY}` }
            }
        );

        const paymentData = verifyResponse.data;
        
        // Validate payment amount based on product
        const expectedAmount = PAYMENT_CONFIG[productId] || PAYMENT_CONFIG.BASIC_SERVICE;
        if (!validatePaymentAmount(paymentData.amount, expectedAmount)) {
            throw new Error('Invalid payment amount');
        }

        // If verification passes, approve the payment
        const response = await axios.post(
            `${PI_API_BASE_URL}/payments/${paymentId}/approve`,
            {},
            {
                headers: { 'Authorization': `Key ${PI_API_KEY}` }
            }
        );

        console.log('Payment approved successfully:', response.data);
        res.json({
            success: true,
            message: 'Payment approved',
            data: response.data
        });
    } catch (error) {
        console.error(
            'Error approving payment with Pi API:',
            error.response ? { status: error.response.status, data: error.response.data } : error.message
        );
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Failed to approve payment with Pi API',
            error: error.response?.data || error.message
        });
    }
};

exports.completePayment = async (req, res) => {
    const { paymentId, txid, userId } = req.body;
    
    if (!paymentId || !txid) {
        return res.status(400).json({ 
            success: false,
            message: 'Payment ID and Transaction ID (txid) are required' 
        });
    }

    try {
        // Verify the transaction with Pi servers
        const verifyResponse = await axios.get(
            `${PI_API_BASE_URL}/payments/${paymentId}`,
            {
                headers: { 'Authorization': `Key ${PI_API_KEY}` }
            }
        );

        if (verifyResponse.data.status !== 'completed') {
            // Complete the payment
            const response = await axios.post(
                `${PI_API_BASE_URL}/payments/${paymentId}/complete`,
                { txid },
                {
                    headers: { 'Authorization': `Key ${PI_API_KEY}` }
                }
            );            // Update user's premium status if userId is provided
            if (userId) {
                await User.findOneAndUpdate(
                    { piUserId: userId },
                    {
                        isPremium: true,
                        lastPaymentDate: new Date(),
                        paymentTxid: txid
                    }
                );
            }

            console.log('Payment completed successfully:', response.data);
            res.json({
                success: true,
                message: 'Payment completed',
                data: response.data
            });
        } else {
            res.json({
                success: true,
                message: 'Payment was already completed',
                data: verifyResponse.data
            });
        }
    } catch (error) {
        console.error(
            'Error completing payment with Pi API:',
            error.response ? { status: error.response.status, data: error.response.data } : error.message
        );
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Failed to complete payment with Pi API',
            error: error.response?.data || error.message
        });
    }
};

exports.cancelPayment = async (req, res) => {
    const { paymentId } = req.body;
    
    if (!paymentId) {
        return res.status(400).json({
            success: false,
            message: 'Payment ID is required'
        });
    }

    try {
        // Log the cancellation
        console.log(`Payment cancelled: ${paymentId}`);
        
        // You might want to update your database to mark this payment as cancelled
        
        res.json({
            success: true,
            message: 'Payment cancellation acknowledged',
            paymentId
        });
    } catch (error) {
        console.error('Error handling payment cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Error handling payment cancellation',
            error: error.message
        });
    }
};

exports.handlePaymentError = async (req, res) => {
    const { paymentId, error: paymentErrorDetails } = req.body;
    
    if (!paymentId) {
        return res.status(400).json({
            success: false,
            message: 'Payment ID is required'
        });
    }

    try {
        // Log the error details
        console.error(`Payment error for ID ${paymentId}:`, paymentErrorDetails);
        
        // You might want to store this error in your database for tracking
        
        res.json({
            success: true,
            message: 'Payment error logged',
            paymentId
        });
    } catch (error) {
        console.error('Error handling payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error handling payment error',
            error: error.message
        });
    }
};