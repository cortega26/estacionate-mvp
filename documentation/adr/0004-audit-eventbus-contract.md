# ADR 0004: Audit EventBus Contract

- Status: accepted
- Date: 2026-04-26

## Context

Estacionate needs an auditable record of state-changing operations across booking,
payment, admin, concierge, sales, cron, webhook, and agent-driven workflows. The
backend already has an `EventBus` implementation and `documentation/AGENTS.md` requires
state-changing actions to publish events, but that contract was documented only as an
agent guardrail.

## Decision

Treat `backend/src/lib/event-bus.ts` as the canonical audit event boundary. Backend
create, update, and delete workflows must publish audit events through
`EventBus.getInstance().publish(...)` and include the correct `actorType` for `HUMAN`,
`AGENT`, or `SYSTEM` actors.

## Consequences

Audit behavior becomes part of the backend service contract rather than an optional
implementation detail. Tests for sensitive write paths should verify that an event is
published or explicitly document why the path is excluded. New provider adapters,
webhooks, and cron jobs must preserve actor attribution when they mutate state.

## Links

- `backend/src/lib/event-bus.ts`
- `documentation/AGENTS.md`
- `documentation/AGENT_POLICY.md`
- `audit-system/README.md`
