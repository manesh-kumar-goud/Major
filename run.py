#!/usr/bin/env python3
"""
Stock Market Forecasting Application Launcher
Run this script to start the backend and frontend servers
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command in a subprocess"""
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return process
    except Exception as e:
        print(f"Error running command '{command}': {e}")
        return None

def check_requirements():
    """Check if Python and Node.js are installed"""
    print("🔍 Checking requirements...")
    
    # Check Python
    try:
        python_version = subprocess.run(['python', '--version'], capture_output=True, text=True)
        print(f"✅ Python: {python_version.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Python not found. Please install Python 3.8+")
        return False
    
    # Check Node.js
    try:
        node_version = subprocess.run(['node', '--version'], capture_output=True, text=True)
        print(f"✅ Node.js: {node_version.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Node.js not found. Please install Node.js 16+")
        return False
    
    # Check npm
    try:
        npm_version = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        print(f"✅ npm: {npm_version.stdout.strip()}")
    except FileNotFoundError:
        print("❌ npm not found. Please install npm")
        return False
    
    return True

def setup_backend():
    """Setup and start the Flask backend"""
    print("\n🔧 Setting up backend...")
    
    backend_dir = Path('backend')
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return None
    
    # Create virtual environment if it doesn't exist
    venv_dir = backend_dir / 'venv'
    if not venv_dir.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', str(venv_dir)])
    
    # Install requirements
    requirements_file = backend_dir / 'requirements.txt'
    if requirements_file.exists():
        print("📦 Installing Python dependencies...")
        if os.name == 'nt':  # Windows
            pip_path = venv_dir / 'Scripts' / 'pip'
        else:  # Unix/Linux/macOS
            pip_path = venv_dir / 'bin' / 'pip'
        
        subprocess.run([str(pip_path), 'install', '-r', str(requirements_file)])
    
    # Start Flask server
    print("🚀 Starting Flask backend on http://localhost:5000")
    if os.name == 'nt':  # Windows
        python_path = venv_dir / 'Scripts' / 'python'
    else:  # Unix/Linux/macOS
        python_path = venv_dir / 'bin' / 'python'
    
    flask_process = run_command(f"{python_path} app.py", cwd=backend_dir)
    return flask_process

def setup_frontend():
    """Setup and start the React frontend"""
    print("\n🔧 Setting up frontend...")
    
    frontend_dir = Path('frontend')
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return None
    
    # Install npm dependencies
    package_json = frontend_dir / 'package.json'
    if package_json.exists():
        print("📦 Installing Node.js dependencies...")
        subprocess.run(['npm', 'install'], cwd=frontend_dir)
    
    # Start React development server
    print("🚀 Starting React frontend on http://localhost:3000")
    react_process = run_command('npm start', cwd=frontend_dir)
    return react_process

def main():
    """Main function to orchestrate the application startup"""
    print("🚀 Stock Market Forecasting Application")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python run.py setup    - Setup both backend and frontend")
        print("  python run.py backend  - Start only backend")
        print("  python run.py frontend - Start only frontend")
        print("  python run.py full     - Start both backend and frontend")
        return
    
    command = sys.argv[1].lower()
    
    if not check_requirements():
        return
    
    if command == 'setup':
        print("\n🔧 Setting up the application...")
        setup_backend()
        setup_frontend()
        print("\n✅ Setup complete!")
        
    elif command == 'backend':
        flask_process = setup_backend()
        if flask_process:
            try:
                flask_process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Backend stopped")
                flask_process.terminate()
                
    elif command == 'frontend':
        react_process = setup_frontend()
        if react_process:
            try:
                react_process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Frontend stopped")
                react_process.terminate()
                
    elif command == 'full':
        # Start backend
        flask_process = setup_backend()
        if not flask_process:
            print("❌ Failed to start backend")
            return
        
        # Wait a bit for backend to start
        time.sleep(3)
        
        # Start frontend
        react_process = setup_frontend()
        if not react_process:
            print("❌ Failed to start frontend")
            flask_process.terminate()
            return
        
        # Wait a bit more and open browser
        time.sleep(5)
        print("\n🌐 Opening application in browser...")
        webbrowser.open('http://localhost:3000')
        
        try:
            print("\n🎉 Application is running!")
            print("🔗 Frontend: http://localhost:3000")
            print("🔗 Backend API: http://localhost:5000")
            print("Press Ctrl+C to stop both servers")
            
            # Wait for user to stop
            while True:
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 Stopping servers...")
            flask_process.terminate()
            react_process.terminate()
            print("✅ Servers stopped")
    
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main() 