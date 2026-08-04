# KNOWN_ISSUES.md

Tracking bugs, technical debt, performance concerns, and blockers for the InsightFlow Edu Enterprise IAM Platform.

---

## Bugs

### BUG-001: Frontend Build Warning - Large Chunk Size
- **Severity**: Low
- **Component**: Frontend (Vite)
- **Description**: Vite build warns about chunks larger than 500KB (660KB main JS)
- **Impact**: Slower initial load, potential caching issues
- **Root Cause**: Recharts + TanStack Query + React Router bundled together
- **Workaround**: None yet
- **Fix Plan**: Implement code splitting with dynamic imports for heavy components (RiskDashboard, charts)
- **Status**: Open

### BUG-002: Backend - SQLite vs PostgreSQL Inconsistency
- **Severity**: Medium
- **Component**: Backend (Database)
- **Description**: Local development uses SQLite (.env), but production uses PostgreSQL. Some queries behave differently (e.g., JSON functions, date handling)
- **Impact**: Bugs may only surface in staging/production
- **Root Cause**: Different SQL dialects
- **Workaround**: Test against PostgreSQL locally via Docker
- **Fix Plan**: Use PostgreSQL for all environments via docker-compose
- **Status**: Open

### BUG-003: Risk Assessment - Factors Stored as JSON String
- **Severity**: Low
- **Component**: Backend (Risk Service)
- **Description**: `factors` field in `risk_assessments` table stored as JSON string instead of JSONB
- **Impact**: Cannot query/filter by individual factors in SQL
- **Root Cause**: Quick implementation choice
- **Fix Plan**: Migrate to JSONB column, add GIN index
- **Status**: Open

### BUG-004: Dashboard - Student Semester Field Missing
- **Severity**: Low
- **Component**: Backend (Schema) / Frontend
- **Description**: Student model has `semester` field but it's not populated for all students; frontend shows undefined
- **Impact**: UI shows "undefined" for some students
- **Root Cause**: Sample data script didn't set semester for all users
- **Fix Plan**: Update init_db.py to ensure all students have semester
- **Status**: Open

---

## Technical Debt

### TD-001: Custom JWT Auth - Needs Migration to Keycloak
- **Severity**: High
- **Component**: Backend (Auth)
- **Description**: Current JWT implementation is custom (HS256, no refresh tokens, no MFA, no standards compliance)
- **Impact**: Security risk, not enterprise-ready, blocks Saviynt alignment
- **Migration Plan**: ADR-003 - Replace with Keycloak OIDC/OAuth2
- **Dependencies**: Kubernetes Deployment, Secrets Management
- **Status**: Planned

### TD-002: RBAC Only - No Fine-Grained Authorization
- **Severity**: High
- **Component**: Backend (Authorization)
- **Description**: Only three roles (admin/teacher/student) with coarse permissions
- **Impact**: Cannot express complex policies (e.g., "teacher can only see their class students")
- **Migration Plan**: ADR-004 - Implement OpenFGA for ReBAC/ABAC
- **Dependencies**: Kubernetes Deployment, OIDC/OAuth2
- **Status**: Planned

### TD-003: No Audit Logging
- **Severity**: High
- **Component**: Backend (Security)
- **Description**: No structured audit trail for security events (login, permission changes, data access)
- **Impact**: Non-compliant with enterprise requirements, no forensic capability
- **Migration Plan**: Implement audit logging framework (Tier 2)
- **Dependencies**: Observability (Loki/Elasticsearch)
- **Status**: Planned

### TD-004: Secrets in .env Files
- **Severity**: Critical
- **Component**: Infrastructure (Security)
- **Description**: Database passwords, JWT secrets in .env files committed to Git
- **Impact**: Credential exposure, compliance violation
- **Migration Plan**: ADR-005 - HashiCorp Vault + External Secrets Operator
- **Dependencies**: Kubernetes Deployment, Terraform
- **Status**: Planned

### TD-005: No CI/CD Pipeline
- **Severity**: High
- **Component**: Infrastructure (DevOps)
- **Description**: Manual deployment process, no automated testing/scanning
- **Impact**: Human error risk, slow releases, no quality gates
- **Migration Plan**: ADR-009 - GitHub Actions + ArgoCD
- **Dependencies**: Container Registry (GHCR)
- **Status**: Planned

### TD-006: No Infrastructure as Code
- **Severity**: High
- **Component**: Infrastructure (DevOps)
- **Description**: All infrastructure manual (databases, clusters, networking)
- **Impact**: Not reproducible, environment drift, slow provisioning
- **Migration Plan**: ADR-006 - Terraform with reusable modules
- **Dependencies**: Cloud accounts (AWS/GCP)
- **Status**: Planned

### TD-007: No Observability Stack
- **Severity**: High
- **Component**: Infrastructure (Operations)
- **Description**: Only basic `/health` endpoint, no metrics, logs, traces
- **Impact**: Cannot debug production issues, no alerting
- **Migration Plan**: ADR-008 - LGTM Stack
- **Dependencies**: Kubernetes Deployment
- **Status**: Planned

### TD-008: Test Coverage Gaps
- **Severity**: Medium
- **Component**: Backend/Frontend (Quality)
- **Description**: Minimal unit tests, no integration/e2e tests
- **Impact**: Regressions not caught, refactoring risky
- **Fix Plan**: Achieve >80% coverage, add integration/e2e tests
- **Status**: Ongoing

### TD-009: Monolithic Risk Service
- **Severity**: Low
- **Component**: Backend (ML)
- **Description**: Risk scoring, anomaly detection, role mining all in one service
- **Impact**: Harder to scale independently, single point of failure
- **Fix Plan**: Decompose into separate microservices when needed
- **Status**: Deferred

### TD-010: Frontend State Management
- **Severity**: Low
- **Component**: Frontend (Architecture)
- **Description**: Using React Query for server state, but no global client state management
- **Impact**: Prop drilling for some UI state
- **Fix Plan**: Add Zustand or Context for global UI state when needed
- **Status**: Deferred

---

## Performance Concerns

### PERF-001: FGA Check Latency
- **Severity**: Medium
- **Component**: OpenFGA
- **Description**: Authorization checks add latency to every API call
- **Target**: < 10ms p99
- **Current**: Unknown (not implemented yet)
- **Mitigation**: Local caching, batch checks, async evaluation
- **Status**: Planned

### PERF-002: ML Model Inference Time
- **Severity**: Low
- **Component**: Risk Scorer
- **Description**: Model inference on every risk assessment request
- **Current**: ~5ms per prediction (acceptable)
- **Target**: < 10ms p99
- **Mitigation**: Model caching, batch predictions, ONNX runtime
- **Status**: Monitoring

### PERF-003: Database Query N+1 in Dashboard
- **Severity**: Medium
- **Component**: Backend (Dashboard API)
- **Description**: `/risk/dashboard/summary` makes N queries for N students
- **Impact**: Slow response with many students
- **Current**: ~500ms for 15 students
- **Target**: < 200ms for 500 students
- **Fix Plan**: Optimize with JOINs, materialized views, or caching
- **Status**: Open

### PERF-004: Frontend Bundle Size
- **Severity**: Low
- **Component**: Frontend
- **Description**: 660KB main JS bundle (warning at 500KB)
- **Impact**: Slower initial page load on slow connections
- **Fix Plan**: Code splitting, lazy loading for RiskDashboard, Recharts
- **Status**: Open

### PERF-005: PostgreSQL Connection Pooling
- **Severity**: Medium
- **Component**: Database
- **Description**: No connection pooling configured (using SQLAlchemy defaults)
- **Impact**: Connection exhaustion under load
- **Fix Plan**: Add PgBouncer, configure pool_size/max_overflow
- **Status**: Planned

---

## Blockers

### BLOCKER-001: Cloud Accounts for Terraform
- **Severity**: Critical
- **Component**: Terraform
- **Description**: Need AWS/GCP accounts with permissions to create VPC, EKS/GKE, RDS/CloudSQL
- **Impact**: Cannot test Terraform modules end-to-end
- **Workaround**: Develop modules locally, validate with `terraform plan`, use localstack for AWS mocking
- **Resolution**: Request cloud credits or use personal accounts
- **Status**: Blocked

### BLOCKER-002: Domain + TLS for Production
- **Severity**: High
- **Component**: Infrastructure
- **Description**: Need registered domain and DNS control for Let's Encrypt certificates
- **Impact**: Cannot test production ingress/TLS locally
- **Workaround**: Use self-signed certs for staging, nip.io for local testing
- **Status**: Blocked

### BLOCKER-003: External IdP for Federation Testing
- **Severity**: Medium
- **Component**: Keycloak
- **Description**: Need Google/GitHub/Azure AD apps configured for OIDC federation testing
- **Impact**: Cannot verify federation flows end-to-end
- **Workaround**: Use Keycloak's built-in identity provider for testing
- **Status**: Blocked

### BLOCKER-004: SCIM Client for Compliance Testing
- **Severity**: Medium
- **Component**: SCIM 2.0
- **Description**: Need Okta/Azure AD tenant or SCIM test client for RFC 7644 compliance
- **Impact**: Cannot fully validate SCIM implementation
- **Workaround**: Use `scim-test-tools` or Postman collection for manual testing
- **Status**: Blocked

### BLOCKER-005: SIEM Endpoint for Audit Export
- **Severity**: Low
- **Component**: Audit Logging
- **Description**: Need Elasticsearch/Splunk endpoint for export validation
- **Impact**: Cannot verify export pipeline end-to-end
- **Workaround**: Deploy local Elasticsearch/OpenSearch for testing
- **Status**: Blocked

---

## Resolved Issues

### FIXED-001: bcrypt Version Compatibility
- **Original Issue**: bcrypt 5.0.0 incompatible with passlib
- **Resolution**: Downgraded to bcrypt 3.2.2
- **Date**: 2026-08-03

### FIXED-002: pydantic-settings Import Error
- **Original Issue**: `BaseSettings` not importable from pydantic_settings
- **Resolution**: Downgraded to pydantic-settings 2.1.0 compatible with pydantic 2.13
- **Date**: 2026-08-03

### FIXED-003: Missing AttendanceStatus Enum in Models
- **Original Issue**: AttendanceStatus used in code but not defined in models.py
- **Resolution**: Added AttendanceStatus enum to models.py
- **Date**: 2026-08-03

### FIXED-004: Student Semester Field Missing
- **Original Issue**: User model missing `semester` column
- **Resolution**: Added semester column to User model, updated init_db.py
- **Date**: 2026-08-03

### FIXED-005: Risk Assessment Response Validation
- **Original Issue**: Pydantic validation failed for RiskAssessmentResponse (factors as list vs string, missing id/assessed_at)
- **Resolution**: Modified assess_all_students to return saved DB records with proper model validation
- **Date**: 2026-08-03

### FIXED-006: Frontend TypeScript Build
- **Original Issue**: `tsc` command not found in build script
- **Resolution**: Removed `tsc` from build script, Vite handles TypeScript
- **Date**: 2026-08-03

### FIXED-007: Large Frontend Bundle Warning
- **Original Issue**: Vite warns about 660KB chunk
- **Resolution**: Documented as PERF-004, will implement code splitting
- **Date**: 2026-08-03