# 🔧 TensorFlow Clean Installation Guide

## Current Issue
TensorFlow installation is incomplete/corrupted. The module imports but Keras components are missing.

## ✅ Solution: Clean Reinstall

### Step 1: Open PowerShell as Administrator
1. Press `Windows + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted

### Step 2: Navigate to Project Directory
```powershell
cd C:\Users\91868\OneDrive\Desktop\Major\backend
```

### Step 3: Uninstall All TensorFlow Packages
```powershell
pip uninstall tensorflow tensorflow-intel keras tensorboard -y
```

### Step 4: Clean Install TensorFlow
```powershell
pip install tensorflow==2.18.0
```

### Step 5: Verify Installation
```powershell
python -c "import tensorflow as tf; from tensorflow.keras.models import Sequential; print('✅ Success!')"
```

## Alternative: Use Virtual Environment (Recommended)

### Step 1: Create Virtual Environment
```powershell
cd C:\Users\91868\OneDrive\Desktop\Major\backend
python -m venv venv
```

### Step 2: Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

### Step 3: Install TensorFlow
```powershell
pip install tensorflow==2.18.0
pip install -r requirements.txt
```

### Step 4: Verify
```powershell
python -c "import tensorflow as tf; from tensorflow.keras.models import Sequential; print('✅ Success!')"
```

## After Installation

1. **Restart the backend server**
2. **Test model training** by making a prediction
3. **Check logs** - you should see "✅ TensorFlow and Keras imported successfully"

## Troubleshooting

If you still get errors:
1. Make sure you're using Python 3.10-3.12 (TensorFlow 2.18.0 supports these)
2. Try: `pip install --upgrade pip` first
3. Check: `python --version` (should be 3.10, 3.11, or 3.12)

## Note

The backend code has been updated to handle TensorFlow imports. Once TensorFlow is properly installed, everything will work automatically.



