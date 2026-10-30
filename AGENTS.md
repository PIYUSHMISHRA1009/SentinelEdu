# SentinelEdu agent guide

SentinelEdu is a student-performance analytics application. Work from the active FastAPI and React entry points and verify behavior before documenting it.

## Stack

- Backend: Python, FastAPI, SQLAlchemy, Pydantic, scikit-learn, bcrypt, JWT.
- Frontend: React, TypeScript, Vite, React Query, Recharts, Tailwind CSS.
- Data: SQLite by default for tests; PostgreSQL when `TEST_DATABASE_URL` is set.

## Repository map

- `backend/app/main.py`: FastAPI application, routers, metrics, and middleware.
- `backend/app/api/v1/`: HTTP routers.
- `backend/app/services/`: analytics, data-quality, and risk logic.
- `backend/app/db/`: SQLAlchemy models and sessions.
- `backend/tests/`: backend tests and test fixtures.
- `frontend/src/App.tsx`: active frontend routes.
- `frontend/src/api/client.ts`: active API client.
- `docs/`: project documentation.

## Commands

```sh
# Backend setup
cd backend
python3 -m venv venv
venv/bin/python -m pip install -r requirements.txt

# Run backend
venv/bin/uvicorn app.main:app --reload --port 8000

# SQLite tests
venv/bin/python -m pytest tests -q --cov=app

# PostgreSQL tests (provide a PostgreSQL URL)
TEST_DATABASE_URL="<PostgreSQL URL>" venv/bin/python -m pytest tests -q --cov=app

# Frontend
cd ../frontend
npm install
npm run dev
```

## Conventions

- Put HTTP endpoints in `backend/app/api/v1/` and business logic in `backend/app/services/`.
- Audit-log sensitive actions.
- Add tests for every new endpoint.
- Bind enum values as parameters in raw SQL; never hard-code enum strings.
- Inspect models before writing raw SQL.

## Gotchas

- SQLAlchemy enums are stored by member name; attendance labels include `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED`.
- SQLite can hide enum-comparison errors that PostgreSQL rejects.
- `SECRET_KEY` comes from the environment and is required when `ENVIRONMENT=production`.
- Do not commit `.env` files or model binaries.

## Definition of done

- The implementation and tests are updated together.
- Relevant commands pass, or any blocker is reported accurately.
- Documentation reflects verified code only.

## Do not

- Do not make unverified claims.
- Do not push changes.
