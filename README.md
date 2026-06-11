# ClearCall AI — MVP

Accent clarity platform for businesses and their clients.
Clients record voice messages → AI transcribes, cleans, summarizes, and re-speaks in a clear voice → businesses receive both the original and AI-clarified audio.

---

## Quick Start (5 minutes)

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy env file (defaults work out of the box with SQLite)
cp .env.example .env

# Seed demo data
python seed.py

# Start the API
uvicorn main:app --reload --port 8000
```

API is now running at http://localhost:8000
Interactive docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

Frontend is now running at http://localhost:5173

---

## Demo Credentials

| Role     | Email                      | Password    |
|----------|----------------------------|-------------|
| Client   | demo@clearcall.ai          | password123 |
| Business | business@clearcall.ai      | password123 |

---

## Project Structure

```
clearcall/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── seed.py                  # Demo data seeder
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   └── auth.py              # JWT helpers + route dependencies
│   ├── models/
│   │   └── all_models.py        # All SQLAlchemy models
│   ├── routers/
│   │   ├── auth.py              # POST /auth/signup, /auth/login
│   │   ├── messages.py          # POST /messages/upload, GET /messages
│   │   └── business.py          # GET /business/messages
│   └── services/
│       └── ai_pipeline.py       # STT → clean → summarize → TTS pipeline
│
└── frontend/
    └── src/
        ├── App.tsx              # Routes + auth guards
        ├── lib/api.ts           # Axios client + all API calls
        ├── hooks/useAuth.tsx    # Auth context + hook
        ├── components/shared.tsx # Logo, AudioPlayer, StatusBadge, Spinner
        └── pages/
            ├── Login.tsx
            ├── Signup.tsx
            ├── app/
            │   ├── AppLayout.tsx    # Mobile app shell + bottom nav
            │   ├── Home.tsx
            │   ├── Record.tsx       # Mic recording + file upload
            │   ├── Messages.tsx     # List + detail
            │   └── Onboarding.tsx   # Accent profile setup
            └── business/
                └── Business.tsx    # Dashboard, inbox, message detail, settings
```

---

## API Endpoints

### Auth
| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | /auth/signup           | User signup              |
| POST   | /auth/login            | User login               |
| POST   | /auth/business/signup  | Business signup          |
| POST   | /auth/business/login   | Business login           |

### Messages (user JWT required)
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /messages/upload            | Upload audio + process   |
| GET    | /messages                   | List user's messages     |
| GET    | /messages/{id}              | Get message + transcript |
| POST   | /messages/{id}/process      | Reprocess message        |

### Business (business JWT required)
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /business/messages                | Business inbox           |
| GET    | /business/messages/{id}           | Message detail           |
| PATCH  | /business/messages/{id}/status    | Update status tag        |
| GET    | /business/profile                 | Business profile         |

---

## AI Pipeline — Plugging in Real APIs

All AI functions are in `backend/services/ai_pipeline.py`. Each function has a detailed TODO comment showing exactly which API to add.

### Speech-to-Text
Replace `speech_to_text()` with:
- **OpenAI Whisper API** — `pip install openai`, set `OPENAI_API_KEY`
- **Local Whisper** — `pip install openai-whisper` (free, no API key)

### Transcript Cleaning + Summarization
Replace `clean_transcript()` and `summarize_text()` with:
- **OpenAI GPT-4o** — `pip install openai`, set `OPENAI_API_KEY`
- **Claude API** — `pip install anthropic`, set `ANTHROPIC_API_KEY`

### Text-to-Speech (clear AI voice)
Replace `text_to_speech()` with:
- **OpenAI TTS** — `client.audio.speech.create(model="tts-1-hd", voice="nova")`
- **ElevenLabs** — `pip install elevenlabs`, set `ELEVENLABS_API_KEY`
- **Azure TTS** — `pip install azure-cognitiveservices-speech`

---

## Switching to PostgreSQL

In `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/clearcall
```

Install driver:
```bash
pip install psycopg2-binary
```

Uncomment in `requirements.txt`:
```
psycopg2-binary==2.9.9
```

---

## Switching to S3 Storage

In `routers/messages.py`, the upload endpoint has a TODO comment. Replace local file save with:
```python
import boto3
s3 = boto3.client("s3")
s3.upload_fileobj(file.file, os.getenv("AWS_S3_BUCKET"), s3_key)
file_path = f"https://{bucket}.s3.amazonaws.com/{s3_key}"
```

Add to `.env`:
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=clearcall-audio
AWS_REGION=us-east-1
```

---

## Frontend Routes

| Path                    | Description                    | Auth        |
|-------------------------|--------------------------------|-------------|
| /login                  | Login (client or business)     | Public      |
| /signup                 | Signup                         | Public      |
| /app/home               | Client home                    | User JWT    |
| /app/record             | Record/upload audio            | User JWT    |
| /app/messages           | Message history                | User JWT    |
| /app/messages/:id       | Message detail + playback      | User JWT    |
| /app/onboarding         | Accent profile setup           | User JWT    |
| /business/dashboard     | Business inbox                 | Biz JWT     |
| /business/messages/:id  | Message detail + status update | Biz JWT     |
| /business/settings      | Business settings              | Biz JWT     |

---

## Tech Stack

| Layer     | Tech                                    |
|-----------|-----------------------------------------|
| Backend   | Python 3.12, FastAPI, SQLAlchemy        |
| Database  | SQLite (dev) / PostgreSQL (prod)        |
| Auth      | JWT via python-jose + passlib/bcrypt    |
| Storage   | Local filesystem (dev) / S3 (prod)      |
| Frontend  | React 18, TypeScript, Vite              |
| Styling   | Tailwind CSS v3                         |
| HTTP      | Axios with auto-auth interceptor        |
| Icons     | Lucide React                            |
| Fonts     | DM Sans + Syne (Google Fonts)           |
