# ADR 0002: Comando Raíz De Validación

- Estado: aceptado
- Fecha: 2026-04-26

## Contexto

Los comandos de validación existían en los paquetes backend y frontend, pero un agente nuevo debía inferir qué revisiones representaban a todo el repositorio. El `check:all` raíz anterior solo delegaba al backend.

## Decisión

Definir `npm run check:all` como el comando raíz de validación de repositorio completo. Ejecuta linting, builds, pruebas de backend y frontend, y auditoría de arquitectura backend. Mantener Playwright E2E como comando explícito porque inicia infraestructura de navegador y es más lento.

## Consecuencias

Los agentes tienen un comando por defecto antes de entregar cambios amplios. E2E sigue disponible para cambios de flujos de usuario sin encarecer toda verificación local. CI puede seguir ejecutando revisiones backend y frontend por separado, pero ambas deben mantenerse alineadas en comportamiento con el comando raíz.

## Links

- `package.json`
- `scripts/verify.sh`
- `backend/package.json`
- `frontend/package.json`
