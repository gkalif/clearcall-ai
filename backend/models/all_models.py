"""
SQLAlchemy models for ClearCall AI.
All tables in one file for MVP clarity. Split into separate files as the app grows.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from core.database import Base


class MessageStatus(str, enum.Enum):
    new = "new"
    processing = "processing"
    complete = "complete"
    reviewed = "reviewed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="user")
    accent_profile = relationship("AccentProfile", back_populates="user", uselist=False)


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="business")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True)
    original_audio_path = Column(String(512), nullable=False)
    status = Column(Enum(MessageStatus), default=MessageStatus.new, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="messages")
    business = relationship("Business", back_populates="messages")
    transcript = relationship("Transcript", back_populates="message", uselist=False)
    audio_output = relationship("AudioOutput", back_populates="message", uselist=False)


class AccentProfile(Base):
    __tablename__ = "accent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    # TODO: Store accent type, sample audio paths, training metadata
    accent_type = Column(String(100), nullable=True)
    native_language = Column(String(100), nullable=True)
    sample_audio_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accent_profile")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), unique=True, nullable=False)
    raw_text = Column(Text, nullable=True)       # Direct STT output
    cleaned_text = Column(Text, nullable=True)   # After LLM cleanup
    summary = Column(Text, nullable=True)        # AI-generated summary
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="transcript")


class AudioOutput(Base):
    __tablename__ = "audio_outputs"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), unique=True, nullable=False)
    # Path to AI-generated clear-voice audio file
    # TODO: Replace local path with S3 URL when adding cloud storage
    file_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="audio_output")
