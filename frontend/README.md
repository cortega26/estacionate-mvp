# Estacionate Frontend

React, Vite, TypeScript, TailwindCSS, React Query, and Playwright app for the
Estacionate parking marketplace.

## Local Development

From the repository root:

```bash
npm run dev:frontend
```

Or from this directory:

```bash
npm run dev
```

The default local URL is `http://localhost:5173`.

## Environment

Create `frontend/.env` from the checked-in example:

```bash
cp .env.example .env
```

The main variable is:

- `VITE_API_URL`: backend API base URL, usually `http://localhost:3000`.

## Validation

Run the frontend-only checks:

```bash
npm run lint
npm test
npm run build
```

Run browser flows when changing booking, admin, auth, sales, or gatekeeper behavior:

```bash
npm run test:e2e
```

For repository-wide validation, run `npm run check:all` from the root.

## Entry Points

- `src/App.tsx`: route composition.
- `src/pages/**`: route-level pages.
- `src/features/**`: feature components.
- `src/components/ui/**`: reusable UI primitives.
- `src/lib/api.ts`: backend API client.
- `src/types/**`: frontend domain types.
- `e2e/**`: Playwright browser tests.
