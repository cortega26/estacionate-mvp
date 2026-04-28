# Inicio Rápido Para Agentes

Lee esto antes de editar. Este archivo es el mapa operativo corto para agentes de IA y nuevos contribuyentes; las reglas más detalladas viven en `documentation/AGENTS.md`.

## Preparación

Ruta rápida para un entorno local limpio:

```bash
npm run bootstrap
```

Esto instala dependencias, crea archivos de entorno locales faltantes, levanta Postgres y Redis con Docker, aplica las migraciones Prisma registradas, carga datos demo e inicia los servidores de desarrollo de frontend y backend.

Para detenerte después del aprovisionamiento y la carga de datos, ejecuta:

```bash
npm run bootstrap -- --no-start
```

Equivalente manual:

1. Instalar dependencias:
   ```bash
   npm run install:all
   ```
2. Crear archivos de entorno locales:
   ```bash
   cp backend/.env.local.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Iniciar infraestructura local:
   ```bash
   docker compose up -d postgres redis
   ```
4. Preparar la base de datos:
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Iniciar ambas aplicaciones desde la raíz del repositorio:
   ```bash
   npm run dev
   ```

## Validación

- Revisión local completa: `npm run check:all`
- Revisión local consciente del entorno: `npm run check:local`
- Misma revisión vía script de shell: `npm run verify`
- Revisión de documentación/proceso: `npm run check:docs`
- Revisión de formato: `npm run format:check`
- Solo backend: `cd backend && npm run check:all`
- Solo frontend: `cd frontend && npm run lint && npm test && npm run build`
- E2E en navegador: `cd frontend && npm run test:e2e`

Ejecuta la prueba más acotada y relevante mientras trabajas; luego ejecuta `npm run check:all` antes de entregar cambios amplios. Revisa `documentation/VALIDATION.md` para la matriz completa de validación.

## Dónde Trabajar

- Entrada de la app backend: `backend/app.ts`, `backend/dev-server.ts`
- Rutas backend: `backend/src/api`
- Lógica de negocio backend: `backend/src/services`
- Helpers de infraestructura backend: `backend/src/lib`
- Esquema y migraciones Prisma: `backend/prisma`
- Entrada y rutas de la app frontend: `frontend/src/App.tsx`
- Páginas frontend: `frontend/src/pages`
- Componentes de funcionalidades frontend: `frontend/src/features`
- Cliente API y tipos frontend: `frontend/src/lib`, `frontend/src/types`
- Arquitectura y documentación operativa: `documentation`
- Materiales de auditoría y hallazgos históricos: `audit-system`

## Punteros De Cambio

- Los cambios de autenticación normalmente requieren pruebas de rutas/servicios de auth backend y cobertura de roles.
- Los cambios de reservas normalmente requieren pruebas de `BookingService` y, si afectan la UI, revisiones del flujo de reserva frontend.
- Los cambios de pagos requieren leer `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` y ejecutar primero `documentation/task-recipes/monetization-change.md`; luego requieren pruebas de servicios/adaptadores de pago y cobertura de integración de webhooks.
- Los cambios Prisma requieren `npx prisma migrate dev`, `npx prisma generate` y actualizaciones de tipos API/frontend afectados.
- Los cambios de flujos frontend deben incluir cobertura Vitest cuando sea práctico y cobertura Playwright para rutas críticas.
- Toda documentación nueva o modificada debe estar en español neutro, chileno sin modismos. Conserva sin traducir comandos, rutas, nombres de librerías, identificadores de código y términos de dominio cuando sean contratos técnicos.

## Leer Después

- `documentation/CODEMAP.md` para un mapa más completo del repositorio.
- `documentation/AGENT_POLICY.md` para las reglas canónicas de flujo de trabajo de agentes.
- `documentation/OWNERSHIP.md` para límites de edición y rutas de alto riesgo o generadas.
- `documentation/TASKS.md` para puntos de entrada y revisiones por tipo de tarea.
- `documentation/VALIDATION.md` para elegir comandos de validación.
- `documentation/TECH_SPEC.md` para reglas de producto y dominio.
- `documentation/PROTOCOL.md` para expectativas de terminal y salida.
- `documentation/LESSONS.md` para aprendizajes y advertencias específicas del proyecto.
- `documentation/adr/` para decisiones de arquitectura duraderas.
- `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` — **obligatorio antes de cualquier cambio en pagos, precios, facturación, payout o monetización** (restricciones legales chilenas; leer antes de escribir código, no después).
