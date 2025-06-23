# 🚀 Stock Market Forecasting App - Setup Guide

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Python 3.12** or higher ([Download here](https://www.python.org/downloads/))
- **Node.js 18** or higher ([Download here](https://nodejs.org/))
- **Git** ([Download here](https://git-scm.com/downloads))

## 🔄 Quick Setup (5 minutes)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "Major Project"
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Environment Configuration
```bash
# Go back to project root
cd ..

# Copy the example environment file
copy .env.example .env    # Windows
# OR
cp .env.example .env      # macOS/Linux

# Edit .env file with your API credentials (see below)
```

### Step 4: Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Step 5: Run the Application
```bash
# Terminal 1 - Start Backend (from backend directory)
cd backend
venv\Scripts\activate     # Windows
# OR
source venv/bin/activate  # macOS/Linux
python app.py

# Terminal 2 - Start Frontend (from frontend directory)
cd frontend
npm start
```

## 🔧 Detailed Setup Instructions

### 🐍 Backend Setup (Detailed)

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   
   **Windows (PowerShell):**
   ```powershell
   venv\Scripts\Activate.ps1
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   venv\Scripts\activate.bat
   ```
   
   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

3. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify Installation**
   ```bash
   python -c "import tensorflow; import flask; print('✅ All dependencies installed!')"
   ```

### ⚛️ Frontend Setup (Detailed)

1. **Install Node.js Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Verify Installation**
   ```bash
   npm list --depth=0
   ```

### 🔐 Environment Configuration

1. **Copy Environment Template**
   ```bash
   # From project root directory
   copy .env.example .env
   ```

2. **Edit .env File**
   
   Open `.env` file and update these values:
   ```env
   # RapidAPI Configuration
   RAPIDAPI_KEY=your-rapidapi-key-here
   SECRET_KEY=your-secret-key-here
   
   # Other settings can remain as default
   ```

3. **Get RapidAPI Key** (if you don't have one)
   - Go to [RapidAPI](https://rapidapi.com)
   - Sign up for free account
   - Subscribe to Yahoo Finance API
   - Copy your API key

4. **Generate Secret Key**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

## 🚀 Running the Application

### Method 1: Run Both Services Manually

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate    # Windows
# OR
source venv/bin/activate # macOS/Linux
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Method 2: Using Docker (Advanced)

If you have Docker installed:
```bash
docker-compose up --build
```

## 🌐 Access the Application

Once both services are running:

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔍 Troubleshooting

### Common Issues

**1. Python virtual environment activation fails**
```bash
# Try this instead:
python -m venv venv --upgrade-deps
venv\Scripts\python.exe -m pip install --upgrade pip
```

**2. "Module not found" errors**
```bash
# Make sure virtual environment is activated
# Reinstall dependencies:
pip install -r requirements.txt --force-reinstall
```

**3. Node.js dependency issues**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. API connection errors**
- Check if `.env` file exists and has correct API key
- Verify internet connection
- Check RapidAPI subscription status

**5. Port already in use**
```bash
# Find and kill process using port 5000
netstat -ano | findstr :5000    # Windows
lsof -ti:5000 | xargs kill -9   # macOS/Linux
```

### Environment-Specific Issues

**Windows Users:**
- Use PowerShell as administrator if you encounter permission issues
- If activation script fails, try: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**macOS Users:**
- Install Xcode command line tools: `xcode-select --install`
- If Python installation fails, use Homebrew: `brew install python`

**Linux Users:**
- Install python3-venv: `sudo apt-get install python3-venv`
- Install build essentials: `sudo apt-get install build-essential`

## 📊 Testing the Setup

1. **Test Backend**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status": "healthy", "timestamp": "..."}`

2. **Test API Integration**
   ```bash
   curl http://localhost:5000/api/popular-stocks
   ```
   Should return stock data

3. **Test Frontend**
   - Open http://localhost:3000
   - Navigate through different pages
   - Try the prediction functionality

## 📁 Project Structure

```
Major Project/
├── backend/
│   ├── venv/              # Python virtual environment
│   ├── app.py            # Main Flask application
│   ├── config.py         # Configuration management
│   ├── models.py         # ML models (LSTM/RNN)
│   ├── utils.py          # Utility functions
│   ├── api_client.py     # RapidAPI client
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/              # React source code
│   ├── public/           # Static files
│   ├── package.json      # Node.js dependencies
│   └── build/            # Production build (after npm run build)
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Environment template
├── docker-compose.yml    # Docker configuration
└── SETUP_GUIDE.md       # This file
```

## 🆘 Getting Help

If you encounter issues:

1. **Check Prerequisites**: Ensure Python 3.12+ and Node.js 18+ are installed
2. **Check Environment**: Verify `.env` file is configured correctly
3. **Check Logs**: Look at terminal output for error messages
4. **Check Network**: Ensure internet connection for API calls
5. **Check Ports**: Make sure ports 3000 and 5000 are available

## 🔄 Updates

To get the latest version:
```bash
git pull origin main
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

## 🎯 Features Available

- **📈 Stock Predictions**: LSTM and RNN model comparisons
- **📊 Real-time Data**: Live stock prices and market data
- **🔍 Stock Search**: Find and analyze any stock
- **👔 Insider Trades**: View recent insider trading activity
- **📱 Responsive UI**: Works on desktop and mobile
- **⚡ Fast API**: Optimized backend with caching

## 🔐 Security Notes

- Never commit your `.env` file to version control
- Keep your RapidAPI key private
- Use strong secret keys in production
- Regularly update dependencies

---

**🎉 Enjoy exploring the Stock Market Forecasting Application!** 