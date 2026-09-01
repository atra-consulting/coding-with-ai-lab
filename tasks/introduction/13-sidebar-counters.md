# 13 — Zähler-Badges im Seitenmenü

**Dauer:** 15 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Neben den vier Menüpunkten der Seitennavigation steht die Anzahl der Datensätze.
**Ergebnis:** Vier graue Badges aus einem einzigen Request an `/api/dashboard`.

Das Backend hat bereits einen `GET /api/dashboard`-Endpoint, der
`firmenCount`, `personenCount` und `offeneChancenCount` liefert. Für die
Aktivitäten-Zahl reicht ein kleiner Zusatz.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und die Zahlen im Seitenmenü mit den
   Listen vergleichen.
4. Im Network-Tab (`F12`) prüfen, dass die Sidebar nur einen Request an
   `/api/dashboard` stellt.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "Zähler-Badges im Seitenmenü. Neben den Menüpunkten Firmen, Personen, Chancen und Aktivitäten soll jeweils ein kleiner grauer Badge mit der Anzahl der Einträge stehen."
```

## Abnahme

- Zahl-Badge neben jedem der vier Menüpunkte (Firmen, Personen, Chancen,
  Aktivitäten).
- Ein einziger Request beim Sidebar-Init an `/api/dashboard`.
- Graceful Fallback: kein Badge, wenn Request fehlschlägt.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Zahlen stimmen nicht mit Liste überein | Backend zählt eventuell mit Filter. Sicherstellen, dass `SELECT COUNT(*) FROM …` ohne Einschränkungen läuft. |
| Badge nicht rechtsbündig | Bootstrap-Pattern: `<li class="d-flex justify-content-between align-items-center">`. |
| Nach Anlegen einer neuen Firma aktualisiert sich die Zahl nicht | Erwartet — Sidebar lädt nur beim Startup. Diskussionspunkt: Reactive-Pattern / Signal / Service-Event. |
| „Offene Chancen"-Zahl vs. alle Chancen | `/api/dashboard` liefert `offeneChancenCount` — das ist gewollt die Anzahl **offener** Chancen. Falls die Gesamtzahl gewünscht ist: eigenen Count im Dashboard-Service ergänzen. |
| Badge überlappt Icon | Flex-Layout prüfen, `ms-auto` auf dem Badge statt `justify-content-between`. |

## Diskussion

- Wie hält man Sidebar-Counter live (Signal, BehaviorSubject, WebSocket)?
- Lohnt sich der extra Request, oder sollte jede Liste beim Laden die Zahl
  selbst an einen zentralen Store melden?
