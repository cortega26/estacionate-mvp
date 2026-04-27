#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

script_path="$PWD/scripts/bootstrap.sh"

skip_install=false
skip_seed=false
no_start=false

usage() {
  cat <<'EOF'
Usage: npm run bootstrap -- [options]

Bootstrap the local Estacionate environment by installing dependencies,
creating missing env files, starting Docker-backed services, applying the
checked-in Prisma migrations, seeding demo data, and launching the app.

Options:
  --skip-install  Reuse existing node_modules without reinstalling
  --skip-seed     Skip the demo seed step
  --no-start      Stop after provisioning infra and data
  -h, --help      Show this help message
EOF
}

log() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf 'Bootstrap failed: %s\n' "$1" >&2
  exit 1
}

ensure_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "Required command '$command_name' is not installed or not on PATH."
  fi
}

wait_for_postgres() {
  local attempts=0
  local max_attempts=30
  local status

  while [ "$attempts" -lt "$max_attempts" ]; do
    status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' estacionate-db 2>/dev/null || true)

    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      return 0
    fi

    attempts=$((attempts + 1))
    sleep 2
  done

  fail "PostgreSQL did not become ready in time. Check 'docker compose logs postgres'."
}

run_compose() {
  "${compose[@]}" "$@"
}

for arg in "$@"; do
  case "$arg" in
    --skip-install)
      skip_install=true
      ;;
    --skip-seed)
      skip_seed=true
      ;;
    --no-start)
      no_start=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $arg"
      ;;
  esac
done

ensure_command npm
ensure_command node
ensure_command docker

if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
else
  fail "Docker Compose is required. Install Docker Compose v2 or docker-compose."
fi

if ! docker info >/dev/null 2>&1; then
  if [ -z "${BOOTSTRAP_SG_REEXEC:-}" ] && command -v sg >/dev/null 2>&1 && sg docker -c 'docker info >/dev/null 2>&1'; then
    printf -v quoted_args ' %q' "$@"
    log "Refreshing Docker access via the docker group"
    exec sg docker -c "BOOTSTRAP_SG_REEXEC=1 bash $(printf '%q' "$script_path")$quoted_args"
  fi

  fail "Docker daemon is unavailable. Start Docker, then if you recently changed docker group membership run 'newgrp docker' or open a new shell."
fi

if [ "$skip_install" = false ]; then
  log "Installing workspace dependencies"
  npm run install:all
else
  log "Skipping dependency installation"
fi

if [ ! -f backend/.env ]; then
  log "Creating backend/.env from local example"
  cp backend/.env.local.example backend/.env
fi

if [ ! -f frontend/.env ]; then
  log "Creating frontend/.env from example"
  cp frontend/.env.example frontend/.env
fi

log "Starting Docker services"
run_compose up -d postgres redis

log "Waiting for PostgreSQL to become ready"
wait_for_postgres

log "Applying checked-in database migrations"
(
  cd backend
  npx prisma migrate deploy
)

if [ "$skip_seed" = false ]; then
  log "Seeding demo data"
  (
    cd backend
    npm run db:seed
  )
else
  log "Skipping seed step"
fi

printf '\nBootstrap completed successfully.\n'
printf 'Frontend: http://localhost:5173\n'
printf 'Backend:  http://localhost:3000\n'
printf 'Admin:    admin@estacionate.cl / password123\n'
printf 'BAdmin:   badmin@estacionate.cl / password123\n'
printf 'Guard:    concierge@estacionate.cl / password123\n'
printf 'Resident: resident@estacionate.cl / password123\n'

if [ "$no_start" = true ]; then
  printf '\nInfrastructure and data are ready. Start the app with: npm run dev\n'
  exit 0
fi

printf '\nStarting frontend and backend. Press Ctrl+C to stop the dev servers.\n'
exec npm run dev
