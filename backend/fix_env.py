from dotenv import load_dotenv
import os

load_dotenv()
key = os.getenv("ANTHROPIC_API_KEY")
if key:
    print(f"Key found: {key[:20]}...")
else:
    print("No key found - .env not loading")