# Commercial Conversion Plan 2026

**Date:** 2026-04-26  
**Scope:** Product improvement, conversion improvement, solo-founder execution, pitch readiness  
**Audience:** Founder, future collaborators, AI agents, advisors

## Purpose

This document is the overview and entry point for the commercial and conversion planning set.

It keeps the main strategic recommendation in one place and links the detailed execution documents so the material stays maintainable.

## Executive Summary

The current priority is not a full platform rewrite. The priority is to make Estacionate easier to understand, easier to trust, easier to demonstrate, and easier to buy.

For the current stage of the business, the recommended strategy is:

1. Keep the core authenticated application stable.
2. Improve the most visible product workflows that shape trust during demos and pilots.
3. Strengthen the sales and acquisition layer around the product.
4. Delay any full frontend or backend migration unless it directly improves conversion, demo quality, or delivery speed.

## Technical Recommendation

1. Do not perform a full frontend rewrite now.
2. Improve the existing application UX and operational reliability first.
3. If a public acquisition layer is needed, use Next.js for the marketing and sales surface only.
4. Keep the backend on the current stack in the short term while refactoring critical business flows in place.

## Why This Recommendation Fits the Current Repo

1. Frontend is already React, Vite, and TypeScript.
2. Backend is already Express, TypeScript, Prisma, PostgreSQL, and Redis.
3. Production deployment is Vercel-first.
4. Existing audits show maintainability and consistency debt, but not an urgent need for a full-stack rewrite.
5. Solo-founder execution benefits more from predictable delivery than from simultaneous framework migrations.

## Document Map

Use these documents together:

1. [commercial-roadmap-2026.md](commercial-roadmap-2026.md): 30-60-90 execution roadmap.
2. [founder-sales-playbook-es.md](founder-sales-playbook-es.md): Spanish sales playbook for calls, discovery, objections, and pilot framing.
3. [conversion-backlog-2026.md](conversion-backlog-2026.md): prioritized conversion-facing product backlog.
4. [client-pitch-deck-outline-2026.md](client-pitch-deck-outline-2026.md): client-facing deck structure.

## KPIs To Track

### Product and Conversion KPIs

1. Demo-to-follow-up rate.
2. Follow-up-to-pilot rate.
3. Pilot-to-paid conversion rate.
4. Time from first contact to proposal.
5. Time from proposal to close.
6. Drop-off point in the demo process.
7. Critical demo failure count.
8. Time to onboard a new building.
9. Time to create the first successful booking.
10. Support incidents during pilot.

### Technical KPIs

1. p95 latency on critical flows.
2. Booking success rate.
3. Payment reconciliation issues.
4. Error rate on critical endpoints.
5. E2E pass rate for critical flows.
6. Release rollback frequency.

## Final Recommendation

The best near-term path is a commercial-product hardening strategy, not a full-stack migration.

In order of priority:

1. Sharpen positioning.
2. Upgrade demo quality.
3. Improve trust signals.
4. Polish the most visible workflows.
5. Standardize the most fragile technical areas.
6. Use Next.js only if a stronger public sales layer is needed.