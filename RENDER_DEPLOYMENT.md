# 🚀 Render Deployment Guide

## Backend Deployment on Render

### Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- RapidAPI Yahoo Finance subscription

### Step 1: Prepare Your Repository

1. **Ensure your backend is in the `Major/backend/` directory**
2. **Verify these files exist:**
   - `requirements.txt`
   - `wsgi.py`
   - `app.py`
   - `Dockerfile` (optional)

### Step 2: Deploy on Render

#### Option A: Using Render Dashboard

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   ```
   Name: stock-prediction-api
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn wsgi:app
   Root Directory: Major/backend
   ```

5. **Set Environment Variables:**
   ```
   FLASK_ENV=production
   FLASK_DEBUG=false
   RAPIDAPI_KEY=your_rapidapi_key_here
   RAPIDAPI_HOST=yahoo-finance15.p.rapidapi.com
   ```

6. **Click "Create Web Service"**

#### Option B: Using render.yaml (Recommended)

1. **Push your code to GitHub**
2. **Go to Render Dashboard**
3. **Click "New +" → "Blueprint"**
4. **Connect your repository**
5. **Render will automatically detect `render.yaml` and deploy**

### Step 3: Get Your API URL

After deployment, Render will provide you with a URL like:
```
https://your-app-name.onrender.com
```

Your API endpoints will be available at:
```
https://your-app-name.onrender.com/api/health
https://your-app-name.onrender.com/api/predict
https://your-app-name.onrender.com/api/stock-history
```

### Step 4: Test Your Deployment

Test your API endpoints:

```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# Get stock history
curl "https://your-app-name.onrender.com/api/stock-history?ticker=AAPL&period=1y"

# Make prediction
curl -X POST https://your-app-name.onrender.com/api/predict \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","model":"LSTM","period":"1y","prediction_days":30}'
```

### Step 5: Update Frontend Configuration

Update your frontend's API configuration with the Render URL:

```javascript
// In frontend/src/config/api.js
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://your-app-name.onrender.com/api';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};
```

### Troubleshooting

#### Common Issues:

1. **Build Fails:**
   - Check `requirements.txt` for correct dependencies
   - Ensure Python version compatibility

2. **Runtime Errors:**
   - Check Render logs in the dashboard
   - Verify environment variables are set correctly

3. **API Timeouts:**
   - Render free tier has cold starts
   - Consider upgrading to paid plan for better performance

4. **CORS Issues:**
   - Ensure CORS is properly configured in `app.py`
   - Add your frontend domain to allowed origins

#### Performance Tips:

1. **Use Render's paid plans** for better performance
2. **Enable auto-scaling** for high traffic
3. **Set up health checks** to monitor your service
4. **Use environment variables** for sensitive data

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `FLASK_ENV` | Flask environment | Yes |
| `FLASK_DEBUG` | Debug mode | Yes |
| `RAPIDAPI_KEY` | Your RapidAPI key | Yes |
| `RAPIDAPI_HOST` | RapidAPI host | Yes |
| `PORT` | Port number (auto-set by Render) | No |

### Monitoring

- **Logs:** Available in Render dashboard
- **Metrics:** Monitor response times and errors
- **Health Checks:** Set up automated health monitoring

### Cost

- **Free Tier:** $0/month (with limitations)
- **Paid Plans:** Starting at $7/month for better performance

---

**Next Step:** Deploy your frontend on Vercel using the Vercel deployment guide. 