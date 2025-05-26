#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for TunmzyTech Pi Network Integration
Tests all API endpoints, payment flows, and database operations
"""

import requests
import sys
import json
from datetime import datetime
import uuid
import time

class TunmzyTechAPITester:
    def __init__(self, base_url="https://7ba8b434-0bee-41f8-b731-53e217edc967.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
                print(f"   Response Data: {json.dumps(response_data, indent=2)}")
            except:
                response_data = response.text
                print(f"   Response Text: {response_data}")

            if success:
                self.log_test(name, True)
                return True, response_data
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, response_data

        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            print(f"   Error: {error_msg}")
            self.log_test(name, False, error_msg)
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n" + "="*60)
        print("TESTING BASIC CONNECTIVITY")
        print("="*60)
        
        # Test root endpoint
        success, response = self.run_test(
            "API Root Endpoint",
            "GET",
            "",
            200
        )
        
        if success and isinstance(response, dict):
            if "message" in response:
                print(f"   API Message: {response['message']}")
            return True
        return False

    def test_status_endpoints(self):
        """Test status check endpoints"""
        print("\n" + "="*60)
        print("TESTING STATUS ENDPOINTS")
        print("="*60)
        
        # Test creating status check
        test_client_name = f"test_client_{int(time.time())}"
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": test_client_name}
        )
        
        # Test getting status checks
        success2, response2 = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        
        return success and success2

    def test_pi_auth_endpoint(self):
        """Test Pi Network authentication endpoint"""
        print("\n" + "="*60)
        print("TESTING PI NETWORK AUTHENTICATION")
        print("="*60)
        
        # Test with invalid token (expected to fail)
        success, response = self.run_test(
            "Pi Auth with Invalid Token",
            "POST",
            "auth/verify",
            401,  # Expected to fail
            data={"accessToken": "invalid_token_12345"}
        )
        
        # This should fail as expected
        if not success:
            print("   ✅ Authentication correctly rejected invalid token")
            self.log_test("Pi Auth Rejection (Expected)", True)
            return True
        else:
            self.log_test("Pi Auth Rejection (Expected)", False, "Should have rejected invalid token")
            return False

    def test_payment_endpoints(self):
        """Test payment-related endpoints"""
        print("\n" + "="*60)
        print("TESTING PAYMENT ENDPOINTS")
        print("="*60)
        
        # Generate unique payment ID
        payment_id = f"test_payment_{uuid.uuid4().hex[:8]}"
        test_amount = 10.0
        
        # Test payment approval
        success1, response1 = self.run_test(
            "Payment Approval",
            "POST",
            "payments/approve",
            200,
            data={
                "paymentId": payment_id,
                "amount": test_amount
            }
        )
        
        # Test payment completion
        test_txid = f"test_tx_{uuid.uuid4().hex[:8]}"
        success2, response2 = self.run_test(
            "Payment Completion",
            "POST",
            "payments/complete",
            200,
            data={
                "paymentId": payment_id,
                "txid": test_txid
            }
        )
        
        # Test getting all payments
        success3, response3 = self.run_test(
            "Get All Payments",
            "GET",
            "payments",
            200
        )
        
        # Test getting specific payment
        success4, response4 = self.run_test(
            "Get Specific Payment",
            "GET",
            f"payments/{payment_id}",
            200
        )
        
        return success1 and success2 and success3 and success4

    def test_payment_flow_integration(self):
        """Test complete payment flow integration"""
        print("\n" + "="*60)
        print("TESTING COMPLETE PAYMENT FLOW")
        print("="*60)
        
        # Generate unique payment data
        payment_id = f"flow_test_{uuid.uuid4().hex[:8]}"
        test_amount = 15.0
        test_txid = f"flow_tx_{uuid.uuid4().hex[:8]}"
        
        print(f"   Testing payment flow with ID: {payment_id}")
        
        # Step 1: Approve payment
        print("\n   Step 1: Approving payment...")
        success1, response1 = self.run_test(
            "Flow Step 1 - Payment Approval",
            "POST",
            "payments/approve",
            200,
            data={
                "paymentId": payment_id,
                "amount": test_amount
            }
        )
        
        if not success1:
            return False
        
        # Step 2: Complete payment
        print("\n   Step 2: Completing payment...")
        success2, response2 = self.run_test(
            "Flow Step 2 - Payment Completion",
            "POST",
            "payments/complete",
            200,
            data={
                "paymentId": payment_id,
                "txid": test_txid
            }
        )
        
        if not success2:
            return False
        
        # Step 3: Verify payment status
        print("\n   Step 3: Verifying payment status...")
        success3, response3 = self.run_test(
            "Flow Step 3 - Payment Verification",
            "GET",
            f"payments/{payment_id}",
            200
        )
        
        if success3 and isinstance(response3, dict):
            if response3.get("status") == "completed":
                print("   ✅ Payment flow completed successfully")
                self.log_test("Complete Payment Flow", True)
                return True
            else:
                self.log_test("Complete Payment Flow", False, f"Expected status 'completed', got '{response3.get('status')}'")
                return False
        
        return False

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n" + "="*60)
        print("TESTING ERROR HANDLING")
        print("="*60)
        
        # Test non-existent payment
        success1, response1 = self.run_test(
            "Get Non-existent Payment",
            "GET",
            "payments/nonexistent_payment_id",
            404
        )
        
        # Test invalid payment completion (payment doesn't exist)
        success2, response2 = self.run_test(
            "Complete Non-existent Payment",
            "POST",
            "payments/complete",
            404,
            data={
                "paymentId": "nonexistent_payment",
                "txid": "test_tx"
            }
        )
        
        # Test invalid endpoint
        success3, response3 = self.run_test(
            "Invalid Endpoint",
            "GET",
            "invalid/endpoint",
            404
        )
        
        return success1 and success2 and success3

    def test_data_validation(self):
        """Test data validation"""
        print("\n" + "="*60)
        print("TESTING DATA VALIDATION")
        print("="*60)
        
        # Test payment approval with missing data
        success1, response1 = self.run_test(
            "Payment Approval Missing Data",
            "POST",
            "payments/approve",
            422,  # Validation error
            data={"paymentId": "test"}  # Missing amount
        )
        
        # Test payment completion with missing data
        success2, response2 = self.run_test(
            "Payment Completion Missing Data",
            "POST",
            "payments/complete",
            422,  # Validation error
            data={"paymentId": "test"}  # Missing txid
        )
        
        return success1 and success2

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting TunmzyTech Pi Network API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print(f"📡 API Endpoint: {self.api_url}")
        
        start_time = datetime.utcnow()
        
        # Run test suites
        connectivity_ok = self.test_basic_connectivity()
        status_ok = self.test_status_endpoints()
        auth_ok = self.test_pi_auth_endpoint()
        payments_ok = self.test_payment_endpoints()
        flow_ok = self.test_payment_flow_integration()
        error_ok = self.test_error_handling()
        validation_ok = self.test_data_validation()
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        
        # Test suite results
        print(f"\n📋 Test Suite Results:")
        print(f"   🔗 Connectivity: {'✅' if connectivity_ok else '❌'}")
        print(f"   📊 Status Endpoints: {'✅' if status_ok else '❌'}")
        print(f"   🔐 Pi Authentication: {'✅' if auth_ok else '❌'}")
        print(f"   💰 Payment Endpoints: {'✅' if payments_ok else '❌'}")
        print(f"   🔄 Payment Flow: {'✅' if flow_ok else '❌'}")
        print(f"   ⚠️  Error Handling: {'✅' if error_ok else '❌'}")
        print(f"   ✅ Data Validation: {'✅' if validation_ok else '❌'}")
        
        # Critical issues
        if not connectivity_ok:
            print("\n🚨 CRITICAL: Basic API connectivity failed!")
        if not payments_ok:
            print("\n🚨 CRITICAL: Payment endpoints failed!")
        if not flow_ok:
            print("\n🚨 CRITICAL: Payment flow integration failed!")
        
        # Overall result
        overall_success = self.tests_passed == self.tests_run
        if overall_success:
            print(f"\n🎉 ALL TESTS PASSED! API is working correctly.")
        else:
            print(f"\n⚠️  Some tests failed. Please review the issues above.")
        
        return 0 if overall_success else 1

def main():
    """Main test execution"""
    tester = TunmzyTechAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())