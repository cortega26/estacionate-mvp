# Architecture Decision Records

This directory records durable technical decisions for Estacionate. Use ADRs for choices that future agents or maintainers would otherwise have to rediscover from code, chat history, or old audit reports.

## When To Add An ADR

- A framework, deployment target, database, queue, or external service is chosen.
- A tradeoff affects reliability, security, cost, compliance, or developer workflow.
- A decision intentionally rejects an obvious alternative.
- A temporary constraint becomes part of how the system operates.

## Template

```md
# ADR NNNN: Short Title

- Status: proposed | accepted | superseded
- Date: YYYY-MM-DD

## Context

What forces, constraints, or problem led to this decision?

## Decision

What did we choose?

## Consequences

What gets easier, what gets harder, and what follow-up work is implied?

## Links

- Related files, issues, PRs, docs, or audits.
```

## Records

- `0001-local-development-stack.md`: Docker Compose for local PostgreSQL/Redis with npm-run app processes.
- `0002-root-validation-command.md`: `npm run check:all` as the root full-repository validation command.
- `0003-deployment-topology.md`: Vercel as the production deployment target for both frontend and backend.
