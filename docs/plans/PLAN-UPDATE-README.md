# Implementation Plan: UPDATE-README

## Test Command
`cd frontend && npx ng build`

(Documentation-only change. Build check confirms no accidental breakage.)

## Summary of Changes

The README.md is outdated. It describes:
- Spring Boot 3.5.3 / Java 21 / Kotlin CIAM microservice — **gone**
- H2 databases — **now SQLite**
- Angular 20 — **now Angular 21**
- Ports 8080/8081/4200 — **now 7070/7200**
- Java/Maven prerequisites — **now Node.js only**
- `ciam/` folder — **gone**
- Old demo users (only 1) — **now 3 users**
- Old `start.bat` references Java — **needs update**
- Missing: Node.js installation on Mac/Windows/Linux

## Tasks

### 1. Rewrite README.md

- [ ] Update tech stack table: Node.js/TypeScript backend (Express + Drizzle ORM), Angular 21, SQLite, Bootstrap 5
- [ ] Remove CIAM microservice from architecture diagram and description
- [ ] Simplify architecture to single backend + frontend
- [ ] Update Schnellstart section: only Node.js 20.19+ required, correct ports (7070, 7200)
- [ ] Add Node.js installation instructions for Mac, Windows, Linux
- [ ] Update URL table (7070 backend, 7200 frontend, no H2 console, no CIAM)
- [ ] Update demo login table: 3 users (admin/admin123, user/test123, demo/demo1234)
- [ ] Update start script flags: only `--reset-db` (remove `--no-demo`)
- [ ] Update "Einzeln starten" section: backend via `npx tsx`, frontend via `npx ng serve`
- [ ] Update Projektstruktur: remove `ciam/`, show `backend/` with Node.js/TypeScript structure
- [ ] Update Domänenmodell if needed
- [ ] Update Features: remove JWT/CIAM references, note session-based auth
- [ ] Update Backend-Patterns: Drizzle schema, Express routes, middleware
- [ ] Update Frontend-Patterns: Angular 21 standalone components
- [ ] Keep language in German (matching existing style)

### 2. Verification
- [ ] Run frontend build to confirm no breakage
- [ ] Visual review of README for accuracy
