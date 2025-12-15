# Release & Environment Audit
**Focus:** Deploy Safety, Environment Parity, & Configuration Management
**(Versioning • Rollback • Feature Flags • Secrets Management)**

## 1. Purpose
Assess the safety mechanisms of putting code into the wild. Ensure that Staging *actually* represents Production and that we can undo mistakes instantly.

---

## 2. Audience
- **Primary:** Release Manager, QA Lead, DevOps.
- **Secondary:** Product Owners (for feature release planning).

---

## 3. Scope

### 3.1 Release Strategy
- **Deployment vs. Release:** Separation of "Deploy" (code on server) and "Release" (traffic to code).
- **Rollout Mechanics:** Blue/Green, Canary, Rolling Updates. Are they automated?
- **Feature Flags:** Lifecycle management (Are dead flags removed?). Kill-switch readiness.

### 3.2 Environment Integrity
- **Parity:** Diff check between Staging and Prod (Node versions, DB parameters, Memory limits).
- **Data Realism:** Does Staging use sanitized production data or brittle "happy path" seeds?
- **Drift Detection:** Monitoring for manual "hot fixes" applied directly to Prod servers (ClickOps).

### 3.3 Configuration & Secrets
- **Injection Strategy:** Env vars vs. Secret Manager. Are secrets baked into Docker images? (Fail).
- **Versioning:** Is configuration versioned alongside code? Can we rollback *just* the config?

---

## 4. Methodology & Execution

1.  **The "Kill Switch" Test:** Flip a feature flag in Prod. Measure latency until users see the change.
2.  **The "Panic Rollback":** Simulate a bad deploy. Measure time to restore previous version.
3.  **Config Diff:** Run a tool to compare `process.env` (or equivalent) across environments.

---

## 5. Deliverables
1.  **Environment Drift Report:** List of inconsistencies between Staging and Prod.
2.  **Rollback Maturity Score:** Time-to-Recovery metrics for deployments.
3.  **Secrets Hygiene Check:** Report on hardcoded or mismanaged secrets.

## 6. Severity Definitions
- **S0 (Unrecoverable):** No rollback mechanism, Secrets committed to Git, Direct manual changes allowed in Prod DB.
- **S1 (High Risk):** Staging significantly different from Prod, Dead feature flags clogging code.