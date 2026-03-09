# Implementation Plan: UPDATE-REVIEWER-AGENTS

## Test Command
`echo "Manual validation - markdown files only"`

## Context

The `code-review` skill is an installed plugin (`code-review:code-review`) that reviews PRs on GitHub. It uses:
- Confidence-based scoring (0-100 scale)
- False positive filtering (threshold: 80)
- Multi-agent parallel review (5 independent reviewers)
- Structured output format
- CLAUDE.md compliance checking

The 5 reviewer agents (`ba-reviewer`, `be-reviewer`, `db-reviewer`, `fe-reviewer`, `ui-reviewer`) currently have their own review approaches but don't reference the code-review skill.

## Tasks

### 1. Update each reviewer agent to reference the code-review skill

For each of the 5 reviewer agents, add:
- A section explaining they can invoke `/code-review` for PR-based reviews
- Adoption of the confidence scoring system (0-100) for issue reporting
- False positive awareness guidelines from the code-review skill
- Structured issue format: description, confidence score, evidence

Files to modify:
- [ ] `.claude/agents/ba-reviewer.md`
- [ ] `.claude/agents/be-reviewer.md`
- [ ] `.claude/agents/db-reviewer.md`
- [ ] `.claude/agents/fe-reviewer.md`
- [ ] `.claude/agents/ui-reviewer.md`

### 2. Specific changes per file

Each agent gets a new section after existing content:

```markdown
## Code Review Skill Integration

For PR-based reviews, use the `/code-review` skill which provides automated multi-agent PR review with confidence scoring.

### Confidence Scoring

Score each issue on a 0-100 scale:
- **0**: False positive. Does not stand up to scrutiny, or is a pre-existing issue.
- **25**: Might be real, but could be false positive. Stylistic issues not in CLAUDE.md.
- **50**: Verified real issue, but may be a nitpick or not important relative to the PR.
- **75**: Highly confident. Verified real issue that will be hit in practice. Directly impacts functionality or is mentioned in CLAUDE.md.
- **100**: Absolutely certain. Confirmed real issue that will happen frequently.

Only report issues with confidence >= 50. Flag issues >= 75 as actionable.

### False Positive Awareness

Do NOT flag these as issues:
- Pre-existing issues not introduced by the change
- Issues a linter, typechecker, or compiler would catch
- Pedantic nitpicks a senior engineer wouldn't call out
- General code quality issues unless explicitly required in CLAUDE.md
- Changes in functionality that are likely intentional
- Issues on lines the author did not modify
```

### 3. Verification
- [ ] All 5 files updated
- [ ] No syntax errors in frontmatter
- [ ] Existing content preserved
- [ ] New section consistently formatted across all agents
