#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Masrofi App
Tests all available API endpoints and identifies missing functionality
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Backend URL from frontend .env
BACKEND_URL = "http://45.9.191.190/masrofi-api/api"

class MasrofiBackendTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.critical_issues = []
        self.minor_issues = []
        
    def log_result(self, test_name, success, message, is_critical=False):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if not success:
            if is_critical:
                self.critical_issues.append(f"❌ {test_name}: {message}")
            else:
                self.minor_issues.append(f"⚠️ {test_name}: {message}")
        else:
            print(f"✅ {test_name}: {message}")
    
    def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        try:
            response = requests.get(f"{self.backend_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Backend Connectivity", True, f"Connected successfully. Response: {data}")
                return True
            else:
                self.log_result("Backend Connectivity", False, f"HTTP {response.status_code}: {response.text}", True)
                return False
        except requests.exceptions.RequestException as e:
            self.log_result("Backend Connectivity", False, f"Connection failed: {str(e)}", True)
            return False
    
    def test_ai_analysis_endpoint(self):
        """Test AI analysis functionality"""
        try:
            # Prepare realistic test data in Arabic
            test_data = {
                "financial_data": {
                    "expenses": [
                        {"amount": 150, "category": "طعام", "description": "غداء", "date": "2024-01-15"},
                        {"amount": 50, "category": "مواصلات", "description": "تاكسي", "date": "2024-01-15"},
                        {"amount": 200, "category": "تسوق", "description": "ملابس", "date": "2024-01-14"}
                    ],
                    "incomes": [
                        {"amount": 3000, "source": "راتب", "date": "2024-01-01"}
                    ],
                    "debts": [
                        {"totalAmount": 500, "status": "نشط", "description": "قرض شخصي"}
                    ],
                    "budgets": [],
                    "savings_goals": [
                        {"currentAmount": 1000, "targetAmount": 5000, "name": "سيارة جديدة"}
                    ],
                    "recurring_expenses": [
                        {"amount": 300, "isActive": True, "description": "إيجار"}
                    ],
                    "currency": "TRY"
                },
                "analysis_type": "full"
            }
            
            response = requests.post(
                f"{self.backend_url}/ai/analyze",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["analysis", "insights", "recommendations"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("AI Analysis", False, f"Missing fields: {missing_fields}", True)
                else:
                    self.log_result("AI Analysis", True, f"Analysis generated successfully. Insights: {len(data.get('insights', []))}, Recommendations: {len(data.get('recommendations', []))}")
                    return True
            else:
                self.log_result("AI Analysis", False, f"HTTP {response.status_code}: {response.text}", True)
                
        except requests.exceptions.RequestException as e:
            self.log_result("AI Analysis", False, f"Request failed: {str(e)}", True)
        except Exception as e:
            self.log_result("AI Analysis", False, f"Unexpected error: {str(e)}", True)
        
        return False
    
    def test_ai_tips_endpoint(self):
        """Test AI tips functionality"""
        try:
            test_data = {
                "financial_data": {
                    "expenses": [{"amount": 100, "category": "طعام"}],
                    "incomes": [{"amount": 2000, "source": "راتب"}],
                    "debts": [],
                    "budgets": [],
                    "savings_goals": [],
                    "recurring_expenses": [],
                    "currency": "TRY"
                }
            }
            
            response = requests.post(
                f"{self.backend_url}/ai/tips",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if "tips" in data and isinstance(data["tips"], list):
                    self.log_result("AI Tips", True, f"Tips generated: {len(data['tips'])} tips received")
                    return True
                else:
                    self.log_result("AI Tips", False, "Invalid response format - missing tips array", True)
            else:
                self.log_result("AI Tips", False, f"HTTP {response.status_code}: {response.text}", True)
                
        except Exception as e:
            self.log_result("AI Tips", False, f"Error: {str(e)}", True)
        
        return False
    
    def test_status_endpoints(self):
        """Test status check endpoints"""
        try:
            # Test POST /status
            test_status = {
                "client_name": "test_masrofi_client"
            }
            
            response = requests.post(
                f"{self.backend_url}/status",
                json=test_status,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "client_name" in data:
                    self.log_result("Status Creation", True, f"Status created with ID: {data['id']}")
                    
                    # Test GET /status
                    get_response = requests.get(f"{self.backend_url}/status", timeout=10)
                    if get_response.status_code == 200:
                        status_list = get_response.json()
                        self.log_result("Status Retrieval", True, f"Retrieved {len(status_list)} status records")
                        return True
                    else:
                        self.log_result("Status Retrieval", False, f"GET failed: HTTP {get_response.status_code}", True)
                else:
                    self.log_result("Status Creation", False, "Invalid response format", True)
            else:
                self.log_result("Status Creation", False, f"HTTP {response.status_code}: {response.text}", True)
                
        except Exception as e:
            self.log_result("Status Endpoints", False, f"Error: {str(e)}", True)
        
        return False
    
    def test_missing_core_endpoints(self):
        """Test for missing core functionality endpoints"""
        core_endpoints = [
            "/expenses",
            "/income", 
            "/debts",
            "/budgets",
            "/savings",
            "/transactions",
            "/categories",
            "/currencies"
        ]
        
        missing_endpoints = []
        
        for endpoint in core_endpoints:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=5)
                if response.status_code == 404:
                    missing_endpoints.append(endpoint)
            except:
                missing_endpoints.append(endpoint)
        
        if missing_endpoints:
            self.log_result("Core Endpoints Check", False, 
                          f"CRITICAL: Missing core endpoints: {', '.join(missing_endpoints)}. "
                          f"The app cannot function without these endpoints for data management.", True)
            return False
        else:
            self.log_result("Core Endpoints Check", True, "All core endpoints are available")
            return True
    
    def test_database_connection(self):
        """Test database connectivity through API"""
        try:
            # Try to create and retrieve a status to test DB
            test_client = f"db_test_{uuid.uuid4().hex[:8]}"
            
            # Create
            create_response = requests.post(
                f"{self.backend_url}/status",
                json={"client_name": test_client},
                timeout=10
            )
            
            if create_response.status_code != 200:
                self.log_result("Database Connection", False, "Cannot create records in database", True)
                return False
            
            # Retrieve
            get_response = requests.get(f"{self.backend_url}/status", timeout=10)
            if get_response.status_code == 200:
                records = get_response.json()
                found = any(r.get("client_name") == test_client for r in records)
                if found:
                    self.log_result("Database Connection", True, "Database read/write operations working")
                    return True
                else:
                    self.log_result("Database Connection", False, "Data not persisting in database", True)
            else:
                self.log_result("Database Connection", False, "Cannot retrieve records from database", True)
                
        except Exception as e:
            self.log_result("Database Connection", False, f"Database test failed: {str(e)}", True)
        
        return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Masrofi Backend Testing...")
        print(f"🔗 Testing Backend URL: {self.backend_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_backend_connectivity():
            print("\n❌ CRITICAL: Cannot connect to backend. Stopping tests.")
            return self.generate_report()
        
        # Test available endpoints
        self.test_ai_analysis_endpoint()
        self.test_ai_tips_endpoint() 
        self.test_status_endpoints()
        self.test_database_connection()
        
        # Check for missing core functionality
        self.test_missing_core_endpoints()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 MASROFI BACKEND TEST REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"📈 Test Summary: {passed_tests}/{total_tests} passed ({failed_tests} failed)")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES ({len(self.critical_issues)}):")
            for issue in self.critical_issues:
                print(f"  {issue}")
        
        if self.minor_issues:
            print(f"\n⚠️ Minor Issues ({len(self.minor_issues)}):")
            for issue in self.minor_issues:
                print(f"  {issue}")
        
        # Overall assessment
        if len(self.critical_issues) == 0:
            print(f"\n✅ BACKEND STATUS: WORKING")
            print("All critical functionality is operational.")
        else:
            print(f"\n❌ BACKEND STATUS: CRITICAL ISSUES FOUND")
            print("Backend has critical issues that prevent proper app functionality.")
        
        return {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "critical_issues": self.critical_issues,
            "minor_issues": self.minor_issues,
            "overall_status": "WORKING" if len(self.critical_issues) == 0 else "FAILING"
        }

if __name__ == "__main__":
    tester = MasrofiBackendTester()
    result = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if result["overall_status"] == "WORKING" else 1)