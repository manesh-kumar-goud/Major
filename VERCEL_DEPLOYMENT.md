# 🚀 Vercel Deployment Guide

## Frontend Deployment on Vercel

### Prerequisites
- GitHub repository with your code
- Vercel account (free tier available)
- Backend deployed on Render (or other platform)

### Step 1: Prepare Your Repository

1. **Ensure your frontend is in the `Major/frontend/` directory**
2. **Verify these files exist:**
   - `package.json`
   - `vercel.json`
   - `src/config/api.js`

### Step 2: Deploy on Vercel

#### Option A: Using Vercel Dashboard

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**

   ```
   Framework Preset: Create React App
   Root Directory: Major/frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **Set Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-render-app.onrender.com/api
   ```

6. **Click "Deploy"**

#### Option B: Using Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd Major/frontend
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts and set environment variables**

### Step 3: Configure Environment Variables

In your Vercel dashboard, set these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-render-app.onrender.com/api` | Your Render backend URL |

### Step 4: Update API Configuration

Make sure your `src/config/api.js` is configured correctly:

```javascript
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://your-render-app.onrender.com/api';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};
```

### Step 5: Test Your Deployment

After deployment, Vercel will provide you with URLs like:
```
https://your-app-name.vercel.app
https://your-app-name-git-main-your-username.vercel.app
```

Test your application:
1. **Visit the deployed URL**
2. **Test the prediction feature**
3. **Verify API calls work correctly**

### Step 6: Custom Domain (Optional)

1. **Go to your Vercel project settings**
2. **Click "Domains"**
3. **Add your custom domain**
4. **Configure DNS settings**

### Troubleshooting

#### Common Issues:

1. **Build Fails:**
   - Check `package.json` for correct dependencies
   - Ensure all imports are correct
   - Check for TypeScript errors

2. **API Calls Fail:**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check CORS configuration on backend
   - Ensure backend is deployed and running

3. **Environment Variables Not Working:**
   - Redeploy after setting environment variables
   - Check variable names (must start with `REACT_APP_`)
   - Clear browser cache

4. **Routing Issues:**
   - Ensure `vercel.json` is configured correctly
   - Check React Router configuration

#### Performance Tips:

1. **Enable Vercel Analytics** for performance monitoring
2. **Use Vercel Edge Functions** for API calls if needed
3. **Optimize images** and assets
4. **Enable automatic deployments** from GitHub

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `REACT_APP_ENVIRONMENT` | Environment name | No |

### Monitoring

- **Analytics:** Available in Vercel dashboard
- **Performance:** Monitor Core Web Vitals
- **Deployments:** Automatic deployments from GitHub
- **Logs:** Function logs and build logs

### Cost

- **Free Tier:** $0/month (with limitations)
- **Pro Plan:** $20/month for advanced features
- **Enterprise:** Custom pricing

### Advanced Configuration

#### Custom Build Settings

Create a `vercel.json` with custom build settings:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build",
        "installCommand": "npm install",
        "buildCommand": "npm run build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Environment-Specific Configurations

You can set different environment variables for different environments:

- **Production:** Set in Vercel dashboard
- **Preview:** Automatic from Git branches
- **Development:** Use `.env.local` file

### Security

1. **Environment Variables:** Never commit sensitive data
2. **API Keys:** Store in Vercel environment variables
3. **CORS:** Configure properly on backend
4. **HTTPS:** Automatically enabled by Vercel

### Continuous Deployment

1. **Connect GitHub repository**
2. **Enable automatic deployments**
3. **Set up branch protection rules**
4. **Configure preview deployments**

---

**Your full-stack application is now deployed!**
- **Backend:** Running on Render
- **Frontend:** Running on Vercel
- **Database:** No database required for this project
- **Domain:** Custom domain available

### Next Steps

1. **Test all features** on the deployed application
2. **Monitor performance** using Vercel Analytics
3. **Set up monitoring** for both frontend and backend
4. **Consider adding a custom domain**
5. **Set up CI/CD pipelines** for automated testing 