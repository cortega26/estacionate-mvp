# ADR 0003: Topología De Despliegue

- Estado: aceptado
- Fecha: 2026-04-26

## Contexto

La documentación histórica mencionaba GitHub Pages para el frontend y Vercel para el backend, mientras que los workflows activos de despliegue en GitHub Actions usan Vercel para ambas aplicaciones. Agentes y mantenedores necesitan una sola topología productiva para razonar sobre variables de entorno, routing, secretos y revisiones de release.

## Decisión

Usar Vercel para los despliegues productivos de frontend y backend. Mantener Docker Compose como infraestructura de desarrollo local para PostgreSQL y Redis, con procesos backend y frontend normalmente ejecutados mediante npm durante el desarrollo activo.

## Consecuencias

La documentación de despliegue, notas CI/CD y solución de problemas de release deben describir Vercel como host productivo de ambas apps. Referencias históricas a GitHub Pages pueden permanecer en documentos de contexto de proyecto, pero la documentación operativa actual no debe presentar GitHub Pages como destino activo de despliegue frontend.

## Links

- `.github/workflows/cd-frontend.yml`
- `.github/workflows/cd-backend.yml`
- `documentation/INFRASTRUCTURE.md`
- `README.md`
