# Propiedad Y Límites De Edición

Usa esta guía para entender dónde pertenecen los cambios y qué rutas requieren cuidado adicional. Si este archivo contradice al código, trata el código como fuente de verdad y actualiza esta guía en el mismo cambio cuando sea práctico.

## Backend

- Rutas API: `backend/src/api/**`
- Flujos de negocio: `backend/src/services/**`
- Adaptadores de pago: `backend/src/services/payment/**`
- Helpers de validación de reservas: `backend/src/services/booking/**`
- Infraestructura backend compartida: `backend/src/lib/**`
- Middleware Express: `backend/src/middleware/**`
- Esquema Prisma y datos seed: `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`
- Pruebas backend: `backend/tests/**`

## Frontend

- Composición de rutas: `frontend/src/App.tsx`
- Páginas a nivel de ruta: `frontend/src/pages/**`
- Shells de layout: `frontend/src/layouts/**`
- Componentes de funcionalidades: `frontend/src/features/**`
- Primitivas UI compartidas: `frontend/src/components/ui/**`
- Cliente API y helpers: `frontend/src/lib/**`
- Estado de cliente: `frontend/src/store/**`
- Tipos frontend: `frontend/src/types/**`
- Flujos de navegador: `frontend/e2e/**`

## Documentación Y Operaciones

- Entrada para agentes y contribuyentes: `AGENTS.md`
- Índice de documentación: `documentation/README.md`
- Guía de validación: `documentation/VALIDATION.md`
- Puntos de entrada por tarea: `documentation/TASKS.md` y `documentation/task-recipes/**`
- Decisiones de arquitectura: `documentation/adr/**`
- Infraestructura local y producción: `documentation/INFRASTRUCTURE.md`
- Procedimientos operacionales: `RUNBOOK.md`

## Rutas Generadas O De Alto Riesgo

- `backend/prisma/migrations/**`: crear con comandos de migración Prisma; no editar SQL de migraciones a mano salvo para reparar un problema de migración revisado.
- `backend/node_modules/**`, `frontend/node_modules/**`, `node_modules/**`: nunca editar.
- `backend/dist/**`, `frontend/dist/**`, `coverage/**`, `frontend/playwright-report/**`: salida generada; nunca editar.
- `package-lock.json`, `backend/package-lock.json`, `frontend/package-lock.json`: actualizar solo mediante comandos npm.
- `backend/.env`, `frontend/.env`, archivos `.env*` sin `.example`: secretos locales; no commitear.

## Contratos Transversales

- Cambios de modelos Prisma requieren migraciones, generación de Prisma Client, actualizaciones de respuestas API, actualizaciones de tipos frontend y pruebas afectadas.
- Flujos backend que cambian estado deben preservar el contrato de auditoría `EventBus` de `documentation/adr/0004-audit-eventbus-contract.md`.
- Cambios de despliegue deben mantenerse alineados con `documentation/adr/0003-deployment-topology.md`.
- La validación local completa depende del contrato de entorno en `documentation/adr/0005-validation-environment-contract.md`.
- **Cambios de monetización y pagos** que toquen cualquiera de las rutas siguientes requieren leer `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` y ejecutar `documentation/task-recipes/monetization-change.md` antes de escribir código:
  - `backend/prisma/schema.prisma` (modelos: Payment, Payout, PricingRule, SalesRepCommission o cualquier nuevo modelo de billing)
  - `backend/src/services/PaymentService.ts`
  - `backend/src/services/payment/**`
  - `backend/src/api/payments/**`
  - `backend/src/api/cron/reconcile.ts`
  - Cualquier componente frontend que muestre precios, montos de cobro o flujos de pago
  - Cualquier README, términos, pitch, roadmap, receta de tarea o copy UI que pueda posicionar Estacionate como marketplace, producto de monetización de estacionamientos, flujo de pago directo de visitantes, flujo de payout o integración PSP habilitada
  - Cualquier nueva funcionalidad que introduzca una integración PSP o billing recurrente
