# Runbook

## Scope

Este runbook cubre los comandos reales para instalar, configurar, ejecutar,
previsualizar, demostrar, probar y operar localmente Estacionate MVP. Está
pensado para personas técnicas que llegan por primera vez al repositorio y para
agentes que necesitan validar cambios sin depender de conocimiento externo.

El repositorio es un monorepo npm con:

- frontend React/Vite en `frontend/`;
- backend Node.js/Express/Prisma en `backend/`;
- PostgreSQL y Redis locales vía `docker-compose.yml`;
- documentación operativa en `documentation/`.

No hay comandos npm vigentes para tareas cron manuales como
`cron:availability`, `cron:reconcile` o `cron:reminders`. Si aparecen en
documentación antigua, considéralos obsoletos.

## Prerequisites

Ejecuta estos comandos desde la raíz del repositorio para confirmar el entorno:

```bash
node --version
npm --version
docker --version
docker compose version
```

Versiones requeridas o recomendadas:

- Node.js `24.15.0`; el repo incluye `.nvmrc`, por lo que `nvm use` selecciona
  esa versión.
- npm `>=11.12.1 <12`.
- Docker y Docker Compose v2 para PostgreSQL y Redis locales.

## Repository layout

- `package.json`: scripts raíz para instalación, desarrollo, build, test,
  lint, formato y validación.
- `frontend/`: aplicación React/Vite, pruebas Vitest y pruebas Playwright en
  `frontend/e2e`.
- `backend/`: API Express, Prisma, migraciones, seed, pruebas Vitest y scripts
  auxiliares.
- `scripts/`: wrappers de bootstrap y validación documental.
- `documentation/`: documentación de arquitectura, validación, tareas y
  guardrails.
- `tests/`: specs Playwright raíz usadas por `npm run test:e2e:autopilot`.

## Environment setup

Desde la raíz del repositorio, crea los archivos locales desde ejemplos
versionados:

```bash
cp backend/.env.local.example backend/.env
cp frontend/.env.example frontend/.env
```

Variables locales principales del backend, definidas en
`backend/.env.local.example`:

- `PORT=3000`
- `NODE_ENV=development`
- `DATABASE_URL="postgresql://postgres:password@localhost:5432/estacionate_dev"`
- `REDIS_URL="redis://localhost:6379"`
- `JWT_SECRET="local-dev-secret-change-me"`
- `ENCRYPTION_KEY="00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"`
- `FRONTEND_URL="http://localhost:5173"`
- credenciales mock de Twilio para desarrollo local;
- `MERCADOPAGO_ACCESS_TOKEN=""` y `FINTOC_SECRET_KEY=""` vacíos por defecto.

Variable principal del frontend, definida en `frontend/.env.example`:

- `VITE_API_URL=http://localhost:3000`

Para tests backend existe `backend/.env.test.example`, pero el runner actual
puede usar la misma base `estacionate_dev`. Si corres tests backend antes de una
demo manual, vuelve a ejecutar el seed porque algunas pruebas limpian o reemplazan
datos locales.

No guardes secretos reales en `.env.example` ni en documentación.

## Install dependencies

Desde la raíz:

```bash
nvm use
npm run install:all
```

`npm run install:all` ejecuta `npm install` en la raíz, `frontend/` y
`backend/`. El `postinstall` del backend ejecuta `npx prisma generate`.

Para CI o una instalación reproducible por subproyecto, los workflows usan:

```bash
npm ci
```

Ejecuta `npm ci` desde la carpeta que tenga su propio `package-lock.json`:
raíz, `frontend/` o `backend/`.

## Local infrastructure

Desde la raíz:

```bash
docker compose up -d postgres redis
```

Servicios locales:

- PostgreSQL: `localhost:5432`, base `estacionate_dev`, usuario `postgres`,
  password `password`.
- Redis: `localhost:6379`.

Para revisar salud de contenedores:

```bash
docker compose ps
docker compose logs postgres
docker compose logs redis
```

Para detener infraestructura local:

```bash
docker compose down
```

Usa `docker compose down -v` solo si quieres eliminar también el volumen de
PostgreSQL y perder los datos locales.

## Database / migrations / seed

Desde `backend/`:

```bash
npx prisma migrate deploy
npm run db:seed
```

Comandos Prisma disponibles desde `backend/`:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:seed
```

Uso recomendado:

- `npx prisma migrate deploy`: aplica migraciones versionadas en entornos
  locales ya definidos o CI/CD.
- `npm run db:migrate`: crea/aplica una migración durante desarrollo de esquema.
- `npm run db:generate`: regenera Prisma Client.
- `npm run db:push`: sincronización directa de esquema; úsala solo para
  iteración local explícita.
- `npm run db:studio`: abre Prisma Studio para inspección local.
- `npm run db:seed`: carga datos demo desde `backend/prisma/seed.ts`.

## Development

Flujo rápido desde cero, desde la raíz:

```bash
npm run bootstrap
```

Esto instala dependencias, crea `.env` locales si faltan, levanta PostgreSQL y
Redis, aplica migraciones, carga seed demo e inicia frontend y backend.
Detenlo con `Ctrl+C`.

Para preparar infraestructura y datos sin iniciar servidores:

```bash
npm run bootstrap -- --no-start
```

Opciones reales de bootstrap:

```bash
npm run bootstrap -- --skip-install
npm run bootstrap -- --skip-seed
npm run bootstrap -- --no-start
npm run bootstrap -- --help
```

Desarrollo diario desde la raíz:

```bash
npm run dev
```

Equivalentes por proceso:

```bash
npm run dev:backend
npm run dev:frontend
```

O desde cada subproyecto:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

URLs locales esperadas:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Health check backend: `http://localhost:3000/api/health`

Si `5173` está ocupado, Vite elige el siguiente puerto libre y lo muestra en la
salida, por ejemplo `http://localhost:5174/`.

## Production build

Desde la raíz:

```bash
npm run build
```

Equivalentes por subproyecto:

```bash
cd frontend && npm run build
cd backend && npm run build
```

El frontend genera `frontend/dist/`. El backend ejecuta `tsc` y genera
`backend/dist/`. No existe un script npm `start` ni un preview backend
productivo dedicado; despliegue backend/frontend está modelado para Vercel.

## Preview production build locally

Frontend, desde `frontend/`:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

URL por defecto de Vite preview: `http://127.0.0.1:4173/`.

Para que el preview frontend use la API local, deja
`frontend/.env` con `VITE_API_URL=http://localhost:3000` y corre el backend en
otro terminal:

```bash
cd backend && npm run dev
```

Backend: no hay comando npm de preview local de producción. El build se valida
con `cd backend && npm run build`; para una ejecución local usa `npm run dev`.

## Demo mode / local demo

La demo funcional usa datos seed locales y proveedores externos mockeados por
defecto. No requiere secretos reales de Twilio, MercadoPago ni Fintoc.

Preparación recomendada, desde la raíz:

```bash
npm run bootstrap -- --no-start
npm run dev
```

Si ya corriste tests backend antes de la demo, recarga los usuarios demo:

```bash
cd backend && npm run db:seed
```

Cuentas demo creadas por `npm run db:seed`:

| Rol                 | Email                                | Password      |
| ------------------- | ------------------------------------ | ------------- |
| Admin plataforma    | `admin@estacionate.cl`               | `password123` |
| Admin edificio      | `badmin@estacionate.cl`              | `password123` |
| Conserjería         | `concierge@estacionate.cl`           | `password123` |
| Residente activo    | `resident@estacionate.cl`            | `password123` |
| Residente lockout   | `resident-lockout@estacionate.cl`    | `password123` |
| Residente pendiente | `resident-unverified@estacionate.cl` | `password123` |
| Residente inactivo  | `resident-inactive@estacionate.cl`   | `password123` |

Datos demo principales:

- edificio `Torres del Parque (Demo)`;
- unidad `101`;
- usuarios staff y residentes anteriores;
- pagos y notificaciones quedan en modo mock/simulador salvo configuración
  explícita de proveedores reales.

Limitación importante: la fase activa del producto es SaaS B2B sin pagos
integrados reales de residentes ni comunidades. Los flujos de pago existentes
son infraestructura demo/simulador o fase futura bloqueada por
`documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`.

## Tests

Desde la raíz:

```bash
npm test
npm run test:backend
npm run test:frontend
npm run test:coverage
npm run test:ui
```

Desde `backend/`:

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:ui
```

Desde `frontend/`:

```bash
npm test
npm run test:watch
```

E2E Playwright de `frontend/e2e`, desde `frontend/`:

```bash
npm run test:e2e
```

Una spec E2E acotada:

```bash
cd frontend && npm run test:e2e -- --project=chromium smoke.spec.ts
```

Specs Playwright raíz en Chromium, desde la raíz:

```bash
npm run test:e2e:autopilot
```

Después de tests backend, vuelve a ejecutar `cd backend && npm run db:seed` si
necesitas iniciar sesión con usuarios demo en navegador.

## Lint, format and type checks

Desde la raíz:

```bash
npm run lint
npm run lint:backend
npm run lint:frontend
npm run format:check
npm run format
npm run audit:arch
npm run check:all
npm run check:local
npm run verify
```

Desde `backend/`:

```bash
npm run lint
npm run build
npm run audit:arch
npm run check:all
```

Desde `frontend/`:

```bash
npm run lint
npm run type-check
npm run build
```

`npm run check:local` crea `.env` faltantes, levanta PostgreSQL/Redis y luego
ejecuta `npm run check:all`.

## Documentation checks

Desde la raíz:

```bash
npm run check:docs
npm run format:check
```

`npm run check:docs` valida sintaxis de scripts shell y enlaces Markdown con
`markdown-link-check`. La configuración ignora URLs `localhost`.

## Operation / maintenance

Comandos útiles desde la raíz:

```bash
docker compose ps
docker compose logs postgres
docker compose logs redis
docker compose down
npm run clean
```

Comandos útiles desde `backend/`:

```bash
npm run db:studio
npm run db:generate
npx prisma migrate status
npx prisma migrate deploy
```

Cron/endpoints:

- `backend/vercel.json` define crons de Vercel para
  `/api/cron/generate-availability` y `/api/cron/cleanup-bookings`.
- El router local expone `/api/cron/worker` y `/api/cron/reconcile`.
- Los cron handlers requieren `CRON_SECRET`; si falta, la app avisa:
  `WARNING: CRON_SECRET is not set. Cron endpoints will reject all requests.`

Ejemplo local con backend corriendo y `CRON_SECRET` definido:

```bash
curl -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/reconcile
```

No hay scripts npm locales para ejecutar cron jobs manualmente.

## Common workflows

Primer setup local:

```bash
nvm use
npm run bootstrap
```

Setup local sin dejar servidores corriendo:

```bash
nvm use
npm run install:all
npm run bootstrap -- --skip-install --no-start
```

Desarrollo diario:

```bash
docker compose up -d postgres redis
npm run dev
```

Preparar demo:

```bash
npm run bootstrap -- --no-start
npm run dev
```

Reparar datos demo después de tests backend:

```bash
cd backend && npm run db:seed
```

Validación antes de PR:

```bash
npm run check:all
npm run format:check
```

Validación local con infraestructura:

```bash
npm run check:local
```

Preview local productivo del frontend:

```bash
cd frontend
npm run build
npm run preview -- --host 127.0.0.1
```

## Troubleshooting

### Docker daemon unavailable

Síntoma de `npm run bootstrap`:

```text
Docker daemon is unavailable. Start Docker, then if you recently changed docker group membership run 'newgrp docker' or open a new shell.
```

Acción:

```bash
docker info
newgrp docker
```

Luego reintenta `npm run bootstrap`.

### PostgreSQL no queda listo

Síntoma:

```text
PostgreSQL did not become ready in time. Check 'docker compose logs postgres'.
```

Acción:

```bash
docker compose ps
docker compose logs postgres
docker compose up -d postgres redis
```

### Puerto 5173 ocupado

Síntoma:

```text
Port 5173 is in use, trying another one...
```

Acción: usa la URL que imprime Vite, por ejemplo `http://localhost:5174/`, o
detén el proceso anterior si necesitas exactamente `5173`.

### Login demo falla después de tests

Síntoma en UI: `Credenciales inválidas` para `admin@estacionate.cl`.

Evidencia observada: después de correr tests backend,
`cd backend && npx tsx scripts/check-users.ts` puede mostrar
`Demo Admin (admin@estacionate.cl): Not Found`.

Acción:

```bash
cd backend && npm run db:seed
```

### Cron endpoints rechazan requests

Síntoma al arrancar backend:

```text
WARNING: CRON_SECRET is not set. Cron endpoints will reject all requests.
```

Acción: define `CRON_SECRET` en `backend/.env` si necesitas probar endpoints
cron. No hace falta para flujo demo normal.

### Build frontend advierte chunk grande

Síntoma:

```text
Some chunks are larger than 500 kB after minification.
```

Estado: advertencia preexistente de Vite/Rollup. El build termina exitosamente.

### npm audit reporta vulnerabilidades

`npm run install:all` puede terminar correctamente y aun así reportar
vulnerabilidades de `npm audit`. No ejecutes `npm audit fix --force` como parte
de onboarding; trátalo como tarea de mantenimiento separada.

### Scripts deploy raíz

`package.json` raíz contiene `deploy:staging` y `deploy:production`, pero ambos
apuntan a `./scripts/deploy.sh`, archivo que no está versionado actualmente. No
los uses como procedimiento operativo hasta corregir o restaurar ese script.

## Command reference

| Comando                                          | Carpeta     | Propósito                                              | Cuándo usarlo                                | Validado | Notas                                                                                   |
| ------------------------------------------------ | ----------- | ------------------------------------------------------ | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `nvm use`                                        | raíz        | Seleccionar Node desde `.nvmrc`                        | Antes de instalar o correr scripts           | No       | Depende de tener `nvm` instalado.                                                       |
| `npm run install:all`                            | raíz        | Instalar dependencias raíz, frontend y backend         | Primer setup o cambios de dependencias       | Sí       | Ejecutó Prisma generate; `npm audit` reportó vulnerabilidades.                          |
| `npm run bootstrap`                              | raíz        | Setup completo y arranque dev                          | Primer setup rápido                          | Parcial  | Validado con `--skip-install --no-start`; sin `--no-start` deja servidores corriendo.   |
| `npm run bootstrap -- --no-start`                | raíz        | Provisionar infra, migraciones y seed sin arrancar dev | Preparar demo/validación                     | Sí       | Levanta Docker, aplica migraciones y carga seed.                                        |
| `npm run bootstrap -- --skip-install --no-start` | raíz        | Reusar dependencias y preparar infra/datos             | Validación rápida con dependencias presentes | Sí       | Usado en esta revisión.                                                                 |
| `docker compose up -d postgres redis`            | raíz        | Levantar PostgreSQL y Redis                            | Desarrollo, tests DB, demo                   | Sí       | También lo ejecuta bootstrap/check local.                                               |
| `docker compose ps`                              | raíz        | Ver estado de contenedores                             | Diagnóstico                                  | No       | Comando Docker estándar.                                                                |
| `docker compose logs postgres`                   | raíz        | Ver logs PostgreSQL                                    | Diagnóstico DB                               | No       | Recomendado por bootstrap si DB no queda lista.                                         |
| `docker compose logs redis`                      | raíz        | Ver logs Redis                                         | Diagnóstico Redis                            | No       | Útil ante timeouts/rate limit.                                                          |
| `docker compose down`                            | raíz        | Detener contenedores                                   | Cierre de entorno local                      | No       | No borra volúmenes.                                                                     |
| `npm run dev`                                    | raíz        | Iniciar frontend y backend juntos                      | Desarrollo diario                            | Sí       | Validado con timeout; backend inició en 3000, Vite usó 5174 porque 5173 estaba ocupado. |
| `npm run dev:frontend`                           | raíz        | Iniciar solo frontend                                  | Desarrollo frontend                          | No       | Wrapper de `cd frontend && npm run dev`.                                                |
| `npm run dev:backend`                            | raíz        | Iniciar solo backend                                   | Desarrollo backend                           | No       | Wrapper de `cd backend && npm run dev`.                                                 |
| `npm run build`                                  | raíz        | Build frontend + backend                               | Validación global                            | Sí       | Revalidado después de editar.                                                           |
| `npm run build:frontend`                         | raíz        | Build frontend                                         | Cambios frontend                             | No       | Wrapper de subproyecto.                                                                 |
| `npm run build:backend`                          | raíz        | Build backend                                          | Cambios backend                              | No       | Wrapper de subproyecto.                                                                 |
| `npm test`                                       | raíz        | Tests backend + frontend                               | Validación global                            | Sí       | Revalidado después de editar.                                                           |
| `npm run test:backend`                           | raíz        | Tests backend                                          | Cambios backend                              | No       | Wrapper de `cd backend && npm test`.                                                    |
| `npm run test:frontend`                          | raíz        | Tests frontend                                         | Cambios frontend                             | No       | Wrapper de `cd frontend && npm test`.                                                   |
| `npm run test:coverage`                          | raíz        | Coverage backend                                       | Antes de ampliar cobertura                   | No       | Wrapper backend.                                                                        |
| `npm run test:ui`                                | raíz        | UI Vitest backend                                      | Debug interactivo                            | No       | Deja proceso interactivo.                                                               |
| `npm run test:e2e:autopilot`                     | raíz        | Playwright specs raíz en Chromium                      | Validar flujos raíz                          | No       | Requiere app local/servidores Playwright.                                               |
| `npm run lint`                                   | raíz        | Lint backend + frontend                                | Pre-PR                                       | Sí       | Pasó.                                                                                   |
| `npm run format:check`                           | raíz        | Verificar formato docs/config                          | Docs/pre-PR                                  | Sí       | Revalidado después de editar.                                                           |
| `npm run format`                                 | raíz        | Aplicar Prettier                                       | Antes de entregar docs/config                | Sí       | Ejecutado para formatear cambios.                                                       |
| `npm run check:docs`                             | raíz        | Validar shell scripts y links Markdown                 | Cambios docs/proceso                         | Sí       | Revalidado después de editar.                                                           |
| `npm run check:local`                            | raíz        | Levantar infra y ejecutar `check:all`                  | Validación DB-aware                          | No       | Puede tardar; usa Docker.                                                               |
| `npm run check:all`                              | raíz        | Lint + build + tests + arquitectura                    | Pre-PR amplio                                | No       | Partes equivalentes fueron validadas.                                                   |
| `npm run verify`                                 | raíz        | Wrapper de `check:all`                                 | Alternativa pre-PR                           | No       | Ejecuta `scripts/verify.sh`.                                                            |
| `npm run audit:arch`                             | raíz        | Dependency Cruiser backend                             | Validación arquitectura backend              | No       | Wrapper backend.                                                                        |
| `npm run clean`                                  | raíz        | Eliminar `node_modules`                                | Reset local de dependencias                  | No       | Destructivo para instalación local, no para código.                                     |
| `npm run build`                                  | `frontend/` | Typecheck y build Vite                                 | Cambios frontend                             | Sí       | Pasó con advertencia de chunk grande.                                                   |
| `npm run preview -- --host 127.0.0.1`            | `frontend/` | Servir `dist` local                                    | Preview producción frontend                  | Sí       | Validado con timeout; URL 4173.                                                         |
| `npm run dev`                                    | `frontend/` | Vite dev server                                        | Desarrollo frontend                          | Sí       | Validado vía raíz.                                                                      |
| `npm test`                                       | `frontend/` | Vitest frontend                                        | Cambios frontend                             | Sí       | 3 archivos, 7 tests pasaron.                                                            |
| `npm run test:e2e`                               | `frontend/` | Playwright `frontend/e2e`                              | Flujos navegador                             | Parcial  | `smoke.spec.ts` Chromium falló sin seed y pasó tras `npm run db:seed`.                  |
| `npm run lint`                                   | `frontend/` | ESLint frontend                                        | Cambios frontend                             | Sí       | Pasó.                                                                                   |
| `npm run type-check`                             | `frontend/` | TypeScript sin emit                                    | Cambios TS frontend                          | No       | Cubierto indirectamente por build frontend.                                             |
| `npm run build`                                  | `backend/`  | TypeScript backend                                     | Cambios backend                              | Sí       | Pasó.                                                                                   |
| `npm run dev`                                    | `backend/`  | API local con `tsx watch`                              | Desarrollo backend                           | Sí       | Validado vía raíz.                                                                      |
| `npm test`                                       | `backend/`  | Vitest backend                                         | Cambios backend                              | Sí       | 47 archivos pasaron, 1 skipped.                                                         |
| `npm run lint`                                   | `backend/`  | ESLint backend                                         | Cambios backend                              | Sí       | Pasó.                                                                                   |
| `npm run check:all`                              | `backend/`  | Lint + build + tests + arquitectura backend            | Pre-PR backend                               | No       | Sus partes principales fueron validadas.                                                |
| `npm run db:seed`                                | `backend/`  | Cargar demo seed                                       | Demo y reparación de datos                   | Sí       | Creó usuarios demo y login API devolvió 200.                                            |
| `npm run db:generate`                            | `backend/`  | Regenerar Prisma Client                                | Cambios Prisma                               | Sí       | Ejecutado por postinstall.                                                              |
| `npm run db:migrate`                             | `backend/`  | Crear/aplicar migración dev                            | Cambios de schema                            | No       | Puede modificar migraciones.                                                            |
| `npm run db:push`                                | `backend/`  | Empujar schema sin migración                           | Iteración local controlada                   | No       | No usar para reemplazar migraciones versionadas.                                        |
| `npm run db:studio`                              | `backend/`  | Abrir Prisma Studio                                    | Inspección DB                                | No       | Proceso interactivo.                                                                    |
| `npx prisma migrate deploy`                      | `backend/`  | Aplicar migraciones versionadas                        | Bootstrap/CI/CD                              | Sí       | No había migraciones pendientes.                                                        |
| `npx prisma migrate status`                      | `backend/`  | Ver estado de migraciones                              | Diagnóstico DB                               | No       | Comando Prisma estándar.                                                                |
