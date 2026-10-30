# Contributing

## Backend
    cd backend
    pip install -r requirements.txt
    ruff check app scripts
    black --check app scripts
    python -m pytest tests -q

Tests run on SQLite by default. To run them against PostgreSQL, set `TEST_DATABASE_URL` to a PostgreSQL connection string.

## Frontend
    cd frontend
    npm ci
    npm run lint
    npm run test -- --run
    npm run build

## Pull requests
Keep commits small with conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`). Lint, tests and build should pass before opening a PR.
