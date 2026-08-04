# DECISIONS.md

Architectural Decision Records (ADRs) for the InsightFlow Edu Enterprise IAM Platform.

---

## ADR-001: Framework Choice - FastAPI over Django/Spring Boot

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need a modern, high-performance Python web framework for the backend API. The original project used Spring Boot.

### Decision
Use **FastAPI** with Pydantic v2 for the backend.

### Alternatives Considered
| Framework | Pros | Cons |
|-----------|------|------|
| Django | Mature, admin, ORM | Heavier, slower, async limited |
| Spring Boot | Enterprise standard, JVM ecosystem | Not Python, heavier ops |
| Flask | Simple, flexible | No built-in validation, async limited |

### Consequences
- **Positive**: Native async, automatic OpenAPI docs, Pydantic validation, high performance, great developer experience
- **Negative**: Smaller ecosystem than Django/Spring, need to build admin/auth ourselves
- **Mitigation**: Use SQLAlchemy 2.0 for ORM, build custom admin UI in React

---

## ADR-002: Database - PostgreSQL over Oracle/MySQL

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need a production-grade relational database. Original used Oracle.

### Decision
Use **PostgreSQL 15+** as primary database.

### Alternatives Considered
| Database | Pros | Cons |
|----------|------|------|
| Oracle | Enterprise features | Expensive, vendor lock-in |
| MySQL | Widely used | Weaker JSON, no CTEs (older versions) |
| SQLite | Simple, file-based | Not production-ready for concurrent writes |

### Consequences
- **Positive**: Advanced JSON support, CTEs, window functions, extensions (pgvector, pg_trgm), open source, cloud-managed everywhere
- **Negative**: No built-in advanced security (use pgcrypto, RLS)
- **Mitigation**: Implement row-level security, column encryption at app layer

---

## ADR-003: Authentication - Migrate from Custom JWT to Keycloak OIDC/OAuth2

**Date**: 2026-08-03
**Status**: Accepted

### Context
Current implementation uses custom JWT with HS256. Need enterprise-grade auth for Saviynt alignment.

### Decision
Migrate to **Keycloak** as OIDC/OAuth2 Identity Provider.

### Alternatives Considered
| Solution | Pros | Cons |
|----------|------|------|
| Custom JWT | Simple, full control | No MFA, no federation, no standards compliance |
| Auth0/Clerk | Managed, feature-rich | Cost, vendor lock-in, data residency |
| AWS Cognito | Integrated with AWS | Limited OIDC features, vendor lock-in |
| Keycloak | Open source, full OIDC/SAML, self-hosted | Operational overhead |

### Consequences
- **Positive**: Full OIDC/OAuth2/SAML, MFA, federation, PKCE, refresh rotation, user management UI, free
- **Negative**: Additional infrastructure, Java-based (memory), learning curve
- **Mitigation**: Helm chart for deployment, Terraform for config, dedicate resources

---

## ADR-004: Authorization - OpenFGA for Fine-Grained Access Control

**Date**: 2026-08-03
**Status**: Accepted

### Context
Current RBAC (admin/teacher/student) is insufficient for enterprise IAM. Need ReBAC/ABAC.

### Decision
Use **OpenFGA** (open-source Google Zanzibar implementation) for fine-grained authorization.

### Alternatives Considered
| Solution | Pros | Cons |
|----------|------|------|
| Custom RBAC/ABAC | Full control | Complex to maintain, no audit trail |
| OPA/Gatekeeper | Policy as code, K8s native | Rego learning curve, not relationship-based |
| Casbin | Multi-model, Go/Rust/Python | Less mature ReBAC, no managed offering |
| OpenFGA | Zanzibar model, ReBAC native, CNCF | Newer project, smaller community |

### Consequences
- **Positive**: Relationship-based tuples, horizontal scaling, HTTP/gRPC, TypeScript/Python SDKs, tuple management API
- **Negative**: Additional service, tuple consistency model (eventual), modeling complexity
- **Mitigation**: Start with hybrid (RBAC + FGA), migrate incrementally, use OpenFGA UI for modeling

---

## ADR-005: Secrets Management - HashiCorp Vault + External Secrets Operator

**Date**: 2026-08-03
**Status**: Accepted

### Context
Currently using .env files with secrets in Git. Need zero-secrets-in-git for production.

### Decision
Use **HashiCorp Vault** with **External Secrets Operator** for Kubernetes-native secret sync.

### Alternatives Considered
| Solution | Pros | Cons |
|----------|------|------|
| Sealed Secrets | GitOps-friendly, no extra infra | No rotation, no dynamic secrets |
| AWS Secrets Manager | Managed, integrated | Vendor lock-in, cost |
| Doppler | Developer-friendly, sync | SaaS, cost |
| Vault + ESO | Dynamic secrets, rotation, K8s-native, open source | Operational complexity |

### Consequences
- **Positive**: Dynamic database credentials, PKI, auto-rotation, Kubernetes auth, audit logging, open source
- **Negative**: Vault HA setup complexity, unseal process, resource requirements
- **Mitigation**: Auto-unseal with KMS, Raft storage, Helm chart with defaults, monitoring

---

## ADR-006: Infrastructure as Code - Terraform with Multi-Cloud Modules

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need reproducible, version-controlled infrastructure for AWS and GCP.

### Decision
Use **Terraform** with reusable modules supporting both AWS and GCP.

### Alternatives Considered
| Solution | Pros | Cons |
|----------|------|------|
| Pulumi | General-purpose languages | Smaller ecosystem, state management |
| Crossplane | K8s-native, GitOps | Immature, complex |
| CloudFormation/Deployment Manager | Native | Vendor lock-in, limited abstraction |
| Terraform | Mature, large ecosystem, multi-cloud | HCL learning curve, state management |

### Consequences
- **Positive**: Largest provider ecosystem, modules, workspaces, plan/apply workflow, drift detection
- **Negative**: State file management, HCL limitations, no native testing
- **Mitigation**: Remote state (S3/GCS + DynamoDB/Cloud Lock), terraform-docs, Terratest for testing

---

## ADR-007: Kubernetes Deployment - Helm + Kustomize

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need templating and environment-specific configuration for Kubernetes manifests.

### Decision
Use **Helm** for packaging and **Kustomize** for environment overlays.

### Alternatives Considered
| Solution | Pros | Cons |
|----------|------|------|
| Helm only | Package management, dependencies | Values files get complex |
| Kustomize only | Native, no templates | No package management |
| Helm + Kustomize | Best of both | Two tools to learn |
| Kpt | Google-backed, functions | Smaller community |

### Consequences
- **Positive**: Helm for distribution/dependencies, Kustomize for patches/overlays, GitOps-friendly
- **Negative**: Two templating systems, potential conflicts
- **Mitigation**: Clear separation: Helm = package, Kustomize = environment config

---

## ADR-008: Observability - LGTM Stack (Loki, Grafana, Tempo, Prometheus)

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need comprehensive observability. Current: basic health endpoint only.

### Decision
Deploy full **LGTM stack** via Helm (Grafana kube-prometheus-stack + loki-stack + tempo).

### Alternatives Considered
| Stack | Pros | Cons |
|-------|------|------|
| ELK/EFK | Mature, powerful | Resource heavy, complex |
| Datadog/New Relic | Managed, full-featured | Expensive, vendor lock-in |
| LGTM | Open source, integrated, cloud-native | Newer, Loki query language (LogQL) learning curve |
| Jaeger + Prometheus + EFK | Best-of-breed | Multiple UIs, integration effort |

### Consequences
- **Positive**: Single vendor (Grafana Labs), unified UI, native integration, cost-effective, cloud-native
- **Negative**: LogQL different from Lucene/ES, Tempo requires object storage
- **Mitigation**: Pre-built dashboards, LogQL documentation, MinIO for local Tempo storage

---

## ADR-009: CI/CD - GitHub Actions + ArgoCD

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need automated pipeline from code to production with security gates.

### Decision
**GitHub Actions** for CI (build, test, scan, sign), **ArgoCD** for CD (GitOps deployment).

### Alternatives Considered
| CI/CD | Pros | Cons |
|-------|------|------|
| GitLab CI | Integrated | Need GitLab |
| Jenkins | Mature, plugins | Maintenance heavy, not cloud-native |
| CircleCI | Fast, config | Cost at scale |
| GitHub Actions + ArgoCD | Native to GitHub, GitOps, free for public | Actions minutes cost for private |

### Consequences
- **Positive**: Native GitHub integration, reusable workflows, OIDC for cloud auth, ArgoCD for GitOps drift detection
- **Negative**: Two systems, Actions runner costs for private repos
- **Mitigation**: Self-hosted runners for heavy jobs, workflow templates

---

## ADR-010: ML Framework - scikit-learn + Joblib (Keep Existing)

**Date**: 2026-08-03
**Status**: Accepted

### Context
Current risk scoring uses scikit-learn LogisticRegression/DecisionTree with joblib persistence.

### Decision
Keep **scikit-learn + joblib** for ML models. Add MLflow for experiment tracking later.

### Alternatives Considered
| Framework | Pros | Cons |
|-----------|------|------|
| PyTorch/TensorFlow | Deep learning | Overkill for tabular data |
| XGBoost/LightGBM | Gradient boosting | Additional dependency |
| MLflow | Experiment tracking | Additional infrastructure |
| scikit-learn + joblib | Simple, no deps, fast inference | No experiment tracking, no model registry |

### Consequences
- **Positive**: Zero additional deps, fast inference (<5ms), model fits in memory, easy to retrain
- **Negative**: No experiment tracking, no model versioning, no A/B testing
- **Mitigation**: Add MLflow in Phase 2, use DVC for data versioning

---

## ADR-011: Frontend - React + Vite + Tailwind (Keep Existing)

**Date**: 2026-08-03
**Status**: Accepted

### Context
Current frontend uses React 18, Vite, TypeScript, Tailwind, Recharts.

### Decision
Keep existing stack. Add TanStack Query v5, React Router v6, testing with Vitest.

### Alternatives Considered
| Stack | Pros | Cons |
|-------|------|------|
| Next.js | SSR, RSC, file routing | Overkill for dashboard, Vercel lock-in |
| Remix | Nested routing, loaders | Learning curve |
| React + Vite | Fast, simple, flexible | No SSR (not needed for dashboard) |

### Consequences
- **Positive**: Familiar, fast HMR, no SSR complexity, easy to deploy as static files
- **Negative**: No SSR (SEO not needed for auth'd dashboard)
- **Mitigation**: N/A - dashboard doesn't need SEO

---

## ADR-012: Container Registry - GitHub Container Registry (GHCR)

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need container registry for Docker images.

### Decision
Use **GitHub Container Registry (ghcr.io)** with OIDC authentication.

### Alternatives Considered
| Registry | Pros | Cons |
|----------|------|------|
| Docker Hub | Familiar | Rate limits, cost for private |
| ECR/GCR/ACR | Cloud-native | Vendor lock-in |
| GHCR | Integrated with GitHub, free for public, OIDC auth | Private repos need GitHub Packages quota |

### Consequences
- **Positive**: Native GitHub Actions integration, OIDC token auth, no extra credentials, vulnerability scanning
- **Negative**: Storage limits on free tier
- **Mitigation**: Clean up old images, use retention policies

---

## ADR-013: SCIM 2.0 - Custom Implementation over Library

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need SCIM 2.0 endpoints for provisioning integration with Okta/Azure AD.

### Decision
Implement **custom SCIM 2.0 endpoints** in FastAPI rather than using a library.

### Alternatives Considered
| Approach | Pros | Cons |
|-----------|------|------|
| scim2 library | Standards-compliant | Unmaintained, limited FastAPI support |
| Custom implementation | Full control, FastAPI native | More code to maintain |
| Keycloak SCIM | Built-in | Limited customization, separate endpoint |

### Consequences
- **Positive**: Full control over schema, filtering, extensions, integrated with our user model
- **Negative**: Must implement RFC 7644 correctly, testing burden
- **Mitigation**: Comprehensive test suite with scim-test-tools, schema validation

---

## ADR-014: Certificate Management - cert-manager + Let's Encrypt

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need TLS certificates for ingress.

### Decision
Use **cert-manager** with **Let's Encrypt** (staging for dev, production for prod).

### Alternatives Considered
| Solution | Pros | Cons |
|----------|------|------|
| Manual certs | Full control | Operational burden, expiration risk |
| AWS ACM / GCP Managed Certs | Managed | Vendor lock-in, ALB only |
| cert-manager + Let's Encrypt | K8s-native, free, automatic renewal | Rate limits, DNS challenge complexity |

### Consequences
- **Positive**: Automatic renewal, K8s-native, supports DNS-01 and HTTP-01, wildcard certs
- **Negative**: Let's Encrypt rate limits, DNS provider credentials needed
- **Mitigation**: Use staging issuer for dev, monitor cert expiration, use wildcard certs

---

## ADR-015: Database Migrations - Alembic

**Date**: 2026-08-03
**Status**: Accepted

### Context
Need schema migration tool for PostgreSQL.

### Decision
Use **Alembic** (SQLAlchemy's migration tool).

### Alternatives Considered
| Tool | Pros | Cons |
|------|------|------|
| Flyway | Java-based, SQL migrations | Separate from SQLAlchemy |
| Django migrations | Integrated | Django-specific |
| Alembic | SQLAlchemy-native, Python migrations, autogenerate | Learning curve |

### Consequences
- **Positive**: Integrated with SQLAlchemy, autogenerate from models, Python migrations for complex logic
- **Negative**: Can generate incorrect migrations if not reviewed
- **Mitigation**: Always review generated migrations, test on staging first