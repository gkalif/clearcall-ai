"""
Business dashboard routes.
Businesses see messages sent to them, update status, view transcripts and AI audio.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.database import get_db
from core.auth import get_current_business
from models.all_models import Message, Transcript, AudioOutput, MessageStatus, Business

router = APIRouter()


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
    user_id: int
    status: MessageStatus
    original_audio_path: str
    created_at: datetime
    transcript: Optional[TranscriptOut] = None
    audio_output: Optional[AudioOutputOut] = None

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: MessageStatus


# ── Routes ───────────────────────────────────

@router.get("/messages", response_model=List[MessageOut])
def get_business_inbox(
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    """Business inbox: all messages addressed to this business, newest first."""
    return (
        db.query(Message)
        .filter(Message.business_id == current_business.id)
        .order_by(Message.created_at.desc())
        .all()
    )


@router.get("/messages/{message_id}", response_model=MessageOut)
def get_business_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    """Get single message detail. Must belong to this business."""
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.business_id == current_business.id,
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.patch("/messages/{message_id}/status", response_model=MessageOut)
def update_message_status(
    message_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_business: Business = Depends(get_current_business),
):
    """Update message status: new → processing → complete → reviewed."""
    msg = db.query(Message).filter(
        Message.id == message_id,
        Message.business_id == current_business.id,
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.status = payload.status
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/profile")
def get_business_profile(
    current_business: Business = Depends(get_current_business),
):
    return {
        "id": current_business.id,
        "email": current_business.email,
        "name": current_business.name,
        "created_at": current_business.created_at,
    }
