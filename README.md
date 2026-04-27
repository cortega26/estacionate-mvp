# Estacionate MVP

A comprehensive marketplace for renting residential parking spots. Connects building administrators, residents, and visitors.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, TypeScript, Prisma (PostgreSQL)
- **Infrastructure:** Redis (queues/caching), Docker
- **Testing:** Playwright (E2E), Vitest (Unit)

## Prerequisites

- Node.js 24.15.0 LTS
- `nvm` recommended; this repository includes `.nvmrc`, so `nvm use` will select the pinned runtime
- Docker and Docker Compose for local PostgreSQL/Redis

## Getting Started

### Fast Bootstrap

For a fresh local environment, run:

```bash
npm run bootstrap
```

This installs dependencies, creates local `.env` files when missing, starts PostgreSQL and Redis, applies Prisma migrations, and seeds the database.
It then starts the frontend and backend together.

To provision everything without launching the dev servers:

```bash
npm run bootstrap -- --no-start
```

### Manual Setup

#### 1. Installation

```bash
nvm use
npm run install:all
```

#### 2. Environment Configuration

Create local environment files from the examples:

```bash
cp backend/.env.local.example backend/.env
cp frontend/.env.example frontend/.env
```

**Backend Required Variables:**

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `PORT` (default 3000)

For local infrastructure defaults, see `docker-compose.yml` and `documentation/INFRASTRUCTURE.md`.

#### 3. Running the Project

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Prepare the database:

```bash
cd backend
npx prisma migrate deploy
npm run db:seed
```

Start backend and frontend together:

```bash
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Testing

### E2E Tests (Playwright)

Running full end-to-end tests for the critical visitor booking flows.

```bash
cd frontend
npm run test:e2e
```

To see the report:

```bash
npx playwright show-report
```

### Unit Tests

```bash
npm run test
```

### Full Validation

```bash
npm run check:all
```

If local PostgreSQL/Redis may not be running yet, use:

```bash
npm run check:local
```

## Project Structure

- `frontend/`: React application, E2E tests (`/e2e`)
- `backend/`: Express API, Prisma schema, Business Logic
- `documentation/`: Detailed architectural and product documentation
- `documentation/CODEMAP.md`: File and workflow map for agents/contributors
- `documentation/OWNERSHIP.md`: Ownership and edit-boundary guide
- `documentation/TASKS.md`: Task-specific entry points and validation hints
- `documentation/VALIDATION.md`: Validation command guide
- `documentation/adr/`: Architecture decision records
- `AGENTS.md`: Fast-start guide for agents and new contributors
