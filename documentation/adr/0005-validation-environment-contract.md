# ADR 0005: Contrato De Entorno De Validación

- Estado: aceptado
- Fecha: 2026-04-26

## Contexto

El comando raíz `npm run check:all` ejecuta pruebas backend que requieren PostgreSQL, Redis y variables de entorno backend. Cuando faltan esas dependencias, las fallas parecen regresiones de aplicación aunque el entorno local de validación esté incompleto.

## Decisión

Agregar `npm run check:local` como comando local de validación consciente del entorno. Ejecuta `scripts/check-local-env.sh` para crear archivos de entorno locales faltantes, verificar que Docker Compose esté disponible, iniciar PostgreSQL y Redis, y luego ejecutar `npm run check:all`.

Documentar `backend/.env.test.example` como plantilla de entorno de prueba para revisiones backend con base de datos.

## Consecuencias

Agentes y mantenedores obtienen un preflight determinístico antes de la validación local completa. Las fallas pueden distinguir infraestructura faltante de regresiones reales de código. Máquinas sin Docker fallan temprano con un mensaje claro en lugar de una traza larga de Prisma o Redis.

## Links

- `scripts/check-local-env.sh`
- `backend/.env.test.example`
- `documentation/VALIDATION.md`
- `documentation/OWNERSHIP.md`
