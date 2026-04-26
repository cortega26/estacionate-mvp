# Ownership And Edit Boundaries

Use this guide to understand where changes belong and which paths need extra care. If
this file disagrees with code, treat code as the source of truth and update this guide
in the same change when practical.

## Backend

- API routes: `backend/src/api/**`
- Business workflows: `backend/src/services/**`
- Payment adapters: `backend/src/services/payment/**`
- Booking validation helpers: `backend/src/services/booking/**`
- Shared backend infrastructure: `backend/src/lib/**`
- Express middleware: `backend/src/middleware/**`
- Prisma schema and seed data: `backend/prisma/schema.prisma`,
  `backend/prisma/seed.ts`
- Backend tests: `backend/tests/**`

## Frontend

- Route composition: `frontend/src/App.tsx`
- Route-level pages: `frontend/src/pages/**`
- Layout shells: `frontend/src/layouts/**`
- Feature components: `frontend/src/features/**`
- Shared UI primitives: `frontend/src/components/ui/**`
- API client and helpers: `frontend/src/lib/**`
- Client state: `frontend/src/store/**`
- Frontend types: `frontend/src/types/**`
- Browser flows: `frontend/e2e/**`

## Documentation And Operations

- Agent and contributor entry: `AGENTS.md`
- Documentation index: `documentation/README.md`
- Validation guidance: `documentation/VALIDATION.md`
- Task entry points: `documentation/TASKS.md` and `documentation/task-recipes/**`
- Architecture decisions: `documentation/adr/**`
- Local and production infrastructure: `documentation/INFRASTRUCTURE.md`
- Operational procedures: `RUNBOOK.md`

## Generated Or High-Risk Paths

- `backend/prisma/migrations/**`: create with Prisma migration commands; do not edit
  migration SQL by hand unless repairing a reviewed migration issue.
- `backend/node_modules/**`, `frontend/node_modules/**`, `node_modules/**`: never edit.
- `backend/dist/**`, `frontend/dist/**`, `coverage/**`, `frontend/playwright-report/**`:
  generated output; never edit.
- `package-lock.json`, `backend/package-lock.json`, `frontend/package-lock.json`: update
  only through npm commands.
- `backend/.env`, `frontend/.env`, `.env*` files without `.example`: local secrets; do
  not commit.

## Cross-Cutting Contracts

- Prisma model changes require migrations, Prisma client generation, API response
  updates, frontend type updates, and affected tests.
- State-changing backend workflows must preserve the audit `EventBus` contract from
  `documentation/adr/0004-audit-eventbus-contract.md`.
- Deployment changes must stay aligned with
  `documentation/adr/0003-deployment-topology.md`.
- Full local validation depends on the environment contract in
  `documentation/adr/0005-validation-environment-contract.md`.
