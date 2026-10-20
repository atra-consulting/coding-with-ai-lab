#!/usr/bin/env bash
#
# sync-issues.sh — reconcile the agent-factory workshop task specs with GitHub issues.
#
# Reads every spec in aufgaben/agent-factory/issues/*.md (except README.md) and makes sure an
# OPEN issue with the same title exists on the lab repo. Missing ones get
# created with their labels and added to the "Coding with AI:
# Fortgeschrittenen-Schulung" Kanban board. Idempotent: run before every workshop.
#
# Usage:
#   bash aufgaben/agent-factory/issues/sync-issues.sh            # create missing issues
#   bash aufgaben/agent-factory/issues/sync-issues.sh --dry-run  # show actions, change nothing
#
# Requires: gh CLI, authenticated with access to the lab repo. Adding issues to
# the board needs the 'project' scope: gh auth refresh -s project

set -eo pipefail

REPO="atra-consulting/coding-with-ai-lab"
# Newly created issues are added to this org-level Kanban board (Projects v2).
# https://github.com/orgs/atra-consulting/projects/7
PROJECT="Coding with AI: Fortgeschrittenen-Schulung"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DRY_RUN=0
case "${1:-}" in
  --dry-run) DRY_RUN=1 ;;
  -h|--help)
    grep '^#' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  "") ;;
  *) echo "Unknown option: $1 (use --dry-run or --help)" >&2; exit 2 ;;
esac

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh CLI not found." >&2; exit 1; }

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

# --- 1. Ensure labels exist -------------------------------------------------
ensure_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list --repo "$REPO" --limit 200 --json name -q '.[].name' | grep -qxF "$name"; then
    echo "label OK: $name"
  else
    run gh label create "$name" --repo "$REPO" --color "$color" --description "$desc"
    [[ $DRY_RUN -eq 0 ]] && echo "label created: $name"
  fi
}

echo "== Labels =="
ensure_label "Refinement needed" "fbca04" "GitHub Claude Code picks this up to refine and solve."
ensure_label "Likely to fail" "e4e669" "Probably too vague or too large — likely won't work out."
ensure_label "Will ask" "c5def5" "Spec designed so Claude Code must ask for input before coding."
ensure_label "Input needed" "1d76db" "Claude Code applies this when it asks a question and waits for an answer."

# --- 2. Fetch open issue titles --------------------------------------------
OPEN_FILE="$(mktemp)"
trap 'rm -f "$OPEN_FILE"' EXIT
gh issue list --repo "$REPO" --state open --limit 500 --json title -q '.[].title' > "$OPEN_FILE"

title_is_open() { grep -qxF "$1" "$OPEN_FILE"; }

# --- 3. Reconcile specs -----------------------------------------------------
echo
echo "== Issues =="
created=0
existing=0
for f in "$SCRIPT_DIR"/*.md; do
  [[ -e "$f" ]] || continue
  [[ "$(basename "$f")" == "README.md" ]] && continue

  title="$(awk '/^---$/{c++; next} c==1 && /^title:/{sub(/^title:[[:space:]]*/,""); print; exit}' "$f")"
  labels_line="$(awk '/^---$/{c++; next} c==1 && /^labels:/{sub(/^labels:[[:space:]]*/,""); print; exit}' "$f")"
  body="$(awk 'flag{print} /^---$/{c++; if(c==2) flag=1}' "$f")"

  if [[ -z "$title" ]]; then
    echo "SKIP (no title): $(basename "$f")" >&2
    continue
  fi

  if title_is_open "$title"; then
    echo "OK (open): $title"
    existing=$((existing + 1))
    continue
  fi

  # Build --label args from the comma-separated labels line.
  label_args=()
  IFS=',' read -ra _labels <<< "$labels_line"
  for l in "${_labels[@]}"; do
    l="$(echo "$l" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
    [[ -n "$l" ]] && label_args+=(--label "$l")
  done

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] would create: $title  [labels: $labels_line]  [board: $PROJECT]"
  else
    gh issue create --repo "$REPO" --title "$title" --body "$body" \
      --project "$PROJECT" "${label_args[@]}"
    echo "created: $title  (added to board: $PROJECT)"
  fi
  created=$((created + 1))
done

echo
echo "== Summary =="
echo "already open: $existing"
if [[ $DRY_RUN -eq 1 ]]; then
  echo "would create: $created"
else
  echo "created:      $created"
fi
