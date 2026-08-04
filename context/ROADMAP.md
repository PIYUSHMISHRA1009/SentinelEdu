# ROADMAP.md

Project roadmap for InsightFlow Edu Enterprise IAM Platform Upgrade.

---

## Current Sprint (Week 1-2) — Foundation

### Goals
- Establish CI/CD pipeline
- Deploy Kubernetes locally (kind)
- Create Helm charts for all services
- Set up observability stack
- Begin Terraform modules

### Deliverables
| Feature | Target Date | Status |
|---------|-------------|--------|
| GitHub Actions CI | Day 2 | 🚧 In Progress |
| GitHub Actions CD | Day 3 | ⏳ Not Started |
| GitHub Actions Security | Day 4 | ⏳ Not Started |
| Helm Charts (all services) | Day 5 | ⏳ Not Started |
| Kustomize Overlays | Day 6 | ⏳ Not Started |
| Kind Cluster Deployment | Day 7 | ⏳ Not Started |
| Prometheus + Grafana | Day 8 | ⏳ Not Started |
| Loki + Tempo | Day 9 | ⏳ Not Started |
| Alertmanager + Dashboards | Day 10 | ⏳ Not Started |
| Terraform VPC Module | Day 11 | ⏳ Not Started |
| Terraform IAM Module | Day 12 | ⏳ Not Started |
| Terraform EKS/GKE Module | Day 13 | ⏳ Not Started |

### Success Criteria
- [ ] Push to main triggers CI pipeline
- [ ] CI passes: lint, format, test, build, scan
- [ ] Images pushed to GHCR
- [ ] `helm install` deploys full stack to kind
- [ ] All pods healthy, ingress accessible
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards showing data
- [ ] Logs in Loki, traces in Tempo

---

## Next Sprint (Week 3-4) — Platform Hardening

### Goals
- Secrets management with Vault
- OIDC/OAuth2 with Keycloak
- SCIM 2.0 implementation
- Fine-Grained AuthZ with OpenFGA

### Deliverables
| Feature | Target Date | Status |
|---------|-------------|--------|
| Vault Deployment | Day 15 | ⏳ Not Started |
| External Secrets Operator | Day 16 | ⏳ Not Started |
| Secret Rotation | Day 17 | ⏳ Not Started |
| Keycloak Realm Setup | Day 18 | ⏳ Not Started |
| OIDC Endpoints | Day 19 | ⏳ Not Started |
| PKCE + Refresh Rotation | Day 20 | ⏳ Not Started |
| Federation (Google/GitHub) | Day 21 | ⏳ Not Started |
| SCIM 2.0 Users/Groups API | Day 22 | ⏳ Not Started |
| SCIM Filtering/Pagination | Day 23 | ⏳ Not Started |
| OpenFGA Deployment | Day 24 | ⏳ Not Started |
| Authorization Model | Day 25 | ⏳ Not Started |
| FGA Integration in Backend | Day 26 | ⏳ Not Started |
| RBAC Migration | Day 27 | ⏳ Not Started |

### Success Criteria
- [ ] No secrets in Git (trufflehog clean)
- [ ] Vault auto-unseal works
- [ ] External Secrets sync to K8s secrets
- [ ] Keycloak accessible, realm configured
- [ ] OIDC flow works end-to-end
- [ ] PKCE + refresh rotation verified
- [ ] SCIM endpoints pass compliance tests
- [ ] OpenFGA check latency < 10ms p99
- [ ] Existing RBAC migrated without breaking changes

---

## Sprint 3 (Week 5-6) — Enterprise IAM Features

### Goals
- Access certification campaigns
- Audit logging with SIEM export
- Begin AI security features

### Deliverables
| Feature | Target Date | Status |
|---------|-------------|--------|
| Access Certification API | Day 29 | ⏳ Not Started |
| Review Workflow | Day 30 | ⏳ Not Started |
| Reminders/Escalation | Day 31 | ⏳ Not Started |
| Certification Reports | Day 32 | ⏳ Not Started |
| Audit Logging Framework | Day 33 | ⏳ Not Started |
| Structured JSON + Hash Chain | Day 34 | ⏳ Not Started |
| Loki Integration | Day 35 | ⏳ Not Started |
| Elasticsearch Export | Day 36 | ⏳ Not Started |
| Splunk Export | Day 37 | ⏳ Not Started |
| Anomaly Detection Service | Day 38 | ⏳ Not Started |
| Feature Engineering Pipeline | Day 39 | ⏳ Not Started |
| Isolation Forest Training | Day 40 | ⏳ Not Started |

### Success Criteria
- [ ] Campaigns create certification items automatically
- [ ] Reviewers can approve/revoke/escalate
- [ ] Reports generate in PDF/CSV
- [ ] All security events logged with correlation IDs
- [ ] Logs queryable in Loki/Grafana
- [ ] Export to Elasticsearch works
- [ ] Export to Splunk works
- [ ] Anomaly model AUC > 0.85
- [ ] Impossible travel detected
- [ ] Alerts fire in Alertmanager

---

## Sprint 4 (Week 7-8) — AI Security & Polish

### Goals
- Risk-based authentication
- Automated role mining
- Documentation
- Testing
- Production hardening

### Deliverables
| Feature | Target Date | Status |
|---------|-------------|--------|
| Risk Engine | Day 43 | ⏳ Not Started |
| Device Fingerprinting | Day 44 | ⏳ Not Started |
| GeoIP Enrichment | Day 45 | ⏳ Not Started |
| Behavioral Baselines | Day 46 | ⏳ Not Started |
| Policy Engine (Allow/Step-up/Deny) | Day 47 | ⏳ Not Started |
| Keycloak Flow Integration | Day 48 | ⏳ Not Started |
| Role Miner Service | Day 49 | ⏳ Not Started |
| Clustering Algorithms | Day 50 | ⏳ Not Started |
| Role Recommendation API | Day 51 | ⏳ Not Started |
| Analytics Dashboard | Day 52 | ⏳ Not Started |

### Documentation (Parallel)
| Doc | Target Date | Status |
|-----|-------------|--------|
| RUNBOOK.md | Day 35 | ⏳ Not Started |
| DEPLOYMENT.md | Day 36 | ⏳ Not Started |
| INSTALLATION.md | Day 37 | ⏳ Not Started |
| THREAT_MODEL.md | Day 38 | ⏳ Not Started |
| SECURITY.md | Day 39 | ⏳ Not Started |
| TESTING.md | Day 40 | ⏳ Not Started |
| API.md | Day 41 | ⏳ Not Started |
| OPERATIONS.md | Day 42 | ⏳ Not Started |

### Testing (Parallel)
| Test Type | Target Date | Status |
|-----------|-------------|--------|
| Unit Tests (Backend) | Ongoing | ⏳ Not Started |
| Unit Tests (Frontend) | Ongoing | ⏳ Not Started |
| Integration Tests | Day 50 | ⏳ Not Started |
| E2E Tests | Day 52 | ⏳ Not Started |
| Load Tests | Day 54 | ⏳ Not Started |
| Chaos Experiments | Day 55 | ⏳ Not Started |

### Success Criteria
- [ ] Risk engine scores correctly
- [ ] Adaptive MFA works with Keycloak
- [ ] Role mining generates meaningful clusters
- [ ] Coverage > 90%, redundancy < 20%
- [ ] All documentation complete and accurate
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass
- [ ] E2E tests cover critical flows
- [ ] Load test: 1000 RPS sustained
- [ ] Chaos experiments pass

---

## Future Enhancements (Post-MVP)

### Short-term (Month 3)
- [ ] MLflow for experiment tracking
- [ ] A/B testing framework for ML models
- [ ] Webhook system for third-party integrations
- [ ] Saviynt-specific SCIM extensions
- [ ] Advanced threat detection (MITRE ATT&CK mapping)

### Medium-term (Month 4-6)
- [ ] Multi-tenancy (namespace + data isolation)
- [ ] Custom SCIM schemas for Saviynt attributes
- [ ] SOAR integration (Cortex XSOAR, Splunk SOAR)
- [ ] Advanced role mining (temporal, graph-based)
- [ ] Policy-as-code for FGA (Rega/Rego)

### Long-term (Month 6+)
- [ ] Zero Trust Network Access (ZTNA) integration
- [ ] Decentralized identity (DID/VC) support
- [ ] AI-powered policy recommendation
- [ ] Compliance automation (SOC2, ISO27001, GDPR)
- [ ] Global deployment (multi-region active-active)

---

## Stretch Goals (If Time Permits)

| Feature | Effort | Value |
|---------|--------|-------|
| GraphQL API alongside REST | Medium | High (flexible queries) |
| Event sourcing for audit trail | High | High (complete history) |
| WebAssembly policy engine | High | Medium (extensibility) |
| eBPF-based network observability | High | Medium (deep visibility) |
| Custom Keycloak SPIs | Medium | High (tailored flows) |
| Automated disaster recovery drills | Medium | High (resilience) |

---

## Dependency Graph

```mermaid
graph TD
    CI[GitHub Actions CI] --> CD[GitHub Actions CD]
    CI --> SEC[Security Scan]
    CD --> HELM[Helm Charts]
    HELM --> KUSTOMIZE[Kustomize]
    KUSTOMIZE --> KIND[Kind Deploy]
    KIND --> OBS[Observability]
    TERRAFORM[Terraform Modules] --> VAULT[Vault]
    VAULT --> ESO[External Secrets]
    KIND --> KEYCLOAK[Keycloak]
    KEYCLOAK --> OIDC[OIDC Endpoints]
    OIDC --> SCIM[SCIM 2.0]
    SCIM --> FGA[OpenFGA]
    FGA --> CERT[Certification]
    OBS --> AUDIT[Audit Logging]
    AUDIT --> ANOMALY[Anomaly Detection]
    ANOMALY --> RISK[Risk Engine]
    RISK --> RBA[Risk-Based Auth]
    FGA + SCIM + AUDIT --> ROLE_MINER[Role Miner]
```

---

## Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| M1: CI/CD Live | End of Week 1 | Automated pipeline from push to registry |
| M2: Stack on Kind | End of Week 2 | Full stack running locally |
| M3: Observability Ready | End of Week 2 | LGTM stack with dashboards |
| M4: Terraform Modules | End of Week 3 | Reusable AWS/GCP modules |
| M5: Secrets Managed | End of Week 3 | Vault + ESO operational |
| M6: Identity Platform | End of Week 4 | Keycloak + OIDC + SCIM + FGA |
| M7: Enterprise IAM | End of Week 6 | Certification + Audit + Anomaly |
| M8: AI Security | End of Week 8 | Risk-based auth + Role mining |
| M9: Production Ready | End of Week 8 | Docs + Tests + Hardening |
| M10: Saviynt Demo | End of Week 8 | Demo-ready for interviews |