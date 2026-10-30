# Known limitations

- Risk-scoring model training data and labels are synthetic; no accuracy claim is made.
- The test suite defaults to in-memory SQLite. PostgreSQL tests require `TEST_DATABASE_URL` and an available PostgreSQL database.
- Frontend lint currently reports existing unused-import errors, so it is not a passing verification command.
- Risk-assessment factors are stored as text containing JSON, not as a native JSON database column.
