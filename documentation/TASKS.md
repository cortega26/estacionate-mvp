# Task Recipes

Use these recipes to choose starting files and the narrowest useful checks. If a recipe disagrees with code, treat code as the source of truth and update this file in the same change.

For deeper workflow notes, see:

- `task-recipes/frontend-ui.md`
- `task-recipes/deployment.md`
- `task-recipes/notifications.md`

## Authentication

Start with:

- `backend/src/api/auth`
- `backend/src/services/auth.ts`
- `backend/tests/login-integration.test.ts`
- `backend/tests/signup.test.ts`
- Frontend auth pages under `frontend/src/pages`

Validate with:

```bash
cd backend && npm test -- login signup auth
```

## Booking Lifecycle

Start with:

- `backend/src/api/bookings`
- `backend/src/services/BookingService.ts`
- `backend/src/services/booking`
- `backend/tests/bookings.test.ts`
- `backend/tests/unit/BookingService.test.ts`
- `frontend/src/features/booking`
- `frontend/e2e/booking.spec.ts`

Validate with:

```bash
cd backend && npm test -- BookingService bookings
cd frontend && npm run test:e2e -- booking.spec.ts
```

## Payments And Webhooks

Current classification: demo/simulator and future-gated infrastructure only.
Read `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` and execute
`documentation/task-recipes/monetization-change.md` before any edit in this
area. Do not present these flows as enabled production payments for communities.

Start with:

- `backend/src/api/payments`
- `backend/src/services/PaymentService.ts`
- `backend/src/services/payment`
- `backend/tests/payments.test.ts`
- `backend/tests/integration/webhook-payment-flow.test.ts`
- Checkout and booking confirmation pages under `frontend/src/pages`

Validate with:

```bash
cd backend && npm test -- payments webhook PaymentService
```

## Admin Flows

Start with:

- `backend/src/api/admin`
- `backend/tests/admin.test.ts`
- `backend/tests/admin-analytics.test.ts`
- `backend/tests/admin-buildings.test.ts`
- `frontend/src/pages/admin`
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/e2e/admin-flow.spec.ts`

Validate with:

```bash
cd backend && npm test -- admin
cd frontend && npm run test:e2e -- admin-flow.spec.ts
```

## Concierge And Gatekeeper Flows

Start with:

- `backend/src/api/concierge`
- `frontend/src/pages/gatekeeper`
- `frontend/src/layouts/GatekeeperLayout.tsx`
- Related verification tests in `backend/tests`

Validate with the closest backend role or verification test, then run:

```bash
cd frontend && npm test
```

## Frontend UI

Start with:

- `frontend/src/App.tsx`
- `frontend/src/pages`
- `frontend/src/features`
- `frontend/src/components/ui`

Validate with:

```bash
cd frontend && npm run lint && npm test && npm run build
```

See `task-recipes/frontend-ui.md` for state, styling, and E2E guidance.

## Sales Flows

Start with:

- `backend/src/api/sales`
- `backend/src/services/SalesService.ts`
- `backend/tests/sales.test.ts`
- Sales pages and layouts under `frontend/src/pages` and `frontend/src/layouts`

Validate with:

```bash
cd backend && npm test -- sales
```

## Cron Jobs

Start with:

- `backend/src/api/cron`
- `backend/tests/cron`
- `backend/tests/cron-availability.test.ts`
- `backend/tests/reconcile.test.ts`
- `RUNBOOK.md`

Validate with:

```bash
cd backend && npm test -- cron reconcile
```

## Notifications

Start with:

- `backend/src/services`
- `backend/src/lib`
- `backend/src/api`
- `backend/tests`

Validate with:

```bash
cd backend && npm test -- notification webhook
cd backend && npm run lint && npm run build
```

See `task-recipes/notifications.md` for provider and idempotency guidance.

## Deployment

Start with:

- `.github/workflows`
- `documentation/INFRASTRUCTURE.md`
- `documentation/adr/0003-deployment-topology.md`
- `backend/.env.example`
- `frontend/.env.example`

Validate with:

```bash
npm run check:docs
npm run check:all
```

See `task-recipes/deployment.md` for Vercel, CI/CD, and secret documentation guidance.

## Database Changes

Start with:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations`
- `backend/prisma/seed.ts`
- API handlers and frontend types affected by the changed model

Validate with:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run check:all
```
