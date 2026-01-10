# 🔧 TensorFlow Installation Fix Instructions

## Problem
TensorFlow installation is corrupted or incomplete. Error: `No module named 'tensorflow.python.trackable'`

## Solution Steps

### Option 1: Reinstall TensorFlow (Recommended)

1. **Open PowerShell/Command Prompt as Administrator** (Right-click → Run as Administrator)

2. **Uninstall existing TensorFlow packages:**
   ```powershell
   pip uninstall tensorflow tensorflow-intel keras -y
   ```

3. **Reinstall TensorFlow:**
   ```powershell
   pip install tensorflow==2.18.0
   ```

4. **Verify installation:**
   ```powershell
   python -c "import tensorflow as tf; print('TensorFlow installed successfully!')"
   ```

5. **Restart the backend server**

### Option 2: Install with --user flag (If you don't have admin rights)

```powershell
pip uninstall tensorflow tensorflow-intel keras -y
pip install --user tensorflow==2.18.0
```

### Option 3: Use Virtual Environment (Best Practice)

```powershell
# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install TensorFlow
pip install tensorflow==2.18.0

# Install other requirements
pip install -r requirements.txt
```

## After Installation

Once TensorFlow is properly installed, the backend will automatically detect it and enable model training.

## Verification

Run this command to verify:
```powershell
cd backend
python -c "import sys; sys.path.insert(0, '.'); from ml.models import TF_AVAILABLE; print(f'TensorFlow Available: {TF_AVAILABLE}')"
```

You should see: `TensorFlow Available: True`

## Note

The backend code has been updated to handle TensorFlow import errors gracefully. Once TensorFlow is properly installed, model training will work automatically.



