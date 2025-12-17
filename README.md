# Estacionate MVP

A comprehensive marketplace for renting residential parking spots. Connects building administrators, residents, and visitors.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, TypeScript, Prisma (PostgreSQL)
- **Infrastructure:** Redis (queues/caching), Docker
- **Testing:** Playwright (E2E), Vitest (Unit)

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis

## Getting Started

### 1. Installation

```bash
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Ensure you have the necessary environment variables set up. Check `backend/.env.example` and `frontend/.env.example` (if available) or ask the team for the current configuration keys.

**Backend Required Variables:**
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `PORT` (default 3000)

### 3. Running the Project

**Start Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:3000
```

**Start Frontend:**
```bash
cd frontend
npm run dev
# App starts on http://localhost:5173
```

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
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

## Project Structure

- `frontend/`: React application, E2E tests (`/e2e`)
- `backend/`: Express API, Prisma schema, Business Logic
- `documentation/`: Detailed architectural and product documentation