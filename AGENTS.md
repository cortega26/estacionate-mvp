# Agent Quickstart

Start here before editing. This file is the short operational map for AI agents and new contributors; deeper rules live in `documentation/AGENTS.md`.

## Bootstrap

Fast path for a fresh local environment:

```bash
npm run bootstrap
```

This installs dependencies, creates missing local env files, starts Docker-backed
Postgres and Redis, applies checked-in Prisma migrations, seeds demo data, and
launches the frontend and backend dev servers.

To stop after provisioning and data setup, run:

```bash
npm run bootstrap -- --no-start
```

Manual equivalent:

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Create local environment files:
   ```bash
   cp backend/.env.local.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Start local infrastructure:
   ```bash
   docker compose up -d postgres redis
   ```
4. Prepare the database:
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Start both applications from the repository root:
   ```bash
   npm run dev
   ```

## Validation

- Full local check: `npm run check:all`
- Environment-aware local check: `npm run check:local`
- Same check via shell script: `npm run verify`
- Documentation/process check: `npm run check:docs`
- Formatting check: `npm run format:check`
- Backend only: `cd backend && npm run check:all`
- Frontend only: `cd frontend && npm run lint && npm test && npm run build`
- Browser E2E: `cd frontend && npm run test:e2e`

Run the narrowest relevant test while working, then run `npm run check:all` before handing off broad changes. See `documentation/VALIDATION.md` for the full validation matrix.

## Where To Work

- Backend app entry: `backend/app.ts`, `backend/dev-server.ts`
- Backend routes: `backend/src/api`
- Backend business logic: `backend/src/services`
- Backend infrastructure helpers: `backend/src/lib`
- Prisma schema and migrations: `backend/prisma`
- Frontend app entry and routing: `frontend/src/App.tsx`
- Frontend pages: `frontend/src/pages`
- Frontend feature components: `frontend/src/features`
- Frontend API client and types: `frontend/src/lib`, `frontend/src/types`
- Architecture and operational docs: `documentation`
- Audit materials and historical findings: `audit-system`

## Change Pointers

- Auth changes usually need backend auth route/service tests and role coverage.
- Booking changes usually need `BookingService` tests plus frontend booking-flow checks when UI-facing.
- Payment changes usually need payment service/adapter tests and webhook integration coverage.
- Prisma changes require `npx prisma migrate dev`, `npx prisma generate`, and affected API/frontend type updates.
- Frontend user-flow changes should include Vitest coverage where practical and Playwright coverage for critical paths.

## Read Next

- `documentation/CODEMAP.md` for a fuller map of the repository.
- `documentation/AGENT_POLICY.md` for canonical agent workflow rules.
- `documentation/OWNERSHIP.md` for edit boundaries and high-risk/generated paths.
- `documentation/TASKS.md` for task-specific entry points and checks.
- `documentation/VALIDATION.md` for validation command selection.
- `documentation/TECH_SPEC.md` for product/domain rules.
- `documentation/PROTOCOL.md` for terminal/output expectations.
- `documentation/LESSONS.md` for project-specific gotchas.
- `documentation/adr/` for durable architecture decisions.
