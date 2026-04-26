# Frontend UI Recipe

Use this recipe for route, component, state, and styling changes in the Vite React app.

## Start With

- `frontend/src/App.tsx` for routing and top-level composition.
- `frontend/src/pages/**` for route-level screens.
- `frontend/src/features/**` for feature-owned components.
- `frontend/src/components/ui/**` for shared controls.
- `frontend/src/lib/api.ts` for backend calls.
- `frontend/src/types/**` for shared frontend contracts.

## Implementation Notes

- Use React Query for server state and Zustand only for cross-screen client state.
- Keep reusable UI primitives in `frontend/src/components/ui`.
- Use Tailwind utility classes and existing layout patterns before adding new CSS.
- Update API types and fixtures when a UI change depends on backend response shape.

## Validate With

```bash
cd frontend && npm run lint && npm test && npm run build
```

Add Playwright when the change affects auth, booking, admin, sales, or gatekeeper flows:

```bash
cd frontend && npm run test:e2e
```
