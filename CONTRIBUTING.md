# Contributing to Estacionate MVP

## Getting Started

For a fresh local environment, run:

```bash
npm run bootstrap
```

Manual equivalent:

1.  **Install Dependencies:**
    ```bash
    npm run install:all
    ```
2.  **Environment:** Copy the local environment examples to `.env`:
    ```bash
    cp backend/.env.local.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
3.  **Local Services:** Start Postgres and Redis:
    ```bash
    docker compose up -d postgres redis
    ```

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

Before pushing, you **MUST** run the full regression check from the repository root:

```bash
npm run check:all
```

This script runs:

1.  Backend and frontend linting (`eslint`)
2.  Backend and frontend builds
3.  Backend and frontend tests (`vitest`)
4.  Backend architecture audit (`dependency-cruiser`)

**If `check:all` fails, do not open a PR.**

## Architecture

- **Backend:** Node.js/Express + Prisma. Logic in `services/`.
- **Frontend:** React + Tailwind.
- **Database:** PostgreSQL.

## Principles

- **Type Safety:** No `any`. Use Zod for validation.
- **Security:** Hashed PII (RUT).
- **Idempotency:** All cron jobs and webhooks must be idempotent.
