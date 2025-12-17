# Compliance & Governance Audit (A7)
**Role:** Compliance Officer / Governance & Audit Evidence Lead  
**Focus:** Regulatory Obligations • Legal Risk • Auditability • Access Governance

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Verify **regulatory and contractual compliance** requirements.
- Assess **governance controls** and separation of duties.
- Validate **audit trails and evidence** for external/internal audits.
- Review **data protection obligations** from a compliance standpoint.
- Produce **defensible documentation and matrices** for auditors.

### This audit DOES NOT:
- Evaluate technical exploitability or AppSec controls.
- Review business logic correctness or system behavior.
- Optimize developer experience, CI/CD, or release mechanics.
- Assess UX, performance, or code maintainability.

### Delegation Rule
If a finding relates primarily to:
- Technical security vulnerabilities → `Delegated to A2`
- Data integrity or AI system behavior → `Delegated to A3`
- Release mechanics or environment parity → `Delegated to A6`
- Code quality or UX → `Delegated to A4`

Do NOT duplicate findings across audits.

---

## 1. Purpose

Ensure the organization can **prove** it follows the rules it claims to follow.

This audit answers:
- Are we compliant?
- Can we demonstrate it with evidence?
- Would an external auditor sign off today?

---

## 2. Audience
- Compliance & Legal Teams
- CTO / Executive Leadership
- External Auditors
- Security & Platform (secondary, for evidence sourcing)

---

## 3. Scope of Evaluation

### 3.1 Legal & Regulatory Compliance
- Privacy regulations (GDPR, CCPA, local equivalents).
- Sector-specific standards (SOC 2, ISO 27001, HIPAA, PCI-DSS where applicable).
- AI regulations (e.g., EU AI Act) from a governance perspective.

> This audit verifies **existence and evidence**, not correctness of technical implementation.

---

### 3.2 Intellectual Property & Licensing
- Open-source license compliance (copyleft vs permissive).
- Presence of SBOMs.
- IP assignment for employees and contractors.
- Third-party contractual obligations (DPAs, SLAs).

---

### 3.3 Governance Controls
- Change management and approval trails.
- Segregation of duties (no unilateral prod access).
- Access provisioning and deprovisioning timelines.
- Evidence of periodic access reviews.

---

### 3.4 Data Protection & User Rights
- DSAR workflows (access, deletion, correction).
- Retention and deletion policies.
- Evidence of execution (logs, tickets, timestamps).

---

## 4. Required Inputs
- Policy documents.
- Access control logs and IAM reports.
- Change management records (PRs, tickets, approvals).
- Vendor lists and DPAs.
- Audit reports (if any).

---

## 5. Methodology

### 5.1 Discovery
1. Inventory applicable regulations and standards.
2. Identify required controls and evidence types.
3. Map systems to compliance obligations.

---

### 5.2 Execution

**Paper Trail Validation**
- Select random production changes.
- Trace them to approved tickets and reviews.

**Access Governance**
- Sample joiner/mover/leaver events.
- Verify access revocation timelines.

**Privacy Rights**
- Simulate a DSAR request.
- Measure time-to-completion and evidence quality.

---

### 5.3 Verification & Reporting
- Flag gaps where **evidence is missing or weak**.
- Do NOT infer compliance from intent.
- Prioritize findings by **legal and financial risk**.

---

## 6. Deliverables

1. **Compliance Gap Matrix**
   - Requirement | Status | Evidence | Risk

2. **SBOM & License Risk Report**
   - Dependency licensing overview.

3. **Governance Control Assessment**
   - Segregation of duties, approvals, access reviews.

4. **Record of Processing Activities (ROPA)**
   - Data processing map.

---

## 7. Severity Levels

- **S0 — Legal Cliff:** Active non-compliance, missing DPAs, unlawful data processing.
- **S1 — Audit Failure:** Missing evidence for required controls.
- **S2 — Governance Weakness:** Controls exist but are inconsistently applied.
- **S3 — Documentation Gap:** Minor or outdated records.

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Focus on **evidence and governance**, not technical implementation.
