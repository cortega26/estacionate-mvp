# Deployment Recipe

Use this recipe for Vercel, GitHub Actions, environment, and production release changes.

## Start With

- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- `.github/workflows/cd-backend.yml`
- `.github/workflows/cd-frontend.yml`
- `documentation/INFRASTRUCTURE.md`
- `documentation/adr/0003-deployment-topology.md`
- `backend/.env.example`
- `frontend/.env.example`

## Implementation Notes

- Keep production hosting aligned with ADR 0003: Vercel for both frontend and backend.
- Document new required secrets in `documentation/INFRASTRUCTURE.md`.
- Keep CI checks behaviorally aligned with local validation commands.
- Do not include real credentials in examples, tests, or logs.

## Validate With

```bash
npm run check:docs
npm run check:all
```

For workflow-only changes, also sanity-check changed YAML:

```bash
find .github/workflows -name '*.yml' -print
```
