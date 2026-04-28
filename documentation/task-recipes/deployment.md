# Receta De Despliegue

Usa esta receta para cambios en Vercel, GitHub Actions, entorno y releases productivos.

## Comienza Con

- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- `.github/workflows/cd-backend.yml`
- `.github/workflows/cd-frontend.yml`
- `documentation/INFRASTRUCTURE.md`
- `documentation/adr/0003-deployment-topology.md`
- `backend/.env.example`
- `frontend/.env.example`

## Notas De Implementación

- Mantén el hosting productivo alineado con ADR 0003: Vercel para frontend y backend.
- Documenta nuevos secretos requeridos en `documentation/INFRASTRUCTURE.md`.
- Mantén las revisiones CI alineadas en comportamiento con los comandos de validación local.
- No incluyas credenciales reales en ejemplos, pruebas ni logs.

## Validar Con

```bash
npm run check:docs
npm run check:all
```

Para cambios solo de workflow, revisa también de forma básica el YAML modificado:

```bash
find .github/workflows -name '*.yml' -print
```
