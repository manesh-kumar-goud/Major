"""
Complete Backend Test Script
Tests all imports and basic functionality line by line
"""
import sys
import traceback

def test_import(module_name, import_statement):
    """Test an import statement"""
    try:
        exec(import_statement)
        print(f"✅ {module_name}: OK")
        return True
    except Exception as e:
        print(f"❌ {module_name}: FAILED - {e}")
        traceback.print_exc()
        return False

print("=" * 60)
print("BACKEND COMPLETE TEST - Line by Line Check")
print("=" * 60)

results = []

# Test 1: Core Configuration
print("\n1. Testing Core Configuration...")
results.append(test_import("Core Config", "from core.config import settings"))
results.append(test_import("Settings", "from core.config import get_settings"))

# Test 2: Logging
print("\n2. Testing Logging...")
results.append(test_import("Logging", "from core.logging import setup_logging"))

# Test 3: Database/Cache
print("\n3. Testing Database/Cache...")
results.append(test_import("Database", "from core.database import init_cache, get_cache"))

# Test 4: Security
print("\n4. Testing Security...")
results.append(test_import("Security", "from core.security import verify_password, get_password_hash, create_access_token"))

# Test 5: ML Models
print("\n5. Testing ML Models...")
results.append(test_import("ML Models", "from ml.models import LSTMModel, RNNModel, BaseModel"))
results.append(test_import("ML Metrics", "from ml.metrics import calculate_all_metrics, mape, smape, mase"))

# Test 6: ML Utils
print("\n6. Testing ML Utils...")
results.append(test_import("ML Utils", "from ml.utils import preprocess_data, create_sequences, inverse_transform"))

# Test 7: Services
print("\n7. Testing Services...")
results.append(test_import("Prediction Service", "from services.prediction_service import PredictionService"))
results.append(test_import("Stock Service", "from services.stock_service import StockService"))
results.append(test_import("API Client", "from services.api_client import YahooFinanceAPI"))

# Test 8: API Routes
print("\n8. Testing API Routes...")
results.append(test_import("Health Route", "from api.routes import health"))
results.append(test_import("Auth Route", "from api.routes import auth"))
results.append(test_import("Stocks Route", "from api.routes import stocks"))
results.append(test_import("Predictions Route", "from api.routes import predictions"))
results.append(test_import("Benchmarks Route", "from api.routes import benchmarks"))

# Test 9: Main App
print("\n9. Testing Main App...")
results.append(test_import("Main App", "import app"))

# Test 10: Model Initialization
print("\n10. Testing Model Initialization...")
try:
    from ml.models import LSTMModel, RNNModel
    lstm = LSTMModel(units=128)
    rnn = RNNModel(units=128)
    print("✅ Model Initialization: OK")
    results.append(True)
except Exception as e:
    print(f"❌ Model Initialization: FAILED - {e}")
    results.append(False)

# Test 11: Service Initialization
print("\n11. Testing Service Initialization...")
try:
    from services.prediction_service import PredictionService
    service = PredictionService()
    print("✅ Service Initialization: OK")
    results.append(True)
except Exception as e:
    print(f"❌ Service Initialization: FAILED - {e}")
    traceback.print_exc()
    results.append(False)

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
passed = sum(results)
total = len(results)
print(f"Passed: {passed}/{total}")
print(f"Failed: {total - passed}/{total}")
print(f"Success Rate: {(passed/total)*100:.1f}%")

if passed == total:
    print("\n✅ ALL TESTS PASSED - Backend is ready!")
else:
    print(f"\n⚠️  {total - passed} test(s) failed - Check errors above")

print("=" * 60)





