#!/usr/bin/env bash
#
# gh-issues-select.sh
#
# Print the issue numbers on GitHub Project board #7 that the GitHub-issue agent
# runner should process. One number per line, sorted, unique. Empty output means
# nothing to do.
#
# Selection rules (see docs/prds/PRD-GH-ISSUE-AGENT-RUNNER.md):
#   Pick an OPEN issue in atra-consulting/coding-with-ai-lab when EITHER:
#     A) it has label "Refinement needed" AND its board Status is not "Done", or
#     B) it does NOT have "Refinement needed" AND Status is "In progress" or "In review".
#   Hard exclusion (both branches): skip any issue labelled "Input needed".
#
# The two branches are a UNION, evaluated client-side after fetching the whole
# board (avoids a Cartesian label x status GraphQL query). We page manually with
# an explicit cursor because `gh api graphql --paginate` does not reliably page
# the deep organization.projectV2.items path.
#
# Requires: gh (authenticated, token with `project` + `repo`), jq.
# Environment:
#   GH_ORG             (optional) default atra-consulting
#   GH_PROJECT_NUMBER  (optional) default 7
#   GH_TARGET_REPO     (optional) default atra-consulting/coding-with-ai-lab

set -euo pipefail

GH_ORG="${GH_ORG:-atra-consulting}"
GH_PROJECT_NUMBER="${GH_PROJECT_NUMBER:-7}"
GH_TARGET_REPO="${GH_TARGET_REPO:-atra-consulting/coding-with-ai-lab}"

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh not found on PATH." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq not found on PATH." >&2; exit 1; }

read -r -d '' QUERY <<'GRAPHQL' || true
query($org: String!, $number: Int!, $cursor: String) {
  organization(login: $org) {
    projectV2(number: $number) {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          status: fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
          content {
            ... on Issue {
              number
              state
              repository { nameWithOwner }
              labels(first: 50) { nodes { name } }
            }
          }
        }
      }
    }
  }
}
GRAPHQL

# jq program: project each node, then apply the selection rules. The branch union
# is parenthesised so the "Input needed" exclusion is not absorbed by `or`.
read -r -d '' FILTER <<'JQ' || true
.data.organization.projectV2.items.nodes[]
| select(.content != null)
| {
    number: .content.number,
    state:  .content.state,
    repo:   .content.repository.nameWithOwner,
    status: (.status.name // ""),
    labels: [.content.labels.nodes[].name]
  }
| select(.state == "OPEN")
| select(.repo == $repo)
| select((.labels | index("Input needed")) | not)
| select(
    ( (.labels | index("Refinement needed")) and (.status != "Done") )
    or
    ( ((.labels | index("Refinement needed")) | not)
      and (.status == "In progress" or .status == "In review") )
  )
| .number
JQ

cursor=""
results=""
while : ; do
  if [ -z "$cursor" ]; then
    page=$(gh api graphql -f query="$QUERY" -f org="$GH_ORG" -F number="$GH_PROJECT_NUMBER") \
      || { echo "ERROR: GraphQL query failed." >&2; exit 1; }
  else
    page=$(gh api graphql -f query="$QUERY" -f org="$GH_ORG" -F number="$GH_PROJECT_NUMBER" -f cursor="$cursor") \
      || { echo "ERROR: GraphQL query failed." >&2; exit 1; }
  fi

  nums=$(printf '%s' "$page" | jq -r --arg repo "$GH_TARGET_REPO" "$FILTER")
  if [ -n "$nums" ]; then
    results="${results}${nums}"$'\n'
  fi

  has_next=$(printf '%s' "$page" | jq -r '.data.organization.projectV2.items.pageInfo.hasNextPage')
  if [ "$has_next" != "true" ]; then
    break
  fi
  cursor=$(printf '%s' "$page" | jq -r '.data.organization.projectV2.items.pageInfo.endCursor')
done

# Sorted, unique, no blank lines.
printf '%s' "$results" | grep -E '^[0-9]+$' | sort -nu || true
