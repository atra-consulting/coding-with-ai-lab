# Implementation Plan: FIX-STARTSH-CLEANUP

## Problem

`./start.sh` does not stop the backend (and sometimes the frontend) when the user presses Ctrl+C. The next run fails with:

```
Error: listen EADDRINUSE: address already in use :::7070
```

## Root Cause

`start.sh` launches the backend with:

```bash
npx tsx --watch src/index.ts &
BACKEND_PID=$!
```

`$BACKEND_PID` is the **npx** PID. npx spawns tsx, tsx spawns node. When the trap runs `kill $BACKEND_PID`, only npx dies. tsx and node live on as orphans.

Even a port-based sweep (kill whoever listens on 7070) is not enough on its own: `tsx --watch` **respawns** the node child as soon as it exits, so the port comes back within milliseconds. We must kill the watcher itself, not just the port-bound child.

The user's log proves this: on the next run, the health check returns 200 against the **orphan** backend, so the script prints "Backend is ready!" — then the fresh backend hits EADDRINUSE. The migrations and seeder lines that appear late in the log belong to the *new* backend, which exits seconds later.

The same issue affects `npx ng serve` for the frontend (though it tends to be less aggressive about respawning).

Windows (`start.bat` / `end.bat`) has the same problem — `netstat` + `taskkill /f /pid` kills the node child, and tsx respawns it.

## Test Command

No automated suite covers shell scripts. Verification is manual:

```bash
./start.sh          # start app
# wait for "Press Ctrl+C to stop", then Ctrl+C
lsof -i :7070 -i :7200   # expect no output
./start.sh          # second run must start cleanly, no EADDRINUSE
```

## Tasks

### 1. Fix `start.sh` cleanup

- [x] Add a `kill_tree` helper that walks `pgrep -P` recursively and TERMs parent-before-children (so watchers stop respawning before we touch their children).
- [x] Call `kill_tree "$BACKEND_PID"` and `kill_tree "$FRONTEND_PID"` first in `cleanup()`.
- [x] Keep the port-based `stop_port` sweep as a safety net for grandchildren or late respawns.
- [x] Stop frontend before backend (user-facing first) — already the current order.
- [x] Add `cleaned_up` guard so cleanup is idempotent (SIGINT + EXIT both fire).

### 2. Add pre-flight port check

- [x] Before starting the backend, check if port 7070 is already in use. If yes, print a clear message and exit with code 1.
- [x] Do the same for port 7200 before starting the frontend.

### 3. Handle EXIT trap

- [x] Add `EXIT` to the trap list so cleanup also runs when the shell exits for any reason (not just SIGINT/SIGTERM).

### 4. Apply the same fix to `start.bat` / `end.bat`

- [x] Parameterise `BACKEND_PORT` / `FRONTEND_PORT` at the top of `start.bat`.
- [x] Add pre-flight port check in `start.bat` (same message as `start.sh`, points at `end.bat`).
- [x] In `start.bat` `:cleanup` and in `end.bat`, kill watcher processes by command-line match (`tsx --watch src/index.ts` / `ng serve ... 7200`) via PowerShell `Get-CimInstance Win32_Process` + `Stop-Process` **before** the port sweep.
- [x] Use `taskkill /t /f /pid` (tree-kill flag) in the port sweep on Windows.

### 5. Verification

- [ ] Run `./start.sh`, confirm backend and frontend start, press Ctrl+C.
- [ ] Run `lsof -i :7070 -i :7200` → must be empty.
- [ ] Run `./start.sh` a second time → must start cleanly with no EADDRINUSE.
- [ ] Run `./start.sh` once while another instance is already running → must refuse with the pre-flight error.
- [ ] `.bat` verification: left to Windows users (we cannot run Windows batch from macOS).

## Non-Goals

- Not rewriting `end.sh` — already port-based and works.
- Not adding automated tests — shell-script cleanup is validated manually.
- Not introducing a dependency on `setsid`, `pkill -g`, or other non-portable process-group mechanisms.
