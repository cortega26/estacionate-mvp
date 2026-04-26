# Architecture Decision Records

This directory records durable technical decisions for Estacionate. Use ADRs for choices that future agents or maintainers would otherwise have to rediscover from code, chat history, or old audit reports.

## When To Add An ADR

- A framework, deployment target, database, queue, or external service is chosen.
- A tradeoff affects reliability, security, cost, compliance, or developer workflow.
- A decision intentionally rejects an obvious alternative.
- A temporary constraint becomes part of how the system operates.

## Template

Use `TEMPLATE.md` when creating a new ADR.

## Records

- `0001-local-development-stack.md`: Docker Compose for local PostgreSQL/Redis with npm-run app processes.
- `0002-root-validation-command.md`: `npm run check:all` as the root full-repository validation command.
- `0003-deployment-topology.md`: Vercel as the production deployment target for both frontend and backend.
- `0004-audit-eventbus-contract.md`: `EventBus` as the canonical audit event boundary for state-changing backend workflows.
- `0005-validation-environment-contract.md`: `npm run check:local` as the environment-aware local validation command.
