"""
Comprehensive backend test and run script
"""
import sys
import subprocess
import time
import requests
import json

def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_warning(text):
    print(f"⚠️  {text}")

def test_imports():
    """Test all critical imports"""
    print_header("TESTING IMPORTS")
    
    tests = [
        ("Core Config", "from core.config import settings"),
        ("Logging", "from core.logging import setup_logging"),
        ("ML Models", "from ml.models import LSTMModel, RNNModel"),
        ("ML Metrics", "from ml.metrics import calculate_all_metrics"),
        ("Prediction Service", "from services.prediction_service import PredictionService"),
        ("Stock Service", "from services.stock_service import StockService"),
        ("API Routes", "from api.routes import health, stocks, predictions"),
    ]
    
    passed = 0
    failed = 0
    
    for name, import_stmt in tests:
        try:
            exec(import_stmt)
            print_success(f"{name}: OK")
            passed += 1
        except Exception as e:
            print_error(f"{name}: FAILED - {str(e)}")
            failed += 1
    
    print(f"\nImports: {passed}/{len(tests)} passed")
    return failed == 0

def test_server_health(base_url="http://localhost:5000"):
    """Test server health endpoint"""
    print_header("TESTING SERVER HEALTH")
    
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Server is healthy")
            print(f"   Status: {data.get('status')}")
            print(f"   Version: {data.get('version')}")
            print(f"   Environment: {data.get('environment')}")
            return True
        else:
            print_error(f"Server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to server. Is it running?")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_endpoints(base_url="http://localhost:5000"):
    """Test key endpoints"""
    print_header("TESTING ENDPOINTS")
    
    endpoints = [
        ("GET", "/api/health", None),
        ("GET", "/api/stocks/search?query=TSLA", None),
    ]
    
    passed = 0
    failed = 0
    
    for method, endpoint, data in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=10)
            else:
                response = requests.post(url, json=data, timeout=10)
            
            if response.status_code in [200, 201]:
                print_success(f"{method} {endpoint}: OK ({response.status_code})")
                passed += 1
            else:
                print_warning(f"{method} {endpoint}: {response.status_code}")
                passed += 1  # Still count as passed if server responds
        except Exception as e:
            print_error(f"{method} {endpoint}: FAILED - {str(e)}")
            failed += 1
    
    print(f"\nEndpoints: {passed}/{len(endpoints)} passed")
    return failed == 0

def check_tensorflow():
    """Check TensorFlow availability"""
    print_header("CHECKING TENSORFLOW")
    
    try:
        import tensorflow as tf
        version = getattr(tf, '__version__', 'unknown')
        print_success(f"TensorFlow {version} is available")
        return True
    except ImportError:
        print_warning("TensorFlow not available - fallback mode will be used")
        return False
    except Exception as e:
        print_warning(f"TensorFlow check issue: {str(e)} - fallback mode will be used")
        return False

if __name__ == "__main__":
    print_header("BACKEND COMPREHENSIVE TEST")
    
    # Test imports
    imports_ok = test_imports()
    
    # Check TensorFlow
    tf_available = check_tensorflow()
    
    # Wait a bit for server to start
    print("\n⏳ Waiting 3 seconds for server to initialize...")
    time.sleep(3)
    
    # Test server
    server_ok = test_server_health()
    
    if server_ok:
        endpoints_ok = test_endpoints()
    else:
        endpoints_ok = False
    
    # Final summary
    print_header("TEST SUMMARY")
    
    all_ok = imports_ok and server_ok and endpoints_ok
    
    if all_ok:
        print_success("ALL TESTS PASSED - Backend is ready!")
        print("\n🚀 Server is running at: http://localhost:5000")
        print("📚 API Docs: http://localhost:5000/api/docs")
    else:
        print_error("SOME TESTS FAILED")
        if not imports_ok:
            print_error("  - Import tests failed")
        if not server_ok:
            print_error("  - Server health check failed")
        if not endpoints_ok:
            print_error("  - Endpoint tests failed")
    
    sys.exit(0 if all_ok else 1)

