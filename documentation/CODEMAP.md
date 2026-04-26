# Codebase Map

Use this map to choose the right files before editing. If the map disagrees with code, treat code as the source of truth and update this file in the same change.

## Runtime Shape

- Frontend: React, Vite, TypeScript, TailwindCSS.
- Backend: Node.js, Express-style handlers, TypeScript, Prisma.
- Data stores: PostgreSQL through Prisma, Redis for cache/pub-sub/rate-limit support.
- Local infrastructure: `docker-compose.yml` provides PostgreSQL and Redis.
- Production/deployment docs: `documentation/INFRASTRUCTURE.md`.

## Root

- `package.json`: monorepo command surface for install, dev, build, lint, test, and full checks.
- `scripts/bootstrap.sh`: one-command local setup for dependencies, env files, Docker services, migrations, and seed data.
- `scripts/check-local-env.sh`: preflight for Docker-backed PostgreSQL/Redis and local env files before full checks.
- `scripts/check-docs.sh`: Markdown link and shell-script sanity checks for documentation/process changes.
- `docker-compose.yml`: local Postgres, Redis, backend, and frontend containers.
- `AGENTS.md`: short agent/new-contributor entry point.
- `README.md`: human-facing project overview and bootstrap.
- `CONTRIBUTING.md`: contribution rules and PR expectations.
- `RUNBOOK.md`: operational procedures and troubleshooting.

## Backend

- `backend/app.ts`: API app composition.
- `backend/dev-server.ts`: local development server entry point.
- `backend/api/**`: Vercel-oriented API entry files.
- `backend/src/api/**`: domain route handlers grouped by area.
- `backend/src/services/**`: business workflows such as auth, booking, payment, notification, and sales.
- `backend/src/services/payment/**`: payment gateway abstraction and adapters.
- `backend/src/services/booking/**`: booking validation helpers.
- `backend/src/lib/**`: database, Redis, logging, CORS, errors, constants, crypto, and domain helpers.
- `backend/src/middleware/**`: Express middleware.
- `backend/src/types/**`: local request/type shims.
- `backend/prisma/schema.prisma`: database model source of truth.
- `backend/prisma/migrations/**`: committed database migrations.
- `backend/prisma/seed.ts`: seed data for local development.
- `backend/tests/**`: backend unit, integration, security, cron, and regression tests.
- `backend/scripts/**`: manual diagnostics, verification helpers, and operational scripts.

## Frontend

- `frontend/src/App.tsx`: application routes and top-level composition.
- `frontend/src/pages/**`: route-level screens grouped by role/workflow.
- `frontend/src/layouts/**`: admin, sales, gatekeeper, and main layout shells.
- `frontend/src/features/**`: feature-specific components such as booking and map UI.
- `frontend/src/components/ui/**`: reusable low-level UI controls.
- `frontend/src/lib/api.ts`: API client.
- `frontend/src/lib/utils.ts`: shared frontend utilities.
- `frontend/src/types/**`: frontend app/domain types.
- `frontend/src/store/**`: client state stores.
- `frontend/src/tests/**`: frontend Vitest setup and smoke coverage.
- `frontend/e2e/**`: Playwright browser flows.

## Validation Matrix

- Full repo: `npm run check:all`
- Formatting: `npm run format:check`
- Documentation/process: `npm run check:docs`
- Environment-aware local validation: `npm run check:local`
- Backend full regression: `cd backend && npm run check:all`
- Backend tests: `cd backend && npm test`
- Backend coverage: `cd backend && npm run test:coverage`
- Backend architecture audit: `cd backend && npm run audit:arch`
- Frontend lint/test/build: `cd frontend && npm run lint && npm test && npm run build`
- Frontend E2E: `cd frontend && npm run test:e2e`

See `documentation/VALIDATION.md` for command selection by change type.

## Change Guide

- Authentication: inspect `backend/src/api/auth`, `backend/src/services/auth.ts`, related frontend auth pages, and backend auth/login tests.
- Booking lifecycle: inspect `backend/src/api/bookings`, `backend/src/services/BookingService.ts`, `backend/src/services/booking`, booking tests, and frontend booking components/pages.
- Payments/webhooks: inspect `backend/src/api/payments`, `backend/src/services/PaymentService.ts`, `backend/src/services/payment`, payment/webhook tests, and checkout pages.
- Admin flows: inspect `backend/src/api/admin`, admin tests, `frontend/src/pages/admin`, and `frontend/src/layouts/AdminLayout.tsx`.
- Concierge/gatekeeper flows: inspect `backend/src/api/concierge`, gatekeeper pages/layouts, and verification tests.
- Sales flows: inspect `backend/src/api/sales`, `backend/src/services/SalesService.ts`, sales tests, and sales pages/layout.
- Cron jobs: inspect `backend/src/api/cron`, cron tests, and operational notes in `RUNBOOK.md`.
- Database changes: update `backend/prisma/schema.prisma`, create a migration, regenerate Prisma client, update affected API/frontend types, and run relevant tests.
- Deployment changes: inspect `.github/workflows`, Vercel config, environment examples, and `documentation/INFRASTRUCTURE.md`.
- Notification changes: inspect backend services/adapters, env examples, and provider tests.

See `documentation/TASKS.md` for more detailed task recipes.
