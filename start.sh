#!/bin/bash
set -euo pipefail

echo "=== CRM Application Starter ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRM_DB_DIR="${ROOT_DIR}/backend/data"
CIAM_DB_DIR="${ROOT_DIR}/ciam/data"
CIAM_KEYS_DIR="${ROOT_DIR}/ciam/keys"

# Parse arguments
RESET_DB=false
DEMO_MODE=true
RESTART_CIAM=false
for arg in "$@"; do
  case "$arg" in
    --reset-db) RESET_DB=true ;;
    --no-demo) DEMO_MODE=false ;;
    --restart-ciam) RESTART_CIAM=true ;;
    *)
      echo "Usage: $0 [--reset-db] [--no-demo] [--restart-ciam]"
      echo "  --reset-db      Delete local H2 databases (will be recreated with seed data)"
      echo "  --no-demo       Disable demo mode (hides demo login button)"
      echo "  --restart-ciam  Force restart CIAM service (normally left running)"
      exit 1
      ;;
  esac
done

# --reset-db implies --restart-ciam (CIAM DB gets deleted, must restart)
if [ "$RESET_DB" = true ]; then
  RESTART_CIAM=true
fi

# Optionally reset databases
if [ "$RESET_DB" = true ]; then
  for DB_DIR in "$CRM_DB_DIR" "$CIAM_DB_DIR"; do
    if [ -d "$DB_DIR" ]; then
      echo "Deleting database at ${DB_DIR}..."
      rm -rf "$DB_DIR"
    fi
  done
  echo "Databases deleted. Will be recreated on startup."
fi

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

CIAM_STARTED_BY_US=false
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
  if [ "${CIAM_STARTED_BY_US}" = true ]; then
    echo "CIAM left running for next start."
    echo "  Hint: use --restart-ciam to force restart CIAM"
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

# --- CIAM: persistent service ---

# Kill existing CIAM if restart requested
if [ "$RESTART_CIAM" = true ]; then
  EXISTING_CIAM_PID=$(lsof -ti:8081 2>/dev/null || true)
  if [ -n "$EXISTING_CIAM_PID" ]; then
    echo "Stopping existing CIAM (PID ${EXISTING_CIAM_PID})..."
    kill "$EXISTING_CIAM_PID" 2>/dev/null || true
    sleep 2
  fi
fi

# Check if CIAM is already running
if curl -s "http://localhost:8081/.well-known/jwks.json" > /dev/null 2>&1; then
  echo "CIAM already running — reusing."
else
  # Start CIAM service (generates RSA keys on first run)
  echo "Starting CIAM service..."
  cd "${ROOT_DIR}/ciam"
  mvn spring-boot:run -Dspring-boot.run.arguments="--app.demo-mode=${DEMO_MODE}" -q &
  CIAM_STARTED_BY_US=true
  cd "${ROOT_DIR}"

  # Start frontend npm install in parallel while waiting for CIAM
  (
    cd "${ROOT_DIR}/frontend"
    if [ ! -d "node_modules" ]; then
      echo "Installing frontend dependencies (parallel)..."
      npm install
    fi
  ) &
  NPM_CHECK_PID=$!

  # Wait for CIAM to be ready
  echo "Waiting for CIAM service to start..."
  for i in $(seq 1 60); do
    if curl -s "http://localhost:8081/.well-known/jwks.json" > /dev/null 2>&1; then
      echo "CIAM service is ready!"
      break
    fi
    if [ "${i}" -eq 60 ]; then
      echo "ERROR: CIAM service failed to start within 60 seconds"
      cleanup
    fi
    sleep 1
  done

  # Wait for npm install to finish (if it was running)
  wait "${NPM_CHECK_PID}" 2>/dev/null || true
fi

# --- Backend ---

echo "Starting backend..."
cd "${ROOT_DIR}/backend"
mvn spring-boot:run -Dspring-boot.run.arguments="--app.demo-mode=${DEMO_MODE}" -Dspring-boot.run.profiles=dev -q &
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

# Install node modules if not present (may already be done in parallel above)
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
echo "CIAM:      http://localhost:8081 (persistent — survives Ctrl+C)"
echo "Backend:   http://localhost:7070 (CRM Resource Server)"
echo "Frontend:  http://localhost:7200 (live reload enabled)"
echo ""
echo "Press Ctrl+C to stop backend + frontend (CIAM stays running)"

# Wait for background processes
wait
