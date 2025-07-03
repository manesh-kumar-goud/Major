# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_ENV=production
ENV PORT=5000

# Set working directory
WORKDIR /app

# Install system dependencies including curl and other utilities
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./
COPY api/ api/

# Create necessary directories
RUN mkdir -p logs

# Create a simple startup script
RUN echo '#!/bin/bash\necho "Starting Flask application..."\necho "Python version: $(python --version)"\necho "Working directory: $(pwd)"\necho "Files in directory: $(ls -la)"\npython app.py' > start.sh
RUN chmod +x start.sh

# Expose port
EXPOSE 5000

# Run the application with the startup script
CMD ["bash", "start.sh"] 