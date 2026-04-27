# Autopilot Todo

## Now

- [x] Refresh `spec.md` so the current execution order and exact proof commands are explicit.
- [x] Refresh `todo.md` and `tests/` so the remaining work is tracked as verifiable slices.
- [x] Identify and implement the first high-value admin reporting clarity gap in `frontend/src/pages/admin/DashboardPage.tsx`.
- [x] Add a deterministic admin dashboard browser proof in `tests/admin-dashboard.spec.ts`.
- [x] Prove the admin reporting slice with targeted Playwright and frontend lint.
- [x] Start the resident booking-to-payment journey expansion with a deterministic browser proof.

## Next

- [x] Close the building-admin dashboard verification gap with explicit browser proof for building-scoped dashboard behavior.
- [x] Expand guard validation coverage with deterministic browser proof for plate-versus-code verification routing.
- [x] Add narrow backend proof that concierge verification stays building-scoped and only accepts active bookings.
- [ ] Add browser-level proof that seeded locked, inactive, and unverified accounts surface the intended login feedback.

## Blocked

- [ ] No current blocked items.

## Done

- [x] Surface tailored login feedback for locked, inactive, and unverified accounts on the frontend with focused Vitest proof.
- [x] Run a fresh audit review to identify the next smallest product-quality gap after the auth, support, and reconciliation stabilization work.
- [x] Create `todo.md` as the running execution checklist.
- [x] Create a root `tests/` Playwright harness that reuses the frontend tooling.
- [x] Bring up Docker-backed Postgres and Redis, apply migrations, and seed demo accounts.
- [x] Full backend suite is green after stabilizing shared-database test execution and repairing reconcile coverage.
- [x] Extend admin user management so seeded residents can be listed and ban/unban flows work end to end.
- [x] Improve payment result pages with clearer approved, pending, and rejected guidance plus browser proof.
- [x] Improve resident booking confirmation clarity, normalize resident role handling for booking CTA access, and prove the pre-payment modal details in the resident browser flow.
- [x] Route support users into a coherent read-only admin experience, expand auth smoke coverage for building admin and concierge landings, and add backend login proof for all remaining staff roles.
- [x] Repair and enable reconcile unit and integration proof, then stabilize backend Vitest execution for shared Postgres state so `cd backend && npm test` passes end to end.
 [x] Harden persisted auth storage for Vitest so root frontend unit coverage no longer breaks `npm run check:all`.
- [x] Expand browser proof into a deterministic resident booking-to-payment journey.
- [x] Strengthen backend observability in the admin reporting and booking payment-init paths.
- [x] Make concierge verification input routing deterministic for patents versus confirmation codes and prove backend building/time enforcement.
- [x] Fix the auth login payload contract so backend login responses match the frontend auth store shape for resident and staff roles.
- [x] Remove frontend auth-role normalization drift and prove resident/admin login persistence plus non-resident greeting fallback in auth smoke coverage.
- [x] Route sales representatives to the correct dashboard after login and prove the sales landing with stable fallback identity messaging.