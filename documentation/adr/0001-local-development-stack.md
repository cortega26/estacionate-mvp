# ADR 0001: Stack De Desarrollo Local

- Estado: aceptado
- Fecha: 2026-04-26

## Contexto

Estacionate necesita PostgreSQL, Redis, una API backend y un frontend Vite para desarrollo local. Agentes y contribuyentes necesitan una configuración reproducible que no dependa de Supabase/Neon productivo, Upstash ni credenciales de despliegue.

## Decisión

Usar Docker Compose para PostgreSQL y Redis, mientras backend y frontend se ejecutan con npm durante el desarrollo activo. Mantener `docker-compose.yml` capaz de iniciar el stack completo, pero documentar el desarrollo dirigido por npm como ruta por defecto en `AGENTS.md` y `README.md`.

## Consecuencias

La infraestructura local es reproducible y queda aislada de servicios productivos. El hot reload de backend/frontend se mantiene rápido porque los desarrolladores ejecutan esos procesos directamente. Los ejemplos de entorno y la documentación de bootstrap deben mantenerse alineados con `docker-compose.yml`.

## Links

- `docker-compose.yml`
- `backend/.env.example`
- `frontend/.env.example`
- `AGENTS.md`
- `documentation/INFRASTRUCTURE.md`
