#!/bin/bash
set -euo pipefail

echo "=== CRM Application Starter ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRM_DB_DIR="${ROOT_DIR}/backend/data"

# Parse arguments
RESET_DB=false
for arg in "$@"; do
  case "$arg" in
    --reset-db) RESET_DB=true ;;
    *)
      echo "Usage: $0 [--reset-db]"
      echo "  --reset-db      Delete local SQLite database (will be recreated with seed data)"
      exit 1
      ;;
  esac
done

# --- Prerequisite checks ---

# Check Node.js is installed
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "This project requires Node.js 20.19+ (Angular 21 requirement)."
  echo "Install via: brew install node@22  OR  nvm install 22"
  exit 1
fi

# Check Node.js version is 20.19+
NODE_VERSION=$(node --version | sed 's/^v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
NODE_MINOR=$(echo "$NODE_VERSION" | cut -d. -f2)
if [ "$NODE_MAJOR" -lt 20 ] 2>/dev/null || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; }; then
  echo "ERROR: Node.js 20.19 or later is required. Found: Node ${NODE_VERSION}."
  echo "Install via: brew install node@22  OR  nvm install 22"
  exit 1
fi
echo "Node.js ${NODE_VERSION} detected."

# Check npm is available (bundled with Node.js)
if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is not installed (should be bundled with Node.js)."
  echo "Reinstall Node.js: brew install node@22  OR  nvm install 22"
  exit 1
fi

# Optionally reset database
if [ "$RESET_DB" = true ]; then
  if [ -d "$CRM_DB_DIR" ]; then
    echo "Deleting database at ${CRM_DB_DIR}..."
    rm -rf "$CRM_DB_DIR"
  fi
  echo "Database deleted. Will be recreated on startup."
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "${FRONTEND_PID}" ]; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
    echo "Frontend stopped"
  fi
  if [ -n "${BACKEND_PID}" ]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
    echo "Backend stopped"
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

# --- Backend ---

echo "Starting backend..."
cd "${ROOT_DIR}/backend"

# Install node modules if not present
if [ ! -d "node_modules" ]; then
  echo "Backend node modules not found. Running npm install..."
  npm install
fi

npx tsx --watch src/index.ts &
BACKEND_PID=$!
cd "${ROOT_DIR}"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 60); do
  if curl -s "http://localhost:7070/api/health" -o /dev/null -w '%{http_code}' 2>/dev/null | grep -q '200'; then
    echo "Backend is ready!"
    break
  fi
  if [ "${i}" -eq 60 ]; then
    echo "ERROR: Backend failed to start within 60 seconds"
    cleanup
  fi
  sleep 1
done

# --- Frontend ---

echo "Starting frontend..."
cd "${ROOT_DIR}/frontend"

# Install node modules if not present
if [ ! -d "node_modules" ]; then
  echo "Node modules not found. Running npm install..."
  npm install
fi

# Optional sanity check: can ng run?
if ! npx ng version > /dev/null 2>&1; then
  echo "Angular CLI seems not properly installed. Reinstalling dependencies..."
  rm -rf node_modules package-lock.json
  npm install
fi

npx ng serve --port 7200 --proxy-config proxy.conf.json &
FRONTEND_PID=$!
cd "${ROOT_DIR}"

echo ""
echo "=== CRM Application Started ==="
echo "Backend:   http://localhost:7070"
echo ""
echo "  >>>  http://localhost:7200  <<<"
echo ""
echo "Press Ctrl+C to stop"

# Wait for background processes
wait
