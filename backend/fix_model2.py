with open('services/ai_pipeline.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'claude-3-5-sonnet-20241022' in line:
        lines[i] = line.replace('claude-3-5-sonnet-20241022', 'claude-haiku-4-5-20251001')
        print(f"Fixed line {i+1}")

with open('services/ai_pipeline.py', 'w') as f:
    f.writelines(lines)
print('Done')