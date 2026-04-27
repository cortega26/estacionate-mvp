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

1. Keep the admin dashboard and analytics rendering slice green with deterministic proof in `tests/admin-dashboard.spec.ts`.
2. Remove the last raw browser `confirm()` path in sales-rep building management (`frontend/src/pages/admin/components/ManageBuildingsList.tsx`) using in-app confirmation UI.
3. Add deterministic browser proof for cancel-versus-confirm sales-rep building removal in root `tests/`.
4. Validate the sales-rep slice with focused Playwright plus touched-slice lint only if page code changes.

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

### Slice 5: Admin Settings Confirmation Clarity

1. Replace the blocking `confirm()` flow in `frontend/src/pages/admin/SettingsPage.tsx` with an in-app confirmation surface that summarizes the selected building, new base price, and the fact that only future available blocks are affected.
2. Keep the action deterministic by allowing the confirmation step to be fully exercised with mocked `GET /api/buildings` and `PUT /api/admin/prices` responses in a root `tests/` Playwright spec.
3. Preserve the existing mutation contract while improving the operator experience: cancel should abort the request, confirm should send the exact building and price chosen in the form, and success feedback should remain visible.

### Slice 6: Admin User-Management Confirmation Clarity

1. Replace the raw `confirm()` flow in `frontend/src/pages/admin/UserManagement.tsx` with an in-app confirmation surface for ban and unban actions so admins can verify the target user before mutating account status.
2. Keep the slice behaviorally complete by ensuring cancel leaves the user row unchanged and confirm triggers the same backend patch contract used today.
3. Keep the browser proof deterministic by intercepting admin login plus the list-and-patch user-management requests inside `tests/admin-user-management.spec.ts`, so the test isolates confirmation behavior instead of live auth or seed drift.

### Slice 7: Building-Management Confirmation Clarity

1. Replace the remaining raw `confirm()` usage in building-management admin surfaces with in-app confirmation UI, starting with `frontend/src/pages/admin/BuildingsPage.tsx` and `frontend/src/pages/admin/components/ManageBuildingsList.tsx`.
2. Preserve the current backend contracts while making destructive actions reviewable and cancelable without relying on browser dialogs.
3. Add or extend root `tests/` browser proof so building status changes or destructive building actions can be canceled before any request is sent and explicitly confirmed before state changes.

### Slice 7a: Buildings Page Confirmation Clarity

1. Replace the raw `confirm()` calls in `frontend/src/pages/admin/BuildingsPage.tsx` for archive/restore and delete actions with a shared in-app confirmation panel.
2. Keep the contract stable: archive/restore should still issue the same `PUT /api/admin/buildings` payload, and delete should still issue the same `DELETE /api/admin/buildings?id=...` request only after explicit confirmation.
3. Prove the slice with deterministic browser coverage that can cancel each action without sending a request and confirm the exact archive/delete request once accepted.

### Slice 7b: Demo Building Deletion

1. Add an explicit demo marker to buildings so seeded demo inventory can be handled intentionally instead of inferred from fragile naming or email conventions.
2. Update `backend/src/api/admin/buildings.ts` so a normal delete for a demo building automatically performs the same dependency cleanup currently reserved for `force=true`, while preserving the stricter 409-plus-force flow for non-demo buildings with associated records.
3. Expose the demo flag in the admin buildings response and use it in `frontend/src/pages/admin/BuildingsPage.tsx` to explain when deleting a demo building will also remove its demo operational history.

### Slice 8: Local Admin CORS Resilience

1. Update `backend/src/lib/cors.ts` so approved local development origins include the standard Vite fallback ports needed when `5173` is already occupied, without broadening access to arbitrary origins.
2. Keep the security posture explicit: local loopback origins may vary by approved port, production origins remain allowlisted, and unknown origins must still fail closed.
3. Refresh the admin reporting browser proof so it no longer depends on stale seeded-login assumptions and confirms the dashboard can load data after a real authenticated admin session.

### Slice 8a: Admin Dashboard And Analytics Render Reliability

1. Keep `frontend/src/pages/admin/DashboardPage.tsx` and `frontend/src/pages/admin/Analytics.tsx` aligned with the backend response contracts so both routes load reliably after authentication.
2. Make root browser proof deterministic by mocking `POST /api/auth/login`, `GET /api/admin/stats`, and `GET /api/admin/analytics` inside `tests/admin-dashboard.spec.ts`.
3. Ensure the proof explicitly asserts both pages: dashboard state messaging and analytics summary-plus-chart sections.

### Slice 9: Sales-Rep Building Removal Confirmation Clarity

1. Replace the raw `confirm()` call in `frontend/src/pages/admin/components/ManageBuildingsList.tsx` with an in-app confirmation surface before unassigning a sales rep from a building.
2. Preserve contract behavior: cancel sends no mutation, confirm sends the same `PUT /api/admin/buildings` payload with `salesRepId: null`.
3. Prove the slice with deterministic root browser coverage for cancel-versus-confirm removal behavior.

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
| Admin user-management confirmation clarity | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-user-management.spec.ts` | Admin can review, cancel, and then confirm ban-or-unban actions before the row status changes |
| Critical login behavior | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts auth.smoke.spec.ts` | Invalid login fails and seeded admin login succeeds |
| Payment result states | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts payment-result-pages.spec.ts` | Approved, pending, and rejected result pages show clear guidance and recovery actions |
| Admin dashboard and analytics render reliability | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` | Admin dashboard and analytics pages both load after login and render deterministic reporting content |
| Building-admin dashboard scope | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` | Building admins see scoped dashboard messaging and cannot request another building's stats |
| Resident booking confirmation clarity | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-search.spec.ts` | Resident can review booking details before leaving for payment |
| Resident booking-to-payment journey | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-booking-journey.spec.ts` | Resident can move from search to booking confirmation to payment result guidance |
| Guard validation clarity | Browser and narrow backend test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/guard-validation.spec.ts`, `cd backend && npm test -- concierge-verify.test.ts`, `cd frontend && npm run lint` | Guard can verify patents and confirmation codes without format ambiguity, and backend verification remains building-scoped and time-valid |
| Admin settings confirmation clarity | Browser test and frontend lint | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-settings.spec.ts`, `cd frontend && npm run lint` | Admin sees an in-app confirmation summary before bulk price changes, can cancel without sending the mutation, and can confirm the exact building/price payload |
| Buildings page confirmation clarity | Browser test and frontend lint | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-buildings.spec.ts`, `cd frontend && npm run lint` | Admin can review, cancel, and then confirm archive/delete actions for a building before any request is sent |
| Demo building deletion | Focused backend test plus browser proof | `cd backend && npm test -- admin-buildings.test.ts`, `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-buildings.spec.ts`, `cd frontend && npm run lint` | Demo buildings with demo residents, bookings, and payments delete cleanly from the standard admin flow without a force-delete detour |
| Local admin CORS resilience | Focused backend integration plus browser proof | `cd backend && npm test -- integration/cors.test.ts`, `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` | Local admin login, dashboard, and analytics requests succeed when Vite moves to an approved fallback localhost port |
| Sales-rep building-removal confirmation clarity | Browser test | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-sales-reps.spec.ts` | Admin can cancel sales-rep building removal without sending a mutation and must explicitly confirm before unassignment is persisted |
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

### Admin Settings Confirmation Clarity

1. Add `tests/admin-settings.spec.ts` to intercept `GET /api/buildings` and `PUT /api/admin/prices`, then assert that the page shows a confirmation summary before the mutation runs.
2. Prove that canceling from the confirmation step sends no update request.
3. Prove that confirming sends the exact `buildingId` and `newPrice` selected in the form and surfaces the success toast.
4. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-settings.spec.ts` immediately after the first substantive settings-page edit, then `cd frontend && npm run lint`.

### Admin User-Management Confirmation Clarity

1. Update `tests/admin-user-management.spec.ts` to mock admin login plus `GET` and `PATCH /api/admin/users`, then verify that canceling a ban leaves the row active.
2. Extend the same browser proof so the admin must explicitly confirm the ban before the row status changes, then repeat the pattern for unban.
3. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-user-management.spec.ts` immediately after the first substantive user-management edit, then `cd frontend && npm run lint`.

### Building-Management Confirmation Clarity

1. Identify the smallest remaining raw `confirm()` path in building administration and add or extend a root `tests/` Playwright proof for cancel-versus-confirm behavior.
2. Run the targeted building-management Playwright spec immediately after the first substantive UI edit.
3. Run `cd frontend && npm run lint` once the next confirmation slice is green.

### Buildings Page Confirmation Clarity

1. Add `tests/admin-buildings.spec.ts` to mock admin login, `GET /api/admin/buildings`, and the archive/delete mutations.
2. Prove that canceling the archive action leaves the row unchanged and sends no update request.
3. Prove that confirming archive sends the exact building id plus inverted `isActive` payload, and that confirming delete sends the expected delete request only after explicit confirmation.
4. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-buildings.spec.ts` immediately after the first substantive buildings-page edit, then `cd frontend && npm run lint`.

### Demo Building Deletion

1. Extend `backend/tests/admin-buildings.test.ts` with a case that creates a demo building with resident, booking, and payment dependencies, then proves a plain `DELETE /api/admin/buildings?id=...` succeeds without `force=true`.
2. Update `tests/admin-buildings.spec.ts` so the buildings page shows demo-aware deletion guidance and the mocked delete succeeds through the normal confirmation path without surfacing the force-delete modal.
3. Run `cd backend && npm test -- admin-buildings.test.ts` immediately after the first substantive backend edit, then run the targeted browser proof and `cd frontend && npm run lint` if the UI copy changes.

### Local Admin CORS Resilience

1. Extend `backend/tests/integration/cors.test.ts` so an approved fallback local origin such as `http://localhost:5174` is accepted and still receives credentialed CORS headers.
2. Update `tests/admin-dashboard.spec.ts` to use a deterministic mocked admin login path that matches the current auth flow, then confirm the dashboard loads once the authenticated requests are no longer blocked by CORS.
3. Run `cd backend && npm test -- integration/cors.test.ts` immediately after the first substantive backend CORS edit, then run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts`.

### Admin Dashboard And Analytics Render Reliability

1. Extend `tests/admin-dashboard.spec.ts` so it proves both `/admin` and `/admin/analytics` rendering with deterministic mocked responses.
2. Assert dashboard scope messaging and analytics summary/chart sections to catch contract drift immediately.
3. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` after the first substantive proof edit, then run `cd frontend && npm run lint` only if admin page code changes.

### Sales-Rep Building Removal Confirmation Clarity

1. Add `tests/admin-sales-reps.spec.ts` to mock admin login plus sales-rep and building admin APIs.
2. Prove cancel-versus-confirm removal behavior so no update request is sent on cancel and a single unassignment payload is sent only on confirm.
3. Run `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-sales-reps.spec.ts` immediately after the first substantive sales-rep admin edit, then run `cd frontend && npm run lint`.

## Initial Risks

1. Existing browser coverage is thin and may not be deterministic enough for fast iteration.
2. Some cross-role flows may require stronger test data control than the current seed provides.
3. Payment end-to-end coverage may need a simulator or deterministic harness to avoid external dependency noise.
4. The broader backend suite still has unrelated reconciliation test failures, so full-repo handoff proof is not yet equivalent to slice-level proof.

## Deferred Until Proven Necessary

1. Full test framework restructuring beyond the minimum needed for a reliable root `tests/` layer.
2. New public-site work.
3. Wide architectural refactors not tied to user-visible quality or operational risk.