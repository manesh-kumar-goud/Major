"""
Deployment Configuration for Stock Market Forecasting App

This file contains deployment-specific configurations and utilities
for deploying the application to various platforms (Heroku, AWS, Docker, etc.)
"""

import os
from config import Config

class ProductionConfig(Config):
    """Production configuration with enhanced security and performance settings"""
    
    DEBUG = False
    TESTING = False
    
    # Security enhancements
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Performance settings
    SEND_FILE_MAX_AGE_DEFAULT = 31536000  # 1 year cache for static files
    
    # Rate limiting (if using Flask-Limiter)
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'WARNING')
    
    @staticmethod
    def init_app(app):
        # Production-specific initialization
        # Log to stderr in production
        import logging
        from logging import StreamHandler
        file_handler = StreamHandler()
        file_handler.setLevel(logging.WARNING)
        app.logger.addHandler(file_handler)

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])

# Deployment helpers
def check_deployment_readiness():
    """Check if application is ready for deployment"""
    checks = []
    
    # Check required environment variables
    required_vars = ['RAPIDAPI_KEY', 'SECRET_KEY']
    for var in required_vars:
        if not os.getenv(var):
            checks.append(f"❌ Missing environment variable: {var}")
        else:
            checks.append(f"✓ Environment variable set: {var}")
    
    # Check if running in production mode
    if os.getenv('FLASK_ENV') == 'production':
        checks.append("✓ Running in production mode")
    else:
        checks.append("⚠️  Not running in production mode")
    
    # Check secret key strength
    secret_key = os.getenv('SECRET_KEY', '')
    if len(secret_key) < 32:
        checks.append("⚠️  Secret key should be at least 32 characters long")
    else:
        checks.append("✓ Secret key is strong")
    
    return checks

def print_deployment_status():
    """Print deployment readiness status"""
    print("\n" + "="*50)
    print("DEPLOYMENT READINESS CHECK")
    print("="*50)
    
    checks = check_deployment_readiness()
    for check in checks:
        print(check)
    
    print("="*50)
    
    # Count issues
    issues = [check for check in checks if check.startswith('❌')]
    warnings = [check for check in checks if check.startswith('⚠️')]
    
    if issues:
        print(f"❌ {len(issues)} critical issue(s) found - fix before deployment")
        return False
    elif warnings:
        print(f"⚠️  {len(warnings)} warning(s) found - review before deployment")
        return True
    else:
        print("✅ Ready for deployment!")
        return True

if __name__ == '__main__':
    print_deployment_status() 