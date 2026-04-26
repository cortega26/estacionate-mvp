# Validation Guide

Run the narrowest relevant check while working, then run the broader command before handing off broad or cross-cutting changes.

## Full Repository

```bash
npm run check:all
```

Equivalent shell wrapper:

```bash
npm run verify
```

Environment-aware local wrapper:

```bash
npm run check:local
```

`check:local` creates missing local env files, starts Docker-backed PostgreSQL and
Redis, then runs `npm run check:all`.

## Backend Only

```bash
cd backend && npm run check:all
```

DB-backed backend checks require PostgreSQL, Redis, and backend test environment
variables. Use `backend/.env.test.example` as the test template, or run
`npm run check:local` from the repository root to start local infrastructure first.

Faster backend loop:

```bash
cd backend && npm run lint && npm run build && npm test
```

## Frontend Only

```bash
cd frontend && npm run lint && npm test && npm run build
```

## Browser-Critical Frontend Flows

```bash
cd frontend && npm run test:e2e
```

Run a single Playwright spec when iterating:

```bash
cd frontend && npm run test:e2e -- booking.spec.ts
```

## Database Changes

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run check:all
```

Also update affected API responses, frontend types, and seed data when the schema change touches user-facing contracts.

## Dependency Changes

After adding, removing, or upgrading packages:

```bash
npm run install:all
npm run check:all
```

Use `npm audit` for visibility, but do not run `npm audit fix --force`.

## Documentation-Only Changes

For Markdown or process-only edits, run a lightweight sanity check:

```bash
npm run check:docs
npm run format:check
```

If the docs changed commands or scripts, also run the command parser or shell syntax check for those files.

## Formatting

Check formatting without changing files:

```bash
npm run format:check
```

Apply formatting to supported source and documentation files:

```bash
npm run format
```
