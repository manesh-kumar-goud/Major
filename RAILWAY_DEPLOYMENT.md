# 🚀 Railway.app Deployment Guide - REAL AI Stock Prediction App

## 🌟 **What You'll Get:**
- ✅ **Real Yahoo Finance API** data
- ✅ **Live stock prices** & historical data
- ✅ **Actual LSTM/RNN** TensorFlow models
- ✅ **Real-time predictions** 
- ✅ **Full-stack deployment** on Railway.app

---

## 📋 **Prerequisites**
1. [Railway.app account](https://railway.app/) (Free tier available)
2. [GitHub account](https://github.com/)
3. Your RapidAPI key: `51930ec5damsh1a4a74844a2c3b3p10c74djsn64b7c88fd62e`

---

## 🔥 **STEP 1: Deploy Backend to Railway.app**

### 1.1 Connect Repository
1. Go to [Railway.app](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `manesh-kumar-goud/Major`
5. Railway will automatically detect the Dockerfile and deploy your backend

### 1.2 Configure Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```bash
# Required Variables
RAPIDAPI_KEY=51930ec5damsh1a4a74844a2c3b3p10c74djsn64b7c88fd62e
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-super-secret-key-here-change-this

# Optional Variables
CORS_ORIGINS=*
API_REQUEST_TIMEOUT=30
API_MAX_RETRIES=3
```

### 1.3 Deploy Backend
Railway will automatically:
- Detect the Dockerfile
- Install TensorFlow, Flask, numpy, pandas, scikit-learn
- Build and deploy your Flask API with LSTM/RNN models
- Provide a public URL like `https://your-app.railway.app`

---

## 🔥 **STEP 2: Deploy Frontend to Vercel**

### 2.1 Update Frontend Config
After Railway deployment, get your backend URL and update `frontend/src/config/api.js`:

```javascript
// Replace with your actual Railway app URL
return 'https://your-app.railway.app/api';
```

### 2.2 Deploy to Vercel
```bash
cd frontend
npm run build
npx vercel --prod
```

Set environment variable in Vercel:
```bash
REACT_APP_API_URL=https://your-app.railway.app/api
```

---

## 🔥 **STEP 3: Test Your Deployment**

### 3.1 Backend Health Check
Visit: `https://your-app.railway.app/api/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-02T12:00:00",
  "environment": "production"
}
```

### 3.2 Test Real API Endpoints
- **Popular Stocks**: `/api/popular-stocks`
- **Stock History**: `/api/stock-history?ticker=AAPL&period=1y`
- **AI Prediction**: `/api/predict` (POST)
- **Model Comparison**: `/api/compare-models` (POST)

---

## 🎯 **REAL FEATURES YOU'LL HAVE:**

### 🔴 **Yahoo Finance Integration**
```python
# Real API calls in backend/api_client.py
yahoo_api.get_stock_history('AAPL', '1y')
yahoo_api.get_stock_quote(['AAPL', 'GOOGL'])
```

### 🧠 **Real AI Models**
```python
# Actual TensorFlow LSTM in backend/models.py
model = Sequential([
    LSTM(50, return_sequences=False),
    Dense(1, activation='linear')
])
```

### 📊 **Real Predictions**
- Historical data training
- Future price predictions
- Model comparison (LSTM vs RNN)
- Performance metrics (RMSE, MAE, R²)

---

## 💰 **Railway.app Pricing**
- **Starter Plan**: $5/month
  - 512MB RAM, 1GB storage
  - Perfect for your app
- **Developer Plan**: $10/month
  - 1GB RAM, 5GB storage
  - Better performance

---

## 🔧 **Local Development**

### Backend (Terminal 1):
```bash
cd backend
pip install -r requirements.txt
export RAPIDAPI_KEY=51930ec5damsh1a4a74844a2c3b3p10c74djsn64b7c88fd62e
python app.py
```

### Frontend (Terminal 2):
```bash
cd frontend
npm install
npm start
```

---

## 🎉 **What Makes This REAL:**

| Feature | Mock Version | REAL Version ✅ |
|---------|-------------|-----------------|
| Stock Data | Random numbers | Yahoo Finance API |
| AI Models | Fake predictions | TensorFlow LSTM/RNN |
| Training | No training | Real historical training |
| Metrics | Random values | Actual RMSE, MAE, R² |
| Predictions | Static mock | Dynamic AI predictions |

---

## 🆘 **Troubleshooting**

### Backend Issues:
```bash
# Check Railway logs in dashboard
# Test locally
python backend/app.py
```

### Frontend Issues:
```bash
# Check environment variables
echo $REACT_APP_API_URL

# Test API connection
curl https://your-app.railway.app/api/health
```

---

## 📁 **Files Created for Railway Deployment:**
- ✅ `Dockerfile` - Docker configuration with TensorFlow
- ✅ `railway.toml` - Railway.app deployment settings
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ Updated API configurations for real data

---

## 🚀 **Deploy Now!**
1. **Push to GitHub** (already done ✅)
2. **Deploy backend** to Railway.app 
3. **Deploy frontend** to Vercel
4. **Update API URLs**
5. **Test everything**

**Your app will have REAL Yahoo Finance data and AI predictions!** 🎯 