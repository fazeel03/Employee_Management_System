#!/usr/bin/env python
"""
Start the FastAPI Reports Service
Automatically cleans up port 8001 before starting
"""
import os
import sys
import subprocess
import time
import signal

PORT = 8001

def find_process_on_port(port):
    """Find process ID using the specified port"""
    try:
        result = subprocess.run(
            f'netstat -ano | findstr :{port}',
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            pids = set()
            for line in lines:
                parts = line.split()
                if len(parts) >= 5 and 'LISTENING' in line:
                    pids.add(parts[-1])
            return list(pids)
        return []
    except Exception as e:
        print(f"Error finding process: {e}")
        return []

def kill_process(pid):
    """Kill process by PID"""
    try:
        subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
        print(f"Killed process {pid}")
        return True
    except Exception as e:
        print(f"Error killing process {pid}: {e}")
        return False

def cleanup_port(port):
    """Clean up any processes using the port"""
    print(f"\n{'='*50}")
    print(f"Checking port {port}...")
    print(f"{'='*50}\n")
    
    pids = find_process_on_port(port)
    
    if pids:
        print(f"Found {len(pids)} process(es) on port {port}")
        for pid in pids:
            print(f"Killing PID: {pid}")
            kill_process(pid)
        
        time.sleep(2)
        
        # Check again
        remaining = find_process_on_port(port)
        if remaining:
            print(f"\n[WARNING] Port {port} still in use by PIDs: {remaining}")
            print("You may need to restart your computer or manually kill these processes")
            return False
        else:
            print(f"\n[SUCCESS] Port {port} is now free!")
            return True
    else:
        print(f"[SUCCESS] Port {port} is already free!")
        return True

def start_server():
    """Start the FastAPI server"""
    print(f"\n{'='*50}")
    print("Starting FastAPI Reports Service...")
    print(f"{'='*50}\n")
    
    try:
        # Start uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "127.0.0.1",
            "--port", str(PORT),
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        cleanup_port(PORT)
        sys.exit(0)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("EMS REPORTS SERVICE STARTUP")
    print("="*50)
    
    # Cleanup port first
    if cleanup_port(PORT):
        # Start server
        start_server()
    else:
        print("\n[ERROR] Could not free port. Please restart your computer.")
        sys.exit(1)
