# Audit Phase 1: Automated Scans & Quick Wins

**Date:** 2025-12-23
**Status:** In Progress

## 1. Executive Summary
The initial automated scan identified several low-hanging fruits ("Quick Wins") that can immediately improve code cleanliness and reduce noise. Key findings include debug logs left in production code, version mismatches in dependencies between frontend and backend, and critical TODOs in payment handling.

## 2. Findings

### 2.1 Code Cleanliness (Console Logs)
**Severity: Low (Noise) / Medium (Information Leak)**
Found `console.log` and `console.error` usage in what appears to be production paths:
- `backend/api/index.ts`: Debug startup logs.
- `backend/app.ts`: Debug startup logs.
- `frontend/src/main.tsx`: `console.log('Main app starting...')`
- `frontend/src/pages/dashboard/SearchPage.tsx`: Debugging usage `console.log('Checkout Init:', res.data)` and `console.error`.

**Recommendation:** Remove these logs or replace with a proper logger (like `pino` which is already installed in backend).

### 2.2 Technical Debt (TODOs/FIXMEs)
**Severity: Medium / High**
- **CRITICAL:** `backend/src/api/payments/webhook.ts`: `// TODO: Fetch payment from MP API using paymentId`. This suggests the webhook might be trusting the incoming body without verification, which is a security risk.
- **UX:** `frontend/src/pages/admin/SettingsPage.tsx`: Hardcoded Spanish strings in `confirm()` calls. Should be UI components or at least centralized strings.

### 2.3 Dependency Management (`package.json`)
**Severity: Medium**
- **Inconsistency:** `date-fns` is v3.6.0 in Backend but v2.30.0 in Frontend.
- **Suspicious Versions:**
    - Frontend lists `zod` as `^4.1.13` (Zod v4 is not standard yet).
    - Backend lists `zod` as `^3.25.76` (Zod v3.24 is latest stable usually).
- **Dead Scripts?**: Frontend has `deploy`: `gh-pages -d dist`, but the project seems to target Vercel.

### 2.4 Type Safety
**Severity: Low (for now)**
- Extensive use of `any` in Test files (`backend/tests/**`). This makes refactoring tests fragile but doesn't affect production runtime directly.

## 3. Immediate Action Plan (Quick Wins)
1.  **Cleanup:** Remove `console.log` from `frontend/src/main.tsx`, `frontend/src/pages/dashboard/SearchPage.tsx`, `backend/api/index.ts`, `backend/app.ts`.
2.  **Investigation:** Verify if `zod` versions are valid or typos.
3.  **Refactor:** Add a `verifyPayment` check in `webhook.ts` (moved to "Deep Dive" but noted here).
