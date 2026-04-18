# 10 — Zähler-Badges im Seitenmenü

**Umfang:** klein · **Bereiche:** Backend + Frontend · **Dauer:** ~15 Min

## Ziel

In der Seitennavigation erscheint neben den Menüpunkten „Firmen", „Personen",
„Chancen" und „Verträge" ein kleiner grauer Badge mit der Anzahl der
Datensätze.

Wenn Aufgabe 01 (Dashboard-Kacheln) bereits umgesetzt wurde, kann der
`/api/stats`-Endpoint wiederverwendet werden — guter Anlass, auf Wiederholung
zu verzichten.

## Prompt

```
/plan-and-do "In der Sidebar (frontend/src/app/layout/sidebar) hinter den Menüpunkten Firmen, Personen, Chancen und Verträge einen kleinen Bootstrap-Badge mit der Anzahl der Einträge anzeigen. Zahl wird einmal beim Laden der Sidebar vom Backend geholt. Wenn bereits ein GET /api/stats-Endpoint existiert, diesen wiederverwenden — sonst einen minimalen Endpoint bauen, der { firmen, personen, chancen, vertraege } liefert. Badge-Stil: bg-secondary, klein, rechts ausgerichtet im Listenpunkt."
```

## Erwartetes Ergebnis

- Zahl-Badge neben jedem der vier Menüpunkte.
- Ein einziger Request beim Sidebar-Init.
- Graceful Fallback: kein Badge, wenn Request fehlschlägt.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Zahlen stimmen nicht mit Liste überein | Backend zählt eventuell mit Filter. Sicherstellen, dass `SELECT COUNT(*) FROM …` ohne Einschränkungen läuft. |
| Badge nicht rechtsbündig | Bootstrap-Pattern: `<li class="d-flex justify-content-between align-items-center">`. |
| Nach Anlegen einer neuen Firma aktualisiert sich die Zahl nicht | Erwartet — Sidebar lädt nur beim Startup. Diskussionspunkt: Reactive-Pattern / Signal / Service-Event. |
| Duplikate mit Aufgabe 01 | Wenn `/api/stats` bereits existiert: wiederverwenden. Kein zweiter Endpoint. |
| Badge überlappt Icon | Flex-Layout prüfen, `ms-auto` auf dem Badge statt `justify-content-between`. |

## Diskussionspunkte

- Wie hält man Sidebar-Counter live (Signal, BehaviorSubject, WebSocket)?
- Lohnt sich der extra Request, oder sollte jede Liste beim Laden die Zahl
  selbst an einen zentralen Store melden?
