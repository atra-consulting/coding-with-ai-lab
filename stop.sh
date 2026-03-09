#!/bin/bash
set -euo pipefail

echo "=== CRM Application Stop ==="

CIAM_PIDS=$(lsof -ti:8081 2>/dev/null) || true

if [ -z "$CIAM_PIDS" ]; then
  echo "CIAM is not running."
  exit 0
fi

echo "Stopping CIAM (PIDs: $(echo $CIAM_PIDS | tr '\n' ' '))..."
echo "$CIAM_PIDS" | xargs kill 2>/dev/null || true

# Wait until port is free
for i in $(seq 1 10); do
  lsof -ti:8081 > /dev/null 2>&1 || break
  if [ "$i" -eq 10 ]; then
    echo "WARNING: CIAM still running after 10s. Try: kill -9 $(lsof -ti:8081 2>/dev/null)"
    exit 1
  fi
  sleep 1
done

echo "CIAM stopped."
