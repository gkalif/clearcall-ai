"""
ClearCall AI Pipeline — Real API Implementation
Uses:
  - OpenAI Whisper (local, free) for speech-to-text
  - Claude API (Anthropic) for transcript cleaning and summarization
  - OpenAI TTS for clear AI voice generation

Set in .env:
  ANTHROPIC_API_KEY=sk-ant-...
  OPENAI_API_KEY=sk-...        (for TTS only)
  STT_BACKEND=whisper_local    (or whisper_api if you prefer the hosted version)
  TTS_BACKEND=openai           (or mock for local testing without API keys)
"""

import asyncio
import os
import logging

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY")
STT_BACKEND       = os.getenv("STT_BACKEND", "mock")   # whisper_local | whisper_api | mock
TTS_BACKEND       = os.getenv("TTS_BACKEND", "mock")          # openai | mock

# Whisper model size: tiny/base/small/medium/large
# base = good balance of speed and accuracy for MVP
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")


# ─────────────────────────────────────────────
# STEP 1: Speech-to-Text
# ─────────────────────────────────────────────

async def speech_to_text(audio_file_path: str) -> str:
    """
    Transcribe audio file to raw text.
    Runs in a thread executor so it doesn't block the async event loop.
    """
    if STT_BACKEND == "whisper_local":
        return await asyncio.get_event_loop().run_in_executor(
            None, _whisper_local, audio_file_path
        )
    elif STT_BACKEND == "whisper_api":
        return await asyncio.get_event_loop().run_in_executor(
            None, _whisper_api, audio_file_path
        )
    else:
        # Mock fallback — useful for testing without API keys
        await asyncio.sleep(0.5)
        return (
            "I am calling because I wanting to make reservation for next Saturday "
            "for five peoples. My name is Chen Wei and my number is 613-555-0182."
        )


def _whisper_local(audio_file_path: str) -> str:
    """
    Transcribe using local Whisper model.
    First run downloads the model (~140MB for 'base').
    Install: pip install openai-whisper
    """
    try:
        import whisper
        logger.info(f"[STT] Loading Whisper model '{WHISPER_MODEL}'")
        model = whisper.load_model(WHISPER_MODEL)
        result = model.transcribe(audio_file_path)
        text = result["text"].strip()
        logger.info(f"[STT] Transcribed: {text[:80]}...")
        return text
    except ImportError:
        raise RuntimeError(
            "openai-whisper is not installed. Run: pip install openai-whisper\n"
            "Or set STT_BACKEND=mock in .env to use placeholder text."
        )


def _whisper_api(audio_file_path: str) -> str:
    """
    Transcribe using OpenAI hosted Whisper API (~$0.006 per minute).
    Requires OPENAI_API_KEY in .env.
    """
    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        with open(audio_file_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )
        return result.strip()
    except ImportError:
        raise RuntimeError("openai package not installed. Run: pip install openai")


# ─────────────────────────────────────────────
# STEP 2: Clean Transcript
# ─────────────────────────────────────────────

async def clean_transcript(raw_text: str) -> str:
    """
    Use Claude to fix grammar, remove filler words, and improve clarity
    while preserving the caller's exact meaning and all key details.
    """
    if not ANTHROPIC_API_KEY:
        logger.warning("[Claude] No ANTHROPIC_API_KEY set — using mock clean")
        await asyncio.sleep(0.3)
        return raw_text  # Return raw if no key — still better than crashing

    return await asyncio.get_event_loop().run_in_executor(
        None, _claude_clean, raw_text
    )


def _claude_clean(raw_text: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    system_prompt = """You are a transcript cleaning assistant for ClearCall AI.

Your job is to fix a voice message transcript from a caller with a non-native English accent.

Rules:
- Fix grammar, verb tenses, and phrasing errors
- Remove filler words (um, uh, like, you know)
- Preserve ALL specific details: names, phone numbers, dates, times, quantities
- Do NOT add information that wasn't in the original
- Do NOT remove information that was in the original
- Keep the caller's tone and intent exactly intact
- Return ONLY the cleaned transcript — no preamble, no explanation"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"Clean this transcript:\n\n{raw_text}"}
        ]
    )

    cleaned = message.content[0].text.strip()
    logger.info(f"[Claude/clean] Done. Input tokens: {message.usage.input_tokens}")
    return cleaned


# ─────────────────────────────────────────────
# STEP 3: Summarize
# ─────────────────────────────────────────────

async def summarize_text(cleaned_text: str) -> str:
    """
    Use Claude to generate a concise summary for the business dashboard.
    Business owners need to scan many messages quickly.
    """
    if not ANTHROPIC_API_KEY:
        logger.warning("[Claude] No ANTHROPIC_API_KEY set — using mock summary")
        await asyncio.sleep(0.2)
        return cleaned_text[:120] + "..." if len(cleaned_text) > 120 else cleaned_text

    return await asyncio.get_event_loop().run_in_executor(
        None, _claude_summarize, cleaned_text
    )


def _claude_summarize(cleaned_text: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    system_prompt = """You are a message summarizer for ClearCall AI.

Businesses receive voice messages from clients. Summarize each message for the business owner.

Rules:
- 1-2 sentences maximum
- Lead with the action required (booking, complaint, question, cancellation, etc.)
- Include the caller's name and contact number if mentioned
- Include specific dates, times, or quantities if mentioned
- Be direct — no filler phrases like "The caller is calling to..."
- Return ONLY the summary — no preamble"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        system=system_prompt,
        messages=[
            {"role": "user", "content": cleaned_text}
        ]
    )

    summary = message.content[0].text.strip()
    logger.info(f"[Claude/summarize] Done. Summary: {summary}")
    return summary


# ─────────────────────────────────────────────
# STEP 4: Text-to-Speech
# ─────────────────────────────────────────────

async def text_to_speech(cleaned_text: str, output_path: str) -> str:
    """
    Generate a clear AI voice audio file from the cleaned transcript.
    Returns the path to the saved audio file.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    if TTS_BACKEND == "elevenlabs":
        return await asyncio.get_event_loop().run_in_executor(
            None, _elevenlabs_tts, cleaned_text, output_path
        )
    elif TTS_BACKEND == "openai":
        await asyncio.get_event_loop().run_in_executor(
            None, _openai_tts, cleaned_text, output_path
        )
    else:
        _mock_tts(output_path)

    return output_path


def _openai_tts(text: str, output_path: str):
    """
    Generate speech using OpenAI TTS (~$0.015 per 1000 chars for tts-1-hd).
    Voices: alloy, echo, fable, nova, onyx, shimmer
    'nova' is clear, professional, neutral — good for business context.
    Install: pip install openai
    """
    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.audio.speech.create(
            model="tts-1-hd",
            voice="nova",
            input=text,
            response_format="mp3",
        )
        # stream_to_file saves the audio directly
        response.stream_to_file(output_path.replace(".wav", ".mp3"))

        # Update path to .mp3 since that's what OpenAI returns
        logger.info(f"[TTS] Audio saved to {output_path}")
    except ImportError:
        raise RuntimeError(
            "openai package not installed. Run: pip install openai\n"
            "Or set TTS_BACKEND=mock in .env to skip TTS."
        )
    except Exception as e:
        logger.error(f"[TTS] OpenAI TTS failed: {e} — falling back to mock")
        _mock_tts(output_path)

def _elevenlabs_tts(text: str, output_path: str) -> str:
    import requests as req
    api_key = os.getenv("ELEVENLABS_API_KEY")
    url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
    headers = {"Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": api_key}
    data = {"text": text, "model_id": "eleven_monolingual_v1", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
    response = req.post(url, json=data, headers=headers)
    response.raise_for_status()
    mp3_path = output_path.replace(".wav", ".mp3")
    with open(mp3_path, "wb") as f:
        f.write(response.content)
    return mp3_path


def _mock_tts(output_path: str):
    """
    Write a minimal valid WAV file (silent) so the audio player doesn't crash.
    Used when TTS_BACKEND=mock or as a fallback on TTS errors.
    """
    wav_header = bytes([
        0x52,0x49,0x46,0x46, 0x24,0x08,0x00,0x00,
        0x57,0x41,0x56,0x45, 0x66,0x6D,0x74,0x20,
        0x10,0x00,0x00,0x00, 0x01,0x00,0x01,0x00,
        0x22,0x56,0x00,0x00, 0x44,0xAC,0x00,0x00,
        0x02,0x00,0x10,0x00, 0x64,0x61,0x74,0x61,
        0x00,0x08,0x00,0x00,
    ])
    with open(output_path, "wb") as f:
        f.write(wav_header + bytes(2048))


# ─────────────────────────────────────────────
# ORCHESTRATOR
# ─────────────────────────────────────────────

async def process_message(message_id: int, audio_path: str, db_session):
    """
    Full pipeline: audio → STT → clean → summarize → TTS → save to DB.
    Called as a background task after upload.
    """
    from models.all_models import Message, Transcript, AudioOutput, MessageStatus

    try:
        msg = db_session.query(Message).filter(Message.id == message_id).first()
        if not msg:
            return

        msg.status = MessageStatus.processing
        db_session.commit()
        logger.info(f"[Pipeline] Starting message_id={message_id}")

        # Step 1: Transcribe
        raw = await speech_to_text(audio_path)
        logger.info(f"[Pipeline] STT complete for message_id={message_id}")

        # Step 2: Clean
        cleaned = await clean_transcript(raw)
        logger.info(f"[Pipeline] Clean complete for message_id={message_id}")

        # Step 3: Summarize
        summary = await summarize_text(cleaned)
        logger.info(f"[Pipeline] Summary complete for message_id={message_id}")

        # Step 4: TTS — save as mp3 if using OpenAI, wav if mock
        ext = "mp3" if TTS_BACKEND in ("openai", "elevenlabs") else "wav"
        output_path = f"uploads/processed/message_{message_id}_ai.{ext}"
        await text_to_speech(cleaned, output_path)
        logger.info(f"[Pipeline] TTS complete for message_id={message_id}")

        # Persist transcript
        transcript = db_session.query(Transcript).filter(
            Transcript.message_id == message_id
        ).first()
        if not transcript:
            from models.all_models import Transcript as T
            transcript = T(message_id=message_id)
            db_session.add(transcript)
        transcript.raw_text = raw
        transcript.cleaned_text = cleaned
        transcript.summary = summary

        # Persist audio output path
        audio_out = db_session.query(AudioOutput).filter(
            AudioOutput.message_id == message_id
        ).first()
        if not audio_out:
            from models.all_models import AudioOutput as AO
            audio_out = AO(message_id=message_id)
            db_session.add(audio_out)
        audio_out.file_path = output_path

        msg.status = MessageStatus.complete
        db_session.commit()
        logger.info(f"[Pipeline] Complete for message_id={message_id}")

    except Exception as e:
        logger.error(f"[Pipeline] Error on message_id={message_id}: {e}")
        msg = db_session.query(Message).filter(Message.id == message_id).first()
        if msg:
            msg.status = MessageStatus.new  # Allow retry
            db_session.commit()
        raise
