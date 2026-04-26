# ADR 0005: Validation Environment Contract

- Status: accepted
- Date: 2026-04-26

## Context

The root `npm run check:all` command runs backend tests that require PostgreSQL,
Redis, and backend environment variables. When those dependencies are missing, failures
look like application regressions even though the local validation environment is
incomplete.

## Decision

Add `npm run check:local` as the environment-aware local validation command. It runs
`scripts/check-local-env.sh` to create missing local env files, verify Docker Compose is
available, start PostgreSQL and Redis, and then run `npm run check:all`.

Document `backend/.env.test.example` as the test environment template for backend
DB-backed checks.

## Consequences

Agents and maintainers get a deterministic preflight path before full local validation.
Failures can distinguish missing infrastructure from real code regressions. Machines
without Docker still fail early with a clear message rather than a long Prisma or Redis
error trail.

## Links

- `scripts/check-local-env.sh`
- `backend/.env.test.example`
- `documentation/VALIDATION.md`
- `documentation/OWNERSHIP.md`
