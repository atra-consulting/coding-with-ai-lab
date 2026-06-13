#!/usr/bin/env bash
#
# solve-all-agent-tasks.sh
#
# Walk every agent-task data source and let Claude Code attempt each open task,
# one at a time, until that source's queue is empty (/next returns HTTP 204).
#
# For each task Claude decides accept or reject:
#   - doable  -> runs the plan-and-do skill, creates a branch/PR, merges, calls /done
#   - reject  -> calls /reject with a comment and stops
#
# Local use only. Requires a running app (./start.sh) and Claude Code on PATH.
#
# Environment:
#   AGENT_API_TOKEN    (required) shared secret for the agent API
#   ANTHROPIC_API_KEY  (required) so `claude -p` can call the Anthropic API
#   APP_BASE_URL       (optional) default http://localhost:7070
#   MAX_PER_SOURCE     (optional) safety cap on iterations per source, default 10

set -euo pipefail

APP_BASE_URL="${APP_BASE_URL:-http://localhost:7070}"
MAX_PER_SOURCE="${MAX_PER_SOURCE:-10}"

if [ -z "${AGENT_API_TOKEN:-}" ]; then
  echo "ERROR: AGENT_API_TOKEN is not set." >&2
  exit 1
fi
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set (needed by 'claude -p')." >&2
  exit 1
fi

# source enum value  ->  prompt file suffix
SOURCES=("EMAIL:email" "GITHUB_ISSUE:github-issue" "APP_LOG:app-log" "ERROR_REPORT:error-report")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for entry in "${SOURCES[@]}"; do
  SOURCE="${entry%%:*}"
  SUFFIX="${entry##*:}"
  PROMPT="${SCRIPT_DIR}/.claude/prompts/agent-${SUFFIX}.md"

  echo ""
  echo "=================================================================="
  echo " Source: ${SOURCE}   (prompt: .claude/prompts/agent-${SUFFIX}.md)"
  echo "=================================================================="

  if [ ! -f "$PROMPT" ]; then
    echo "  Prompt file missing, skipping: $PROMPT" >&2
    continue
  fi

  # Run the prompt repeatedly. The prompt itself fetches (and claims) the next
  # open task, then works it. When the queue is empty it fetches a 204 and prints
  # "No open <SOURCE> tasks." — we watch for that sentinel to stop. We never call
  # /next from the script, so there is no double-claim.
  i=0
  while [ "$i" -lt "$MAX_PER_SOURCE" ]; do
    i=$((i + 1))
    echo "  [${SOURCE} #${i}] Running prompt..."

    output=$(claude -p "$(cat "$PROMPT")" --dangerously-skip-permissions 2>&1) || {
      echo "$output"
      echo "  claude run failed for ${SOURCE}; stopping this source." >&2
      break
    }
    echo "$output"

    if printf '%s' "$output" | grep -q "No open ${SOURCE} tasks"; then
      echo "  Queue for ${SOURCE} is empty."
      break
    fi
  done
done

echo ""
echo "Done. Check the dashboard summary at ${APP_BASE_URL%/}  (frontend on :7200)."
echo "Expected end state: every task DONE or REJECTED."
