#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for DB-backed local checks."
  echo "Install Docker, then run: npm run check:local"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
else
  echo "Docker Compose is required for DB-backed local checks."
  exit 1
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.local.example backend/.env
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
fi

"${compose[@]}" up -d postgres redis

echo "Local Postgres and Redis are running."
echo "Run npm run check:all, or use npm run check:local to run it automatically."
