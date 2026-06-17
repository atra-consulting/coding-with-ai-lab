#!/usr/bin/env bash
#
# solve-gh-board-issues.sh
#
# Local equivalent of the "Drain selected board issues" step in
# .github/workflows/agent-issue-runner.yml. Selects matching issues from GitHub
# Project board #7 and runs the agent-gh-board prompt against each, one at a time.
#
# For each issue Claude decides solve or pause:
#   - solvable -> sets Status "In progress", runs plan-and-do, merges, sets "Done"
#   - pause    -> adds "Input needed" + a comment, leaves it for a human
#
# Local use only. Requires Claude Code on PATH and gh authenticated.
#
# Environment:
#   GH_TOKEN                 (required) PAT with `project` + `repo`
#   CLAUDE_CODE_OAUTH_TOKEN  (required, or ANTHROPIC_API_KEY) so `claude -p` can authenticate
#   MAX_ISSUES_PER_RUN       (optional) per-run cap, default 10

set -uo pipefail

MAX_ISSUES_PER_RUN="${MAX_ISSUES_PER_RUN:-10}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPT="${SCRIPT_DIR}/.claude/prompts/agent-gh-board.md"

if [ -z "${GH_TOKEN:-}" ]; then
  echo "ERROR: GH_TOKEN is not set (PAT with project + repo)." >&2
  exit 1
fi
if [ -z "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: set CLAUDE_CODE_OAUTH_TOKEN (from 'claude setup-token') or ANTHROPIC_API_KEY for 'claude -p'." >&2
  exit 1
fi

ISSUES=$("${SCRIPT_DIR}/scripts/gh-issues-select.sh") || {
  echo "Selection script failed." >&2
  exit 1
}

if [ -z "$ISSUES" ]; then
  echo "No matching issues on board #7."
  exit 0
fi

TOTAL=$(printf '%s\n' "$ISSUES" | grep -cE '^[0-9]+$')
echo "Selected ${TOTAL} issue(s). Cap is ${MAX_ISSUES_PER_RUN} per run."

SOLVED=0; PAUSED=0; SKIPPED=0; DEFERRED=0; FAILED=0
i=0
while IFS= read -r n; do
  [ -n "$n" ] || continue
  i=$((i + 1))
  if [ "$i" -gt "$MAX_ISSUES_PER_RUN" ]; then
    DEFERRED=$((DEFERRED + 1))
    continue
  fi
  echo ""
  echo "=================================================================="
  echo " Issue #${n}  (${i}/${TOTAL})"
  echo "=================================================================="

  output=$(ISSUE_NUMBER="$n" claude -p "$(cat "$PROMPT")" --dangerously-skip-permissions 2>&1) || {
    echo "$output"
    echo "  claude run failed for #${n}; continuing." >&2
    FAILED=$((FAILED + 1))
    continue
  }
  echo "$output"

  if   printf '%s' "$output" | grep -qE '^SOLVED: '; then SOLVED=$((SOLVED + 1))
  elif printf '%s' "$output" | grep -qE '^PAUSED: '; then PAUSED=$((PAUSED + 1))
  elif printf '%s' "$output" | grep -qE '^SKIP: ';   then SKIPPED=$((SKIPPED + 1))
  fi
done <<< "$ISSUES"

[ "$DEFERRED" -gt 0 ] && echo "Deferred ${DEFERRED} issue(s) over the cap."
echo ""
echo "Summary: solved=${SOLVED} paused=${PAUSED} skipped=${SKIPPED} deferred=${DEFERRED} failed=${FAILED}"
[ "$FAILED" -gt 0 ] && echo "WARNING: ${FAILED} issue(s) failed to run (see output above)." >&2
exit 0
