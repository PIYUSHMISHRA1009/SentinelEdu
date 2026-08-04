# CHANGELOG.md

All notable changes to the InsightFlow Edu Enterprise IAM Platform.

---

## [Unreleased] - 2026-08-03

### Added
- Context folder with project tracking documents (CURRENT_GOALS.md, PROGRESS_TRACKER.md, ARCHITECTURE.md, DECISIONS.md, ROADMAP.md, KNOWN_ISSUES.md)
- Initial project structure for Enterprise IAM upgrade

### Changed
- Migrated from Spring Boot + Oracle to FastAPI + PostgreSQL (completed in previous session)
- Implemented JWT auth with RBAC (admin/teacher/student)
- Built ML risk scoring with scikit-learn (Isolation Forest / Logistic Regression)
- Created React dashboard with Recharts for risk visualization
- Dockerized backend and frontend

### Fixed
- bcrypt 5.0.0 compatibility with passlib (downgraded to 3.2.2)
- pydantic-settings import error (pinned to 2.1.0)
- Missing AttendanceStatus enum in models
- Student semester field missing from User model
- Risk assessment response validation (factors as list vs string)
- Frontend TypeScript build (removed tsc from build script)

---

## [1.0.0] - 2026-08-03 (Original Spring Boot Version)

### Added
- Student performance tracking (500+ records)
- Risk detection with static thresholds
- REST APIs for students, grades, attendance
- Spring Boot backend with Oracle Database
- React frontend with basic dashboard
- JWT authentication with role-based access

---

## Legend

| Type | Description |
|------|-------------|
| Added | New features |
| Changed | Changes in existing functionality |
| Deprecated | Soon-to-be removed features |
| Removed | Now removed features |
| Fixed | Bug fixes |
| Security | Vulnerability fixes |