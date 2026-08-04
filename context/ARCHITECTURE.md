# ARCHITECTURE.md

This document describes the overall architecture of the InsightFlow Edu Enterprise IAM & Analytics Platform.

---

## System Overview

```mermaid
graph TB
    subgraph "External"
        UI[Frontend - React]
        SCIM_CLIENT[SCIM Clients - Okta/Azure AD]
        IDP[External IdPs - Google/GitHub/SAML]
    end

    subgraph "Edge"
        INGRESS[Ingress Controller - NGINX]
        WAF[WAF - ModSecurity]
    end

    subgraph "Application Layer"
        BACKEND[Backend - FastAPI]
        KEYCLOAK[Keycloak - OIDC/OAuth2]
        OPENFGA[OpenFGA - AuthZ]
        VAULT[HashiCorp Vault]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL - Primary)]
        REDIS[(Redis - Cache/Sessions)]
        ES[(Elasticsearch - Audit/SIEM)]
    end

    subgraph "Observability"
        PROM[Prometheus]
        GRAF[Grafana]
        LOKI[Loki]
        TEMPO[Tempo]
        ALERT[Alertmanager]
    end

    subgraph "AI/ML"
        ANOMALY[Anomaly Detection]
        RISK[Risk Engine]
        ROLE_MINER[Role Miner]
    end

    subgraph "CI/CD"
        GH_ACTIONS[GitHub Actions]
        ARGOCD[ArgoCD]
        TERRAFORM[Terraform]
    end

    UI --> INGRESS
    SCIM_CLIENT --> INGRESS
    IDP --> KEYCLOAK
    INGRESS --> BACKEND
    INGRESS --> KEYCLOAK
    BACKEND --> PG
    BACKEND --> REDIS
    BACKEND --> OPENFGA
    BACKEND --> VAULT
    BACKEND --> ANOMALY
    BACKEND --> RISK
    BACKEND --> ROLE_MINER
    BACKEND --> ES
    KEYCLOAK --> PG
    OPENFGA --> PG
    ANOMALY --> ES
    RISK --> PG
    ROLE_MINER --> PG
    PROM --> BACKEND
    PROM --> KEYCLOAK
    PROM --> OPENFGA
    LOKI --> BACKEND
    TEMPO --> BACKEND
    ALERT --> PROM
    GRAF --> PROM
    GRAF --> LOKI
    GRAF --> TEMPO
    GH_ACTIONS --> ARGOCD
    ARGOCD --> BACKEND
    TERRAFORM --> PG
    TERRAFORM --> ES
```

---

## Component Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18, Vite, TypeScript
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Build**: Vite → Nginx static serving

### Backend (FastAPI + Python)
- **Framework**: FastAPI 0.109+, Pydantic v2
- **Database**: SQLAlchemy 2.0 + PostgreSQL 15
- **Auth**: JWT (current) → OIDC/OAuth2 (Keycloak)
- **AuthZ**: RBAC → FGA (OpenFGA)
- **ML**: scikit-learn, joblib for model persistence
- **Observability**: prometheus-fastapi-instrumentator, OpenTelemetry
- **Testing**: pytest, pytest-asyncio, httpx

### Database (PostgreSQL 15)
- **Primary Tables**: users, classes, enrollments, grades, attendance, risk_assessments
- **IAM Tables**: scim_users, scim_groups, fga_tuples, audit_logs, certifications
- **Extensions**: pgcrypto, uuid-ossp, pg_trgm
- **Connection Pooling**: PgBouncer (production)

### Cache (Redis 7)
- **Use Cases**: Session storage, rate limiting, FGA tuple caching, ML feature store
- **Cluster Mode**: Sentinel for HA (production)

### Identity Provider (Keycloak 24+)
- **Realm**: insightflow
- **Protocols**: OIDC, OAuth2, SAML 2.0
- **Features**: PKCE, refresh token rotation, federation, custom themes
- **Storage**: PostgreSQL (shared or dedicated)

### Authorization (OpenFGA)
- **Model**: Relationship-based (ReBAC) with ABAC conditions
- **Tuples**: Stored in PostgreSQL (OpenFGA's datastore)
- **API**: gRPC + HTTP
- **Cache**: In-memory + Redis for distributed deployments

### Secrets (HashiCorp Vault)
- **Backend**: Integrated storage (Raft) or Consul
- **Seal**: Auto-unseal via AWS KMS / GCP KMS
- **Auth**: Kubernetes auth method
- **Rotation**: Database credentials, API keys, TLS certificates

### Observability Stack
| Component | Purpose | Retention |
|-----------|---------|-----------|
| Prometheus | Metrics collection | 15d (local), 1y (Thanos) |
| Grafana | Visualization | N/A |
| Loki | Log aggregation | 30d |
| Tempo | Distributed tracing | 7d |
| Alertmanager | Alert routing | N/A |

---

## Networking Architecture

```mermaid
graph LR
    subgraph "Public Subnet"
        ALB[Application Load Balancer]
        NAT[NAT Gateway]
    end

    subgraph "Private Subnet - App"
        K8S[EKS/GKE Cluster]
        BACKEND_POD[Backend Pods]
        FRONTEND_POD[Frontend Pods]
        KEYCLOAK_POD[Keycloak Pods]
    end

    subgraph "Private Subnet - Data"
        PG[(RDS/CloudSQL)]
        REDIS_CLUSTER[(ElastiCache/Memorystore)]
        ES_DOMAIN[(OpenSearch/Elasticsearch)]
    end

    subgraph "Management"
        BASTION[Bastion Host]
        VAULT_POD[Vault Pods]
        MONITORING[Monitoring Stack]
    end

    ALB --> K8S
    K8S --> PG
    K8S --> REDIS_CLUSTER
    K8S --> ES_DOMAIN
    BASTION -.-> K8S
    NAT --> INTERNET
```

### Network Policies
- **Default Deny**: All ingress/egress denied by default
- **App → DB**: Only backend pods can reach PostgreSQL
- **App → Redis**: Only backend/frontend pods
- **App → External**: Only via NAT Gateway (egress)
- **Monitoring → App**: Prometheus, Grafana, Loki, Tempo can scrape
- **Ingress → App**: Only ALB/Ingress controller

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Keycloak
    participant Backend
    participant OpenFGA

    User->>Frontend: Access protected resource
    Frontend->>Keycloak: Redirect to /authorize (PKCE)
    Keycloak->>User: Login form / SSO
    User->>Keycloak: Credentials
    Keycloak->>Frontend: Redirect with auth code
    Frontend->>Keycloak: POST /token (code + PKCE verifier)
    Keycloak-->>Frontend: Access token + Refresh token + ID token
    Frontend->>Backend: API request + Bearer token
    Backend->>Keycloak: Validate token (JWKS)
    Backend->>OpenFGA: Check permission (user, relation, object)
    OpenFGA-->>Backend: Allow/Deny
    Backend-->>Frontend: Response
```

### Token Lifecycle
| Token Type | Lifetime | Storage | Rotation |
|------------|----------|---------|----------|
| Access Token | 15 min | Memory (JS) | No |
| Refresh Token | 30 days | HttpOnly Cookie | Yes (rotation) |
| ID Token | 15 min | Memory | No |

---

## Authorization Flow (FGA)

```mermaid
graph TD
    REQUEST[API Request] --> EXTRACT[Extract: user, relation, object]
    EXTRACT --> CHECK[OpenFGA Check API]
    CHECK --> MODEL{Authorization Model}
    MODEL --> TUPLES[Relationship Tuples]
    MODEL --> CONDITIONS[ABAC Conditions]
    TUPLES --> EVAL[Evaluation Engine]
    CONDITIONS --> EVAL
    EVAL --> RESULT[Allow / Deny]
    RESULT --> AUDIT[Audit Log]
    RESULT --> RESPONSE[API Response]
```

### Authorization Model (Simplified)
```fga
model
  schema 1.1

type user
type role
  relations
    define member: [user, user:*]
type organization
  relations
    define owner: [user]
    define admin: [user]
    define member: [user, role:member]
type resource
  relations
    define viewer: [user, role:member]
    define editor: [user, role:member]
    define admin: [user, role:member]
    define owner: [user]
    define parent: [organization]
```

---

## CI/CD Pipeline

```mermaid
graph LR
    subgraph "CI"
        PUSH[Push to GitHub] --> LINT[Lint & Format]
        LINT --> TEST[Unit Tests]
        TEST --> INTEGRATION[Integration Tests]
        INTEGRATION --> BUILD[Docker Build]
        BUILD --> SCAN[Trivy Scan]
        SCAN --> SIGN[Cosign Sign]
        SIGN --> PUSH_REG[Push to Registry]
    end

    subgraph "CD"
        PUSH_REG --> ARGOCD[ArgoCD Sync]
        ARGOCD --> DEV[Deploy to Dev]
        DEV --> STAGING[Deploy to Staging]
        STAGING --> PROD[Deploy to Prod]
    end

    subgraph "Release"
        TAG[Git Tag] --> CHANGELOG[Generate Changelog]
        CHANGELOG --> RELEASE[GitHub Release]
        RELEASE --> PROD_DEPLOY[Production Deploy]
    end
```

### Pipeline Stages
| Stage | Tools | Gates |
|-------|-------|-------|
| Lint/Format | ruff, black, eslint, prettier | Must pass |
| Unit Test | pytest, vitest | >80% coverage |
| Integration Test | pytest + testcontainers | Must pass |
| Build | Docker, BuildKit | Multi-arch (amd64/arm64) |
| Security Scan | Trivy, Grype | No HIGH/CRITICAL |
| Sign | Cosign, Sigstore | Keyless signing |
| Deploy | ArgoCD, Helm, Kustomize | Manual approval for prod |

---

## Data Flow

### Risk Assessment Pipeline
```mermaid
graph TD
    GRADES[Grades Data] --> FEATURES[Feature Engineering]
    ATTENDANCE[Attendance Data] --> FEATURES
    FEATURES --> MODEL[Isolation Forest / Risk Scorer]
    MODEL --> SCORE[Risk Score 0-1]
    SCORE --> DB[(Risk Assessments Table)]
    DB --> DASHBOARD[Dashboard]
    DB --> ALERT[Alerting]
    ALERT --> ANOMALY[Anomaly Detection]
```

### Audit Log Pipeline
```mermaid
graph LR
    EVENT[Security Event] --> FORMAT[Structured JSON]
    FORMAT --> CHAIN[Hash Chain]
    CHAIN --> LOKI[Loki]
    CHAIN --> ES[Elasticsearch]
    CHAIN --> SPLUNK[Splunk HEC]
    LOKI --> GRAF[Grafana]
    ES --> SIEM[SIEM Queries]
```

---

## Deployment Architecture

### Environments
| Environment | Purpose | Cluster | Domain |
|-------------|---------|---------|--------|
| Development | Feature testing | kind (local) / EKS dev | dev.insightflow.edu |
| Staging | Integration testing | EKS/GKE staging | staging.insightflow.edu |
| Production | Live traffic | EKS/GKE prod (multi-AZ) | insightflow.edu |

### Release Strategy
- **Development**: Continuous deployment on merge to main
- **Staging**: Daily deployment or on-demand
- **Production**: Git tag triggered, manual approval, blue-green

---

## Security Architecture

### Defense in Depth
1. **Network**: VPC, subnets, security groups, NACLs, WAF
2. **Transport**: TLS 1.3 everywhere (internal mTLS via Istio/Linkerd)
3. **Application**: Input validation, output encoding, CSP, HSTS
4. **Identity**: OIDC/OAuth2, MFA, PKCE, short-lived tokens
5. **Authorization**: FGA, least privilege, regular certification
6. **Data**: Encryption at rest (AES-256), in transit (TLS), field-level for PII
7. **Secrets**: Vault, rotation, no secrets in Git
8. **Supply Chain**: SLSA Level 2, signed images, SBOM
9. **Observability**: Audit logs, anomaly detection, alerting
10. **Incident Response**: Runbooks, playbooks, automated containment

### Threat Model (STRIDE)
| Threat | Mitigation |
|--------|------------|
| Spoofing | OIDC/OAuth2, MFA, certificate pinning |
| Tampering | Immutable audit logs, hash chains, signed images |
| Repudiation | Correlation IDs, tamper-evident logs |
| Information Disclosure | Encryption, least privilege, field-level encryption |
| Denial of Service | Rate limiting, WAF, autoscaling, circuit breakers |
| Elevation of Privilege | FGA, regular certification, anomaly detection |

---

## Scaling Strategy

### Horizontal Pod Autoscaler (HPA)
```yaml
# Backend HPA
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

### Vertical Pod Autoscaler (VPA)
- **Mode**: Auto for dev/staging, Initial for production
- **Resources**: CPU/Memory recommendations based on usage

### Cluster Autoscaler
- **Node Groups**: Separate for system, backend, frontend, monitoring
- **Scale-down**: 10min delay, respect PDBs

### Database Scaling
- **Read Replicas**: 2 for staging, 3 for production
- **Connection Pooling**: PgBouncer (1000 max connections)
- **Partitioning**: Audit logs by month (pg_partman)

---

## Disaster Recovery

### RPO/RTO Targets
| Tier | RPO | RTO |
|------|-----|-----|
| Database (Primary) | < 1 min | < 15 min |
| Database (Audit) | < 5 min | < 1 hour |
| Application | 0 | < 5 min |
| Secrets | 0 | < 5 min |

### Backup Strategy
- **PostgreSQL**: Continuous archiving (WAL-G), daily base backups, point-in-time recovery
- **Redis**: RDB snapshots every 5 min, AOF every second
- **Vault**: Integrated storage snapshots, unseal keys in KMS
- **ETCD**: Velero backups daily
- **Object Storage**: Cross-region replication

---

## Cost Optimization

### Right-sizing
- **VPA recommendations** applied weekly
- **Spot instances** for batch workloads (model training, role mining)
- **Graviton/ARM** for compatible workloads (20-40% savings)

### Storage Tiering
- **Hot**: Loki/Elasticsearch recent data (SSD)
- **Warm**: Compressed, older logs (HDD)
- **Cold**: S3 Glacier / GCS Coldline for audit archives

### Monitoring Costs
- **Prometheus**: Remote write to Thanos/Grafana Cloud for long-term
- **Tempo**: Sampling (10% traces), block storage
- **Loki**: Boltdb-shipper with S3/GCS

---

## Future Extensibility

### Plugin Architecture
- **SCIM Extensions**: Custom schemas for Saviynt-specific attributes
- **FGA Models**: Versioned, hot-reloadable
- **ML Models**: MLflow registry, A/B testing framework
- **Integrations**: Webhook system for third-party SIEM/SOAR

### Multi-tenancy Roadmap
- **Namespace isolation**: Kubernetes namespaces per tenant
- **Data isolation**: Row-level security in PostgreSQL
- **Control plane**: Tenant-aware Keycloak realms, Vault namespaces