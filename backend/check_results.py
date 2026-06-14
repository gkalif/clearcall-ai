import requests
import json

url = "http://127.0.0.1:8000/messages" 
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6InVzZXIiLCJleHAiOjE3ODE0NjY3MjJ9.9xyypaxn1vFDMP_GBafzM496fIg3MgDeJb2x_9atrs0"

headers = {
    "Authorization": f"Bearer {token}"
}

print("🔄 Fetching your messages to see AI Whisper updates...")
response = requests.get(url, headers=headers)

if response.status_code == 200:
    messages = response.json()
    
    if messages:
        # Sort messages by ID to ensure we find the absolute newest one
        messages_sorted = sorted(messages, key=lambda x: x["id"])
        latest_message = messages_sorted[-1]  # [-1] grabs the very last element
        
        print(f"\n--- [WHISPER OPTIMIZATION RESULT FOR ID {latest_message['id']}] ---")
        print(json.dumps(latest_message, indent=2))
    else:
        print("\nYour message list is completely empty.")
else:
    print(f"Failed to fetch data. Status code: {response.status_code}")
    print(response.text)