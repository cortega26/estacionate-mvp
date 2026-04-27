# Autopilot Todo

## Now

- [ ] Review the resident booking flow against `spec.md` and identify the first high-value quality gap to fix.
- [ ] Review admin reporting and user-management clarity against `spec.md` and identify the first high-value quality gap to fix.

## Next

- [ ] Expand E2E coverage from payment result states into the full resident booking-to-payment journey.
- [ ] Expand E2E coverage for guard validation once the route and seed assumptions are verified.
- [ ] Improve status messaging and next-step guidance in the most user-visible broken or unclear flow.
- [ ] Strengthen backend observability and error handling in the touched critical path.

## Blocked

- [ ] Full backend suite is not fully green because `backend/tests/reconcile.test.ts` still has unrelated failures outside the resident-management slice.

## Done

- [x] Create `spec.md` with goals, system anchors, implementation strategy, and verification matrix.
- [x] Create `todo.md` as the running execution checklist.
- [x] Create a root `tests/` Playwright harness that reuses the frontend tooling.
- [x] Bring up Docker-backed Postgres and Redis, apply migrations, and seed demo accounts.
- [x] Prove the root autopilot E2E suite against the seeded local environment.
- [x] Extend admin user management so seeded residents can be listed and ban/unban flows work end to end.
- [x] Improve payment result pages with clearer approved, pending, and rejected guidance plus browser proof.