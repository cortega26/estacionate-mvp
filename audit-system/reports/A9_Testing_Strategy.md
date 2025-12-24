# Audit A9: Testing Strategy & Coverage

## 1. Executive Summary
**Current Status**: ⚠️ **False Confidence Detected**
**Score**: C+
The project relies heavily on 3 layers:
1.  **Unit Tests (Mocks)**: `BookingService.test.ts` verifies logic (refunds) but mocks DB completely.
2.  **Integration Tests (Real DB)**: `bookings.test.ts` is robust but lacks cleanup isolation ("if we reused 'Test Building'").
3.  **E2E (Playwright)**: Minimal (Smoke Login only).

**Risk**: The core "Money" flows (Payments, Payouts, Commissions) have the least "Real World" coverage (relying on unit tests or repro scripts), while the "Happy Path" booking flow is well covered.

## 2. Coverage Gaps by Risk

### High Risk (Money/Legal)
| Feature | Current Status | Risk | Recommendation |
| :--- | :--- | :--- | :--- |
| **Payment Webhooks** | Partially partially mocked in unit tests. Real webhook flow not simulated in E2E. | **CRITICAL** | Create a `verified-payouts.test.ts` integration test that simulates the full webhook signature verification. |
| **Admin Payouts** | No automated tests found. | **HIGH** | Add integration test for `generate-payouts.ts` script logic. |
| **Yield Management** | Mocked as `[]` in Unit tests. | **HIGH** | Add `pricing-rules.test.ts` (Integration) to verify priority/date range logic with real DB queries. |
| **Commissions** | `fix-s1-commission.test.ts` exists (repro). | **MED** | Formalize into `commissions.test.ts`. |

### Medium Risk (UX/Operations)
| Feature | Current Status | Risk | Recommendation |
| :--- | :--- | :--- | :--- |
| **Admin Dashboard** | Manual testing only. | **MED** | Add E2E for "Approve Resident" and "Cancel Booking". |
| **Availability Sync** | `bookings.test.ts` covers overrides, but "Generate Availability" CRON needs specific overlap tests. | **MED** | Refactor `cron-availability.test.ts` to be more robust. |

## 3. False Confidence Detectors
These tests pass easily but may mask real bugs:
1.  **`backend/tests/unit/BookingService.test.ts`**:
    *   **Why**: It manual-mocks `db.availabilityBlock.findUniqueOrThrow`. If the Schema relationship changes (e.g. `spot` becomes optional), this test generally still passes while the app crashes.
    *   **Verdict**: Good for testing *Refund Math*, Useless for testing *Data Integrity*.
2.  **`backend/tests/singleton.ts` consumers**:
    *   Any test relying solely on `prismaMock` for complex queries (Joins/Transactions) is suspect. Prisma transactions are hard to mock correctly.

## 4. Missing E2E Scenarios (Playwright)
The current `frontend/e2e` only has 2 files. Missing:
1.  **Admin Flow**:
    *   Login as Admin -> Go to Residents -> Click "Verify" -> Logout -> Login as Resident -> Verify Access.
2.  **My Bookings Flow**:
    *   Login -> View "Upcoming Booking" -> Click Cancel -> Verify Toast.
3.  **Profile Update**:
    *   Update Vehicle Plate -> Verify reflection in next booking attempt.

## 5. Proposed Minimal Test Matrix
Optimize for **Confidence**, not % Coverage.

| Layer | Focus | Target Matches |
| :--- | :--- | :--- |
| **E2E (Playwright)** | "Can a user give us money?" & "Can an admin stop abuse?" | 1. **Booking Flow** (Full, including fake payment)<br>2. **Admin Verification Flow**<br>3. **Emergency Button** (Cancel/Block) |
| **Integration (Vitest + DB)** | Business Invariants & Money Math. | 1. **`BookingService`** (Switch from Unit to Integration for DB interactions)<br>2. **`PaymentService`** (Mock external MP API, but use Real DB for state transitions)<br>3. **`PricingRules`** (Complex SQL logic) |
| **Unit (Vitest + Mocks)** | Pure Functions & Edge Logic. | 1. **Refund Calculator** (Date math)<br>2. **Audit Logging** (Format checks)<br>3. **Input Validation** (Regex) |

## 6. Action Plan
1.  **Stop writing Unit Tests for Services**. Write Integration Tests instead (using the Docker DB). Service logic is too coupled to Data to mock effectively.
2.  **Create `admin.spec.ts`** in Playwright.
3.  **Formalize `payouts.test.ts`**.
