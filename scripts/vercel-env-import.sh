#!/bin/bash

# 🚀 VERCEL ENVIRONMENT VARIABLES BULK IMPORT SCRIPT
# 
# This script reads from .env.production and imports all variables to Vercel
# 
# Usage:
# 1. Create .env.production with your actual values
# 2. Run: chmod +x scripts/vercel-env-import.sh
# 3. Run: ./scripts/vercel-env-import.sh

echo "🚀 Vercel Environment Variables Bulk Import"
echo "==========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "📝 Please create .env.production with your actual values:"
    echo "   cp .env.example .env.production"
    echo "   # Then edit .env.production with real values"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    echo "   vercel login"
    exit 1
fi

echo "📋 Reading environment variables from .env.production..."

# Import environment variables
success_count=0
error_count=0

while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Skip placeholder values
    if [[ $value == *"your_"* ]] || [[ $value == *"change_this"* ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    if [[ -n $key ]] && [[ -n $value ]]; then
        echo "📤 Setting $key..."
        if echo "$value" | vercel env add "$key" production; then
            echo "   ✅ $key set successfully"
            ((success_count++))
        else
            echo "   ❌ Failed to set $key"
            ((error_count++))
        fi
    fi
done < .env.production

echo ""
echo "==========================================="
echo "📊 Import Summary:"
echo "   ✅ Success: $success_count variables"
echo "   ❌ Errors: $error_count variables"

if [ $success_count -gt 0 ]; then
    echo ""
    echo "🎉 Environment variables imported successfully!"
    echo "🔄 Your next deployment will use these variables."
    echo "📝 To deploy now: vercel --prod"
else
    echo ""
    echo "❌ No variables were imported. Please check your setup."
fi

echo ""
echo "💡 Alternative: Use Vercel Dashboard"
echo "   1. Go to vercel.com → Your Project → Settings"
echo "   2. Click 'Environment Variables'"
echo "   3. Add variables manually" 