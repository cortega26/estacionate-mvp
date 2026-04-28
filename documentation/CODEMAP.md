# Mapa Del Código

Usa este mapa para elegir los archivos correctos antes de editar. Si el mapa contradice al código, trata el código como fuente de verdad y actualiza este archivo en el mismo cambio.

## Forma En Runtime

- Frontend: React, Vite, TypeScript, TailwindCSS.
- Backend: Node.js, handlers estilo Express, TypeScript, Prisma.
- Almacenes de datos: PostgreSQL mediante Prisma, Redis para caché/pub-sub/rate-limit.
- Infraestructura local: `docker-compose.yml` provee PostgreSQL y Redis.
- Documentación de producción/despliegue: `documentation/INFRASTRUCTURE.md`.

## Raíz

- `package.json`: superficie de comandos monorepo para instalación, desarrollo, build, lint, pruebas y revisiones completas.
- `scripts/bootstrap.sh`: configuración local con un comando para dependencias, archivos de entorno, servicios Docker, migraciones registradas, datos seed e inicio de la app.
- `scripts/check-local-env.sh`: preflight para PostgreSQL/Redis con Docker y archivos de entorno locales antes de revisiones completas.
- `scripts/check-docs.sh`: revisión de links Markdown y sintaxis de scripts shell para cambios de documentación/proceso.
- `docker-compose.yml`: contenedores locales de Postgres, Redis, backend y frontend.
- `AGENTS.md`: punto de entrada corto para agentes y nuevos contribuyentes.
- `README.md`: visión general del proyecto y preparación para personas.
- `CONTRIBUTING.md`: reglas de contribución y expectativas de PR.
- `RUNBOOK.md`: procedimientos operacionales y solución de problemas.

## Backend

- `backend/app.ts`: composición de la app API.
- `backend/dev-server.ts`: entrada del servidor de desarrollo local.
- `backend/api/**`: archivos de entrada API orientados a Vercel.
- `backend/src/api/**`: handlers de rutas de dominio agrupados por área.
- `backend/src/services/**`: flujos de negocio como auth, booking, demo/payment-simulator, notification y sales.
- `backend/src/services/payment/**`: demo/simulador y abstracción/adaptadores de gateway de pago con guardrails futuros.
- `backend/src/services/booking/**`: helpers de validación de reservas.
- `backend/src/lib/**`: base de datos, Redis, logging, CORS, errores, constantes, crypto y helpers de dominio.
- `backend/src/middleware/**`: middleware Express.
- `backend/src/types/**`: shims locales de requests/tipos.
- `backend/prisma/schema.prisma`: fuente de verdad del modelo de base de datos.
- `backend/prisma/migrations/**`: migraciones de base de datos registradas.
- `backend/prisma/seed.ts`: datos seed para desarrollo local.
- `backend/tests/**`: pruebas unitarias, integración, seguridad, cron y regresión backend.
- `backend/scripts/**`: diagnósticos manuales, helpers de verificación y scripts operacionales.

## Frontend

- `frontend/src/App.tsx`: rutas de aplicación y composición superior.
- `frontend/src/pages/**`: pantallas a nivel de ruta agrupadas por rol/flujo.
- `frontend/src/layouts/**`: shells de layout admin, ventas, conserjería y principal.
- `frontend/src/features/**`: componentes específicos de funcionalidades como booking y UI de mapa.
- `frontend/src/components/ui/**`: controles UI reutilizables de bajo nivel.
- `frontend/src/lib/api.ts`: cliente API.
- `frontend/src/lib/utils.ts`: utilidades frontend compartidas.
- `frontend/src/types/**`: tipos de app/dominio frontend.
- `frontend/src/store/**`: stores de estado de cliente.
- `frontend/src/tests/**`: setup Vitest frontend y cobertura smoke.
- `frontend/e2e/**`: flujos de navegador Playwright.

## Matriz De Validación

- Repositorio completo: `npm run check:all`
- Formato: `npm run format:check`
- Documentación/proceso: `npm run check:docs`
- Validación local consciente del entorno: `npm run check:local`
- Regresión completa backend: `cd backend && npm run check:all`
- Pruebas backend: `cd backend && npm test`
- Cobertura backend: `cd backend && npm run test:coverage`
- Auditoría de arquitectura backend: `cd backend && npm run audit:arch`
- Lint/test/build frontend: `cd frontend && npm run lint && npm test && npm run build`
- E2E frontend: `cd frontend && npm run test:e2e`

Revisa `documentation/VALIDATION.md` para elegir comandos según el tipo de cambio.

## Guía De Cambios

- Autenticación: inspecciona `backend/src/api/auth`, `backend/src/services/auth.ts`, páginas frontend de auth relacionadas y pruebas backend de auth/login.
- Ciclo de vida de reservas: inspecciona `backend/src/api/bookings`, `backend/src/services/BookingService.ts`, `backend/src/services/booking`, pruebas de booking y componentes/páginas frontend de booking.
- Pagos/webhooks: inspecciona primero `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`; luego `backend/src/api/payments`, `backend/src/services/PaymentService.ts`, `backend/src/services/payment`, pruebas de payment/webhook y páginas de checkout. Esta área es demo/simulador o futura con guardrails, salvo que los gates de la sección 3 estén documentados como abiertos.
- Flujos admin: inspecciona `backend/src/api/admin`, pruebas admin, `frontend/src/pages/admin` y `frontend/src/layouts/AdminLayout.tsx`.
- Flujos conserjería/gatekeeper: inspecciona `backend/src/api/concierge`, páginas/layouts gatekeeper y pruebas de verificación.
- Flujos de ventas: inspecciona `backend/src/api/sales`, `backend/src/services/SalesService.ts`, pruebas de sales y páginas/layout de ventas.
- Cron jobs: inspecciona `backend/src/api/cron`, pruebas cron y notas operacionales en `RUNBOOK.md`.
- Cambios de base de datos: actualiza `backend/prisma/schema.prisma`, crea una migración, regenera Prisma Client, actualiza tipos API/frontend afectados y ejecuta pruebas relevantes.
- Cambios de despliegue: inspecciona `.github/workflows`, configuración Vercel, ejemplos de entorno y `documentation/INFRASTRUCTURE.md`.
- Cambios de notificaciones: inspecciona servicios/adaptadores backend, ejemplos de entorno y pruebas de proveedores.

Revisa `documentation/TASKS.md` para recetas de tareas más detalladas.
