#!/usr/bin/env bash
#
# gh-issue-status.sh
#
# Read or write the board Status of an issue on GitHub Project board #7.
# The board Status is a Projects v2 single-select field — it is NOT part of the
# normal issue JSON, so the agent prompt uses this helper to see and set it.
#
# Usage:
#   gh-issue-status.sh get <issue-number>
#   gh-issue-status.sh set <issue-number> "<status-name>"
#
# Status names: Backlog | Ready | In progress | In review | Done
#
# `set` is idempotent: setting the status it already has is a no-op success.
#
# Requires: gh (token with `project` + `repo`), jq.
# Environment:
#   GH_ORG             (optional) default atra-consulting
#   GH_PROJECT_NUMBER  (optional) default 7

set -euo pipefail

GH_ORG="${GH_ORG:-atra-consulting}"
GH_PROJECT_NUMBER="${GH_PROJECT_NUMBER:-7}"

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh not found on PATH." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq not found on PATH." >&2; exit 1; }

usage() {
  echo "Usage: $0 get <issue-number>" >&2
  echo "       $0 set <issue-number> \"<status-name>\"" >&2
  exit 2
}

CMD="${1:-}"
ISSUE="${2:-}"
[ -n "$CMD" ] && [ -n "$ISSUE" ] || usage
case "$ISSUE" in *[!0-9]*|'') echo "ERROR: issue number must be numeric." >&2; exit 2;; esac

# Resolve the project item id and the issue's current Status by paging the board.
# Echoes "<itemId>\t<statusName>" or empty if the issue is not on the board.
find_item() {
  local cursor="" page nodes hit
  read -r -d '' ITEM_QUERY <<'GRAPHQL' || true
query($org: String!, $number: Int!, $cursor: String) {
  organization(login: $org) {
    projectV2(number: $number) {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          status: fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
          content { ... on Issue { number } }
        }
      }
    }
  }
}
GRAPHQL
  while : ; do
    if [ -z "$cursor" ]; then
      page=$(gh api graphql -f query="$ITEM_QUERY" -f org="$GH_ORG" -F number="$GH_PROJECT_NUMBER") \
        || { echo "ERROR: GraphQL item query failed." >&2; exit 1; }
    else
      page=$(gh api graphql -f query="$ITEM_QUERY" -f org="$GH_ORG" -F number="$GH_PROJECT_NUMBER" -f cursor="$cursor") \
        || { echo "ERROR: GraphQL item query failed." >&2; exit 1; }
    fi
    hit=$(printf '%s' "$page" | jq -r --argjson n "$ISSUE" '
      .data.organization.projectV2.items.nodes[]
      | select(.content != null and .content.number == $n)
      | "\(.id)\t\(.status.name // "")"' | head -n1)
    if [ -n "$hit" ]; then
      printf '%s' "$hit"
      return 0
    fi
    has_next=$(printf '%s' "$page" | jq -r '.data.organization.projectV2.items.pageInfo.hasNextPage')
    [ "$has_next" = "true" ] || break
    cursor=$(printf '%s' "$page" | jq -r '.data.organization.projectV2.items.pageInfo.endCursor')
  done
  return 0
}

case "$CMD" in
  get)
    hit="$(find_item)"
    [ -n "$hit" ] || { echo "ERROR: issue #$ISSUE is not on project #$GH_PROJECT_NUMBER." >&2; exit 1; }
    printf '%s\n' "${hit#*$'\t'}"
    ;;

  set)
    STATUS="${3:-}"
    [ -n "$STATUS" ] || usage

    hit="$(find_item)"
    [ -n "$hit" ] || { echo "ERROR: issue #$ISSUE is not on project #$GH_PROJECT_NUMBER." >&2; exit 1; }
    ITEM_ID="${hit%%$'\t'*}"
    CURRENT="${hit#*$'\t'}"

    if [ "$CURRENT" = "$STATUS" ]; then
      echo "Status of #$ISSUE already '$STATUS' (no change)."
      exit 0
    fi

    # Resolve project id, Status field id, and the option id for the target name.
    read -r -d '' FIELD_QUERY <<'GRAPHQL' || true
query($org: String!, $number: Int!) {
  organization(login: $org) {
    projectV2(number: $number) {
      id
      field(name: "Status") {
        ... on ProjectV2SingleSelectField { id options { id name } }
      }
    }
  }
}
GRAPHQL
    field_json=$(gh api graphql -f query="$FIELD_QUERY" -f org="$GH_ORG" -F number="$GH_PROJECT_NUMBER") \
      || { echo "ERROR: GraphQL field query failed." >&2; exit 1; }

    PROJECT_ID=$(printf '%s' "$field_json" | jq -r '.data.organization.projectV2.id')
    FIELD_ID=$(printf '%s' "$field_json" | jq -r '.data.organization.projectV2.field.id')
    OPTION_ID=$(printf '%s' "$field_json" | jq -r --arg s "$STATUS" \
      '.data.organization.projectV2.field.options[] | select(.name == $s) | .id')

    if [ -z "$OPTION_ID" ] || [ "$OPTION_ID" = "null" ]; then
      valid=$(printf '%s' "$field_json" | jq -r '[.data.organization.projectV2.field.options[].name] | join(", ")')
      echo "ERROR: unknown status '$STATUS'. Valid: $valid" >&2
      exit 2
    fi

    read -r -d '' MUTATION <<'GRAPHQL' || true
mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project, itemId: $item, fieldId: $field,
    value: { singleSelectOptionId: $option }
  }) { projectV2Item { id } }
}
GRAPHQL
    gh api graphql -f query="$MUTATION" \
      -f project="$PROJECT_ID" -f item="$ITEM_ID" -f field="$FIELD_ID" -f option="$OPTION_ID" \
      >/dev/null || { echo "ERROR: status mutation failed for #$ISSUE." >&2; exit 1; }

    echo "Status of #$ISSUE set to '$STATUS'."
    ;;

  *)
    usage
    ;;
esac
