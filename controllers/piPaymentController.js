const axios = require('axios');

// Load environment variables
require('dotenv').config(); 

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE_URL = 'https://api.minepi.com/v2';

if (!PI_API_KEY) {
    console.error('CRITICAL: PI_API_KEY is not defined in your .env file. Payment processing will fail.');
}

exports.approvePayment = async (req, res) => {
    const { paymentId } = req.body;
    if (!paymentId) {
        return res.status(400).json({ message: 'Payment ID is required' });
    }
    if (!PI_API_KEY) {
        return res.status(500).json({ message: 'Server configuration error: Pi API Key not set.' });
    }

    console.log(`Attempting to approve payment: ${paymentId}`);
    try {
        const response = await axios.post(
            `${PI_API_BASE_URL}/payments/${paymentId}/approve`,
            {},
            {
                headers: { 'Authorization': `Key ${PI_API_KEY}` }
            }
        );
        console.log('Pi API approve response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error(
            'Error approving payment with Pi API:',
            error.response ? { status: error.response.status, data: error.response.data } : error.message
        );
        res.status(error.response?.status || 500).json({
            message: 'Failed to approve payment with Pi API',
            error: error.response?.data || error.message
        });
    }
};

exports.completePayment = async (req, res) => {
    const { paymentId, txid } = req.body;
    if (!paymentId || !txid) {
        return res.status(400).json({ message: 'Payment ID and Transaction ID (txid) are required' });
    }
    if (!PI_API_KEY) {
        return res.status(500).json({ message: 'Server configuration error: Pi API Key not set.' });
    }

    console.log(`Attempting to complete payment: ${paymentId} with txid: ${txid}`);
    try {
        const response = await axios.post(
            `${PI_API_BASE_URL}/payments/${paymentId}/complete`,
            { txid }, // txid is sent in the request body
            {
                headers: { 'Authorization': `Key ${PI_API_KEY}` }
            }
        );
        console.log('Pi API complete response:', response.data);
        // IMPORTANT: If payment is successfully completed, this is where you would:
        // 1. Verify the response.data to ensure the payment was indeed successful and for the correct amount/details.
        // 2. Update your application's database to grant the user access to the paid feature/service.
        //    Example: await User.findByIdAndUpdate(req.user.id, { hasPremiumAccess: true });
        //    (This assumes you have user sessions and a User model)
        console.log('Payment successfully completed. Grant user access to features here.');
        res.json(response.data);
    } catch (error) {
        console.error(
            'Error completing payment with Pi API:',
            error.response ? { status: error.response.status, data: error.response.data } : error.message
        );
        res.status(error.response?.status || 500).json({
            message: 'Failed to complete payment with Pi API',
            error: error.response?.data || error.message
        });
    }
};

exports.cancelPayment = async (req, res) => {
    const { paymentId } = req.body;
    console.log(`Client reported cancellation for payment: ${paymentId}`);
    // The Pi SDK typically handles the user-facing cancellation.
    // This backend endpoint is mostly for your server to be aware, log, or take other actions if needed.
    // There isn't always a direct Pi API call to "cancel" an unapproved payment from the server-side
    // in the same way approve/complete work, as cancellation is often a client-side SDK flow.
    // You could log this event or update an internal payment attempt status.
    res.json({ message: 'Payment cancellation acknowledged by server', paymentId });
};

exports.handlePaymentError = async (req, res) => {
    const { paymentId, error: paymentErrorDetails } = req.body;
    console.error(`Client reported error for payment: ${paymentId}`, paymentErrorDetails);
    // Log the error details for monitoring and debugging.
    // Similar to cancel, this is for server awareness.
    res.json({ message: 'Payment error acknowledged by server', paymentId });
};