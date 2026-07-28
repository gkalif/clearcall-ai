# ClearCall AI

**Accent clarity for voice messages.** A caller records a voice message; ClearCall transcribes it, cleans the transcript, summarizes it, and re-speaks it in a clear synthetic voice. The receiving business gets both the original audio and the clarified version, side by side.

<!-- TODO: replace with a real link or delete the line -->
[Live demo](#) · [2-min walkthrough video](#) · [API docs](http://localhost:8000/docs)

<!-- TODO: drop a screenshot or GIF here. This is the single highest-value line in the file. -->
![ClearCall business inbox showing original and clarified audio side by side](docs/screenshot-inbox.png)

---

## The problem

Businesses that take voice messages from a linguistically diverse customer base lose information at the point of intake. Accents, phone-line compression, and background noise mean messages get replayed repeatedly, misheard, or dropped entirely. The cost lands on the caller, who has to repeat themselves, and on the business, which loses the lead.

ClearCall sits between them: it preserves the original recording for fidelity and accountability, and produces a clarified transcript, summary, and re-spoken audio for speed.

---

## How it works

```
  Caller audio                    Processing pipeline                  Business dashboard
  ─────────────                   ───────────────────                  ──────────────────

  Browser mic  ──upload──▶  ┌──────────────────────────┐
  or file                   │ 1. Speech-to-text        │  Whisper
                            │                          │
                            │ 2. Transcript cleaning   │  Claude        ──▶  Inbox
                            │                          │                     Original audio
                            │ 3. Summarization         │  Claude             Clarified audio
                            │                          │                     Transcript
                            │ 4. Text-to-speech        │  ElevenLabs         Summary
                            └──────────────────────────┘                     Status tag
                                        │
                                   persisted:
                                   audio + transcript + summary
```

Each stage is independently swappable — the STT provider, for instance, can be switched between Whisper and OpenAI's endpoint without touching the stages downstream.

---

## Engineering notes

The interesting problems here weren't the API calls — they were everything around them.

**Latency.** Four sequential network round-trips per message, two of them to generative models. <!-- TODO: fill in your real numbers. Something like: "Median end-to-end processing is Xs for a 30-second message; the TTS stage dominates at ~Ys." Do not guess — measure once and write the real figure. -->

**Caching.** An LRU cache sits in front of the model calls so repeat processing of the same message doesn't re-incur cost or latency. <!-- TODO: note the cache size / eviction policy and roughly what hit rate you see. -->

**Rate limiting.** Per-client limits protect the upstream API quotas from a single user uploading in a loop, and keep one tenant from degrading service for others.

**Failure handling.** Upstream model APIs fail — timeouts, 429s, occasional 5xxs. The pipeline degrades in stages rather than all at once: if TTS fails, the transcript and summary still land in the inbox and the message is marked partially processed rather than lost. <!-- TODO: adjust this to describe what your code actually does. If you have a circuit breaker on the Claude call, name it here. -->

**Cost.** <!-- TODO: approximate cost per processed message, if you've worked it out. Reviewers notice when a candidate has thought about unit economics. Delete this block if you haven't. -->

---

## Code review and collaboration

ClearCall took an external contribution from a Principal Solutions Architect at Microsoft, adding LRU caching, rate limiting, and an alternate STT provider. I reviewed the PR, identified and patched a security issue before merge, and integrated it. <!-- TODO: link the PR — the diff and review thread are stronger evidence than this paragraph. -->

---

## Tech stack

| Layer     | Tech                                        |
|-----------|---------------------------------------------|
| Backend   | Python 3.12, FastAPI, SQLAlchemy            |
| Frontend  | React 18, TypeScript, Vite, Tailwind        |
| Auth      | JWT (python-jose, passlib/bcrypt)           |
| Database  | SQLite (dev) / PostgreSQL (prod)            |
| Storage   | Local filesystem (dev) / S3 (prod)          |
| AI        | Whisper (STT), Claude (cleaning + summary), ElevenLabs (TTS) |

---

## Running it locally

Requires Python 3.12+ and Node 18+. You'll need API keys for the model providers — see `.env.example`.

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env        # add your API keys
python seed.py              # seed demo data
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Backend on `:8000` (interactive docs at `/docs`), frontend on `:5173`.

**Demo accounts** — seeded by `seed.py`:

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Client   | demo@clearcall.ai      | password123 |
| Business | business@clearcall.ai  | password123 |

---

## API

<details>
<summary>Endpoint reference</summary>

**Auth**

| Method | Endpoint               | Description     |
|--------|------------------------|-----------------|
| POST   | /auth/signup           | User signup     |
| POST   | /auth/login            | User login      |
| POST   | /auth/business/signup  | Business signup |
| POST   | /auth/business/login   | Business login  |

**Messages** — requires user JWT

| Method | Endpoint                 | Description              |
|--------|--------------------------|--------------------------|
| POST   | /messages/upload         | Upload audio + process   |
| GET    | /messages                | List user's messages     |
| GET    | /messages/{id}           | Get message + transcript |
| POST   | /messages/{id}/process   | Reprocess message        |

**Business** — requires business JWT

| Method | Endpoint                        | Description         |
|--------|---------------------------------|---------------------|
| GET    | /business/messages              | Business inbox      |
| GET    | /business/messages/{id}         | Message detail      |
| PATCH  | /business/messages/{id}/status  | Update status tag   |
| GET    | /business/profile               | Business profile    |

</details>

<details>
<summary>Project layout</summary>

```
backend/
  main.py                   FastAPI entry point
  seed.py                   Demo data seeder
  core/
    database.py             SQLAlchemy engine + session
    auth.py                 JWT helpers + route dependencies
  models/all_models.py
  routers/
    auth.py  messages.py  business.py
  services/
    ai_pipeline.py          STT → clean → summarize → TTS

frontend/src/
  App.tsx                   Routes + auth guards
  lib/api.ts                Axios client
  hooks/useAuth.tsx         Auth context
  components/shared.tsx     Logo, AudioPlayer, StatusBadge, Spinner
  pages/
    Login.tsx  Signup.tsx
    app/                    Client: Home, Record, Messages, Onboarding
    business/Business.tsx   Dashboard, inbox, detail, settings
```

</details>

---

## Deployment notes

<details>
<summary>PostgreSQL and S3</summary>

**PostgreSQL** — set `DATABASE_URL=postgresql://user:password@host:5432/clearcall` in `.env`, install `psycopg2-binary`, and uncomment it in `requirements.txt`.

**S3** — set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, and `AWS_REGION` in `.env`. The upload handler in `routers/messages.py` writes to S3 when these are present and falls back to local disk otherwise.

</details>

---

Built by [Gulet Kalif](https://www.linkedin.com/in/gkalif) · [github.com/gkalif](https://github.com/gkalif)
