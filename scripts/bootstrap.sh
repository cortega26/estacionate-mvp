#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm run install:all

if [ ! -f backend/.env ]; then
  cp backend/.env.local.example backend/.env
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
fi

docker compose up -d postgres redis

cd backend
npx prisma migrate dev
npm run db:seed
