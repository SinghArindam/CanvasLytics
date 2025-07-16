import subprocess
import sys
import time

# Define the services to run
# Each service is a dictionary with its name, directory, and the command to execute.
services = [
    {
        "name": "Pandas EDA Service",
        "cwd": "services/pandas-eda",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"]
    },
    {
        "name": "Scikit-learn Lab Service",
        "cwd": "services/sklearn-lab",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8002"]
    },
    {
        "name": "Agent Service",
        "cwd": "agent",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"]
    }
]

processes = []

try:
    print("🚀 Starting all backend services...")
    # Start all services as subprocesses
    for service in services:
        print(f"   -> Starting {service['name']}...")
        # We use Popen to start a non-blocking subprocess
        proc = subprocess.Popen(service["cmd"], cwd=service["cwd"])
        processes.append(proc)
        time.sleep(1) # Give a moment for each server to initialize

    print("\n✅ All services are running. Press CTRL+C to stop.")
    
    # Wait for all processes to complete (they won't, until terminated)
    for proc in processes:
        proc.wait()

except KeyboardInterrupt:
    print("\n🛑 Stopping all services...")

finally:
    # Ensure all child processes are terminated when the script exits
    for proc in processes:
        proc.terminate()
    print("✅ All services stopped.")