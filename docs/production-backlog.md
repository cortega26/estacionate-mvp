# Production Backlog 2025

This document tracks the implementation status of the [Production Roadmap](production-roadmap-2025.md).

## High Priority

- [x] **8. Strict Content-Security-Policy (CSP)**
    - [x] Verified via `tests/security-headers.test.ts`.

- [x] **4. PII Encryption at Rest**
    - [x] Created `lib/crypto.ts` (AES-256-GCM / SHA-256 Blind Index).
    - [x] Updated `Resident` model to encrypt `rut` and `phone`.
    - [x] Implemented Blind Index (`rutHash`) for lookups in `signup.ts`.
    - [ ] **Follow-up**: Migrate `create-admin` and `seed` scripts to use encryption.

- [x] **1. Distributed Event Bus**
    - [x] Create `RedisEventBus` implementation.
    - [x] Configure connection handling.
    - [x] Switch `EventBus.getInstance()` to use Redis in production.

- [x] **2. Optimistic Concurrency Control**
    - [x] Add `@version` to `AvailabilityBlock` (Verified Atomic Locking via `updateMany` in `create.ts`).
    - [x] Update `createBooking` transaction logic.
    - [x] Add `race-condition.ts` verification test (Coverage existent).

- [ ] **5. Multi-Factor Authentication**
    - [ ] Add MFA fields to `User` schema.
    - [ ] Implement TOTP generation/verification.
    - [ ] Enforce for Admin roles.

## Medium Priority

- [ ] **3. Multi-Tenant "Organization" Layer**
    - [ ] Create `Organization` model.
    - [ ] Migrate `Building` to belong to `Organization`.
    - [ ] Update RBAC.

- [ ] **6. Structured Logging Unification**
    - [ ] Replace `console.log` with `logger` (Pino).

- [ ] **9. Revocable Session Management**
    - [ ] Implement Redis session storage.

## Low Priority (Maintenance/Compliance)

- [ ] **7. Automated GDPR "Right to be Forgotten"**
- [ ] **10. IaC & CI/CD Pipeline**
