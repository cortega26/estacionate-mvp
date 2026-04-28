# Registros De Decisión De Arquitectura

Este directorio registra decisiones técnicas duraderas para Estacionate. Usa ADRs para decisiones que futuros agentes o mantenedores tendrían que redescubrir desde el código, historial de chat o reportes antiguos de auditoría.

## Cuándo Agregar Un ADR

- Se elige un framework, destino de despliegue, base de datos, cola o servicio externo.
- Un tradeoff afecta confiabilidad, seguridad, costo, cumplimiento o flujo de desarrollo.
- Una decisión rechaza intencionalmente una alternativa obvia.
- Una restricción temporal pasa a formar parte de cómo opera el sistema.

## Plantilla

Usa `TEMPLATE.md` al crear un nuevo ADR.

## Registros

- `0001-local-development-stack.md`: Docker Compose para PostgreSQL/Redis local con procesos de app ejecutados vía npm.
- `0002-root-validation-command.md`: `npm run check:all` como comando raíz de validación del repositorio completo.
- `0003-deployment-topology.md`: Vercel como destino de despliegue productivo para frontend y backend.
- `0004-audit-eventbus-contract.md`: `EventBus` como límite canónico de eventos de auditoría para flujos backend que cambian estado.
- `0005-validation-environment-contract.md`: `npm run check:local` como comando local de validación consciente del entorno.
