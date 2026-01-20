import requests
import sys
import json
import base64
from datetime import datetime

class MarDeCortezAPITester:
    def __init__(self, base_url="https://marineprocurement.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.cliente_token = None
        self.proveedor_token = None
        self.cliente_user = None
        self.proveedor_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None
        self.created_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)
                if method == 'POST':
                    response = requests.post(url, headers=headers, files=files, data=data)
            elif method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_proveedor_registration(self):
        """Test proveedor registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        proveedor_data = {
            "email": f"proveedor_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Proveedor Test {timestamp}",
            "role": "proveedor",
            "company": "Test Marine Supply Co."
        }
        
        success, response = self.run_test(
            "Proveedor Registration",
            "POST",
            "auth/register",
            200,
            data=proveedor_data
        )
        
        if success and 'token' in response:
            self.proveedor_token = response['token']
            self.proveedor_user = response['user']
            print(f"   Proveedor ID: {self.proveedor_user['id']}")
            return True
        return False

    def test_cliente_registration(self):
        """Test cliente registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        cliente_data = {
            "email": f"cliente_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Cliente Test {timestamp}",
            "role": "cliente",
            "company": "Test Shipping Co."
        }
        
        success, response = self.run_test(
            "Cliente Registration",
            "POST",
            "auth/register",
            200,
            data=cliente_data
        )
        
        if success and 'token' in response:
            self.cliente_token = response['token']
            self.cliente_user = response['user']
            print(f"   Cliente ID: {self.cliente_user['id']}")
            return True
        return False

    def test_login(self):
        """Test login functionality"""
        if not self.proveedor_user:
            return False
            
        login_data = {
            "email": self.proveedor_user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        return success

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            token=self.proveedor_token
        )
        return success

    def test_create_product(self):
        """Test product creation"""
        product_data = {
            "name": "Aceite de Motor Marino",
            "description": "Aceite sintético para motores marinos de alta calidad",
            "category": "ferreteria",
            "price": 89.99,
            "sku": f"MAR-OIL-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data,
            token=self.proveedor_token
        )
        
        if success and 'id' in response:
            self.created_product_id = response['id']
            print(f"   Product ID: {self.created_product_id}")
            return True
        return False

    def test_get_products(self):
        """Test get products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200,
            token=self.proveedor_token
        )
        return success

    def test_update_product(self):
        """Test product update"""
        if not self.created_product_id:
            return False
            
        update_data = {
            "name": "Aceite de Motor Marino Premium",
            "description": "Aceite sintético premium para motores marinos",
            "category": "ferreteria",
            "price": 99.99,
            "sku": f"MAR-OIL-PREM-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Update Product",
            "PUT",
            f"products/{self.created_product_id}",
            200,
            data=update_data,
            token=self.proveedor_token
        )
        return success

    def test_create_order(self):
        """Test order creation"""
        if not self.created_product_id or not self.cliente_token:
            return False
            
        order_data = {
            "supplier_id": self.proveedor_user['id'],
            "products": [
                {
                    "product_id": self.created_product_id,
                    "product_name": "Aceite de Motor Marino Premium",
                    "quantity": 2,
                    "price": 99.99
                }
            ],
            "notes": "Entrega urgente para barco pesquero"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data,
            token=self.cliente_token
        )
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            print(f"   Order ID: {self.created_order_id}")
            print(f"   Order Number: {response.get('order_number')}")
            return True
        return False

    def test_get_orders_cliente(self):
        """Test get orders for cliente"""
        success, response = self.run_test(
            "Get Orders (Cliente)",
            "GET",
            "orders",
            200,
            token=self.cliente_token
        )
        return success

    def test_get_orders_proveedor(self):
        """Test get orders for proveedor"""
        success, response = self.run_test(
            "Get Orders (Proveedor)",
            "GET",
            "orders",
            200,
            token=self.proveedor_token
        )
        return success

    def test_update_order_status(self):
        """Test order status update"""
        if not self.created_order_id:
            return False
            
        status_data = {
            "status": "recibido",
            "assigned_to": "Juan Pérez - Supervisor"
        }
        
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"orders/{self.created_order_id}/status",
            200,
            data=status_data,
            token=self.proveedor_token
        )
        return success

    def test_upload_quotation(self):
        """Test quotation upload"""
        if not self.created_order_id:
            return False
            
        # Create a simple PDF content (base64 encoded)
        pdf_content = b"PDF test content for quotation"
        
        files = {
            'file': ('cotizacion.pdf', pdf_content, 'application/pdf')
        }
        data = {
            'amount': '199.98',
            'notes': 'Cotización para aceite marino premium'
        }
        
        success, response = self.run_test(
            "Upload Quotation",
            "POST",
            f"orders/{self.created_order_id}/quotation",
            200,
            data=data,
            token=self.proveedor_token,
            files=files
        )
        return success

    def test_get_quotations(self):
        """Test get quotations"""
        if not self.created_order_id:
            return False
            
        success, response = self.run_test(
            "Get Quotations",
            "GET",
            f"orders/{self.created_order_id}/quotations",
            200,
            token=self.cliente_token
        )
        return success

    def test_get_notifications(self):
        """Test get notifications"""
        success, response = self.run_test(
            "Get Notifications (Cliente)",
            "GET",
            "notifications",
            200,
            token=self.cliente_token
        )
        
        if success:
            success2, response2 = self.run_test(
                "Get Notifications (Proveedor)",
                "GET",
                "notifications",
                200,
                token=self.proveedor_token
            )
            return success2
        return False

    def test_delete_product(self):
        """Test product deletion"""
        if not self.created_product_id:
            return False
            
        success, response = self.run_test(
            "Delete Product",
            "DELETE",
            f"products/{self.created_product_id}",
            200,
            token=self.proveedor_token
        )
        return success

def main():
    print("🚢 Mar de Cortez E-Procurement API Testing")
    print("=" * 50)
    
    tester = MarDeCortezAPITester()
    
    # Test sequence
    tests = [
        ("Proveedor Registration", tester.test_proveedor_registration),
        ("Cliente Registration", tester.test_cliente_registration),
        ("Login", tester.test_login),
        ("Get Current User", tester.test_get_me),
        ("Create Product", tester.test_create_product),
        ("Get Products", tester.test_get_products),
        ("Update Product", tester.test_update_product),
        ("Create Order", tester.test_create_order),
        ("Get Orders (Cliente)", tester.test_get_orders_cliente),
        ("Get Orders (Proveedor)", tester.test_get_orders_proveedor),
        ("Update Order Status", tester.test_update_order_status),
        ("Upload Quotation", tester.test_upload_quotation),
        ("Get Quotations", tester.test_get_quotations),
        ("Get Notifications", tester.test_get_notifications),
        ("Delete Product", tester.test_delete_product),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"  - {test}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())