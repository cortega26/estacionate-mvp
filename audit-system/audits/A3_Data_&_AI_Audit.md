# Data & AI Integrity Audit (A3)
**Role:** Head of Data / AI Safety Auditor  
**Focus:** Data Integrity • Lineage • Privacy-by-Design • ML/LLM Safety • Reproducibility

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Verify **data correctness, integrity, and traceability** across pipelines.
- Assess **data lineage** from source to consumption (KPIs, models, reports).
- Evaluate **technical privacy controls** (masking, hashing, minimization).
- Audit **ML and LLM systems** for safety, drift, reproducibility, and abuse resistance.
- Identify **systemic data risks** that can silently corrupt outputs or decisions.

### This audit DOES NOT:
- Validate application business logic or state machines.
- Review UX/UI, application performance, or code readability.
- Detect classic AppSec vulnerabilities or infrastructure misconfigurations.
- Produce legal/compliance evidence (that belongs to A7).

### Delegation Rule
If a finding relates primarily to:
- Business rule correctness or transactional behavior → `Delegated to A1`
- Security exploitability, secrets, or IAM → `Delegated to A2`
- UX, maintainability, or app performance → `Delegated to A4`
- Legal obligations, audits, or regulatory interpretation → `Delegated to A7`

Do NOT duplicate findings across audits.

---

## 1. Purpose

Ensure that **data and AI systems are boringly reliable**:
- numbers mean what people think they mean,
- models behave consistently over time,
- privacy is enforced technically (not by policy documents),
- failures are detectable before decisions are made.

---

## 2. Audience
- Head of Data / Analytics
- Data Engineers
- ML / AI Engineers
- Security (secondary, for PII exposure)

---

## 3. Scope of Evaluation

### 3.1 Data Foundation & Quality
- Schema contracts and validation.
- Nullability, freshness, and volume anomalies.
- Silent failures vs loud pipeline breaks.
- Consistency between raw, intermediate, and curated layers.

---

### 3.2 Data Lineage & Observability
- End-to-end traceability from source events to KPIs.
- Reproducibility of reports and dashboards.
- Ability to answer: *“Where did this number come from?”*

---

### 3.3 Technical Privacy Controls
- PII detection in data stores and logs.
- Masking, hashing, tokenization strategies.
- Least-privilege access to sensitive datasets.
- Data minimization in analytics and AI pipelines.

> Policy compliance is out of scope; only **technical enforcement** is evaluated.

---

### 3.4 Machine Learning (Classical)
- Train / test leakage.
- Feature versioning and reproducibility.
- Model drift and monitoring coverage.
- Deterministic inference under identical inputs.

---

### 3.5 Generative AI & LLM Risks
- Prompt injection and jailbreak resistance.
- Data leakage through prompts or retrieval layers.
- Hallucination detection and evaluation frameworks.
- Cost control and token usage observability.

---

## 4. Required Inputs
- Data pipeline definitions (SQL, DAGs, dbt, Airflow, etc.).
- Data schemas and contracts.
- Access to warehouses/lakes (read-only).
- Model training and inference code.
- GenAI system prompts and retrieval logic (if applicable).

---

## 5. Methodology

### 5.1 Discovery
1. Identify critical datasets and KPIs.
2. Map data flows and transformations.
3. Inventory models and AI endpoints.

---

### 5.2 Execution

**Data Integrity**
- Inject malformed or stale data in staging.
- Verify detection and alerting.

**Lineage**
- Trace selected KPIs back to raw ingestion.
- Validate reproducibility.

**Privacy**
- Scan for unmasked PII in data and logs.

**ML / AI**
- Simulate drift scenarios.
- Attempt prompt injection or data exfiltration (safe, non-destructive).

---

### 5.3 Verification & Reporting
- Confirm findings are systemic, not cosmetic.
- Prioritize based on **blast radius** and **detectability**.
- Provide concrete remediation steps.

---

## 6. Deliverables

1. **Data Lineage Map**
   - Visual representation of critical flows.

2. **Data Quality Scorecard**
   - Coverage of checks and SLAs.

3. **AI / ML Risk Assessment**
   - Drift, leakage, safety gaps.

4. **Privacy Exposure Report**
   - Locations of unprotected PII.

---

## 7. Severity Levels

- **S0 — Silent Corruption / Data Breach:** Wrong financial numbers, leaked PII, LLM data exfiltration.
- **S1 — Blindness:** No detection of drift or pipeline failure.
- **S2 — Weak Guarantees:** Partial checks, inconsistent reproducibility.
- **S3 — Observability Gaps:** Missing metrics or lineage documentation.

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Focus on **systemic data and AI risks**, not application logic or compliance paperwork.
