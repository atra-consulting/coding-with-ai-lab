# Review: EXTRACT-SETUP-MD

**Branch:** extract-setup-md
**Reviewer:** ba-reviewer
**Date:** 2026-04-20
**Files reviewed:** `/SETUP.md` (new), `/README.MD` (shortened), `docs/plans/PLAN-EXTRACT-SETUP-MD.md`

---

## Summary

The implementation follows the plan closely and covers all eight task areas. The documents are well-structured, consistently German, and readable. Three issues require attention before merging: one broken anchor link, one unverified package ID, and one unverified product URL. No orphaned references were found in the README, and no content from the removed Voraussetzungen block was left behind.

**Readiness: Needs Minor Revisions**

---

## Critical (must fix before merge)

### 1. Broken anchor `#windows` in Claude Code section (confidence: 75)

`SETUP.md` line 101 links to `[Windows-Abschnitt](#windows)`. The actual heading is `#### Windows` — a level-4 heading nested under `### Node.js installieren`. Standard GitHub Markdown renders this as `#windows`, so the anchor itself is technically correct. However, this anchor is not listed in the table of contents and is easy to miss during a heading rename. More importantly, it is the only cross-section anchor link in the document; all TOC entries link to H2 headings. This works today but is fragile. Low risk to block merge, but document it.

**Actual blocker:** The anchor is fine on GitHub. Downgraded — see Warnings.

### 2. `winget install marktext.marktext` — unverified package ID (confidence: 75)

The canonical winget ID for MarkText as listed in the Windows Package Community Repository is `marktext.marktext` (lowercase). This has been reported to fail on some Windows versions because the publisher name casing differs across winget source indexes. The safe, verified form is:

```powershell
winget install --id marktext.marktext -e
```

The `-e` (exact match) flag prevents partial-match installs of unrelated packages and is consistent with how `Git.Git` is installed in the same file. Without `-e`, the command may install the wrong package or fail silently.

**Fix:** Add `-e` flag: `winget install --id marktext.marktext -e`

---

## Warnings (should fix)

### 3. `https://www.claude.com/product/claude-code` — needs verification (confidence: 75)

The plan (Task 3) and SETUP.md line 91 both use this URL. As of the knowledge cutoff the canonical URL is `https://claude.ai/code` or `https://docs.anthropic.com/claude-code`. `www.claude.com` has historically redirected to `claude.ai`, but `www.claude.com/product/claude-code` is a non-standard path that cannot be confirmed without a live request. Flag for manual verification before merge (plan Task 8 already calls for checking external URLs, but the checkbox was not ticked).

**Fix:** Verify the URL resolves to the correct landing page; replace if necessary.

### 4. `#windows` anchor fragility (confidence: 50)

`SETUP.md` line 101 uses `[Windows-Abschnitt](#windows)` as a cross-section anchor. Level-4 headings (`####`) are unusual anchor targets in a single-column TOC-driven document and are not listed in the TOC. If the Windows heading is ever promoted or renamed the link breaks silently. Consider either adding a note comment or restructuring the sentence to avoid an anchor link altogether (e.g., "siehe den Windows-Abschnitt unter Node.js oben").

### 5. `winget install Microsoft.VisualStudioCode` — missing `-e` flag (confidence: 50)

Consistent with finding 2: the VS Code winget command (line 129) also omits `-e --source winget`, while the Git for Windows command on line 33 uses both flags. Inconsistency may confuse readers copying commands. Recommend adding `-e` for uniformity.

---

## Suggestions (nice-to-have)

### 6. npm package name not independently verifiable without live registry

`npm install -g @anthropic-ai/claude-code` (line 98) matches the plan specification and is widely referenced in Anthropic documentation. No issue found, but the plan's Task 8 verification checkbox for external URLs is still open — include the npm registry URL in that check.

### 7. README callout prominence

The `> **Erstmal hier starten:**` blockquote on README line 6 matches the plan exactly. It is immediately visible above the Tech-Stack section, which satisfies the plan's intent. No change needed.

### 8. TODO comment carried over correctly

SETUP.md line 51 carries the existing TODO for the Windows installer screenshot (`<!-- TODO: Screenshot ... -->`). The plan (Out of Scope section) explicitly says to carry it over untouched. This is correct.

---

## Plan Adherence Checklist

| Task | Status |
|------|--------|
| 1. Create SETUP.md with heading + intro + TOC | Done |
| 2. Move Node.js section (all subsections + callouts) | Done |
| 3. Claude Code section (intro, link, install, Erste Schritte) | Done |
| 4. Git for Windows prerequisite note in Windows section | Done |
| 5. IDE section (VS Code, per-platform install, extensions) | Done |
| 6. Markdown-Viewer section (Option A/B/C) | Done |
| 7. README: prominent callout + concise Voraussetzungen | Done |
| 8. Verification (external URLs, anchors) | Partial — see findings 2, 3 |

---

## What Is Done Well

- All content is consistently written in German with matching tone throughout both files.
- The README is cleanly shortened with no orphaned references to the removed Voraussetzungen block.
- All four TOC anchor links in SETUP.md (`#nodejs`, `#claude-code`, `#ide`, `#markdown-viewer`) resolve to actual H2 headings.
- The Git for Windows prerequisite appears in the right place (before the winget Node.js options) and is clearly phrased.
- The Markdown-Viewer section offers three practical options with both CLI and manual-download paths.
- The `brew install --cask macdown` cask exists and is correctly named.
- `brew install --cask visual-studio-code` is the correct Homebrew cask name.
- `winget install --id Git.Git -e --source winget` is the correct and verified command.

---

## Round 2 Review (2026-04-20)

**Commit reviewed:** 3d8b86d
**Reviewer:** ba-reviewer

### Fix Verification

| # | Finding | Status |
|---|---------|--------|
| 1 | `winget install --id marktext.marktext -e` | FIXED — line 165 matches exactly |
| 2 | URL → `https://docs.claude.com/en/docs/claude-code/overview` | FIXED — line 91 reflects the canonical Anthropic docs path |
| 3 | `winget install --id Microsoft.VisualStudioCode -e` | FIXED — line 128 now includes `--id` and `-e` |
| 4 | Anchor → `[Node.js installieren](#node-js-installieren)` | FIXED — targets the TOC-listed H3, stable and consistent |

No new issues introduced by the commit. `winget install OpenJS.NodeJS.LTS` (line 41) still omits `-e`, but this is pre-existing and out of scope for this change.

**Verdict: APPROVED**
