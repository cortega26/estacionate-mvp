# Audit Phase 2: Deep Dive Findings

**Date:** 2025-12-23
**Status:** In Progress

## 1. Executive Summary
The "Deep Dive" audit reveals a tendency towards "God Functions" in the backend, specifically in critical paths like Booking Creation. The DB Schema is generally robust with good indexing and security practices (blind indexes for PII). The Frontend suffers from inconsistent API patterns, with some components bypassing the configured Axios client in favor of raw `fetch` calls, leading to potential auth implementation errors.

## 2. Backend Findings

### 2.1 Architecture & Separation of Concerns
**Severity: High**
- **Violation:** `backend/api/bookings/create.ts` (280 lines) contains excessive logic:
    - Blocklist verification (Database logic).
    - Pricing Rules engine (Business logic).
    - Double-booking detection (Business logic).
    - Event publishing (Infrastructure logic).
    - Controller logic (Req/Res handling).
- **Impact:** Hard to test in isolation; logic cannot be reused (e.g., if we add a "Concierge Booking" feature later, we'd copy-paste this logic).
- **Recommendation:** Extract logic into `BookingService.createBooking(...)`.

### 2.2 Payment Logic Leakage
**Severity: Medium**
- **Violation:** `backend/api/payments/checkout.ts` handles `db.payment.upsert`.
- **Recommendation:** Move to `PaymentService`.

### 2.3 Database Schema (Prisma)
**Severity: Low (Mostly Good)**
- **Positive:** `Resident` table uses `rutHash` for blind indexing and `rut` encrypted. Good security practice.
- **Positive:** Indexes on foreign keys (`residentId`, `buildingId`) are present.
- **Observation:** `PricingRule` logic is embedded in the controller query rather than a DB function or Service method.

## 3. Frontend Findings

### 3.1 Inconsistent API Patterns
**Severity: High**
- **Violation:** `frontend/src/lib/api.ts` defines a configured Axios instance (handling base URL and cookies).
- **Evidence:** `frontend/src/pages/Admin/UserManagement.tsx` bypasses this and uses raw `fetch`:
    ```typescript
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?${params}`, { credentials: 'include' })
    ```
- **Impact:** If auth logic changes (e.g., header-based token), these raw fetch calls will break. It also duplicates environment variable logic.

### 3.2 Hardcoded Strings
**Severity: Low**
- Management pages use hardcoded English/Spanish strings mixed.

## 4. Recommendations
1.  **Refactor Booking Controller:** Create `BookingService`.
2.  **Standardize Frontend API:** Replace raw `fetch` in `UserManagement.tsx` (and others) with `api` client from `lib/api.ts`.
