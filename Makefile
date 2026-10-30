.PHONY: run test test-pg lint

run:
	cd backend && venv/bin/uvicorn app.main:app --reload --port 8000

test:
	cd backend && venv/bin/python -m pytest tests -q --cov=app

test-pg:
	test -n "$(TEST_DATABASE_URL)"
	cd backend && TEST_DATABASE_URL="$(TEST_DATABASE_URL)" venv/bin/python -m pytest tests -q --cov=app

lint:
	backend/venv/bin/python -B -c "import pathlib; [compile(path.read_text(), str(path), 'exec') for path in pathlib.Path('backend/app').rglob('*.py')]"
