# Agent Policy

This file is the canonical policy layer for AI agents working in this repository. Use
`../AGENTS.md` for the fast start, then use this file when a workflow rule needs
interpretation.

## Instruction Priority

1. The current user request.
2. The root `AGENTS.md` quickstart.
3. `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` for any task touching payments,
   pricing, billing, payout, or monetization — read it before writing code.
4. This policy file.
5. Task-specific recipes in `documentation/TASKS.md` and `documentation/task-recipes/`.
6. Historical context in `documentation/LESSONS.md` and audit reports.

If two repository docs conflict, prefer the more specific and more recent operational
document, then update the stale document as part of the same change when practical.

## Default Workflow

1. Explore the smallest relevant slice of the codebase.
2. Identify the task recipe or entry point that matches the change.
3. Make the smallest behaviorally complete change.
4. Run the narrowest useful validation while iterating.
5. Run `npm run check:all` before handing off broad, cross-cutting, or user-facing
   changes.

## Reproduction-First Scope

Create a failing test before fixing bugs, regressions, and risk-bearing behavior changes.
For docs-only edits, formatting changes, dependency metadata, or mechanical maintenance,
run the relevant validation command directly.

## Validation Selection

- Backend logic: start with the closest backend Vitest target, then `cd backend &&
npm run check:all` for broad changes.
- Frontend UI or client behavior: start with `cd frontend && npm test`, then add
  Playwright for critical user flows.
- Prisma schema changes: run migration/generation commands before application tests.
- Docs and process changes: run `npm run check:docs` and `npm run format:check`.
- Full local validation with DB-backed tests: prefer `npm run check:local` when
  PostgreSQL or Redis may not already be running.

## Editing Boundaries

- Do not edit generated output, lockfiles, or migrations by hand unless the task is
  specifically about those files.
- Use `documentation/OWNERSHIP.md` before crossing backend, frontend, Prisma,
  deployment, or generated-file boundaries.
- Treat `backend/prisma/schema.prisma`, API response shapes, and frontend types as one
  contract when changing data models.
- Prefer established utilities and service boundaries over new abstractions.
- Preserve user comments and TODOs unless the change resolves them.

## Reporting

End handoffs with the commands that were run and any checks that could not be run. Keep
raw command output short and include the failure line when validation fails.
