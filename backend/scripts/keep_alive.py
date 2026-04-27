import time
import requests
from datetime import datetime

# URL of your Render backend
URL = "https://lead-salal-management.onrender.com/health"

def ping_server():
    print(f"[{datetime.now()}] Starting keep-alive script...")
    while True:
        try:
            response = requests.get(URL)
            if response.status_code == 200:
                print(f"[{datetime.now()}] Ping successful: {response.json()}")
            else:
                print(f"[{datetime.now()}] Ping failed with status: {response.status_code}")
        except Exception as e:
            print(f"[{datetime.now()}] Error pinging server: {e}")
        
        # Sleep for 14 minutes (Render sleeps after 15 mins of inactivity)
        time.sleep(14 * 60)

if __name__ == "__main__":
    ping_server()
