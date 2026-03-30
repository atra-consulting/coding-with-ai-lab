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
      echo "  --reset-db      Delete local H2 database (will be recreated with seed data)"
      exit 1
      ;;
  esac
done

# Check prerequisites
if ! command -v mvn &> /dev/null; then
  echo "ERROR: Maven (mvn) is not installed"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is not installed"
  exit 1
fi

# Set JAVA_HOME to Java 21 if available
if [ -d "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home" ]; then
  export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
  echo "Using Java 21: $JAVA_HOME"
elif [ -d "$(brew --prefix openjdk@21 2>/dev/null)/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
  echo "Using Java 21 (Homebrew): $JAVA_HOME"
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
mvn spring-boot:run -Dspring-boot.run.profiles=dev -q &
BACKEND_PID=$!
cd "${ROOT_DIR}"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 60); do
  if curl -s "http://localhost:7070/api/firmen" -o /dev/null -w '%{http_code}' 2>/dev/null | grep -q '401\|200'; then
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
echo "Frontend:  http://localhost:7200 (live reload enabled)"
echo ""
echo "Press Ctrl+C to stop"

# Wait for background processes
wait
