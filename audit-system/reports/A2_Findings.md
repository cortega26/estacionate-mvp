# Audit Report: A2 - Security, AppSec & Infrastructure

**Date:** 2025-12-22
**Auditor:** Agentic Assistant (A2 Orchestrator)
**Status:** In Progress (Partial)

---

## 1. Executive Summary
The application has basic security controls in place (`helmet`, `rate-limiting`, `cors`). However, the CORS configuration uses a regex that might be overly permissive or prone to ReDoS. Dependencies look relatively standard, but `helmet` usage should be configured explicitly rather than relying on defaults which might break CSP.

## 2. Findings

### [A2-1] CORS Origin Regex Risk (S2)
**Location:** `backend/lib/cors.ts`
**Description:** The regex `origin.match(/^https:\/\/[\w-]+\.vercel\.app$/)` is used to allow Vercel previews.
**Why It Fails:** While `\w` is generally safe, ensure this doesn't allow subdomain takeovers (e.g. `my-malicious-app.vercel.app`). Also, verifying if `origin` is null (server-to-server) is allowed, which is standard but must be purposeful.
**Fix:** Consider being more explicit or using a strictly defined list if possible. For now, the regex is acceptable but should be monitored.

### [A2-2] Missing Explicit Helmet Configuration (S3)
**Location:** `backend/app.ts`
**Description:** `app.use(helmet())` is used with defaults.
**Impact:** Defaults are good, but HSTS (Strict-Transport-Security) might not be aggressive enough for a financial app, and CSP (Content Security Policy) is often disabled by default in Helmet to avoid breaking apps.
**Fix:** Configure Helmet explicitly: `app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true, preload: true } }));`

### [A2-3] Secret Management (Pass)
**Description:** Secrets are loaded via `dotenv` and `process.env`. No hardcoded secrets found in `package.json` or analyzed files.

### [A2-4] Dependency Vulnerabilities (Pending)
**Description:** `npm audit` should be run in CI.
**Action:** User should run `npm audit` manually.

## 3. Threat Model (Simplified)
- **Entry Points:** `/api/auth/login`, `/api/bookings/create`, `/api/payments/webhook`.
- **Assets:** User Data (Residents), Financial Data (Commissions), Access Codes.
- **Risks:**
    -   Brute Force on Login (Mitigated by `authLimiter`).
    -   Bypass of Payment (Mitigated by Webhook Signature - to be verified in Payment logic).

## 4. Next Steps
1.  Strengthen Helmet config.
2.  Verify Webhook Signature verification logic (Delegated to Payment Logic verification if not done).
