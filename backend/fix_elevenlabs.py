with open('services/ai_pipeline.py', 'r') as f:
    content = f.read()

# Add elevenlabs import and function
elevenlabs_func = '''
def _elevenlabs_tts(text: str, output_path: str):
    """
    Generate speech using ElevenLabs API.
    Free tier: 10,000 chars/month.
    """
    import requests
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel - clear, professional
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    response = requests.post(url, json=data, headers=headers)
    response.raise_for_status()
    
    mp3_path = output_path.replace(".wav", ".mp3")
    with open(mp3_path, "wb") as f:
        f.write(response.content)
    return mp3_path
'''

# Insert before the orchestrator
content = content.replace(
    '# ─────────────────────────────────────────────\n# ORCHESTRATOR',
    elevenlabs_func + '\n# ─────────────────────────────────────────────\n# ORCHESTRATOR'
)

# Update text_to_speech to handle elevenlabs
content = content.replace(
    '    if TTS_BACKEND == "openai":',
    '    if TTS_BACKEND == "elevenlabs":\n        return await asyncio.get_event_loop().run_in_executor(\n            None, _elevenlabs_tts, cleaned_text, output_path\n        )\n    elif TTS_BACKEND == "openai":'
)

# Fix ext in process_message
content = content.replace(
    'ext = "mp3" if TTS_BACKEND == "openai" and OPENAI_API_KEY else "wav"',
    'ext = "mp3" if TTS_BACKEND in ("openai", "elevenlabs") else "wav"'
)

with open('services/ai_pipeline.py', 'w') as f:
    f.write(content)
print("Done")