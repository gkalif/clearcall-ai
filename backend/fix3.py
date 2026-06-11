with open('services/ai_pipeline.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'STT_BACKEND' in line and 'getenv' in line and 'whisper_local' in line:
        lines[i] = 'STT_BACKEND       = os.getenv("STT_BACKEND", "mock")   # whisper_local | whisper_api | mock\n'
        print(f"Fixed line {i+1}")

with open('services/ai_pipeline.py', 'w') as f:
    f.writelines(lines)

print("Done")