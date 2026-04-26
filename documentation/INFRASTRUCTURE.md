# Infrastructure & Deployment Guide

## Overview
Estaciónate uses a hybrid infrastructure model:
- **Backend**: Node.js/Express on Vercel (Production) / Docker (Local).
- **Frontend**: React SPA on Vercel (Production) / Vite (Local).
- **Database**: PostgreSQL on Neon (Production) / Docker (Local).
- **Caching/Rate Limiting**: Upstash Redis (Production) / Redis Docker (Local).

See `documentation/adr/0003-deployment-topology.md` for the deployment topology decision.

## Local Development (Docker)

We use `docker-compose` to replicate the production environment locally.

### Prerequisites
- Docker & Docker Compose
- Node.js v20+

### Setup
1.  **Clone the repository**.
2.  **Bootstrap the local environment**:
    ```bash
    npm run bootstrap
    ```

    This installs dependencies, creates local `.env` files when missing, starts PostgreSQL and Redis, applies Prisma migrations, and seeds the database.

### Manual Setup
1.  **Start Services**:
    ```bash
    docker-compose up -d
    ```
    This spins up:
    - `postgres` (Port 5432, User: `postgres`, DB: `estacionate_dev`)
    - `redis` (Port 6379)
2.  **Create Local Env Files**:
    ```bash
    cp backend/.env.local.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
3.  **Run Backend Locally** (Outside Docker - Recommended for Dev):
    ```bash
    cd backend
    npm install
    npx prisma migrate dev
    npm run dev
    ```
    *Ensure your `.env` points to localhost ports.*

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example (Local) |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for Postgres | `postgresql://postgres:password@localhost:5432/estacionate_dev` |
| `JWT_SECRET` | Secret for signing auth tokens | `local-dev-secret` |
| `PORT` | API Server Port | `3000` |
| `MP_ACCESS_TOKEN` | MercadoPago Access Token | `TEST-...` |
| `MP_WEBHOOK_SECRET` | MercadoPago Webhook Secret | `...` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL of the Backend API | `http://localhost:3000` |

## CI/CD Pipelines (GitHub Actions)

We use GitHub Actions for continuous integration and deployment.

### Workflows
- **`ci-backend.yml`**: Runs linting and unit/integration tests on every push. Uses a Postgres service container.
- **`ci-frontend.yml`**: Runs linting and builds the React app to verify integrity.
- **`cd-backend.yml`**: Deploys to Vercel when changes are merged to `main`.
- **`cd-frontend.yml`**: Deploys the frontend to Vercel when changes are merged to `main`.

### Secrets Required (GitHub Repo Settings)
To enable deployments, add these secrets to your repository:
- `VERCEL_TOKEN`: Vercel CLI Token.
- `VERCEL_ORG_ID`: From Vercel Project Settings.
- `VERCEL_PROJECT_ID`: From Vercel Project Settings.
- `DATABASE_URL`: Production DB URL (optional for CI, but needed if running non-mocked tests).

## Database Migrations
- **Local**: `npx prisma migrate dev` - Creates new migrations and applies them.
- **Production**: Vercel build command should include `npx prisma migrate deploy` or it should be run manually/via CI before deployment.
