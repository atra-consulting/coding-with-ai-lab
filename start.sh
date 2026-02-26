#!/bin/bash
set -euo pipefail

echo "=== CRM Application Starter ==="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

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

# Set JAVA_HOME to Java 17 if available
if [ -d "/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home" ]; then
  export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home"
  echo "Using Java 17: $JAVA_HOME"
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
mvn spring-boot:run &
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