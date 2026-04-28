# Claude Code — Estacionate MVP

Lee `AGENTS.md` antes de editar. Este archivo agrega contexto específico de Claude Code que no está en `AGENTS.md`.

## Guía Principal

`AGENTS.md` (raíz del repositorio) es la fuente de verdad operativa para cualquier agente de IA: preparación del entorno, comandos de validación, mapa de directorios y punteros de cambio.

La capa de política extendida vive en `documentation/AGENT_POLICY.md`.

## Modelo Por Defecto

Usa `claude-sonnet-4-6` para tareas de desarrollo ordinarias. Para revisiones de arquitectura o cambios transversales de alto impacto puedes escalar a `claude-opus-4-7`.

## Memoria Persistente

La memoria entre sesiones vive en:

```
~/.claude/projects/-home-carlos-VS-Code-Projects-estacionate-mvp/memory/
```

Al inicio de sesión verifica si hay entradas relevantes antes de comenzar. Al cerrar sesión, guarda aprendizajes no obvios que no puedan derivarse del código o del historial git.

## Permisos y Herramientas

- Lecturas de archivos, búsquedas y comandos de validación (`npm run check:*`, `cd backend && npm test`, etc.) pueden ejecutarse sin confirmación.
- Operaciones destructivas o que afecten estado compartido (push, PR, drop de tablas, `docker compose down -v`, force reset) requieren confirmación explícita del usuario.
- Nunca omitas hooks de git (`--no-verify`) salvo indicación explícita del usuario.

## Idioma

Toda documentación nueva o modificada debe estar en español neutro, chileno sin modismos. Conserva sin traducir: comandos, rutas, nombres de librerías, identificadores de código, claves de configuración y términos de dominio que sean contratos técnicos.

## Guardarraíles Críticos

- **Pagos / monetización:** lee `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` _antes_ de escribir código. Este documento prevalece sobre roadmap, pitch, UI y material histórico.
- **Cambios Prisma:** ejecuta `npx prisma migrate dev` + `npx prisma generate` y actualiza tipos API/frontend afectados.
- **Rutas de alto riesgo:** consulta `documentation/OWNERSHIP.md` antes de cruzar límites backend/frontend/Prisma/despliegue.
