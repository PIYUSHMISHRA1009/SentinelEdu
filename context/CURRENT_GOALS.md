# CURRENT_GOALS.md

This file is the single source of truth for the InsightFlow Edu Enterprise IAM Platform Upgrade project.

---

## Tier 1 — Platform Engineering

### 1. GitHub Actions CI/CD
- **Goal**: Fully automated CI/CD pipeline with security scanning and release automation
- **Description**: Multi-stage pipeline covering lint, format, test, Docker build, Trivy vulnerability scan, image signing, and deployment to staging/production
- **Priority**: Critical
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: None
- **Expected Deliverables**:
  - `.github/workflows/ci.yml` - Continuous Integration
  - `.github/workflows/cd.yml` - Continuous Deployment
  - `.github/workflows/release.yml` - Release automation
  - `.github/workflows/security.yml` - Security scanning
- **Validation Checklist**:
  - [ ] Lint passes (ruff, eslint)
  - [ ] Format check passes (black, prettier)
  - [ ] Unit tests pass (pytest, vitest)
  - [ ] Integration tests pass
  - [ ] Docker images build and push to registry
  - [ ] Trivy scan passes with no HIGH/CRITICAL vulnerabilities
  - [ ] Images signed with cosign
  - [ ] Deploy to staging on merge to main
  - [ ] Deploy to production on tag

---

### 2. Kubernetes Deployment
- **Goal**: Production-ready Kubernetes deployment with Helm and Kustomize
- **Description**: Helm charts for all services with Kustomize overlays for environment-specific configuration
- **Priority**: Critical
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: GitHub Actions CI/CD (for image publishing)
- **Expected Deliverables**:
  - `helm/insightflow/` - Umbrella Helm chart
  - `helm/insightflow/charts/backend/` - Backend subchart
  - `helm/insightflow/charts/frontend/` - Frontend subchart
  - `helm/insightflow/charts/postgresql/` - PostgreSQL subchart
  - `helm/insightflow/charts/keycloak/` - Keycloak subchart
  - `helm/insightflow/charts/vault/` - Vault subchart
  - `helm/insightflow/charts/monitoring/` - Observability stack
  - `kustomize/overlays/dev/` - Development overlay
  - `kustomize/overlays/staging/` - Staging overlay
  - `kustomize/overlays/prod/` - Production overlay
- **Validation Checklist**:
  - [ ] All charts pass `helm lint`
  - [ ] `helm template` renders without errors
  - [ ] Deploy to kind cluster succeeds
  - [ ] HPA configured for backend/frontend
  - [ ] Liveness/readiness probes work
  - [ ] Ingress routes traffic correctly
  - [ ] PVCs provision for PostgreSQL
  - [ ] ConfigMaps/Secrets injected properly

---

### 3. Terraform Infrastructure
- **Goal**: Reusable, multi-cloud Terraform modules for infrastructure provisioning
- **Description**: Modular Terraform for VPC, IAM, Kubernetes clusters, databases, and storage on AWS and GCP
- **Priority**: Critical
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: None (can run in parallel)
- **Expected Deliverables**:
  - `terraform/modules/vpc/` - VPC with public/private subnets, NAT gateways
  - `terraform/modules/iam/` - IAM roles, policies, OIDC providers
  - `terraform/modules/eks/` - EKS cluster with managed node groups
  - `terraform/modules/gke/` - GKE cluster with node pools
  - `terraform/modules/rds/` - PostgreSQL with encryption, backup
  - `terraform/modules/cloudsql/` - Cloud SQL for GCP
  - `terraform/modules/s3/` - S3 buckets for state, artifacts
  - `terraform/modules/gcs/` - GCS buckets
  - `terraform/envs/dev/` - Development environment
  - `terraform/envs/staging/` - Staging environment
  - `terraform/envs/prod/` - Production environment
- **Validation Checklist**:
  - [ ] `terraform fmt` passes
  - [ ] `terraform validate` passes
  - [ ] `terraform plan` shows expected resources
  - [ ] Modules are reusable across environments
  - [ ] State backend configured (S3/GCS + DynamoDB/Cloud Lock)
  - [ ] Outputs documented

---

### 4. Observability
- **Goal**: Full LGTM stack (Loki, Grafana, Tempo, Prometheus) with alerting
- **Description**: Comprehensive observability covering metrics, logs, traces, and alerts
- **Priority**: Critical
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: Kubernetes Deployment
- **Expected Deliverables**:
  - `helm/insightflow/charts/monitoring/` - Monitoring stack chart
  - `monitoring/prometheus/rules/` - Alerting rules
  - `monitoring/grafana/dashboards/` - Pre-built dashboards
  - `monitoring/alertmanager/config.yml` - Alert routing
  - Backend instrumentation: `prometheus-fastapi-instrumentator`, OpenTelemetry
  - Frontend instrumentation: Web Vitals, error tracking
  - Distributed tracing with Tempo
  - Log aggregation with Loki
- **Validation Checklist**:
  - [ ] Prometheus scrapes all targets
  - [ ] Grafana dashboards load (cluster, app, business metrics)
  - [ ] Loki receives logs from all pods
  - [ ] Tempo receives traces
  - [ ] Alertmanager routes alerts correctly
  - [ ] SLO-based alerts configured (latency, error rate, availability)
  - [ ] Health endpoints return 200

---

### 5. Secrets Management
- **Goal**: Zero-secrets-in-git with HashiCorp Vault and External Secrets Operator
- **Description**: Secure secrets management with automatic rotation and environment separation
- **Priority**: Critical
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: Kubernetes Deployment, Terraform (for Vault deployment)
- **Expected Deliverables**:
  - `helm/insightflow/charts/vault/` - Vault Helm chart with auto-unseal
  - `helm/insightflow/charts/external-secrets/` - External Secrets Operator
  - `ExternalSecret` resources for each environment
  - `ClusterSecretStore` for Vault backend
  - Secret rotation policies
  - Git pre-commit hooks to prevent secret commits
- **Validation Checklist**:
  - [ ] Vault unsealed and accessible
  - [ ] External Secrets Operator syncs secrets
  - [ ] No secrets in Git history (verified with trufflehog)
  - [ ] Secrets rotated on schedule
  - [ ] Dev/staging/prod use separate secret paths
  - [ ] Applications consume secrets via Kubernetes secrets

---

## Tier 2 — Enterprise IAM

### 6. SCIM 2.0 Provisioning
- **Goal**: Full SCIM 2.0 implementation for automated user/group lifecycle management
- **Description**: RFC 7644 compliant endpoints for provisioning/deprovisioning identities
- **Priority**: High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: OIDC/OAuth2 (for authentication), Fine-Grained AuthZ (for permissions)
- **Expected Deliverables**:
  - `app/api/v1/scim.py` - SCIM endpoints
  - `GET /scim/v2/Users` - List users with pagination/filtering
  - `POST /scim/v2/Users` - Create user
  - `GET /scim/v2/Users/{id}` - Get user
  - `PUT /scim/v2/Users/{id}` - Replace user
  - `PATCH /scim/v2/Users/{id}` - Partial update (add/remove/replace)
  - `DELETE /scim/v2/Users/{id}` - Deprovision user
  - `GET /scim/v2/Groups` - List groups
  - `POST /scim/v2/Groups` - Create group
  - `GET /scim/v2/Groups/{id}` - Get group
  - `PUT /scim/v2/Groups/{id}` - Replace group
  - `PATCH /scim/v2/Groups/{id}` - Update group members
  - `DELETE /scim/v2/Groups/{id}` - Delete group
  - `GET /scim/v2/ServiceProviderConfig` - Provider metadata
  - `GET /scim/v2/ResourceTypes` - Supported resources
  - `GET /scim/v2/Schemas` - Schema definitions
- **Validation Checklist**:
  - [ ] All endpoints return correct HTTP status codes
  - [ ] Filtering works per RFC 7644
  - [ ] PATCH operations handle add/remove/replace correctly
  - [ ] ETags and concurrency control
  - [ ] Audit log entries for all operations
  - [ ] Integration test with SCIM client (e.g., Azure AD, Okta)

---

### 7. OIDC / OAuth2 Identity Provider
- **Goal**: Enterprise-grade OIDC/OAuth2 with Keycloak integration
- **Description**: SSO, PKCE, refresh tokens, federation, and role mapping
- **Priority**: High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: Kubernetes Deployment (for Keycloak), Secrets Management
- **Expected Deliverables**:
  - Keycloak realm configuration (Terraform/Helm)
  - `app/api/v1/auth_oidc.py` - OIDC endpoints
  - `GET /.well-known/openid-configuration` - Discovery
  - `GET /oauth2/jwks` - JWKS endpoint
  - `POST /oauth2/token` - Token endpoint (authorization_code, refresh_token, client_credentials)
  - `GET /oauth2/authorize` - Authorization endpoint with PKCE
  - `GET /oauth2/userinfo` - UserInfo endpoint
  - `POST /oauth2/revoke` - Token revocation
  - `POST /oauth2/introspect` - Token introspection
  - PKCE support (S256)
  - Refresh token rotation
  - Client registration (dynamic)
  - Identity Provider federation (SAML, OIDC)
  - Role/claim mapping from IdP to internal roles
- **Validation Checklist**:
  - [ ] Discovery document valid
  - [ ] JWKS rotates correctly
  - [ ] PKCE flow works end-to-end
  - [ ] Refresh tokens rotate and revoke
  - [ ] UserInfo returns correct claims
  - [ ] Federation with Google/GitHub/Azure AD works
  - [ ] Role mapping syncs to internal RBAC

---

### 8. Fine-Grained Authorization (FGA)
- **Goal**: Google Zanzibar-inspired authorization with OpenFGA
- **Description**: Relationship-based access control (ReBAC) with ABAC support
- **Priority**: High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: OIDC/OAuth2 (for user context), Kubernetes (for OpenFGA deployment)
- **Expected Deliverables**:
  - OpenFGA deployment (Helm)
  - `app/api/v1/fga.py` - FGA integration
  - Authorization model definition (`.fga.yaml`)
  - Tuple management API
  - `check` endpoint for permission evaluation
  - `list-objects` for resource filtering
  - `expand` for user's accessible resources
  - ABAC conditions (time, IP, risk score)
  - Migration from existing RBAC
- **Validation Checklist**:
  - [ ] Model validates in OpenFGA playground
  - [ ] Check latency < 10ms p99
  - [ ] Tuple CRUD works
  - [ ] ABAC conditions evaluate correctly
  - [ ] Existing RBAC migrated without breaking changes
  - [ ] Audit log for all authorization decisions

---

### 9. Access Certification Campaigns
- **Goal**: Automated access review and certification workflows
- **Description**: Periodic campaigns with reviewers, approvals, reminders, and reports
- **Priority**: High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: SCIM 2.0 (for user/group data), FGA (for permissions), Audit Logging
- **Expected Deliverables**:
  - `app/api/v1/certification.py` - Campaign endpoints
  - Campaign creation (scheduled, ad-hoc)
  - Reviewer assignment (manager, resource owner, delegated)
  - Certification items (user-role, user-group, user-resource)
  - Decision options: Approve, Revoke, Escalate
  - Automated reminders (email, in-app)
  - Escalation workflow
  - Certification report generation (PDF, CSV)
  - Audit trail for all decisions
  - Revocation integration with SCIM/FGA
- **Validation Checklist**:
  - [ ] Campaign creates items for all relevant permissions
  - [ ] Reviewers receive notifications
  - [ ] Decisions recorded with justification
  - [ ] Revocations executed automatically
  - [ ] Reports generated correctly
  - [ ] Campaign status dashboard works

---

### 10. Audit Logging
- **Goal**: Immutable, structured audit logging with SIEM integration
- **Description**: Comprehensive audit trail for all security-relevant events
- **Priority**: High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: Kubernetes (for Loki/Elasticsearch), Observability
- **Expected Deliverables**:
  - `app/core/audit.py` - Audit logging framework
  - Structured JSON log format with correlation IDs
  - Event types: authentication, authorization, provisioning, configuration, data access
  - Immutable storage (append-only, WORM)
  - Loki integration for querying
  - Elasticsearch/Splunk export pipeline
  - Log retention policies
  - Tamper-evident logging (hash chaining)
- **Validation Checklist**:
  - [ ] All security events logged
  - [ ] Correlation IDs trace requests across services
  - [ ] Logs queryable in Loki/Grafana
  - [ ] Export to Elasticsearch works
  - [ ] Export to Splunk works
  - [ ] Retention policies enforced
  - [ ] Hash chain verification passes

---

## Tier 3 — AI Security

### 11. Anomalous Access Detection
- **Goal**: ML-powered anomaly detection for security events
- **Description**: Isolation Forest model detecting impossible travel, privilege escalation, unusual access patterns
- **Priority**: Medium-High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: Audit Logging (for training data), Observability (for metrics/alerts)
- **Expected Deliverables**:
  - `app/services/anomaly_detector.py` - Detection service
  - Feature engineering pipeline (login time, location, device, resource, action)
  - Isolation Forest model training pipeline
  - Real-time scoring API
  - Alert generation for anomalies
  - Dashboard for anomaly visualization
  - Model retraining scheduler
  - False positive feedback loop
- **Validation Checklist**:
  - [ ] Model AUC > 0.85 on test set
  - [ ] Impossible travel detected correctly
  - [ ] Privilege escalation flagged
  - [ ] Unusual access times detected
  - [ ] Alerts fire in Alertmanager
  - [ ] False positive rate < 5%

---

### 12. Risk-Based Authentication
- **Goal**: Adaptive MFA based on contextual risk scoring
- **Description**: Risk engine evaluating device, location, behavior to determine authentication requirements
- **Priority**: Medium-High
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: Anomalous Access Detection, OIDC/OAuth2, Audit Logging
- **Expected Deliverables**:
  - `app/services/risk_engine.py` - Risk scoring service
  - Device fingerprinting (browser, OS, screen, timezone)
  - GeoIP enrichment (MaxMind/GeoLite2)
  - Behavioral baselines per user
  - Risk score calculation (0-100)
  - Policy engine: Allow / Step-up MFA / Deny
  - Integration with Keycloak authentication flows
  - Risk dashboard for admins
- **Validation Checklist**:
  - [ ] Known devices score low risk
  - [ ] New devices trigger step-up
  - [ ] Impossible travel triggers deny
  - [ ] Risk scores explainable
  - [ ] MFA integration works with Keycloak
  - [ ] Admin dashboard shows risk trends

---

### 13. Automated Role Mining
- **Goal**: Discover optimal role definitions from actual access patterns
- **Description**: Clustering analysis to recommend least-privilege roles
- **Priority**: Medium
- **Current Status**: 🚧 In Progress
- **Progress %**: 0%
- **Dependencies**: SCIM 2.0, FGA, Audit Logging (for access data)
- **Expected Deliverables**:
  - `app/services/role_miner.py` - Mining service
  - Access matrix construction (users × permissions)
  - Clustering algorithms (k-means, hierarchical, DBSCAN)
  - Role candidate generation
  - Least privilege analysis (excess permissions)
  - Role recommendation API
  - Analytics dashboard (role quality, coverage, redundancy)
  - Export to FGA model
- **Validation Checklist**:
  - [ ] Clusters form meaningful roles
  - [ ] Coverage > 90% of current permissions
  - [ ] Redundancy < 20%
  - [ ] Recommendations exportable to FGA
  - [ ] Dashboard visualizes role quality

---

## Implementation Order (Critical Path)

```
Week 1:
├── GitHub Actions CI/CD (blocking for all deployments)
├── Kubernetes Helm Charts (local kind cluster)
├── Terraform modules (AWS/GCP) - parallel
└── Observability stack (Prometheus, Grafana, Loki, Tempo)

Week 2:
├── Secrets Management (Vault + External Secrets)
├── OIDC/OAuth2 (Keycloak)
├── SCIM 2.0
└── Fine-Grained AuthZ (OpenFGA)

Week 3:
├── Access Certification
├── Audit Logging
├── Anomalous Access Detection
└── Risk-Based Authentication

Week 4:
├── Automated Role Mining
├── Documentation (RUNBOOK, THREAT_MODEL, etc.)
├── Testing (unit, integration, e2e, load)
└── Polish & validation
```