// Test script for API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testEndpoints() {
    console.log('🧪 Testing TumzyTech API Endpoints...\n');

    // Test 1: Basic API endpoint
    try {
        console.log('1. Testing basic API endpoint...');
        const response = await axios.get(`${BASE_URL}/api/pi/subscription-status`);
        console.log('✅ Subscription status:', response.data);
    } catch (error) {
        console.log('❌ Subscription status failed:', error.message);
    }

    // Test 2: Payment creation endpoint
    try {
        console.log('\n2. Testing payment creation endpoint...');
        const response = await axios.post(`${BASE_URL}/api/pi/create-payment`, {
            paymentType: 'singleSession',
            uid: 'test_user'
        });
        console.log('✅ Payment creation:', response.data);
    } catch (error) {
        console.log('❌ Payment creation failed:', error.response?.data || error.message);
    }

    // Test 3: Authentication endpoint
    try {
        console.log('\n3. Testing Pi authentication endpoint...');
        const response = await axios.post(`${BASE_URL}/api/pi/auth`, {
            username: 'test_user',
            uid: 'test_uid_123'
        });
        console.log('✅ Pi authentication:', response.data);
    } catch (error) {
        console.log('❌ Pi authentication failed:', error.response?.data || error.message);
    }

    // Test 4: Services endpoint
    try {
        console.log('\n4. Testing services endpoint...');
        const response = await axios.get(`${BASE_URL}/api/services`);
        console.log('✅ Services endpoint:', response.data);
    } catch (error) {
        console.log('❌ Services endpoint failed:', error.response?.data || error.message);
    }

    console.log('\n🏁 API endpoint testing completed!');
}

testEndpoints().catch(console.error);
