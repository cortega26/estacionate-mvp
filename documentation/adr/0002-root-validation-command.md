# ADR 0002: Root Validation Command

- Status: accepted
- Date: 2026-04-26

## Context

Validation commands existed in backend and frontend package files, but a fresh agent had to infer which checks represented the whole repository. The previous root `check:all` only delegated to the backend.

## Decision

Make `npm run check:all` the root full-repository validation command. It runs backend and frontend linting, builds, tests, and the backend architecture audit. Keep Playwright E2E as an explicit command because it starts browser infrastructure and is slower.

## Consequences

Agents have one default pre-handoff command for broad changes. E2E remains available for user-flow changes without making every local verification expensive. CI can continue to run backend and frontend checks separately, but both should stay behaviorally aligned with the root command.

## Links

- `package.json`
- `scripts/verify.sh`
- `backend/package.json`
- `frontend/package.json`
