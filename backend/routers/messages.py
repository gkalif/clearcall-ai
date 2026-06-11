"""
Message routes for end users.
Upload audio, view message history, get transcript + AI audio results.
"""

import os
import uuid
import asyncio
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from core.auth import get_current_user
from models.all_models import Message, Transcript, AudioOutput, MessageStatus, User
from services.ai_pipeline import process_message

router = APIRouter()

UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Schemas ──────────────────────────────────

class TranscriptOut(BaseModel):
    raw_text: Optional[str]
    cleaned_text: Optional[str]
    summary: Optional[str]

    class Config:
        from_attributes = True

class AudioOutputOut(BaseModel):
    file_path: Optional[str]

    class Config:
        from_attributes = True

class MessageOut(BaseModel):
    id: int
    status: MessageStatus
    original_audio_path: str
    created_at: datetime
    transcript: Optional[TranscriptOut] = None
    audio_output: Optional[AudioOutputOut] = None

    class Config:
        from_attributes = True


# ── Routes ───────────────────────────────────

@router.post("/upload", response_model=MessageOut)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    business_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload audio file. Saves it locally, creates a Message record,
    and kicks off background AI processing.

    TODO: Replace local file save with S3 upload:
        import boto3
        s3 = boto3.client("s3", ...)
        s3.upload_fileobj(file.file, BUCKET_NAME, s3_key)
        file_path = f"s3://{BUCKET_NAME}/{s3_key}"
    """
    # Validate file type
    allowed = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/x-m4a"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Save file
    ext = os.path.splitext(file.filename)[1] or ".wav"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Create DB record
    msg = Message(
        user_id=current_user.id,
        business_id=business_id,
        original_audio_path=file_path,
        status=MessageStatus.new,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Kick off background processing
    # Uses a new DB session inside so the background task isn't tied to this request
    background_tasks.add_task(_run_pipeline, msg.id, file_path)

    return msg


async def _run_pipeline(message_id: int, audio_path: str):
    """Wrapper that creates its own DB session for background processing."""
    from core.database import SessionLocal
    db = SessionLocal()
    try:
        await process_message(message_id, audio_path, db)
    finally:
        db.close()


@router.get("", response_model=List[MessageOut])
def list_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all messages for the logged-in user, newest first."""
    return (
        db.query(Message)
        .filter(Message.user_id == current_user.id)
        .order_by(Message.created_at.desc())
        .all()
    )


@router.get("/{message_id}", response_model=MessageOut)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single message. Only accessible by the owning user."""
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.post("/{message_id}/process")
async def reprocess_message(
    message_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger reprocessing for a message (e.g. after pipeline failure)."""
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.status = MessageStatus.new
    db.commit()

    background_tasks.add_task(_run_pipeline, msg.id, msg.original_audio_path)
    return {"detail": "Reprocessing started", "message_id": message_id}
