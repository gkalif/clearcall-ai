with open('services/ai_pipeline.py', 'r') as f:
    content = f.read()
content = content.replace("STT_BACKEND = os.getenv('STT_BACKEND', 'whisper_local')", "STT_BACKEND = os.getenv('STT_BACKEND', 'mock')")
with open('services/ai_pipeline.py', 'w') as f:
    f.write(content)
print('Done')