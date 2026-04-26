# ADR 0003: Deployment Topology

- Status: accepted
- Date: 2026-04-26

## Context

Current documentation historically mentioned GitHub Pages for the frontend and Vercel for the backend, while the active GitHub Actions deployment workflows use Vercel for both applications. Agents and maintainers need one production topology to reason about environment variables, routing, secrets, and release checks.

## Decision

Use Vercel for both frontend and backend production deployments. Keep Docker Compose as the local development infrastructure for PostgreSQL and Redis, with backend and frontend processes normally run through npm during active development.

## Consequences

Deployment docs, CI/CD notes, and release troubleshooting should describe Vercel as the production host for both apps. Historical GitHub Pages references may remain in project-context documents, but current operational docs should not present GitHub Pages as the active frontend deployment target.

## Links

- `.github/workflows/cd-frontend.yml`
- `.github/workflows/cd-backend.yml`
- `documentation/INFRASTRUCTURE.md`
- `README.md`
