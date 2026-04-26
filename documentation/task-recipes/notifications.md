# Notifications Recipe

Use this recipe for email, SMS, webhook, and user-notification changes.

## Start With

- `backend/src/services`
- `backend/src/lib`
- `backend/src/api`
- `backend/tests`
- `backend/.env.example`
- `documentation/TECH_SPEC.md`

## Implementation Notes

- Validate all notification inputs before sending.
- Keep provider adapters isolated from domain services.
- Mock external providers in tests.
- Ensure retries and webhook handlers are idempotent.
- Never log secrets, tokens, or full personally identifiable payloads.

## Validate With

```bash
cd backend && npm test -- notification webhook
cd backend && npm run lint && npm run build
```

If the change affects user-visible notification state, also run the relevant frontend
tests for the affected flow.
