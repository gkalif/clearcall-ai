from dotenv import load_dotenv
load_dotenv()

"""
ClearCall AI - FastAPI Backend
Entry point for the application with Rate Limiting Enabled
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# 1. Import slowapi exception tools
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# IMPORT FROM NEW CORE UTILITY FILE (Breaks Circular Dependency Loop)
from core.limiter import limiter

from core.database import engine, Base
from routers import auth, messages, business

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs("uploads/audio", exist_ok=True)
os.makedirs("uploads/processed", exist_ok=True)

app = FastAPI(
    title="ClearCall AI API",
    description="Backend for ClearCall AI - accent clarity platform",
    version="1.0.0"
)

# 2. Attach the shared limiter to the app state and register the exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded audio files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(messages.router, prefix="/messages", tags=["messages"])
app.include_router(business.router, prefix="/business", tags=["business"])

@app.get("/me")
async def read_me():
    """Placeholder - actual user resolution happens via JWT middleware"""
    return {"status": "Use Authorization header with Bearer token"}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ClearCall AI"}