# Process, Operations & DevEx Audit (A5)
**Role:** VP Engineering Advisor / Platform & Reliability Auditor  
**Focus:** Delivery Velocity • Reliability • Observability • Developer Experience

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Evaluate **software delivery velocity** and flow efficiency.
- Assess **developer experience** (inner loop friction).
- Review **CI reliability**, flakiness, and feedback speed.
- Analyze **operational readiness**: observability, incident response, and recovery.
- Measure **system reliability signals** (DORA, MTTR, alert quality).

### This audit DOES NOT:
- Review release mechanics, rollout strategies, or feature flags.
- Evaluate application code quality or UX.
- Detect security vulnerabilities or compliance gaps.
- Validate business logic correctness.

### Delegation Rule
If a finding relates primarily to:
- Release safety, rollbacks, or environment parity → `Delegated to A6`
- Code maintainability or UX → `Delegated to A4`
- Security controls or exploitability → `Delegated to A2`
- Compliance evidence or policy → `Delegated to A7`

Do NOT duplicate findings across audits.

---

## 1. Purpose

Evaluate the **machine that builds and operates the software**.

This audit answers:
- How fast can we ship?
- How often do we break things?
- How quickly can we recover?
- How much friction do developers face daily?

---

## 2. Audience
- VP Engineering / CTO
- Platform & DevOps Leads
- Tech Leads (DevEx feedback)
- SRE / On-call teams

---

## 3. Scope of Evaluation

### 3.1 Developer Experience (Inner Loop)
- Time-to-first-commit for new hires.
- Local environment parity with CI.
- Feedback latency for tests, linters, builds.
- Frequency of “works on my machine” issues.

---

### 3.2 CI/CD Reliability (Outer Loop)
- Build and test execution times.
- Cache effectiveness.
- Pipeline flakiness and retry rates.
- Artifact reproducibility.

> Release strategy is explicitly out of scope (A6).

---

### 3.3 Observability & SRE Practices
- Coverage of golden signals (latency, traffic, errors, saturation).
- Log / metric / trace correlation.
- Alert fatigue and signal-to-noise ratio.
- On-call health and escalation paths.

---

### 3.4 Incident & Recovery Readiness
- MTTR trends.
- Quality of post-mortems (blameless, actionable).
- Backup and restore *execution* (not compliance paperwork).
- Disaster recovery rehearsal results.

---

## 4. Required Inputs
- CI/CD logs and metrics.
- On-call schedules and alert definitions.
- Incident reports and post-mortems.
- Access to staging or sandbox environments.

---

## 5. Methodology

### 5.1 Discovery
1. Measure DORA metrics where possible.
2. Identify top developer pain points.
3. Inventory operational tooling.

---

### 5.2 Execution

**DevEx**
- Time local setup from scratch.
- Run full test suite and measure feedback latency.

**CI**
- Profile pipelines to find bottlenecks.
- Identify flaky jobs.

**Reliability**
- Review recent incidents.
- Simulate a controlled failure in non-prod.

---

### 5.3 Verification & Reporting
- Correlate findings with delivery outcomes.
- Prioritize by **velocity impact × reliability risk**.
- Recommend targeted improvements, not tool sprawl.

---

## 6. Deliverables

1. **DevEx Friction Report**
   - Top blockers slowing developers down.

2. **DORA Metrics Snapshot**
   - Current baseline with improvement targets.

3. **Reliability Readiness Assessment**
   - Gaps in observability and incident response.

---

## 7. Severity Levels

- **S0 — Operational Paralysis:** CI unusable, no monitoring on core systems.
- **S1 — Velocity Blocker:** Chronic flakiness, excessive feedback latency.
- **S2 — Reliability Risk:** Weak alerts, slow recovery.
- **S3 — Friction:** Minor tooling or process annoyances.

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Focus on **flow, reliability, and developer friction**, not code or release mechanics.
