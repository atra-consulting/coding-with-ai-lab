#!/bin/bash
set -euo pipefail

echo "=== CRM Application Cleaner ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_PORT=7070
FRONTEND_PORT=7200

# Pre-flight: refuse to run if the app is still up. Deleting node_modules
# while tsx --watch or ng serve is running can leave the watchers in a
# half-dead state that still holds the ports.
check_port_free() {
  local port="$1"
  local label="$2"
  if command -v lsof >/dev/null 2>&1 && lsof -ti ":${port}" >/dev/null 2>&1; then
    echo "ERROR: ${label} port ${port} is still in use."
    echo "Run ./end.sh to stop the application, then run ./clean.sh again."
    exit 1
  fi
}

check_port_free "${BACKEND_PORT}"  "Backend"
check_port_free "${FRONTEND_PORT}" "Frontend"

# Helper: delete a path if it exists, print what happened.
nuke() {
  local path="$1"
  if [ -e "$path" ]; then
    echo "  Deleting ${path}"
    rm -rf "$path"
  fi
}

echo "Cleaning backend..."
nuke "${ROOT_DIR}/backend/data"
nuke "${ROOT_DIR}/backend/node_modules"
nuke "${ROOT_DIR}/backend/test-results"
nuke "${ROOT_DIR}/backend/package-lock.json"

echo "Cleaning frontend..."
nuke "${ROOT_DIR}/frontend/node_modules"
nuke "${ROOT_DIR}/frontend/dist"
nuke "${ROOT_DIR}/frontend/.angular"
nuke "${ROOT_DIR}/frontend/package-lock.json"

echo ""
echo "=== Clean complete ==="
echo "Next: ./start.sh   (will run npm install and recreate the database)"
