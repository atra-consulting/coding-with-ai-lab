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

# Check lsof is available (used for port cleanup)
if ! command -v lsof &> /dev/null; then
  echo "ERROR: lsof is not installed; required for port cleanup."
  exit 1
fi

BACKEND_PORT=7070
FRONTEND_PORT=7200

# Pre-flight: refuse to start if the ports are already in use. Otherwise the
# health check below would talk to a leftover backend from a previous run and
# the new backend would crash with EADDRINUSE.
check_port_free() {
  local port="$1"
  local label="$2"
  if lsof -ti ":${port}" > /dev/null 2>&1; then
    echo "ERROR: ${label} port ${port} is already in use."
    echo "Run ./end.sh to stop the leftover process, then try again."
    exit 1
  fi
}

check_port_free "${BACKEND_PORT}"  "Backend"
check_port_free "${FRONTEND_PORT}" "Frontend"

# Optionally reset database
if [ "$RESET_DB" = true ]; then
  if [ -d "$CRM_DB_DIR" ]; then
    echo "Deleting database at ${CRM_DB_DIR}..."
    rm -rf "$CRM_DB_DIR"
  fi
  echo "Database deleted. Will be recreated on startup."
fi

# Recursively kill a process and all its descendants. Parent is killed
# first so file watchers (tsx --watch, ng serve) stop supervising — without
# this they respawn the node/webpack child we just killed and the port
# stays bound.
kill_tree() {
  local pid="${1:-}"
  [ -z "$pid" ] && return 0
  # Capture children before killing the parent — once the parent dies the
  # children are reparented to init and pgrep -P can no longer find them
  # through this ancestor.
  local children
  children=$(pgrep -P "$pid" 2>/dev/null || true)
  kill -TERM "$pid" 2>/dev/null || true
  local child
  for child in $children; do
    kill_tree "$child"
  done
}

# Kill every process still listening on the given port. Used as a safety
# net after kill_tree, in case a grandchild was missed or tsx had just
# spawned a replacement.
stop_port() {
  local port="$1"

  local pids
  pids=$(lsof -ti ":${port}" 2>/dev/null || true)
  if [ -z "$pids" ]; then
    return 0
  fi

  echo "$pids" | xargs kill 2>/dev/null || true
  sleep 1
  pids=$(lsof -ti ":${port}" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

cleaned_up=false
cleanup() {
  if [ "$cleaned_up" = true ]; then
    return
  fi
  cleaned_up=true
  echo ""
  echo "Shutting down..."
  # Kill the npx-rooted trees first so the watchers stop respawning, then
  # sweep the ports as a safety net.
  kill_tree "${FRONTEND_PID:-}"
  kill_tree "${BACKEND_PID:-}"
  stop_port "${FRONTEND_PORT}"
  echo "Frontend stopped"
  stop_port "${BACKEND_PORT}"
  echo "Backend stopped"
}

trap cleanup SIGINT SIGTERM EXIT

# --- Backend ---

echo "Starting backend..."
cd "${ROOT_DIR}/backend"

# Install node modules if not present or incomplete (partial installs miss
# binaries like tsx and make start fail with MODULE_NOT_FOUND).
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/tsx" ]; then
  echo "Backend node modules missing or incomplete. Running npm install..."
  npm install
fi

# Ensure the native better-sqlite3 binary matches the current Node version.
# (After a Node major upgrade, the cached .node file is compiled against the
# old ABI and throws ERR_DLOPEN_FAILED on boot.)
if ! node -e "require('better-sqlite3')" > /dev/null 2>&1; then
  echo "better-sqlite3 binary mismatch with Node ${NODE_VERSION}, rebuilding..."
  npm rebuild better-sqlite3
fi

npx tsx --watch src/index.ts &
BACKEND_PID=$!
cd "${ROOT_DIR}"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 60); do
  if curl -s "http://localhost:${BACKEND_PORT}/api/health" -o /dev/null -w '%{http_code}' 2>/dev/null | grep -q '200'; then
    echo "Backend is ready!"
    break
  fi
  if [ "${i}" -eq 60 ]; then
    echo "ERROR: Backend failed to start within 60 seconds"
    exit 1
  fi
  sleep 1
done

# --- Frontend ---

echo "Starting frontend..."
cd "${ROOT_DIR}/frontend"

# Install node modules if not present or incomplete
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/ng" ]; then
  echo "Frontend node modules missing or incomplete. Running npm install..."
  npm install
fi

# Optional sanity check: can ng run?
if ! npx ng version > /dev/null 2>&1; then
  echo "Angular CLI seems not properly installed. Reinstalling dependencies..."
  rm -rf node_modules package-lock.json
  npm install
fi

npx ng serve --port "${FRONTEND_PORT}" --proxy-config proxy.conf.json &
FRONTEND_PID=$!
cd "${ROOT_DIR}"

echo ""
echo "=== CRM Application Started ==="
echo "Backend:   http://localhost:${BACKEND_PORT}"
echo ""
echo "  >>>  http://localhost:${FRONTEND_PORT}  <<<"
echo ""
echo "Press Ctrl+C to stop"

# Wait for background processes
wait
