with open('services/ai_pipeline.py', 'r') as f:
    content = f.read()
content = content.replace('claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022')
with open('services/ai_pipeline.py', 'w') as f:
    f.write(content)
print('Done')