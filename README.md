# MedPrep Chart — Backend

Node.js/Express API for the MedPrep Chart platform: lecture PDF storage, AI-generated
practice questions, and timed exam simulations.

## Stack
- **Express** — HTTP API
- **PostgreSQL + Prisma** — database & ORM
- **JWT** — auth (student vs admin roles)
- **Multer** — PDF upload handling (stored locally in `/uploads`; swap for S3 when you scale)
- **pdf-parse** — extracts text from uploaded lecture PDFs
- **Anthropic SDK (Claude)** — generates practice questions from lecture text

## Setup

```bash
cd medprep-backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npm run dev
```

Needs a Postgres database. Easiest options: [Railway](https://railway.app),
[Supabase](https://supabase.com) (Postgres-only, ignore their auth), or a local Postgres install.

## Auth model
- `STUDENT` (default on signup) — can browse lectures, take exams, view own results
- `ADMIN` — can upload PDFs and trigger AI question generation

To make yourself an admin, register normally then flip the role in the DB:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@school.edu';
```
(or use `npx prisma studio` for a GUI)

## API Reference

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, password, name, school }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | student | current user |

### Lectures (PDFs)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/lectures` | student | list all lectures |
| GET | `/api/lectures/:id` | student | lecture detail |
| POST | `/api/lectures` | admin | multipart upload: `file`, `title`, `subject` |
| DELETE | `/api/lectures/:id` | admin | remove lecture + file |
| POST | `/api/lectures/:id/generate-questions` | admin | `{ count }` → calls Claude, saves questions |

### Questions
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/questions?lectureId=&difficulty=` | student | filterable list |
| GET | `/api/questions/:id` | student | single question |

### Exams (timed simulation)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/exams` | student | `{ title, lectureIds[], numQuestions, durationMinutes }` → starts session, returns questions (no answers) |
| POST | `/api/exams/:id/submit` | student | `{ answers: [{answerId, selectedAnswer}] }` → scores it |
| GET | `/api/exams/:id/results` | student | full review with correct answers + explanations |
| GET | `/api/exams` | student | exam history |

## Notes / next steps
- File storage is local disk for now — fine to launch, but move to S3/Cloudflare R2 before
  you have real users on a server that redeploys/restarts (files would be lost).
- `pdf-parse` handles text-based PDFs; scanned/image-only slide decks will need OCR later.
- Question generation is synchronous — for large lecture PDFs consider making this a background
  job (e.g. a simple queue) so the admin upload panel doesn't hang on a long Claude call.
- CORS is wide open in dev; lock `CLIENT_URL` down before deploying.
