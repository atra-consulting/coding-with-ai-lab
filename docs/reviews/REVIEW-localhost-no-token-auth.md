# Code Review - localhost-no-token-auth

**Date**: 2026-06-29
**Branch**: localhost-no-token-auth
**Base**: b585e939bf5feec4f0f0b46b16064d67b3df9ac7 (main at branch start)
**Files Reviewed**: 10
**Review Rounds**: 3 (max 3)

## Summary

Feature adds an opt-in localhost bypass to `requireAgentToken`. When `AGENT_AUTH_ALLOW_LOOPBACK=1` is set, requests from loopback addresses without an auth header bypass token validation. Gated behind both an env var and a forwarding-header guard. All issues found in rounds 1 and 2 were fixed; round 3 was clean.

## Review Rounds

### Round 1

**Issues found**: 7 | **Fixes applied**: 7

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | CRITICAL | `backend/.env.example` / `globalSetup.ts:56` | Docs said "never in CI" but tests set the flag in CI — contradiction | be-reviewer | Remove "or CI" from .env.example comment | direct fix | Removed "or CI" | direct fix |
| 2 | CRITICAL | `tickets.spec.ts:166` | `done` test depended on prior `GET /next` having claimed ticket 1 — fragile | be-reviewer | Use ticket 2 (TODO) for done test; use ticket 1 (IN_PROGRESS) for ask test | direct fix | Tests now use independent ticket IDs with comments | direct fix |
| 3 | WARNING | `docs/API-TASKS.md:61` | `::ffff:127.0.0.1` missing from listed bypass addresses | ba-reviewer | Add `::ffff:127.0.0.1` to docs | direct fix | Added | direct fix |
| 4 | WARNING | `docs/API-TICKETS.md:83` | Same: `::ffff:127.0.0.1` omitted | ba-reviewer | Add `::ffff:127.0.0.1` to docs | direct fix | Added | direct fix |
| 5 | WARNING | `tickets.spec.ts:177` | Test comment implied state was TODO; actual state was DONE | be-reviewer | Update comment and test to reflect real state | direct fix | Test rewritten to be state-accurate | direct fix |
| 6 | SUGGESTION | `agentTasks.spec.ts` | No test verifying bypass refused when forwarding header present | be-reviewer | Add forwarding-header rejection test | direct fix | Added test with `X-Forwarded-For: 10.0.0.1` → 401 | direct fix |
| 7 | SUGGESTION | Both API docs | Proxy-forwarding guard not documented | ba-reviewer | Add note about `X-Forwarded-For` / `X-Real-IP` / `Forwarded` refusal | direct fix | Added to both docs | direct fix |

### Round 2

**Issues found**: 2 | **Fixes applied**: 2

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 8 | SUGGESTION | `docs/API-TASKS.md`, `docs/API-TICKETS.md` | "no token header" imprecise — there are two token headers | ba-reviewer | Expand to "no `Authorization` or `X-Agent-Token` header" | direct fix | Updated both files | direct fix |
| 9 | SUGGESTION | `agentTasks.spec.ts:220` | Forwarding-header test lacked comment explaining why no reset is needed | be-reviewer | Add clarifying comment | direct fix | Comment added | direct fix |

### Round 3

Clean pass. No issues found.

## Remaining Issues

No remaining issues.

## Project Context Validation

- Follows CLAUDE.md `requireAgentToken` pattern and middleware conventions
- Uses `req.socket?.remoteAddress` (not `req.ip`) — correct given `trust proxy: 1` in app.ts
- Timing-safe token comparison preserved unchanged
- `.env.example` documents new env var with security warning

## Next Steps

- Run tests: `cd backend && npx playwright test`
- Push branch and create PR

---
Generated with Claude Code - review v1.8.2
