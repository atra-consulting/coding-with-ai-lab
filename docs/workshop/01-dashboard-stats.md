# 01 — Dashboard-Statistik-Kacheln

**Umfang:** klein · **Bereiche:** Backend + Frontend · **Dauer:** ~20 Min

## Ziel

Das Dashboard zeigt aktuell nur eine Willkommensnachricht. Wir ergänzen vier
Statistik-Kacheln: Anzahl Firmen, Anzahl Personen, offene Chancen, aktive
Verträge. Backend bekommt einen neuen Endpoint `/api/stats`, Frontend zeigt
die Werte in Bootstrap-Cards.

Perfekte Einstiegs-Aufgabe: sichtbares Ergebnis, wenig Code, zeigt
Full-Stack-Durchlauf.

## Prompt

```
/plan-and-do "Dashboard-Statistik-Kacheln hinzufügen. Neuer Backend-Endpoint GET /api/stats liefert { firmenCount, personenCount, offeneChancenCount, aktiveVertraegeCount }. Offene Chancen = Phase nicht GEWONNEN und nicht VERLOREN. Aktive Verträge = Status AKTIV. Frontend zeigt vier Bootstrap-Cards nebeneinander auf dem Dashboard mit großer Zahl und Label darunter. Icons von Bootstrap Icons verwenden."
```

## Erwartetes Ergebnis

- Neuer Endpoint `/api/stats` im Backend mit passendem Service.
- Neuer Frontend-Service `StatsService` ruft den Endpoint auf.
- `DashboardComponent` lädt Statistiken in `ngOnInit` und rendert vier Cards.
- Zahlen sind live aus der Datenbank.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| 401 Unauthorized auf `/api/stats` | Claude hat `requireAuth`-Middleware vergessen. Prompt „Endpoint benötigt Auth wie alle anderen Routen" nachreichen. |
| Cards untereinander statt nebeneinander | Bootstrap-Grid-Klassen `col-md-3` / `col-sm-6` fehlen. Claude bitten, Grid mit `row` und `col-*` zu verwenden. |
| Zahl „0" bei offenen Chancen, obwohl welche da sind | Filter auf Phase falsch. In `services/chanceService.ts` prüfen, welche Phasen-Werte genutzt werden. |
| Endpoint existiert, aber Frontend zeigt „—" | Proxy-Konfig: `frontend/proxy.conf.json` leitet `/api/*` auf Backend um. Frontend neu starten nach Änderungen dort. |
| Werte aktualisieren sich nicht nach Neuanlage | Normal — Dashboard lädt nur beim Öffnen. Seite neu laden genügt. |

## Diskussionspunkte

- Wie würde man die Kacheln klickbar machen, sodass sie zu den jeweiligen
  Listen springen?
- Caching: Muss das bei jedem Dashboard-Öffnen neu geladen werden?
