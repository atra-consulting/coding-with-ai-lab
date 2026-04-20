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

`$BACKEND_PID` is the **npx** PID. npx spawns tsx, tsx spawns node. When the trap runs `kill $BACKEND_PID`, only npx dies. tsx and node live on as orphans, still bound to port 7070.

The user's log proves this: on the next run, the health check returns 200 against the **orphan** backend, so the script prints "Backend is ready!" — then the fresh backend hits EADDRINUSE. The migrations and seeder lines that appear late in the log belong to the *new* backend, which exits seconds later.

The same issue affects `npx ng serve` for the frontend.

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

- [ ] Replace PID-based kill with port-based kill. Use the same logic as `end.sh`: look up PIDs listening on 7070 and 7200 via `lsof -ti`, send TERM, wait, force KILL if still alive.
- [ ] Keep the captured `BACKEND_PID` / `FRONTEND_PID` only as a first, fast attempt. The port-based sweep is the authoritative step.
- [ ] Stop frontend before backend (user-facing first) — already the current order.

### 2. Add pre-flight port check

- [ ] Before starting the backend, check if port 7070 is already in use. If yes, print a clear message ("Port 7070 already in use. Run ./end.sh first.") and exit with code 1.
- [ ] Do the same for port 7200 before starting the frontend.

### 3. Handle EXIT trap

- [ ] Add `EXIT` to the trap list so cleanup also runs when the shell exits for any reason (not just SIGINT/SIGTERM). Currently `wait` blocks forever, but if a background job dies on its own, the script should still tidy up on exit.

### 4. Verification

- [ ] Run `./start.sh`, confirm backend and frontend start.
- [ ] Press Ctrl+C. Confirm output says cleanup ran.
- [ ] Run `lsof -i :7070 -i :7200` → must be empty.
- [ ] Run `./start.sh` again → must start cleanly with no EADDRINUSE.
- [ ] Run `./start.sh`, leave running in one terminal, in another terminal run `./start.sh`. The second run must refuse with the pre-flight error, not crash.

## Non-Goals

- Not rewriting `end.sh` — it already works correctly.
- Not adding tests — shell-script cleanup is validated manually.
- Not changing `start.bat` / `end.bat` — Windows equivalents use a different mechanism (taskkill by PID tree).
