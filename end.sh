#!/bin/bash
set -u

echo "=== CRM Application Stopper ==="

BACKEND_PORT=7070
FRONTEND_PORT=7200

stop_port() {
  local port="$1"
  local label="$2"

  if ! command -v lsof &> /dev/null; then
    echo "ERROR: lsof is not installed; cannot find processes by port."
    return 1
  fi

  local pids
  pids=$(lsof -ti ":${port}" 2>/dev/null || true)

  if [ -z "$pids" ]; then
    echo "${label} (port ${port}): not running"
    return 0
  fi

  echo "${label} (port ${port}): stopping PID(s) ${pids}"
  # Try graceful shutdown first, then force if still running.
  echo "$pids" | xargs kill 2>/dev/null || true
  sleep 1
  pids=$(lsof -ti ":${port}" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "${label} (port ${port}): forcing kill of PID(s) ${pids}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
  echo "${label} stopped"
}

stop_port "${FRONTEND_PORT}" "Frontend"
stop_port "${BACKEND_PORT}"  "Backend"

echo ""
echo "=== CRM Application Stopped ==="
