# Release & Environment Safety Audit (A6)
**Role:** Release Manager / DevOps Safety Auditor  
**Focus:** Deploy Safety • Rollbacks • Environment Parity • Configuration & Secrets Handling

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Evaluate **release safety mechanisms** and rollback readiness.
- Assess **environment parity** between Dev, Staging, and Production.
- Review **configuration management** and secret injection strategies.
- Validate **feature flag lifecycle** and kill‑switch effectiveness.
- Detect **configuration drift** and unsafe manual interventions.

### This audit DOES NOT:
- Optimize CI pipelines or developer inner‑loop experience.
- Review application code quality, UX, or business logic correctness.
- Detect security vulnerabilities beyond release/config exposure.
- Produce legal or compliance evidence.

### Delegation Rule
If a finding relates primarily to:
- CI speed, DevEx, or operational flow → `Delegated to A5`
- Security exploitability or IAM policy design → `Delegated to A2`
- Code maintainability or UX → `Delegated to A4`
- Compliance, approvals, or audit trails → `Delegated to A7`

Do NOT duplicate findings across audits.

---

## 1. Purpose

Ensure that **changes can be shipped and unshipped safely**.

This audit answers:
- Can we deploy without fear?
- Can we stop or rollback instantly?
- Do environments behave the same?
- Are configurations controlled and reversible?

---

## 2. Audience
- Release Managers
- DevOps / Platform Engineers
- QA Leads
- Product Owners (release planning)

---

## 3. Scope of Evaluation

### 3.1 Release Strategy
- Separation of *deploy* (code present) vs *release* (traffic exposed).
- Rollout mechanisms: blue/green, canary, rolling updates.
- Automation level (manual steps are risk).
- Mean time to rollback.

---

### 3.2 Feature Flags & Kill Switches
- Coverage of critical paths.
- Lifecycle management (stale flags).
- Runtime toggle latency.
- Flag ownership and documentation.

---

### 3.3 Environment Parity
- Runtime versions (language, OS, container base).
- Infrastructure parameters (memory, limits, scaling).
- Third‑party integrations and credentials.
- Data realism in non‑prod environments.

---

### 3.4 Configuration & Secrets
- Injection strategy (env vars vs secret manager).
- Config versioning alongside code.
- Ability to rollback configuration independently.
- Detection of hardcoded or baked‑in secrets.

---

### 3.5 Drift & Change Control
- Detection of manual changes in production (ClickOps).
- Infra drift alerts.
- Guardrails preventing unsafe hot fixes.

---

## 4. Required Inputs
- Deployment pipelines and scripts.
- Environment manifests and variables.
- Feature flag configurations.
- Access to non‑prod environments.

---

## 5. Methodology

### 5.1 Discovery
1. Inventory environments and release paths.
2. Map deploy vs release steps.
3. Identify configuration sources of truth.

---

### 5.2 Execution

**Rollback Readiness**
- Simulate a bad deploy.
- Measure time to restore service.

**Flags & Toggles**
- Disable a non‑critical feature in prod.
- Measure propagation latency.

**Parity & Drift**
- Diff configs across environments.
- Inspect for manual changes.

---

### 5.3 Verification & Reporting
- Validate findings are reproducible.
- Prioritize by **blast radius × recovery time**.
- Recommend concrete safety improvements.

---

## 6. Deliverables

1. **Environment Drift Report**
   - Differences between environments.

2. **Rollback Maturity Score**
   - Time‑to‑recovery metrics.

3. **Feature Flag Health Report**
   - Coverage, staleness, ownership.

4. **Config & Secrets Hygiene Summary**
   - Risks and remediation steps.

---

## 7. Severity Levels

- **S0 — Unrecoverable:** No rollback, secrets committed, manual prod edits allowed.
- **S1 — High Risk:** Staging ≠ Prod, dead flags, slow rollback.
- **S2 — Medium Risk:** Partial parity, brittle config.
- **S3 — Low Risk:** Minor inconsistencies.

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Focus on **safety of change**, not speed or code quality.
