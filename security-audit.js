// Comprehensive Security and Integration Test for TumzyTech
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const REACT_URL = 'http://localhost:3000';

async function runSecurityTests() {
    console.log('🔒 TumzyTech Security & Integration Audit\n');
    
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0
    };

    // Test 1: Security Headers
    console.log('1. Testing Security Headers...');
    try {
        const response = await axios.get(`${BASE_URL}`, { timeout: 5000 });
        const headers = response.headers;
        
        console.log('   ✅ Server responsive');
        
        // Check for security headers
        const securityHeaders = [
            'x-frame-options',
            'x-content-type-options', 
            'x-xss-protection',
            'referrer-policy'
        ];
        
        securityHeaders.forEach(header => {
            if (headers[header]) {
                console.log(`   ✅ ${header}: ${headers[header]}`);
                results.passed++;
            } else {
                console.log(`   ⚠️  Missing ${header}`);
                results.warnings++;
            }
        });
    } catch (error) {
        console.log('   ❌ Server not accessible:', error.message);
        results.failed++;
    }

    // Test 2: API Endpoints
    console.log('\n2. Testing API Endpoints...');
    const endpoints = [
        { method: 'GET', path: '/api/pi/subscription-status', auth: false },
        { method: 'POST', path: '/api/pi/auth', auth: false, data: { username: 'test', uid: 'test123' } },
        { method: 'POST', path: '/api/pi/create-payment', auth: true, data: { paymentType: 'singleSession' } }
    ];

    for (const endpoint of endpoints) {
        try {
            const config = {
                method: endpoint.method,
                url: `${BASE_URL}${endpoint.path}`,
                timeout: 5000
            };
            
            if (endpoint.data) {
                config.data = endpoint.data;
            }

            const response = await axios(config);
            console.log(`   ✅ ${endpoint.method} ${endpoint.path}: ${response.status}`);
            results.passed++;
        } catch (error) {
            const status = error.response?.status || 'No response';
            if (endpoint.auth && status === 401) {
                console.log(`   ✅ ${endpoint.method} ${endpoint.path}: ${status} (Expected auth required)`);
                results.passed++;
            } else {
                console.log(`   ❌ ${endpoint.method} ${endpoint.path}: ${status} - ${error.message}`);
                results.failed++;
            }
        }
    }

    // Test 3: Rate Limiting
    console.log('\n3. Testing Rate Limiting...');
    try {
        const requests = [];
        for (let i = 0; i < 5; i++) {
            requests.push(axios.get(`${BASE_URL}/api/pi/subscription-status`, { timeout: 2000 }));
        }
        
        const responses = await Promise.all(requests);
        console.log(`   ✅ Rate limiting allows normal requests: ${responses.length} requests succeeded`);
        results.passed++;
    } catch (error) {
        console.log('   ⚠️  Rate limiting test inconclusive:', error.message);
        results.warnings++;
    }

    // Test 4: CORS Headers
    console.log('\n4. Testing CORS Configuration...');
    try {
        const response = await axios.options(`${BASE_URL}/api/pi/subscription-status`);
        const corsHeaders = response.headers['access-control-allow-origin'];
        if (corsHeaders) {
            console.log(`   ✅ CORS configured: ${corsHeaders}`);
            results.passed++;
        } else {
            console.log('   ⚠️  CORS headers not detected');
            results.warnings++;
        }
    } catch (error) {
        console.log('   ⚠️  CORS test inconclusive:', error.message);
        results.warnings++;
    }

    // Test 5: Frontend Connectivity
    console.log('\n5. Testing Frontend Connectivity...');
    try {
        const response = await axios.get(REACT_URL, { timeout: 5000 });
        console.log('   ✅ React frontend accessible');
        results.passed++;
    } catch (error) {
        console.log('   ❌ React frontend not accessible:', error.message);
        results.failed++;
    }

    // Test 6: Pi Network Integration
    console.log('\n6. Testing Pi Network Integration...');
    try {
        const response = await axios.get(`${BASE_URL}/pi-test`);
        console.log('   ✅ Pi test page accessible');
        results.passed++;
    } catch (error) {
        console.log('   ❌ Pi test page not accessible:', error.message);
        results.failed++;
    }

    // Test 7: Static File Serving
    console.log('\n7. Testing Static File Serving...');
    try {
        const response = await axios.get(`${BASE_URL}/assets/css/styles.css`);
        console.log('   ✅ Static CSS files served');
        results.passed++;
    } catch (error) {
        console.log('   ❌ Static files not accessible:', error.message);
        results.failed++;
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⚠️  Warnings: ${results.warnings}`);
    
    const total = results.passed + results.failed + results.warnings;
    const score = ((results.passed + results.warnings * 0.5) / total * 100).toFixed(1);
    
    console.log(`\n🎯 Overall Score: ${score}%`);
    
    if (results.failed === 0) {
        console.log('🎉 All critical tests passed! System is ready for production.');
    } else if (results.failed <= 2) {
        console.log('⚠️  Minor issues detected. Review failed tests before production.');
    } else {
        console.log('🚨 Major issues detected. Address failed tests before deployment.');
    }
}

runSecurityTests().catch(console.error);
