"""
Auth routes: signup and login for both users and businesses.
Returns JWT tokens. Role is encoded in the token payload.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from core.database import get_db
from core.auth import hash_password, verify_password, create_access_token
from models.all_models import User, Business

router = APIRouter()


# ── Schemas ──────────────────────────────────

class UserSignup(BaseModel):
    email: str
    name: str
    password: str

class BusinessSignup(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    id: int


# ── User Auth ─────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
def user_signup(payload: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": "user"})
    return TokenResponse(access_token=token, role="user", name=user.name, id=user.id)


@router.post("/login", response_model=TokenResponse)
def user_login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": "user"})
    return TokenResponse(access_token=token, role="user", name=user.name, id=user.id)


# ── Business Auth ─────────────────────────────

@router.post("/business/signup", response_model=TokenResponse)
def business_signup(payload: BusinessSignup, db: Session = Depends(get_db)):
    if db.query(Business).filter(Business.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    biz = Business(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password)
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)

    token = create_access_token({"sub": str(biz.id), "business_id": biz.id, "role": "business"})
    return TokenResponse(access_token=token, role="business", name=biz.name, id=biz.id)


@router.post("/business/login", response_model=TokenResponse)
def business_login(payload: LoginRequest, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.email == payload.email).first()
    if not biz or not verify_password(payload.password, biz.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(biz.id), "business_id": biz.id, "role": "business"})
    return TokenResponse(access_token=token, role="business", name=biz.name, id=biz.id)


# ── Me endpoint ───────────────────────────────

@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    """
    TODO: Hook up to get_current_user dependency when protecting routes.
    Example: def get_me(current_user: User = Depends(get_current_user))
    """
    return {"detail": "Send Bearer token to identify yourself"}
