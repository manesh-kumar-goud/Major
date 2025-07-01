# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites
- GitHub account connected to your repository
- Vercel account (free tier available)
- RapidAPI Yahoo Finance API key

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your repository: `https://github.com/manesh-kumar-goud/Major.git`

### 2. Configure Environment Variables
In your Vercel project dashboard, go to Settings > Environment Variables and add:

```
RAPIDAPI_KEY=your_actual_rapidapi_key_here
```

### 3. Deploy
Click "Deploy" - Vercel will automatically:
- Build the React frontend
- Deploy the Flask API as serverless functions
- Configure routing

### 4. Access Your App
Your app will be available at: `https://your-project-name.vercel.app`

## 📁 Project Structure (Vercel-Optimized)

```
Major Project/
├── api/                    # Serverless functions
│   ├── index.py           # Main API endpoints
│   └── requirements.txt   # Python dependencies
├── frontend/              # React application
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js     # API configuration
│   │   └── pages/         # React components
│   ├── package.json
│   └── build/             # Built React app
├── vercel.json            # Vercel configuration
├── package.json           # Root package.json
└── .vercelignore         # Files to ignore
```

## 🔧 Configuration Files

### vercel.json
- Configures build process
- Routes API calls to serverless functions
- Serves React static files

### API Configuration
- Development: Uses `http://localhost:5000/api`
- Production: Uses relative path `/api` (Vercel routing)

## 🌟 Features Ready for Production

### Frontend (React)
✅ Responsive design with Tailwind CSS
✅ Interactive charts with Recharts
✅ Animations with Framer Motion
✅ Environment-aware API configuration

### Backend (Serverless Functions)
✅ Flask API endpoints
✅ RapidAPI Yahoo Finance integration
✅ Mock data fallback for demos
✅ CORS configured for cross-origin requests

### API Endpoints Available
- `GET /api/health` - Health check
- `GET /api/stock-history` - Historical stock data
- `GET /api/popular-stocks` - Popular stocks list
- `POST /api/predict` - Stock predictions
- `POST /api/compare-models` - Model comparison
- `GET /api/search` - Stock search
- `GET /api/metrics` - System metrics

## 🛠️ Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install

# Start development
npm run dev  # Starts frontend on port 3000

# For backend testing (if needed)
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py  # Starts on port 5000
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (requires 18+)
   - Ensure all dependencies are installed
   - Verify vercel.json syntax

2. **API Not Working**
   - Verify RAPIDAPI_KEY environment variable
   - Check serverless function logs in Vercel dashboard
   - Ensure CORS is properly configured

3. **Frontend Not Loading**
   - Check if build directory exists
   - Verify routing in vercel.json
   - Check browser console for errors

### Vercel Logs
Access logs in your Vercel dashboard:
- Functions tab: View serverless function logs
- Runtime Logs: See build and runtime errors

## 🔄 Continuous Deployment

Once connected to GitHub:
- Push to main branch triggers automatic deployment
- Preview deployments for pull requests
- Rollback capabilities in Vercel dashboard

## 📊 Performance Optimizations

### Implemented
- Static file serving from CDN
- Serverless functions for API
- Code splitting in React
- Lazy loading components
- Optimized images and assets

### Monitoring
- Built-in Vercel Analytics
- Performance metrics dashboard
- Function execution time tracking

## 🔐 Security

- Environment variables for sensitive data
- CORS properly configured
- No sensitive data in client-side code
- Rate limiting through RapidAPI

## 💡 Next Steps After Deployment

1. **Custom Domain** (Optional)
   - Add custom domain in Vercel dashboard
   - Configure DNS settings

2. **Environment Management**
   - Set up staging environment
   - Configure preview deployments

3. **Monitoring**
   - Set up alerts for errors
   - Monitor API usage and costs

4. **Scaling**
   - Monitor function execution limits
   - Upgrade Vercel plan if needed

## 📞 Support

If you encounter issues:
1. Check Vercel documentation
2. Review function logs in dashboard
3. Test API endpoints individually
4. Verify environment variables are set

---

**🎉 Your AI Stock Prediction app is now ready for the world!**

Access it at: `https://your-project-name.vercel.app` 