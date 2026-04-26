# ADR 0001: Local Development Stack

- Status: accepted
- Date: 2026-04-26

## Context

Estacionate needs PostgreSQL, Redis, a backend API, and a Vite frontend for local development. Agents and contributors need a reproducible setup that does not depend on production Supabase/Neon, Upstash, or deployment credentials.

## Decision

Use Docker Compose for PostgreSQL and Redis, while running the backend and frontend with npm during active development. Keep `docker-compose.yml` capable of starting the full stack, but document npm-driven development as the default path in `AGENTS.md` and `README.md`.

## Consequences

Local infrastructure is reproducible and isolated from production services. Backend/frontend hot reload stays fast because developers run those processes directly. Environment examples and bootstrap docs must stay aligned with `docker-compose.yml`.

## Links

- `docker-compose.yml`
- `backend/.env.example`
- `frontend/.env.example`
- `AGENTS.md`
- `documentation/INFRASTRUCTURE.md`
