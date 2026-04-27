# Autopilot Todo

## Now

- [x] Refresh `spec.md` so the current execution order and exact proof commands are explicit.
- [x] Refresh `todo.md` and `tests/` so the remaining work is tracked as verifiable slices.
- [x] Make admin settings price changes use an in-app confirmation step instead of raw browser `confirm()` in `frontend/src/pages/admin/SettingsPage.tsx`.
- [x] Add deterministic root Playwright proof in `tests/admin-settings.spec.ts` for cancel-versus-confirm bulk price updates.
- [x] Prove the settings confirmation slice with targeted Playwright and frontend lint.
- [x] Replace raw browser confirmation in `frontend/src/pages/admin/UserManagement.tsx` with an in-app confirmation step for ban and unban.
- [x] Extend `tests/admin-user-management.spec.ts` to prove cancel-versus-confirm behavior before status changes.
- [x] Prove the user-management confirmation slice with targeted Playwright and frontend lint.
- [x] Identify the next smallest building-management confirmation gap and add the corresponding root Playwright proof.
- [x] Add deterministic root Playwright proof in `tests/admin-buildings.spec.ts` for buildings archive/delete cancel-versus-confirm behavior.
- [x] Replace raw browser confirmations in `frontend/src/pages/admin/BuildingsPage.tsx` for archive/restore and delete actions.
- [x] Prove the buildings-page confirmation slice with targeted Playwright and frontend lint.
- [x] Refresh `spec.md` and `todo.md` for the demo-building deletion slice.
- [x] Add focused backend proof that a demo building with demo resident, booking, and payment dependencies deletes without `force=true`.
- [x] Mark seeded demo buildings explicitly in Prisma and seed data.
- [x] Route standard admin delete through automatic demo cleanup while preserving the existing force-delete guard for non-demo buildings.
- [x] Surface demo deletion guidance in `tests/admin-buildings.spec.ts` and `frontend/src/pages/admin/BuildingsPage.tsx`.
- [x] Prove the demo-building deletion slice with targeted backend test, Playwright, and focused lint/build.
- [x] Refresh `spec.md` and `todo.md` for the dashboard-and-analytics loading failure.
- [x] Add focused backend proof that approved fallback localhost origins like `http://localhost:5174` pass CORS.
- [x] Relax local CORS handling in `backend/src/lib/cors.ts` without widening it to arbitrary origins.
- [x] Reproduce live `/admin` and `/admin/analytics` behavior after the CORS fallback fix and capture any remaining render or contract gaps.
- [x] Refresh `tests/admin-dashboard.spec.ts` so it uses deterministic mocked login/data and proves both dashboard and analytics rendering.
- [x] Fix remaining admin dashboard or analytics loading/rendering issues found during live reproduction.
- [x] Prove the dashboard-and-analytics rendering slice with targeted Playwright and touched-slice lint/build where needed.
- [x] Refresh `spec.md`, `todo.md`, and `tests/` so the active slice is sales-rep building-removal confirmation clarity.
- [x] Add deterministic root Playwright proof for sales-rep building removal cancel-versus-confirm behavior.
- [x] Replace the remaining raw sales-rep building-removal `confirm()` call with an in-app confirmation surface.
- [x] Prove the sales-rep confirmation slice with targeted Playwright and focused frontend lint.

## Next

- [x] Close the building-admin dashboard verification gap with explicit browser proof for building-scoped dashboard behavior.
- [x] Expand guard validation coverage with deterministic browser proof for plate-versus-code verification routing.
- [x] Add narrow backend proof that concierge verification stays building-scoped and only accepts active bookings.
- [x] Remove the remaining raw sales-rep building-removal confirmation once the dashboard-and-analytics loading slice is green.

## Blocked

- [ ] No current blocked items.

## Done

- [x] Add narrow backend proof that a successful login clears accumulated Redis lockout attempts before the account is blocked.
- [x] Add browser-level proof that seeded locked, inactive, and unverified accounts surface the intended login feedback.
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
- [x] Harden persisted auth storage for Vitest so root frontend unit coverage no longer breaks `npm run check:all`.
- [x] Expand browser proof into a deterministic resident booking-to-payment journey.
- [x] Strengthen backend observability in the admin reporting and booking payment-init paths.
- [x] Make concierge verification input routing deterministic for patents versus confirmation codes and prove backend building/time enforcement.
- [x] Fix the auth login payload contract so backend login responses match the frontend auth store shape for resident and staff roles.
- [x] Remove frontend auth-role normalization drift and prove resident/admin login persistence plus non-resident greeting fallback in auth smoke coverage.
- [x] Route sales representatives to the correct dashboard after login and prove the sales landing with stable fallback identity messaging.
- [x] Align resident signup and seed paths with the encrypted PII contract and add focused crypto proof.
- [x] Replace the raw admin settings price confirmation with an in-app summary step and deterministic browser proof.
- [x] Replace the raw admin user-management confirmation with an in-app summary step and deterministic browser proof.