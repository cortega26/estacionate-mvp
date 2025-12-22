# Contributing to Estacionate MVP

## Getting Started

1.  **Install Dependencies:**
    ```bash
    cd backend && npm install
    cdfrontend && npm install
    ```
2.  **Environment:** Copy `.env.example` to `.env` in both folders.

## Development Workflow

### Branching Strategy
- `feat/description`: New features.
- `fix/description`: Bug fixes.
- `chore/description`: Maintenance, docs, refactoring.

### Commit Messages
Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add booking cron`
- `fix: resolve race condition in payments`
- `docs: add privacy policy`

### Pull Request Requirements
Before pushing, you **MUST** run the full regression check in the `backend` folder:

```bash
cd backend
npm run check:all
```

This script runs:
1.  Linting (`eslint`)
2.  Build (`tsc`)
3.  Unit Tests (`vitest`)
4.  Architecture Audit (`dependency-cruiser`)

**If `check:all` fails, do not open a PR.**

## Architecture
- **Backend:** Node.js/Express + Prisma. Logic in `services/`.
- **Frontend:** React + Tailwind.
- **Database:** PostgreSQL.

## Principles
- **Type Safety:** No `any`. Use Zod for validation.
- **Security:** Hashed PII (RUT).
- **Idempotency:** All cron jobs and webhooks must be idempotent.
