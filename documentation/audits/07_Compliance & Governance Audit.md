# Compliance & Governance Audit
**Focus:** Regulatory Obligations, Legal Risk, & Audit Evidence
**(Licensing • Privacy Law • SOC 2/ISO • Access Governance)**

## 1. Purpose
Verify that the product complies with legal/contractual obligations and produce the *evidence* required for external auditors. This is not about "is it secure?" (Security Audit), but "can we prove we followed the rules?"

---

## 2. Audience
- **Primary:** Compliance Officer, Legal Counsel, CTO.
- **Secondary:** External Auditors (for evidence gathering).

---

## 3. Scope

### 3.1 Legal & Regulatory
- **Privacy (GDPR / CCPA / Local):** Consent management, "Right to be Forgotten" workflows, Data Subject Access Requests (DSAR).
- **Industry Standards:** SOC 2 (Trust Principles), ISO 27001, HIPAA (if Health), PCI-DSS (if Payments).
- **AI Regulation:** EU AI Act compliance (if applicable)—transparency and risk categorization.

### 3.2 Intellectual Property & Licensing
- **Open Source (SBOM):** Analysis of Copyleft (GPL) vs. Permissive (MIT) usage.
- **Proprietary Rights:** Assignment of IP agreements for all contractors/employees.
- **Third-Party Contracts:** Vendor risk assessment and DPA (Data Processing Agreements) status.

### 3.3 Governance Controls (The "Human Firewall")
- **Segregation of Duties:** Proof that the person who *wrote* the code did not *force-push* it to Prod without review.
- **Change Management:** Audit trail linking every Production Deploy -> Approved Pull Request -> Jira Ticket.
- **Offboarding:** Evidence that access is revoked < 24h after employee departure.

---

## 4. Methodology & Execution

1.  **The "Paper Trail" Test:** Pick 5 random features in Prod. Trace them back to a documented approval.
2.  **The "Forget Me" Test:** Simulate a user requesting data deletion. Measure time-to-completion and verify database state.
3.  **Vendor Audit:** Review list of sub-processors (AWS, Stripe, Auth0). Do we have signed DPAs for all?

---

## 5. Deliverables
1.  **Compliance Gap Analysis (Matrix):** `Requirement` | `Status` | `Evidence Location` | `Risk`.
2.  **SBOM & License Risk Report:** Automated scan results of all dependencies.
3.  **Data Processing Map (ROPA):** Record of Processing Activities (Legal requirement).

## 6. Severity Definitions
- **S0 (Legal Cliff):** Missing DPAs, GDPR non-compliance in live markets, Copyleft code in proprietary core.
- **S1 (Audit Failure):** Systemic lack of change approval evidence, missing offboarding logs.