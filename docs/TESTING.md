# Testing

Backend tests are in `backend/tests/` and use pytest with FastAPI's test client.

The verified SQLite run contains 44 tests at 75% coverage. Tests default to an in-memory SQLite database. Set `TEST_DATABASE_URL` to run the same suite against PostgreSQL.

```sh
cd backend
venv/bin/python -m pytest tests -q --cov=app

TEST_DATABASE_URL="<PostgreSQL URL>" venv/bin/python -m pytest tests -q --cov=app
```

CI runs the backend test command with a PostgreSQL service and `TEST_DATABASE_URL` configured.
