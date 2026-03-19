#!/usr/bin/env bash
#
# ci/run-all.sh — Run the same lint / build / test steps locally that CI runs.
# Usage: ./ci/run-all.sh [--skip-frontend] [--skip-backend] [--skip-ciam]
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

SKIP_FRONTEND=false
SKIP_BACKEND=false
SKIP_CIAM=false

for arg in "$@"; do
  case "$arg" in
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-backend)  SKIP_BACKEND=true ;;
    --skip-ciam)     SKIP_CIAM=true ;;
    *)               echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step() { echo -e "\n${BLUE}▶ $1${NC}"; }
pass() { echo -e "${GREEN}✔ $1${NC}"; }
fail() { echo -e "${RED}✖ $1${NC}"; exit 1; }

# ── CIAM ───────────────────────────────────────────────────────
if [ "$SKIP_CIAM" = false ]; then
  step "CIAM – Compile"
  (cd "$ROOT_DIR/ciam" && mvn -B clean compile -DskipTests) || fail "CIAM compile"
  pass "CIAM compile"

  step "CIAM – Test"
  (cd "$ROOT_DIR/ciam" && mvn -B test) || fail "CIAM tests"
  pass "CIAM tests"

  step "CIAM – Package"
  (cd "$ROOT_DIR/ciam" && mvn -B package -DskipTests) || fail "CIAM package"
  pass "CIAM package"
fi

# ── Backend ────────────────────────────────────────────────────
if [ "$SKIP_BACKEND" = false ]; then
  step "Backend – Compile"
  (cd "$ROOT_DIR/backend" && mvn -B clean compile -DskipTests) || fail "Backend compile"
  pass "Backend compile"

  step "Backend – Test"
  (cd "$ROOT_DIR/backend" && mvn -B test) || fail "Backend tests"
  pass "Backend tests"

  step "Backend – Package"
  (cd "$ROOT_DIR/backend" && mvn -B package -DskipTests) || fail "Backend package"
  pass "Backend package"
fi

# ── Frontend ───────────────────────────────────────────────────
if [ "$SKIP_FRONTEND" = false ]; then
  step "Frontend – Install"
  (cd "$ROOT_DIR/frontend" && npm ci) || fail "Frontend install"
  pass "Frontend install"

  step "Frontend – Lint"
  (cd "$ROOT_DIR/frontend" && npx ng lint) || fail "Frontend lint"
  pass "Frontend lint"

  step "Frontend – Build"
  (cd "$ROOT_DIR/frontend" && npx ng build) || fail "Frontend build"
  pass "Frontend build"

  step "Frontend – Test"
  (cd "$ROOT_DIR/frontend" && npx ng test --no-watch --browsers=ChromeHeadless) || fail "Frontend tests"
  pass "Frontend tests"
fi

echo -e "\n${GREEN}═══ All CI checks passed ═══${NC}"
