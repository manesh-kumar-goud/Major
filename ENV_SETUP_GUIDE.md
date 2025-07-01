# 🚀 Environment Variables Auto-Setup Guide

## 🎯 Quick Setup (3 Steps)

### **Option 1: Automated Script (Recommended)**

```bash
# 1. Create your production environment file
npm run setup-env

# 2. Edit .env.production with your actual values
# Replace 'your_rapidapi_key_here' with your real API key

# 3. Auto-import to Vercel
npm run deploy-env
```

### **Option 2: Manual Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com) → Your Project → Settings
2. Click "Environment Variables"
3. Add only these (minimal setup):
   - `RAPIDAPI_KEY` = your_actual_api_key
   - `SECRET_KEY` = your_secret_key

## 📋 Environment Variables Explained

### **✅ REQUIRED (1 variable)**
```env
RAPIDAPI_KEY=your_rapidapi_key_here
```
- **Purpose:** Get real stock data from Yahoo Finance
- **Without it:** App uses mock data (still fully functional)
- **Get it:** [RapidAPI Yahoo Finance](https://rapidapi.com/yahoo-finance)

### **🛡️ RECOMMENDED (1 additional variable)**
```env
SECRET_KEY=your_strong_secret_key_here
```
- **Purpose:** Secure Flask sessions and API security
- **Generate:** Use a random 32+ character string
- **Example:** `sk_live_abc123def456ghi789...`

### **⚙️ OPTIONAL (Auto-configured)**
All these have smart defaults - only add if you need customization:

```env
API_REQUEST_TIMEOUT=30          # API timeout in seconds
API_MAX_RETRIES=3              # Number of API retries
CORS_ORIGINS=*                 # Allowed CORS origins
API_RATE_LIMIT=100             # Requests per minute limit
MODEL_CACHE_TTL=3600           # Model cache duration (1 hour)
DATA_CACHE_TTL=1800            # Data cache duration (30 min)
LOG_LEVEL=WARNING              # Logging level
```

## 🔧 Automated Import Scripts

### **Node.js Script (Cross-platform)**
```bash
node scripts/deploy-env.js
```

### **Bash Script (Linux/Mac)**
```bash
chmod +x scripts/vercel-env-import.sh
./scripts/vercel-env-import.sh
```

## 🎭 Demo Mode (Zero Variables)

**Want to deploy immediately?** Just deploy without any environment variables!

✅ **Benefits:**
- Instant deployment
- All features work with mock data
- Perfect for demonstrations
- No API keys needed

```bash
# Deploy without any environment variables
vercel --prod
```

## 🔄 Update Environment Variables

### **Add New Variables:**
```bash
# Using Vercel CLI
vercel env add VARIABLE_NAME production

# Using script (add to .env.production first)
npm run deploy-env
```

### **Remove Variables:**
```bash
vercel env rm VARIABLE_NAME production
```

### **List All Variables:**
```bash
vercel env ls
```

## 🚨 Security Best Practices

### **✅ DO:**
- Keep `.env.production` in `.gitignore`
- Use strong, unique secret keys
- Rotate API keys regularly
- Use environment-specific values

### **❌ DON'T:**
- Commit `.env` files to git
- Share API keys in code or messages
- Use default/weak secret keys
- Hardcode secrets in source code

## 🛠️ Troubleshooting

### **Script Fails to Import:**
```bash
# 1. Check if Vercel CLI is installed
vercel --version

# 2. Login to Vercel
vercel login

# 3. Verify project exists
vercel projects ls

# 4. Check .env.production format
cat .env.production
```

### **Variables Not Working:**
1. **Check Vercel dashboard** - are variables there?
2. **Redeploy** - changes need a new deployment
3. **Check variable names** - exact spelling matters
4. **Environment scope** - set for "production"

### **API Key Issues:**
- Verify key is active on RapidAPI
- Check quotas and usage limits
- Ensure key has correct permissions

## 🎉 Success Checklist

- ✅ Environment variables imported to Vercel
- ✅ App deployed successfully
- ✅ Real stock data loading (if using RAPIDAPI_KEY)
- ✅ No errors in Vercel function logs
- ✅ All features working on live site

## 💡 Pro Tips

1. **Start with mock data** - deploy first, add real data later
2. **Use minimal setup** - only add variables you actually need
3. **Test locally** - create `.env` file for local development
4. **Monitor usage** - keep track of API quotas and costs
5. **Version control** - document which variables are needed

---

**🚀 Your AI Stock Prediction app is now ready for production!**

Need help? Check the logs in your Vercel dashboard or run `vercel logs` for debugging. 