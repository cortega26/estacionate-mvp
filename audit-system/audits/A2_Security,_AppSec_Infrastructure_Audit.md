# Security, AppSec & Infrastructure Audit (A2)
**Role:** Senior Security Architect / DevSecOps Lead  
**Focus:** Exploitability • Trust Boundaries • Secrets • Supply Chain • Infrastructure Security

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Identify **exploitable security vulnerabilities** in code, configuration, and infrastructure.
- Evaluate **authentication, authorization, and trust boundaries**.
- Detect **secrets exposure**, supply-chain risks, and insecure defaults.
- Review **cloud/IaC security posture** and container hardening.
- Analyze **abuse cases** that enable data access, privilege escalation, or financial loss.

### This audit DOES NOT:
- Validate business rule correctness or state-machine logic.
- Review UX, accessibility, or code readability.
- Enforce project structure or modularization.
- Produce compliance evidence or legal interpretations.

### Delegation Rule
If a finding relates primarily to:
- Business logic correctness or rule duplication → `Delegated to A1`
- Filesystem topology or naming → `Delegated to A0`
- UX, maintainability, or non-exploitable performance → `Delegated to A4`
- Regulatory evidence, audits, or legal risk → `Delegated to A7`

Do NOT duplicate findings across audits.

---

## 1. Purpose

Identify security weaknesses that are **reachable in real-world conditions** and could be
**exploited to compromise confidentiality, integrity, or availability**.

This is a **white-box audit**: no active exploitation against live systems.

---

## 2. Audience
- AppSec Engineers
- Cloud / Platform Engineers
- Engineering Leads
- Incident Response & SRE teams

---

## 3. Scope of Evaluation

### 3.1 Application Security (SAST Logic)
- Injection flaws (SQLi, command injection, LDAP injection).
- Unsafe deserialization and file handling.
- Broken authentication and authorization logic.
- Insecure cryptographic usage (weak hashes, custom crypto).
- Verbose errors leaking sensitive information.

> Note: Incorrect behavior without exploitability belongs to A1.

---

### 3.2 Abuse & Threat Modeling
- Rate-limiting gaps and brute-force vectors.
- IDOR (Insecure Direct Object Reference).
- Privilege escalation paths.
- Business abuse scenarios (price tampering, inventory abuse).

---

### 3.3 Secrets & Identity
- Hardcoded secrets and credentials in code or config.
- Insecure secret injection (baked into images).
- Overly permissive IAM roles.
- Missing rotation or expiration policies.

---

### 3.4 Supply Chain & CI/CD Security
- Known vulnerable dependencies (CVE exposure).
- Unpinned CI actions or build tools.
- Exposure of secrets in build logs.
- Missing artifact integrity or provenance checks.

---

### 3.5 Infrastructure & IaC
- Network exposure (overly open security groups).
- Storage misconfigurations (public buckets, no encryption).
- Container risks:
  - Running as root
  - Privileged containers
  - Missing resource limits
- Kubernetes hardening gaps.

---

## 4. Required Inputs
- Source code repositories.
- Infrastructure code (Terraform, Helm, CloudFormation).
- Dependency manifests.
- API specifications (OpenAPI/Swagger).
- Prior scanner outputs (if available).

---

## 5. Methodology

### 5.1 Discovery
1. Inventory critical assets (PII, secrets, payment flows).
2. Identify trust boundaries and data entry points.
3. Build a threat model (DFD-style).

---

### 5.2 Execution

**Application Layer**
- Review auth middleware and access checks.
- Inspect database access for parameterization.
- Validate crypto primitives.

**Infrastructure Layer**
- Review IaC against CIS benchmarks.
- Inspect Dockerfiles for unsafe defaults.

**Supply Chain**
- Cross-check dependencies against known CVEs.
- Review CI definitions for integrity risks.

---

### 5.3 Verification & Reporting
- Assign severity based on **exploitability × impact**.
- Avoid false positives: confirm reachability.
- Propose **concrete remediation steps**.

---

## 6. Deliverables

1. **Security Findings Matrix**
   - Vulnerability | Severity (S0–S3) | Location | Impact | Remediation

2. **Threat Model Diagram**
   - Mermaid.js or equivalent notation.

3. **Secrets & IAM Report**
   - Exposed secrets and over-permissive roles.

4. **IaC Hardening Plan**
   - Specific config changes.

5. **Remediation Backlog**
   - Ready for ticketing.

---

## 7. Severity Levels

- **S0 — Critical:** RCE, auth bypass, leaked admin secrets.
- **S1 — High:** IDOR, stored XSS, public storage with sensitive data.
- **S2 — Medium:** Missing headers, weak crypto, outdated dependencies.
- **S3 — Low:** Hardening gaps with low exploitability.

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Report only **exploitable security risks**, not theoretical weaknesses.
