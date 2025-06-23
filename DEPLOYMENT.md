# Deployment Guide

This guide provides instructions for deploying the Stock Market Forecasting application to various platforms.

## 🔒 Security Setup

### 1. Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your actual values:**
   ```bash
   # Required: Replace with your actual RapidAPI key
   RAPIDAPI_KEY=your-actual-rapidapi-key-here
   
   # Required: Generate a strong secret key
   SECRET_KEY=your-super-secret-key-32-chars-minimum
   
   # Optional: Customize other settings
   FLASK_ENV=production
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

3. **Generate a strong secret key:**
   ```python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

### 2. Verify Configuration

Run the deployment readiness check:
```bash
cd backend
python deployment_config.py
```

## 🚀 Deployment Options

### Option 1: Heroku Deployment

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set RAPIDAPI_KEY=your-actual-key
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set FLASK_ENV=production
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 2: Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **For production deployment:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Option 3: Manual Server Deployment

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Gunicorn:**
   ```bash
   pip install gunicorn
   ```

3. **Run with Gunicorn:**
   ```bash
   gunicorn --bind 0.0.0.0:5000 wsgi:application
   ```

### Option 4: AWS/DigitalOcean/VPS

1. **Setup server with Python 3.12**
2. **Clone repository and install dependencies**
3. **Configure environment variables**
4. **Setup Nginx as reverse proxy**
5. **Use PM2 or systemd for process management**

## 🔧 Frontend Deployment

### Build for Production

```bash
cd frontend
npm run build
```

### Deploy to Netlify/Vercel

1. **Connect your GitHub repository**
2. **Set build command:** `npm run build`
3. **Set publish directory:** `build`
4. **Add environment variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   ```

## 🏥 Health Checks

The application includes health check endpoints:

- Backend: `GET /api/health`
- Response includes environment info and timestamp

## 📊 Monitoring

### Application Logs

- Check deployment logs regularly
- Monitor API rate limits
- Track model performance metrics

### Environment Variables Checklist

- [ ] `RAPIDAPI_KEY` - Your RapidAPI key
- [ ] `SECRET_KEY` - Strong secret key (32+ characters)
- [ ] `FLASK_ENV` - Set to 'production'
- [ ] `CORS_ORIGINS` - Your frontend domain(s)
- [ ] `DATABASE_URL` - Database connection (if using)

## 🔐 Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong, unique secret keys**
3. **Enable HTTPS in production**
4. **Regularly rotate API keys**
5. **Monitor API usage and costs**
6. **Use environment-specific configurations**

## 🚨 Troubleshooting

### Common Issues

1. **Missing Environment Variables:**
   ```
   Error: Missing required environment variables: RAPIDAPI_KEY
   ```
   Solution: Ensure all required variables are set in your deployment environment.

2. **CORS Errors:**
   ```
   Access to fetch at 'backend-url' from origin 'frontend-url' has been blocked by CORS policy
   ```
   Solution: Add your frontend domain to `CORS_ORIGINS` environment variable.

3. **API Rate Limits:**
   - Monitor your RapidAPI dashboard
   - Implement caching to reduce API calls
   - Consider upgrading your API plan if needed

### Logs

Check application logs for debugging:
```bash
# Heroku
heroku logs --tail

# Docker
docker-compose logs -f

# PM2
pm2 logs
```

## 📞 Support

If you encounter issues:
1. Check the health endpoint: `/api/health`
2. Verify all environment variables are set
3. Check application logs
4. Ensure API keys are valid and have sufficient quota

## 🔄 Updates

To update the deployed application:
1. Update your code
2. Test locally with production configuration
3. Deploy using your chosen method
4. Verify the health endpoint
5. Monitor logs for any issues 