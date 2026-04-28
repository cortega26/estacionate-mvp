# ADR 0004: Contrato De Auditoría EventBus

- Estado: aceptado
- Fecha: 2026-04-26

## Contexto

Estacionate necesita un registro auditable de operaciones que cambian estado en flujos de booking, pagos, admin, conserjería, ventas, cron, webhooks y tareas ejecutadas por agentes. El backend ya tiene una implementación `EventBus` y `documentation/AGENTS.md` exige que las acciones que cambian estado publiquen eventos, pero ese contrato estaba documentado solo como guardrail para agentes.

## Decisión

Tratar `backend/src/lib/event-bus.ts` como el límite canónico de eventos de auditoría. Los flujos backend de creación, actualización y eliminación deben publicar eventos de auditoría mediante `EventBus.getInstance().publish(...)` e incluir el `actorType` correcto para actores `HUMAN`, `AGENT` o `SYSTEM`.

## Consecuencias

El comportamiento de auditoría pasa a ser parte del contrato de servicio backend, no un detalle opcional de implementación. Las pruebas de rutas sensibles de escritura deben verificar que se publique un evento o documentar explícitamente por qué la ruta está excluida. Nuevos adaptadores de proveedores, webhooks y cron jobs deben preservar atribución de actor cuando muten estado.

## Links

- `backend/src/lib/event-bus.ts`
- `documentation/AGENTS.md`
- `documentation/AGENT_POLICY.md`
- `audit-system/README.md`
