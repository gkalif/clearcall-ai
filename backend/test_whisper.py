import os
import glob
import requests
import json

# 1. Point to the exact upload endpoint
url = "http://127.0.0.1:8000/messages/upload" 
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6InVzZXIiLCJleHAiOjE3ODE0NjY3MjJ9.9xyypaxn1vFDMP_GBafzM496fIg3MgDeJb2x_9atrs0"

headers = {
    "Authorization": f"Bearer {token}"
}

# 2. Add the required business ID payload
data = {
    "business_id": 1
}

# 3. Dynamic path resolution so it NEVER breaks based on terminal location
script_dir = os.path.dirname(os.path.abspath(__file__))
audio_file_path = os.path.join(script_dir, "uploads", "audio", "sample.wav")

print(f"🚀 Firing request to: {url}")
print(f"📦 Attaching {audio_file_path}...")

try:
    with open(audio_file_path, "rb") as f:
        # Package the file
        files = {"file": (os.path.basename(audio_file_path), f, "audio/wav")}
        
        # Send POST request with BOTH data (form fields) and files
        response = requests.post(url, headers=headers, data=data, files=files)
        
        print("\n--- [SERVER RESPONSE] ---")
        print(f"Status Code: {response.status_code}")
        
        try:
            print(json.dumps(response.json(), indent=2))
        except Exception:
            print("Raw text response:", response.text)

except FileNotFoundError:
    print(f"❌ Error: Could not find '{audio_file_path}'.")
except requests.exceptions.ConnectionError:
    print("❌ Error: Is Uvicorn still running?")