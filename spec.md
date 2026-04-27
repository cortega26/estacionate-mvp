# Estacionate SaaS Upgrade Spec

## Objective

Raise Estacionate from MVP quality to a SaaS-grade product by improving the end-to-end platform across resident booking, payments, admin operations, guard validation, UX clarity, reliability, performance, supportability, and trust.

## Goals

1. Improve the quality of the resident booking and payment journey so it is clearer, more trustworthy, and easier to recover when something fails.
2. Improve the admin experience so it communicates status, occupancy, revenue, and actions with less friction and more executive value.
3. Improve the guard workflow so validation states and operational decisions are faster and less ambiguous.
4. Improve platform robustness with better error handling, observability, and validation around critical flows.
5. Improve delivery discipline by tying every meaningful product change to a specific proof path.

## Non-Goals

1. Full replatforming or major framework migration.
2. Broad redesign of unrelated modules with no product-quality impact.
3. Deep pricing-strategy redesign beyond what is required for clarity and trust.
4. New marketing site work unless it is directly required for product trust or onboarding.

## Product Outcomes

1. Core demo flows can be run consistently and explain value quickly.
2. Critical user-facing states have clear messaging and next-step guidance.
3. Browser-critical paths have automated proof instead of relying on manual confidence.
4. Product quality work is tracked as a sequence of verifiable changes rather than broad refactors.

## Scope

### In Scope

1. Resident authentication, search, booking, payment initiation, and post-payment states.
2. Admin dashboards and user-management workflows that affect trust and operational clarity.
3. Guard validation flows and supporting status clarity.
4. Reliability, observability, and performance work in auth, bookings, payments, and admin metrics.
5. Cross-role validation coverage and project-level execution tracking.

### Out of Scope

1. New infrastructure platforms unless a current blocker demands it.
2. Full visual rebrand.
3. Commercial collateral unrelated to product experience or delivery confidence.

## System Anchors

### Frontend

1. `frontend/src/pages/dashboard/SearchPage.tsx`
2. `frontend/src/features/bookings/components/BookingModal.tsx`
3. `frontend/src/features/map/components/ParkingMap.tsx`
4. `frontend/src/pages/checkout/SuccessPage.tsx`
5. `frontend/src/pages/checkout/FailurePage.tsx`
6. `frontend/src/pages/admin/DashboardPage.tsx`
7. `frontend/src/pages/admin/UserManagement.tsx`
8. `frontend/src/pages/gatekeeper/Dashboard.tsx`
9. `frontend/src/routes.config.tsx`

### Backend

1. `backend/src/services/BookingService.ts`
2. `backend/src/services/PaymentService.ts`
3. `backend/src/services/SalesService.ts`
4. `backend/src/api/admin/stats.ts`
5. `backend/src/api/payments/webhook.ts`
6. `backend/src/middleware/auth.ts`
7. `backend/prisma/schema.prisma`

## Implementation Strategy

### Phase 0: Bootstrap

1. Create this spec and keep it current.
2. Create `todo.md` and use it as the running execution checklist.
3. Create a root `tests/` E2E layer that reuses the existing frontend Playwright environment while making proof paths explicit.

### Phase 1: Baseline Quality and Proof

1. Establish stable browser coverage for resident login/search, admin user management, and smoke-level critical entry points.
2. Audit current experience gaps against the main product flows.
3. Prioritize the first slices that improve clarity, status communication, and operational trust.

### Phase 2: High-Value Product Fixes

1. Booking and checkout clarity.
2. Payment success and failure recovery.
3. Admin reporting and workflow clarity.
4. Guard validation flow clarity.
5. Reliability and observability improvements in backend critical paths.

### Phase 3: Hardening

1. Expand E2E coverage to match completed improvements.
2. Close spec-to-implementation gaps found in periodic reviews.
3. Run broader validation before handoff.

## Current Execution Order

1. Close role-scope proof gaps after the completed admin reporting slice.
2. Improve guard validation flow clarity and prove both operator input routing and backend enforcement.
3. Continue with the next smallest product-quality gap once the guard slice is fully proved.

## Current Phase Implementation Details

### Slice 1: Admin Reporting Clarity

1. Improve `frontend/src/pages/admin/DashboardPage.tsx` so the dashboard explains reporting scope, current platform state, and the next operational action instead of only showing raw KPIs.
2. Add clear zero-data and sparse-data states for revenue trends and recent activity so admins understand whether the system is idle, misconfigured, or simply between bookings.
3. Keep the change deterministic by proving the dashboard with mocked stats responses in a root `tests/` Playwright spec instead of relying on volatile seed data.

### Slice 2: Resident Booking-To-Payment Journey

1. Extend the resident browser suite from search and modal confirmation into the payment initiation handoff and result-return path.
2. Reuse deterministic route mocking where external payment behavior or seed variability would make the proof brittle.
3. Keep the journey proof user-visible: confirm that the resident can choose a space, review booking details, initiate payment, and land on a clear status page.

### Slice 3: Backend Observability And Error Handling

1. Add structured logging and safer error-handling around the backend code touched by the booking and reporting slices.
2. Prefer improvements that expose failure cause, actor, and booking or reporting context without changing the public product contract unnecessarily.
3. Validate observability work with narrow backend checks first, then broaden only if the touched slice is green.

### Slice 4: Guard Validation Flow Clarity

1. Make concierge verification less ambiguous by classifying patents and confirmation codes from explicit patterns instead of brittle length guesses.
2. Add operator-facing guidance in `frontend/src/pages/gatekeeper/Dashboard.tsx` so guards know how to enter a booking code versus a patent.
3. Prove the slice with deterministic browser coverage for request routing and a narrow backend test for building isolation plus active-window enforcement.

## Execution Rules

1. Consult this spec before each meaningful implementation change.
2. Update `todo.md` as tasks move from planned to complete.
3. Run the narrowest relevant tests after each meaningful change, then broaden when needed.
4. Every roughly 20 iterations, run a fresh review pass against this spec and the current implementation.
5. Do not mark a task complete without proof.
6. Keep root `tests/` aligned with the current execution order so each completed slice has an explicit browser proof path.

## Verification Matrix

### Environment Preconditions

1. Browser-critical E2E tests require a reachable backend and seeded auth data.
2. The default local path uses Docker-backed Postgres and Redis via `backend/.env.local.example`.
3. This environment is now configured for the default local path, including Docker, Postgres, Redis, migrations, and seeded demo accounts.

| Area | Proof Required | Initial Command/Check | Exit Signal |
| --- | --- | --- | --- |
| Bootstrap artifacts | Files created and internally consistent | Inspect `spec.md`, `todo.md`, `tests/`, run docs checks if touched | Files exist and are coherent |
| Resident auth/search smoke | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts resident-search.spec.ts` | User can reach and use the search surface after login |
| Admin user management | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts admin-user-management.spec.ts` | Admin can ban and unban seeded user |
| Critical login behavior | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts auth.smoke.spec.ts` | Invalid login fails and seeded admin login succeeds |
| Payment result states | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts payment-result-pages.spec.ts` | Approved, pending, and rejected result pages show clear guidance and recovery actions |
| Admin reporting clarity | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` | Admin dashboard explains reporting scope, current state, and zero-data guidance clearly |
| Building-admin dashboard scope | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` | Building admins see scoped dashboard messaging and cannot request another building's stats |
| Resident booking confirmation clarity | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-search.spec.ts` | Resident can review booking details before leaving for payment |
| Resident booking-to-payment journey | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-booking-journey.spec.ts` | Resident can move from search to booking confirmation to payment result guidance |
| Guard validation clarity | Browser and narrow backend test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/guard-validation.spec.ts`, `cd backend && npm test -- concierge-verify.test.ts`, `cd frontend && npm run lint` | Guard can verify patents and confirmation codes without format ambiguity, and backend verification remains building-scoped and time-valid |
| Backend observability in touched path | Narrow backend checks | `cd backend && npm run build`, targeted backend test if added | Touched backend path compiles and preserves behavior while emitting clearer operational context |
| Product changes in touched frontend slice | Narrow frontend checks | `cd frontend && npm run lint`, `cd frontend && npm test`, targeted Playwright spec | No regressions in touched flow |
| Product changes in touched backend slice | Narrow backend checks | `cd backend && npm run lint`, `cd backend && npm run build`, `cd backend && npm test` | No regressions in touched backend slice |
| Cross-cutting handoff | Broad validation | `npm run check:all` | Repo checks pass or blockers are explicitly documented |

## Slice Proof Plan

### Admin Reporting Clarity

1. Add or update `tests/admin-dashboard.spec.ts` to mock `GET /api/admin/stats` and assert the dashboard headline, scope guidance, KPI helper text, and zero-data messaging.
2. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` after the first substantive dashboard edit.
3. Run `cd frontend && npm run lint` once the dashboard slice is green.

### Resident Booking-To-Payment Journey

1. Add or update `tests/resident-booking-journey.spec.ts` to cover space selection, booking confirmation, payment initiation handoff, and return-state messaging.
2. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-booking-journey.spec.ts` after the first substantive journey edit.
3. Re-run the narrower resident search proof if the journey edit changes shared booking UI.

### Backend Observability And Error Handling

1. Add or update narrow backend proof for the touched reporting or booking path when behavior changes.
2. Run `cd backend && npm run build` immediately after the first substantive backend edit.
3. If a targeted backend test exists or is added, rerun it before broadening to wider checks.

### Guard Validation Flow Clarity

1. Add or update `tests/guard-validation.spec.ts` to prove concierge input routing for both patents and confirmation codes with deterministic request assertions.
2. Add or update a narrow backend proof for `backend/src/api/concierge/verify.ts` so assigned-building scoping and active-window checks are explicit.
3. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/guard-validation.spec.ts` after the first substantive guard UI edit.
4. Run `cd backend && npm test -- concierge-verify.test.ts` once the handler proof is in place, then `cd frontend && npm run lint`.

## Initial Risks

1. Existing browser coverage is thin and may not be deterministic enough for fast iteration.
2. Some cross-role flows may require stronger test data control than the current seed provides.
3. Payment end-to-end coverage may need a simulator or deterministic harness to avoid external dependency noise.
4. The broader backend suite still has unrelated reconciliation test failures, so full-repo handoff proof is not yet equivalent to slice-level proof.

## Deferred Until Proven Necessary

1. Full test framework restructuring beyond the minimum needed for a reliable root `tests/` layer.
2. New public-site work.
3. Wide architectural refactors not tied to user-visible quality or operational risk.