# Release Notes - v1.0.0-rc.1

**Commit**: 5909717
**Date**: 2025-12-24
**Verdict**: 🟢 **GO** (Ready for Production)

## 🚀 New Features
-   **Admin Dashboard**: Comprehensive building, unit, and user management.
-   **Booking Flow**: End-to-end visitor parking booking with availability checking.
-   **Payments**: Integrated payment flow with commission calculation (Platform & Software fees).
-   **Resident Portal**: Self-service unit and vehicle management.
-   **Gatekeeper View**: Optimized view for concierges to validate access.

## 🛡️ Security & Stability Fixes
-   **Cross-Browser Login**: Fixed login failures on Firefox/WebKit by resolving cookie domain mismatches and form accessibility issues.
-   **Redis Guardrails**: Implemented fail-fast connection timeouts (5s) to prevent application hangs during outages.
-   **Data Integrity**: Enforced unique constraints on Resident emails and randomized test data to ensure reliable CI/CD pipelines.
-   **Session Security**: Hardened cookie attributes (`SameSite=Lax`, `HttpOnly`, `Secure` in production).

## 🔧 Operational Improvements
-   **E2E Testing**: Full Playwright suite covering critical user journeys (Login, Dashboard) across Chromium, Firefox, and WebKit.
-   **Database**: Robust schema with UUIDs and optimistic locking for availability (implied by concurrency work).
