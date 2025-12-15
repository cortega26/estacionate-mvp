# Security, AppSec & Infrastructure Audit

**Role:** Senior Security Architect / DevSecOps Lead
**(SAST • Code Logic • Supply Chain • Secrets • Cloud/IaC • Threat Modeling)**

## 1. Purpose

Identify security risks in the source code, infrastructure configurations, and software supply chain. The goal is to enforce "Security by Design" and produce a remediation backlog for engineering teams.

**Constraint:** This is a **White Box Audit**. Do not attempt active exploitation against live targets. Focus on **Code Analysis, Configuration Review, and Architectural Flaws**.

---

## 2. Audience / Roles

- **AppSec Engineer:** Focus on code-level vulnerabilities (OWASP Top 10).
- **Cloud/Platform Engineer:** Focus on IAM, network segmentation, and storage encryption.
- **Dev Lead:** Focus on remediation and dependency updates.
- **Compliance Officer:** Focus on audit trails and PII handling.

---

## 3. Scope

### 3.1 Static Code Analysis (SAST Logic)

- **Injection Flaws:** SQLi (concatenated strings), Command Injection (`exec()`), and LDAP injection.
- **Data Handling:** Unsafe deserialization, insecure file uploads (missing type checks), and exposed stack traces.
- **Auth Logic:** Hardcoded generic passwords, weak hashing algorithms (MD5/SHA1), and missing middleware on sensitive routes.

### 3.2 Supply Chain & Pipeline Security (SCA + CI/CD)

- **Dependency Hygiene:** Known CVEs in `package.json`/`requirements.txt`.
- **License Risk:** Copyleft (GPL) contamination in proprietary modules.
- **Pipeline Integrity:**
  - Are GitHub Actions/GitLab CI versions pinned? (Avoid `@latest`).
  - Are CI secrets exposed in build logs?
  - Is there code signing or artifact verification?

### 3.3 Secrets & Identity Management

- **Secret Detection:** Scan for regex patterns matching API Keys (AWS, Stripe, Slack) committed to git.
- **Identity (IAM):**
  - Overly permissive roles (`"Action": "*"`).
  - Long-lived credentials vs. temporary STS tokens.
  - Lack of rotation policies.

### 3.4 Cloud & Infrastructure as Code (IaC)

- **Network:** Security Groups allowing `0.0.0.0/0` on non-web ports (SSH/RDP).
- **Storage:** S3 Buckets/Databases with "Public Read" access or missing encryption-at-rest.
- **Kubernetes/Docker:**
  - Containers running as `root`.
  - Privileged containers.
  - Missing resource limits (DoS risk).

### 3.5 Business Logic & Threat Modeling

- **Abuse Cases:** Rate limiting gaps (brute force), price manipulation, inventory hoarding.
- **Authorization:** IDOR (Insecure Direct Object Reference) patterns—e.g., `GET /user/{id}` without checking ownership.
- **Trust Boundaries:** Where does data cross from "Public" to "Private"?

---

## 4. Required Inputs

- **Codebase Access:** Repositories (Application + Terraform/Helm).
- **Dependency Manifests:** `package.json`, `go.mod`, `pom.xml`, etc.
- **API Specs:** OpenAPI/Swagger (to identify shadow APIs).
- **Architecture Diagrams:** High-level topology.
- **Previous Reports:** Any existing SAST/Scanner outputs (SonarQube/Snyk/Trivy logs).

---

## 5. Methodology

### 5.1 Discovery & Diagramming

1. **Generate a Threat Model Diagram:** Use **Mermaid.js** syntax to map Data Flow (DFD) across trust boundaries.
2. **Asset Inventory:** List all Critical Assets (PII, Payment Data, Secrets).

### 5.2 Execution (Audit Phase)

**Code & Logic Review**

- Review `AuthController` or equivalent for session fixations and weak token generation.
- Review database interaction layers for parameterized queries.
- Check headers setup: `Helmet` (Node) or equivalent for CSP, HSTS, X-Content-Type-Options.

**Infrastructure Review**

- Audit Terraform/CloudFormation files against CIS Benchmarks benchmarks.
- Check `Dockerfile` for `USER root` instructions (fail if found).

**Secrets & Supply Chain**

- Review commit history (if available) or config files for plaintext secrets.
- Check dependencies against the **CISA Known Exploited Vulnerabilities Catalog** logic (simulate this check).

### 5.3 Verification & Reporting

- Assign a **CVSS v3.1 Score** (approximate) to every finding.
- Prioritize based on "Exploitability" vs. "Impact."
- Suggest code fixes (e.g., "Replace `md5` with `bcrypt` or `Argon2`").

---

## 6. Deliverables

1. **Security Assessment Matrix (Markdown Table):**
    - `Vulnerability Name` | `Severity (S0-S3)` | `Location (File/Line)` | `CVSS Score` | `Remediation`
2. **Threat Model Diagram (Mermaid.js):**
    - Visualizing the attack surface and trust boundaries.
3. **Secrets & Auth Report:**
    - List of exposed credentials and weak auth patterns.
4. **IaC Hardening Plan:**
    - Specific Terraform/K8s config changes to close ports and enforce encryption.
5. **Remediation Backlog (CSV Format):**
    - Ready for Jira import (`Summary`, `Description`, `Priority`, `Labels`).

---

## 7. Acceptance Criteria

- Zero "False Positives" in the high-severity list (verify findings are reachable code).
- A valid Mermaid.js Data Flow Diagram is generated.
- All S0/S1 issues have a specific code snippet or config change proposed as a fix.
- No "active exploitation" attempts were made (compliance with safe AI usage).

---

## 8. Severity Levels (Security Focused)

- **S0 - Critical:** Remote Code Execution (RCE), SQL Injection in auth flow, hardcoded Admin keys. **Immediate Stop Ship.**
- **S1 - High:** Broken Object Level Auth (IDOR), Stored XSS, Public S3 Bucket with PII.
- **S2 - Medium:** Missing CSP headers, weak SSL/TLS ciphers, verbose error messages.
- **S3 - Low:** Missing "best practice" docs, minor version outdated (non-exploitable).
