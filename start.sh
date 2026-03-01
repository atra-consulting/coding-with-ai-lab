#!/bin/bash
set -euo pipefail

echo "=== CRM Application Starter ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_DIR="${ROOT_DIR}/backend/data"

# Parse arguments
RESET_DB=false
DEMO_MODE=true
for arg in "$@"; do
  case "$arg" in
    --reset-db) RESET_DB=true ;;
    --no-demo) DEMO_MODE=false ;;
    *)
      echo "Usage: $0 [--reset-db] [--no-demo]"
      echo "  --reset-db  Delete local H2 database (will be recreated with seed data)"
      echo "  --no-demo   Disable demo mode (hides demo login button)"
      exit 1
      ;;
  esac
done

# Optionally reset database
if [ "$RESET_DB" = true ]; then
  if [ -d "$DB_DIR" ]; then
    echo "Deleting database at ${DB_DIR}..."
    rm -rf "$DB_DIR"
    echo "Database deleted. Will be recreated on startup."
  else
    echo "No database found at ${DB_DIR}, nothing to delete."
  fi
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

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "${BACKEND_PID}" ]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
    echo "Backend stopped"
  fi
  if [ -n "${FRONTEND_PID}" ]; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
    echo "Frontend stopped"
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend..."
cd "${ROOT_DIR}/backend"
mvn spring-boot:run -Dspring-boot.run.arguments="--app.demo-mode=${DEMO_MODE}" -Dspring-boot.run.profiles=dev &
BACKEND_PID=$!
cd "${ROOT_DIR}"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 60); do
  if curl -s "http://localhost:8080/api/firmen" > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  if [ "${i}" -eq 60 ]; then
    echo "ERROR: Backend failed to start within 60 seconds"
    cleanup
  fi
  sleep 2
done

# Start frontend
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

npx ng serve --proxy-config proxy.conf.json &
FRONTEND_PID=$!
cd "${ROOT_DIR}"

echo ""
echo "=== CRM Application Started ==="
echo "Backend:   http://localhost:8080"
echo "Frontend:  http://localhost:4200"
echo "H2 Console: http://localhost:8080/h2-console"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait