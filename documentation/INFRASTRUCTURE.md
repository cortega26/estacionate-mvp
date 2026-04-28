# Guía De Infraestructura Y Despliegue

## Visión General

Estaciónate usa un modelo híbrido de infraestructura:

- **Backend:** Node.js/Express en Vercel (producción) / Docker (local).
- **Frontend:** SPA React en Vercel (producción) / Vite (local).
- **Base de datos:** PostgreSQL en Neon (producción) / Docker (local).
- **Caché/rate limiting:** Upstash Redis (producción) / Redis Docker (local).

Revisa `documentation/adr/0003-deployment-topology.md` para la decisión de topología de despliegue.

## Desarrollo Local (Docker)

Usamos Docker Compose para replicar localmente el entorno de producción.

### Prerrequisitos

- Docker y Docker Compose
- Node.js 24.15.0 LTS
- `nvm` recomendado; este repositorio incluye `.nvmrc`, por lo que `nvm use` selecciona el runtime fijado

### Setup

1.  **Clonar el repositorio**.
2.  **Preparar el entorno local**:

    ```bash
    npm run bootstrap
    ```

    Esto instala dependencias, crea archivos `.env` locales cuando falten, inicia PostgreSQL y Redis, aplica migraciones Prisma registradas, carga la base de datos y levanta los servidores de desarrollo frontend/backend.

    Para detenerse después del aprovisionamiento:

    ```bash
    npm run bootstrap -- --no-start
    ```

### Setup Manual

1.  **Iniciar servicios**:
    ```bash
    docker compose up -d postgres redis
    ```
    Esto levanta:
    - `postgres` (puerto 5432, usuario: `postgres`, DB: `estacionate_dev`)
    - `redis` (puerto 6379)
2.  **Crear archivos de entorno locales**:
    ```bash
    cp backend/.env.local.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
3.  **Ejecutar backend localmente** (fuera de Docker, recomendado para desarrollo):
    ```bash
    cd backend
    nvm use
    npm ci
    npx prisma migrate deploy
    npm run dev
    ```
    _Asegúrate de que tu `.env` apunte a puertos localhost._

## Variables De Entorno

### Backend (`backend/.env`)

| Variable            | Descripción                                                                     | Ejemplo (local)                                                 |
| :------------------ | :------------------------------------------------------------------------------ | :-------------------------------------------------------------- |
| `DATABASE_URL`      | String de conexión para Postgres                                                | `postgresql://postgres:password@localhost:5432/estacionate_dev` |
| `JWT_SECRET`        | Secreto para firmar tokens de auth                                              | `local-dev-secret`                                              |
| `PORT`              | Puerto del servidor API                                                         | `3000`                                                          |
| `MP_ACCESS_TOKEN`   | Token demo/sandbox MercadoPago; no usar para pagos productivos de Fase 1        | `TEST-...`                                                      |
| `MP_WEBHOOK_SECRET` | Secreto webhook demo/sandbox MercadoPago; no usar para pagos productivos Fase 1 | `...`                                                           |
| `REDIS_URL`         | String de conexión Redis                                                        | `redis://localhost:6379`                                        |

### Frontend (`frontend/.env`)

| Variable       | Descripción           | Ejemplo                 |
| :------------- | :-------------------- | :---------------------- |
| `VITE_API_URL` | URL de la API backend | `http://localhost:3000` |

## Pipelines CI/CD (GitHub Actions)

Usamos GitHub Actions para integración continua y despliegue.

### Workflows

- **`ci-backend.yml`**: ejecuta linting y pruebas unitarias/integración en cada push. Usa un contenedor de servicio Postgres.
- **`ci-frontend.yml`**: ejecuta linting y build de la app React para verificar integridad.
- **`cd-backend.yml`**: despliega a Vercel cuando los cambios se mergean a `main`.
- **`cd-frontend.yml`**: despliega el frontend a Vercel cuando los cambios se mergean a `main`.

### Secretos Requeridos (Configuración Del Repo En GitHub)

Para habilitar despliegues, agrega estos secretos al repositorio:

- `VERCEL_TOKEN`: token de Vercel CLI.
- `VERCEL_ORG_ID`: desde la configuración del proyecto en Vercel.
- `VERCEL_PROJECT_ID`: desde la configuración del proyecto en Vercel.
- `DATABASE_URL`: URL de base de datos productiva (opcional para CI, pero necesaria si se ejecutan pruebas sin mocks).

## Migraciones De Base De Datos

- **Local:** `npx prisma migrate dev` crea nuevas migraciones y las aplica.
- **Producción:** el comando de build de Vercel debe incluir `npx prisma migrate deploy` o debe ejecutarse manualmente/vía CI antes del despliegue.
