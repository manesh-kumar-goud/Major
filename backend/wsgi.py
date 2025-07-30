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

if __name__ == "__main__":
    app.run() 