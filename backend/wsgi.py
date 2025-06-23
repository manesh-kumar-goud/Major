#!/usr/bin/env python3
"""
WSGI Entry Point for Stock Market Forecasting App

This file serves as the entry point for WSGI servers like Gunicorn
when deploying to production environments.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

from app import app
from deployment_config import get_config, print_deployment_status

# Configure the app for production
config_class = get_config()
app.config.from_object(config_class)

# Print deployment status if running directly
if __name__ == "__main__":
    print_deployment_status()
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
else:
    # This is the WSGI callable that servers like Gunicorn will use
    application = app 