with open('services/ai_pipeline.py', 'r') as f:
    lines = f.readlines()

changes = 0
for i, line in enumerate(lines):
    # Fix STT default to mock
    if 'STT_BACKEND' in line and 'getenv' in line and 'whisper_local' in line:
        lines[i] = 'STT_BACKEND       = os.getenv("STT_BACKEND", "mock")   # whisper_local | whisper_api | mock\n'
        print(f"Fixed STT_BACKEND line {i+1}")
        changes += 1
    # Fix TTS default to mock
    if 'TTS_BACKEND' in line and 'getenv' in line and 'openai' in line:
        lines[i] = 'TTS_BACKEND       = os.getenv("TTS_BACKEND", "mock")          # openai | mock\n'
        print(f"Fixed TTS_BACKEND line {i+1}")
        changes += 1

with open('services/ai_pipeline.py', 'w') as f:
    f.writelines(lines)

print(f"Done — {changes} changes made")