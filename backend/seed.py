"""
Seed script: populates the DB with demo users, a business, and sample messages.
Run: python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal, engine, Base
from core.auth import hash_password
from models.all_models import User, Business, Message, Transcript, AudioOutput, AccentProfile, MessageStatus

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ── Demo User ─────────────────────────────
    user = db.query(User).filter(User.email == "demo@clearcall.ai").first()
    if not user:
        user = User(
            email="demo@clearcall.ai",
            name="Chen Wei",
            hashed_password=hash_password("password123"),
        )
        db.add(user)
        db.flush()

        profile = AccentProfile(
            user_id=user.id,
            accent_type="Mandarin-influenced English",
            native_language="Mandarin",
        )
        db.add(profile)
        print(f"✓ Created user: demo@clearcall.ai / password123")
    else:
        print(f"• User already exists: demo@clearcall.ai")

    # ── Demo Business ─────────────────────────
    biz = db.query(Business).filter(Business.email == "business@clearcall.ai").first()
    if not biz:
        biz = Business(
            email="business@clearcall.ai",
            name="The Grand Table Restaurant",
            hashed_password=hash_password("password123"),
        )
        db.add(biz)
        db.flush()
        print(f"✓ Created business: business@clearcall.ai / password123")
    else:
        print(f"• Business already exists: business@clearcall.ai")

    db.commit()

    # ── Demo Messages ─────────────────────────
    existing = db.query(Message).filter(Message.user_id == user.id).count()
    if existing == 0:
        # Create fake audio file
        os.makedirs("uploads/audio", exist_ok=True)
        os.makedirs("uploads/processed", exist_ok=True)

        wav_header = bytes([
            0x52,0x49,0x46,0x46,0x24,0x08,0x00,0x00,
            0x57,0x41,0x56,0x45,0x66,0x6D,0x74,0x20,
            0x10,0x00,0x00,0x00,0x01,0x00,0x01,0x00,
            0x22,0x56,0x00,0x00,0x44,0xAC,0x00,0x00,
            0x02,0x00,0x10,0x00,0x64,0x61,0x74,0x61,
            0x00,0x08,0x00,0x00,
        ])

        samples = [
            {
                "raw": "I am calling because I wanting to make reservation for next Saturday for five peoples.",
                "cleaned": "I'm calling to make a reservation for next Saturday for five people.",
                "summary": "Caller wants to book a table for 5 people this Saturday.",
                "status": MessageStatus.complete,
            },
            {
                "raw": "Hello I have problem with my order it is not arriving yet.",
                "cleaned": "Hello, I have a problem — my order hasn't arrived yet.",
                "summary": "Customer reporting a missing/delayed order.",
                "status": MessageStatus.reviewed,
            },
            {
                "raw": "I am question about the price for big group special menu.",
                "cleaned": "I have a question about the pricing for the large group special menu.",
                "summary": "Inquiry about large group menu pricing.",
                "status": MessageStatus.new,
            },
        ]

        for i, s in enumerate(samples):
            audio_path = f"uploads/audio/demo_message_{i+1}.wav"
            ai_audio_path = f"uploads/processed/demo_message_{i+1}_ai.wav"

            with open(audio_path, "wb") as f:
                f.write(wav_header + bytes(2048))
            with open(ai_audio_path, "wb") as f:
                f.write(wav_header + bytes(2048))

            msg = Message(
                user_id=user.id,
                business_id=biz.id,
                original_audio_path=audio_path,
                status=s["status"],
            )
            db.add(msg)
            db.flush()

            transcript = Transcript(
                message_id=msg.id,
                raw_text=s["raw"],
                cleaned_text=s["cleaned"],
                summary=s["summary"],
            )
            db.add(transcript)

            audio_out = AudioOutput(
                message_id=msg.id,
                file_path=ai_audio_path,
            )
            db.add(audio_out)

        db.commit()
        print(f"✓ Created {len(samples)} demo messages")
    else:
        print(f"• Demo messages already exist ({existing} found)")

    print("\n✅ Seed complete.")
    print("\nDemo credentials:")
    print("  User:     demo@clearcall.ai / password123")
    print("  Business: business@clearcall.ai / password123")

finally:
    db.close()
