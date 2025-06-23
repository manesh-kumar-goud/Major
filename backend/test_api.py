#!/usr/bin/env python3
"""
Test script for RapidAPI Yahoo Finance integration
Run this to verify the API connection and data formatting
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api_client import yahoo_api
import json

def test_stock_quote():
    """Test getting stock quotes"""
    print("🔍 Testing stock quotes...")
    try:
        result = yahoo_api.get_stock_quote(['AAPL', 'GOOGL'])
        if result:
            print("✅ Stock quotes API working")
            formatted = yahoo_api.format_quote_data(result)
            print(f"📊 Formatted {len(formatted)} quotes")
            if formatted:
                print(f"📈 Sample: {formatted[0]}")
        else:
            print("❌ Stock quotes API failed")
    except Exception as e:
        print(f"❌ Stock quotes error: {e}")

def test_stock_history():
    """Test getting historical data"""
    print("\n🔍 Testing historical data...")
    try:
        result = yahoo_api.get_stock_history('AAPL', '1mo')
        if result:
            print("✅ Historical data API working")
            formatted = yahoo_api.format_historical_data(result, 'AAPL')
            print(f"📊 Formatted {len(formatted)} data points")
            if formatted:
                print(f"📈 Sample: {formatted[0] if formatted else 'No data'}")
        else:
            print("❌ Historical data API failed")
    except Exception as e:
        print(f"❌ Historical data error: {e}")

def test_insider_trades():
    """Test getting insider trades"""
    print("\n🔍 Testing insider trades...")
    try:
        result = yahoo_api.get_insider_trades()
        if result:
            print("✅ Insider trades API working")
            print(f"📊 Response type: {type(result)}")
        else:
            print("❌ Insider trades API failed")
    except Exception as e:
        print(f"❌ Insider trades error: {e}")

def test_trending_stocks():
    """Test getting trending stocks"""
    print("\n🔍 Testing trending stocks...")
    try:
        result = yahoo_api.get_trending_stocks()
        if result:
            print("✅ Trending stocks API working")
            print(f"📊 Response type: {type(result)}")
        else:
            print("❌ Trending stocks API failed")
    except Exception as e:
        print(f"❌ Trending stocks error: {e}")

def test_search():
    """Test stock search"""
    print("\n🔍 Testing stock search...")
    try:
        result = yahoo_api.search_stocks('Apple')
        if result:
            print("✅ Stock search API working")
            print(f"📊 Response type: {type(result)}")
        else:
            print("❌ Stock search API failed")
    except Exception as e:
        print(f"❌ Stock search error: {e}")

def main():
    print("🚀 RapidAPI Yahoo Finance Integration Test")
    print("=" * 50)
    
    # Test API connection
    print(f"🔗 API Base URL: {yahoo_api.base_url}")
    print(f"🔑 API Key: {yahoo_api.headers['X-RapidAPI-Key'][:10]}...")
    
    # Run tests
    test_stock_quote()
    test_stock_history()
    test_insider_trades()
    test_trending_stocks()
    test_search()
    
    print("\n" + "=" * 50)
    print("✅ API testing completed!")
    print("\n💡 If some tests failed, it might be due to:")
    print("   - API rate limits")
    print("   - Invalid API key")
    print("   - Network connectivity")
    print("   - API endpoint changes")

if __name__ == "__main__":
    main() 