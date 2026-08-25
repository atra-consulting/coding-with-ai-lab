# 10 — Firmen als Favorit markieren

**Dauer:** 30 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Ein Stern-Icon in der Firmenliste markiert eine Firma als Favorit, eine Checkbox filtert darauf.
**Ergebnis:** Ein Favoritenstatus, der pro Firma in der Datenbank steht und das Neuladen übersteht.

Zeigt Full-Stack mit PATCH-Endpoint, Boolean-Toggle und Filter-Logik. Der
Zustand wird pro Firma gespeichert, nicht pro User.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und in der Firmenliste zwei Sterne
   klicken.
4. Seite neu laden und die Checkbox „Nur Favoriten anzeigen" aktivieren.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "Firmen als Favorit markieren. In der Firmenliste erscheint vor dem Namen ein Stern-Icon. Klick auf den Stern macht die Firma zum Favoriten (voller Stern) oder hebt den Favoriten wieder auf (transparenter Stern). Der Favoritenstatus wird pro Firma (nicht pro User) gespeichert. Über der Liste steht eine Checkbox 'Nur Favoriten anzeigen'; aktiviert sie der User, zeigt die Liste nur noch Favoriten."
```

## Abnahme

- Firmen-Tabelle hat `is_favorit` Spalte.
- `PATCH /api/firmen/:id/favorit` toggelt den Wert.
- Stern-Icon in der Liste: transparent = kein Favorit, voll = Favorit.
- Filter-Checkbox reduziert die Liste auf Favoriten.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| „no such column: is_favorit" | Migration lief nicht auf bestehende DB. `./start.sh --reset-db` oder manuell `ALTER TABLE firma ADD COLUMN is_favorit INTEGER NOT NULL DEFAULT 0` in `migrate.ts` als idempotente Prüfung. |
| Stern-Klick löst Row-Navigation aus | ag-Grid-Zeile navigiert bei Klick zur Detail-Seite. Im `cellRenderer` `event.stopPropagation()` beim Button-Click. |
| Nach Klick Stern bleibt unverändert | Frontend aktualisiert die Row-Daten nicht. Nach PATCH-Response die Row lokal patchen oder Liste neu laden. |
| Filter `favoritOnly=true` ignoriert | Query-Parameter wird im Service nicht durchgereicht. `firmaService.listPaginated(..., favoritOnly?)` erweitern. |
| Boolean vs. 0/1 | SQLite speichert als INTEGER. Im Service zu Boolean mappen. |
| FaIconComponent fehlt | Standalone-Component importieren: `imports: [FaIconComponent]`. Stern-Icon via `import { faStar } from '@fortawesome/free-solid-svg-icons';`. |

## Diskussion

- Pro-User-Favoriten: was würde sich ändern (Join-Tabelle `user_favorit`)?
- Optimistic UI: Stern sofort umschalten, bei Fehler zurückrollen.
- Voll/leer über zwei Icon-Varianten statt Opacity — benötigt
  `free-regular-svg-icons`. Wann lohnt sich das extra Paket?
