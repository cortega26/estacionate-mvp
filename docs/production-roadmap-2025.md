# Production-Ready Marketplace Roadmap 2025

**Author:** Antigravity (Senior SaaS Architect)
**Date:** December 19, 2025
**Scope:** Gap Analysis for Tier 1 Marketplace Readiness

## Executive Summary
The current `estacionate-mvp` codebase is a solid foundation with good initial practices (TypeScript, Prisma, Sentry, Redis-based Rate Limiting). However, to reach "Tier 1 Marketplace" status—serving hundreds of thousands of users with high concurrency and strict compliance—architecture upgrades are required. The focus must shift from "Functionality" to "Reliability, Compliance, and Scalability".

Below is the Ranked Top 10 Roadmap to bridge this gap.

---

## Top 10 Roadmap

### 1. Distributed Event Bus (Critical Scalability)
*   **The What**: Replace the current In-Memory `EventBus` (Map-based) with a distributed broker like **Redis Pub/Sub** or **AWS EventBridge**.
*   **The Why**: The current bus works only within a single Node.js process. In a production cluster (Kubernetes/Auto-scaling), an event emitted on Server A (e.g., `BOOKING_CREATED`) is invisible to Server B. This prevents scalable async processing (notifications, webhooks).
*   **Agentic Implementation Plan**:
    1.  Create `RedisEventBus` implementing the `EventBus` interface.
    2.  Use `ioredis` to publish/subscribe to channels.
    3.  Update `audit-system/core/EventBus.ts` to switch strategies based on `NODE_ENV`.
*   **Verification**: Spin up two local worker processes. Trigger an event on Worker A and verify Worker B logs/receives it.

### 2. Optimistic Concurrency Control (Data Integrity)
*   **The What**: Add a `@version` integer field to `AvailabilityBlock` and `Booking` models in Prisma.
*   **The Why**: High-concurrency booking attempts (e.g., concert parking) will lead to race conditions. The current system relies on transaction isolation, which can range from "slow serial locking" to "race conditions" depending on DB config. Optimistic locking prevents "Double Booking" at the application level efficiently.
*   **Agentic Implementation Plan**:
    1.  Add `version Int @default(0)` to usage-heavy models in `schema.prisma`.
    2.  Update `createBooking` logic to `increment: version` and check logic.
*   **Verification**: Run a load test script `tests/race-condition.ts` firing 50 concurrent booking requests for the exact same spot. Assert exactly 1 success and 49 failures.

### 3. Multi-Tenant "Organization" Layer
*   **The What**: Introduce an `Organization` or `Operator` model that sits above `Building`.
*   **The Why**: Tier 1 Marketplaces interact with B2B partners (Parking Operators) who manage portfolios of buildings. The current `adminCompany` string on `Building` is insufficient for proper RBAC (Role Based Access Control) and financial aggregation.
*   **Agentic Implementation Plan**:
    1.  Create `Organization` model.
    2.  Link `Building` to `Organization`.
    3.  Create `OrganizationUser` role/relation.
*   **Verification**: Create an Organization with 2 Buildings. Create an Org Admin. Verify they can see stats for both buildings but not for a competitor's building.

### 4. PII Encryption at Rest (SOC2 Compliance)
*   **The What**: Implement application-level encryption for sensitive fields (`rut`, `phone`, `email`) or use Postgres TDE.
*   **The Why**: If a database dump is leaked, raw user data is exposed. SOC2 and GDPR require "Protection of Personal Data".
*   **Agentic Implementation Plan**:
    1.  Create `lib/crypto.ts` with AES-256-GCM helpers.
    2.  Add middleware or Prisma middleware to encrypt on write / decrypt on read for specific fields.
*   **Verification**: Inspect the raw SQL rows via `psql` or Prisma Service. Fields should look like gibberish (`iv:ciphertext`). API requests should still return cleartext to authorized users.

### 5. Multi-Factor Authentication (MFA)
*   **The What**: Integrate TOTP (Time-based One-Time Password) or SMS/WhatsApp OTP for login.
*   **The Why**: Passwords are frequently compromised. Tier 1 security mandates MFA, especially for Admin and Concierge roles.
*   **Agentic Implementation Plan**:
    1.  Add `mfaSecret` and `mfaEnabled` to `User` model.
    2.  Implement `speakeasy` or `otplib` for TOTP generation/verification.
    3.  Enforce MFA for `Role.ADMIN`.
*   **Verification**: Attempt login as Admin. Should require a second step. Verify token using Google Authenticator.

### 6. Structured Logging Unification
*   **The What**: Refactor `EventBus` and global error handlers to use the standard `lib/logger.ts` (Pino) instead of `console.log`.
*   **The Why**: `console.log` works for local dev, but in production, logs must be JSON structured to be ingested by Datadog/Splunk/CloudWatch for querying, alerting, and correlation.
*   **Agentic Implementation Plan**:
    1.  Search and replace `console.log`, `console.error` in backend with `logger.info`, `logger.error`.
    2.  Ensure `traceId` context is passed to all logs.
*   **Verification**: Run the app, trigger a flow, and inspect stdout. Output must be pure JSON lines.

### 7. Automated GDPR "Right to be Forgotten"
*   **The What**: Create a system workflow to "Anonymize" user data upon request.
*   **The Why**: Legal requirement in EU (GDPR) and increasingly in LatAm (LGPD/LPDP). Deleting a user is dangerous (breaks foreign keys), so "Anonymization" (scrambling personal data) is the standard.
*   **Agentic Implementation Plan**:
    1.  Create `User.anonymize()` service method.
    2.  Replace name with "Anonymous", email with "deleted-uuid@placeholder.com", clear phones.
    3.  Keep transaction history for accounting.
*   **Verification**: Create user, make booking. Run anonymize. Verify user cannot login, but booking stats remain accurate.

### 8. Strict Content-Security-Policy (CSP)
*   **The What**: Move from "Report Only" or "Weak" CSP to a Strict CSP preventing XSS and unauthorized script injection.
*   **The Why**: Mitigates Cross-Site Scripting (XSS). Parking marketplaces process payments; ensuring no malicious scripts can skim credit card data is paramount.
*   **Agentic Implementation Plan**:
    1.  Configure `helmet.contentSecurityPolicy`.
    2.  Allow only known domains (Self, MercadoPago, Google Maps).
*   **Verification**: Inject a dummy `<script>alert(1)</script>` in a description field (if reflected). Browser should block execution and log an error.

### 9. Revocable Session Management
*   **The What**: Move stateful session control to Redis. Store `sessionId` in JWT, check validity in Redis on every request.
*   **The Why**: Stateless JWTs cannot be revoked if a user performs "Logout on all devices" or if an admin bans a compromised user.
*   **Agentic Implementation Plan**:
    1.  On login, store `session:{userId}:{sessionId}` in Redis with TTL.
    2.  Middleware checks Redis for existence.
    3.  Limit active sessions per user (prevent account sharing).
*   **Verification**: Login. Manually delete key from Redis. Subsequent request with valid JWT should fail 401.

### 10. Infrastructure as Code (IaC) & CI/CD Pipeline
*   **The What**: Define the entire stack (Postgres, Redis, Node.js, Vercel Config) in Terraform or strict Docker Compose for production.
*   **The Why**: "It works on my machine" is unacceptable for Tier 1. Environments must be deterministic parity.
*   **Agentic Implementation Plan**:
    1.  Formalize `docker-compose.prod.yml`.
    2.  Write GitHub Actions for "Build, Test, Migrations, Deploy".
*   **Verification**: Delete `node_modules` and local DB. Run single "one-click deploy" command. System should be fully operational.
