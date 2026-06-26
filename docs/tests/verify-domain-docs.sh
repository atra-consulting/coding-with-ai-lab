#!/usr/bin/env bash
# Verify the business-domain docs (DOCUMENT-BUSINESS-DOMAIN).
# Checks: DOMAIN.md exists, links resolve, 18 domain agents wired, 6 tooling agents not,
# indexes register it, and enum facts match SPECS-database.md.
set -u
cd "$(dirname "$0")/../.." || { echo "ERROR: cannot cd to repo root" >&2; exit 2; }
fail=0
ok()   { echo "PASS: $1"; }
bad()  { echo "FAIL: $1"; fail=1; }

DOMAIN="docs/specs/DOMAIN.md"

# 1. File exists
domain_exists=0
if [ -f "$DOMAIN" ]; then ok "DOMAIN.md exists"; domain_exists=1; else bad "DOMAIN.md missing"; fi

# 2. Links resolve
[ -f "docs/specs/SPECS-database.md" ] && ok "SPECS-database.md link target exists" || bad "SPECS-database.md missing"
[ -f "docs/API-TASKS.md" ] && ok "API-TASKS.md link target exists" || bad "API-TASKS.md missing"

# 3. 18 domain-bound agents reference DOMAIN.md
domain_agents=(admin ba-writer ba-reviewer md-reader be-coder be-reviewer db-coder db-reviewer \
  fe-coder fe-reviewer ui-designer ui-reviewer be-test-coder be-test-reviewer be-test-runner \
  fe-test-coder fe-test-reviewer fe-test-runner)
n=0
for a in "${domain_agents[@]}"; do
  if grep -q 'docs/specs/DOMAIN.md' ".claude/agents/$a.md" 2>/dev/null; then n=$((n+1)); else bad "$a does not reference DOMAIN.md"; fi
done
[ "$n" -eq 18 ] && ok "all 18 domain-bound agents reference DOMAIN.md" || bad "only $n/18 domain agents wired"

# 4. 6 tooling agents must NOT reference DOMAIN.md
tooling_ok=1
for a in python-coder python-reviewer shell-coder shell-reviewer skill-coder skill-reviewer; do
  if grep -q 'DOMAIN.md' ".claude/agents/$a.md" 2>/dev/null; then bad "tooling agent $a references DOMAIN.md"; tooling_ok=0; fi
done
[ "$tooling_ok" -eq 1 ] && ok "all 6 tooling agents correctly omit DOMAIN.md"

# 5. No duplicate reference lines
for f in .claude/agents/*.md; do
  c=$(grep -c 'docs/specs/DOMAIN.md' "$f")
  [ "$c" -gt 1 ] && bad "duplicate DOMAIN.md line in $f"
done

# 6. Indexes register DOMAIN.md
grep -q 'DOMAIN.md' docs/specs/SPECS.md && ok "SPECS.md registers DOMAIN.md" || bad "SPECS.md missing DOMAIN.md row"
grep -q 'docs/specs/DOMAIN.md' CLAUDE.md && ok "CLAUDE.md registers DOMAIN.md" || bad "CLAUDE.md missing DOMAIN.md row"

# 7. Enum facts present and in order (only if DOMAIN.md exists)
if [ "$domain_exists" -eq 1 ]; then
  grep -q 'NEU.*QUALIFIZIERT.*ANGEBOT.*VERHANDLUNG.*GEWONNEN.*VERLOREN' "$DOMAIN" \
    && ok "Chance phases present in order" || bad "Chance phase order missing/wrong"
  typ_ok=1
  for t in ANRUF EMAIL MEETING NOTIZ AUFGABE; do
    grep -q "$t" "$DOMAIN" || { bad "AktivitaetTyp $t missing from DOMAIN.md"; typ_ok=0; }
  done
  [ "$typ_ok" -eq 1 ] && ok "all AktivitaetTyp values present"
else
  bad "skipped enum checks — DOMAIN.md missing"
fi

echo "----"
[ "$fail" -eq 0 ] && echo "ALL CHECKS PASSED" || echo "SOME CHECKS FAILED"
exit "$fail"
