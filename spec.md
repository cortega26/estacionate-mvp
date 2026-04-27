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

## Execution Rules

1. Consult this spec before each meaningful implementation change.
2. Update `todo.md` as tasks move from planned to complete.
3. Run the narrowest relevant tests after each meaningful change, then broaden when needed.
4. Every roughly 20 iterations, run a fresh review pass against this spec and the current implementation.
5. Do not mark a task complete without proof.

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
| Product changes in touched frontend slice | Narrow frontend checks | `cd frontend && npm run lint`, `cd frontend && npm test`, targeted Playwright spec | No regressions in touched flow |
| Product changes in touched backend slice | Narrow backend checks | `cd backend && npm run lint`, `cd backend && npm run build`, `cd backend && npm test` | No regressions in touched backend slice |
| Cross-cutting handoff | Broad validation | `npm run check:all` | Repo checks pass or blockers are explicitly documented |

## Initial Risks

1. Existing browser coverage is thin and may not be deterministic enough for fast iteration.
2. Some cross-role flows may require stronger test data control than the current seed provides.
3. Payment end-to-end coverage may need a simulator or deterministic harness to avoid external dependency noise.
4. The broader backend suite still has unrelated reconciliation test failures, so full-repo handoff proof is not yet equivalent to slice-level proof.

## Deferred Until Proven Necessary

1. Full test framework restructuring beyond the minimum needed for a reliable root `tests/` layer.
2. New public-site work.
3. Wide architectural refactors not tied to user-visible quality or operational risk.