# Implementation Plan: UPDATE-OSM-FIRMENKARTE

## Source

Freeform user request: "Update `/Users/karsten/workspaces/fh/repos/coding-with-ai-training-materials/tasks/01-openstreetmap-firmenkarte.md`: There's no geocoding necessary anymore, the company and persons have lat/long in the DB."

## Context (verified)

- `adresse.latitude` / `adresse.longitude` columns exist (`backend/src/db/schema/schema.ts:56-57`, `backend/src/config/migrate.ts:52-53`).
- Seed fixture `backend/src/seed/fixture.json` has lat/lng on **all 100 addresses** (companies + persons). No admin geocoding run needed for seeded data.
- `/api/admin/geocode-addresses` endpoint still exists (for addresses *added via the UI* that lack coordinates) but is no longer a prerequisite for the workshop task.
- Target file currently:
  - Line 10: mentions `(Admin-Geokodierung)` as the source of coords.
  - Line 31 (Troubleshooting): tells students to run `/admin/geocoding` first when a company has no coordinates.

## Test Command

`none` — documentation-only change. Verification is manual: read the updated file end-to-end, confirm no stale references and no broken prose.

## Tasks

### 1. Edit `tasks/01-openstreetmap-firmenkarte.md`

- [ ] Update the "Ziel" paragraph (lines 7–10): drop the `(Admin-Geokodierung)` parenthetical. Replace with language that says the seed data ships with coordinates, so markers render immediately.
- [ ] Simplify the prompt (line 15) if it implicitly assumes a geocoding step — the current prompt text does not mention geocoding, so likely no change, but verify.
- [ ] Rework the "Firma hat keine Koordinaten" troubleshooting row (line 31): coords are seeded now, so the row should be either removed or rewritten for the edge case where a student manually adds a new address through the UI without coords. Keep the row for educational value but reframe: "For addresses you add manually through the UI, coords may be missing — only render markers where `latitude` AND `longitude` are set. Skip others."
- [ ] Sanity-check the rest of the file: "Erwartetes Ergebnis", "Diskussionspunkte" — no changes expected, but re-read to be sure.

### 2. Verification

- [ ] Re-read the whole file top-to-bottom. Prose flows, no dangling references to `/admin/geocoding` as a prerequisite.
- [ ] Grep the file for `geokod`, `geocod`, `Admin-Geo` — any remaining hits must be intentional (e.g., the reframed troubleshooting row can still mention missing coords without requiring admin action).

### 3. Commit

- [ ] Commit in `coding-with-ai-training-materials` on branch `update-osm-firmenkarte-remove-geocoding` with message `docs: Remove geocoding prerequisite from OSM Firmenkarte task. UPDATE-OSM-FIRMENKARTE`.

## Out of scope

- The lab's `/admin/geocoding` feature itself (backend routes, service, tests) stays untouched — still relevant for new, non-seeded addresses.
- Other task files (`02-…` through `10-…`) — not mentioned in the request.
- The lab repo `coding-with-ai-lab` — only a state file lives here, not committed to main.
