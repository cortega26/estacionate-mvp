# Data & AI Audit
**Focus:** Data Integrity, Model Safety, & Pipeline Governance
**(Data Quality • Lineage • AI/LLM Risk • Technical Privacy)**

## 1. Purpose
Ensure data is accurate, traceable, and used safely. For AI/ML, ensure models are deterministic, unbiased, and secure against manipulation.

---

## 2. Audience
- **Primary:** Head of Data, Data Engineers, AI Engineers.
- **Secondary:** Security (for PII scanning).

---

## 3. Scope

### 3.1 Data Foundation
- **Quality Contracts:** Schema validation, null checks, freshness SLAs (e.g., "Daily Report is actually daily").
- **Lineage:** Can we trace a KPI on the CEO's dashboard back to the raw `INSERT` statement?
- **Technical Privacy:** Implementation of PII masking/hashing at rest and in logs. (Compliance *requires* it; Data Audit *checks* it).

### 3.2 AI & Machine Learning (Classical)
- **Training Hygiene:** Train/Test leakage, feature store versioning, reproducibility.
- **Model Drift:** Monitoring for performance decay (Covariate shift).

### 3.3 Generative AI (LLM) Risks **[NEW]**
- **Safety:** Guardrails against Prompt Injection, Jailbreaking, and Toxic output.
- **Hallucination Rate:** Eval framework (RAGAS, TruLens) implementation.
- **Cost Control:** Token usage monitoring and caching strategies.

---

## 4. Methodology & Execution

1.  **The "Poison Data" Test:** Inject bad data into Staging. Does the pipeline break, or does it silently corrupt the dashboard?
2.  **PII Scan:** Run a regex scan (e.g., Amazon Macie, local script) across Data Lake/Warehouse for unencrypted emails/phones.
3.  **Red Teaming (AI):** Attempt to trick the chatbot/model into revealing system instructions or PII.

---

## 5. Deliverables
1.  **Data Lineage Map:** Visual graph of critical data flows.
2.  **AI Risk Assessment:** Vulnerability report for GenAI endpoints.
3.  **Data Quality Scorecard:** % of tables with active health checks.

## 6. Severity Definitions
- **S0 (Data Breach/Corruption):** Unmasked PII in logs, Dashboards showing wrong financial numbers, LLM leaking prompt instructions.
- **S1 (Blindness):** Pipelines failing silently, no drift monitoring on production models.