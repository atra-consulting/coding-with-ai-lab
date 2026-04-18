# 09 — Firmen als Favorit markieren

**Umfang:** mittel · **Bereiche:** Datenbank + Backend + Frontend · **Dauer:** ~8 Min

## Ziel

Nutzer sollen Firmen per Stern-Icon als Favorit markieren können. Der Zustand
wird pro Firma (nicht pro User) in der Datenbank gespeichert. In der Liste
gibt es zusätzlich einen Filter „Nur Favoriten".

Zeigt Full-Stack mit PATCH-Endpoint, Boolean-Toggle und Filter-Logik.

## Prompt

```
/plan-and-do "Firmen als Favorit markieren. Datenbank: neue Spalte is_favorit INTEGER NOT NULL DEFAULT 0 in der firma-Tabelle (migrate.ts) und im Drizzle-Schema. Backend: isFavorit in FirmaDTO durchreichen, neuer Endpoint PATCH /api/firmen/:id/favorit der den Wert toggelt und die aktualisierte Firma zurückgibt. GET /api/firmen akzeptiert zusätzlich Query-Parameter favoritOnly=true, das nur Favoriten liefert. Frontend: in der Firmen-Liste eine schmale erste Spalte mit Stern-Icon (bi-star bzw. bi-star-fill). Klick ruft PATCH-Endpoint auf und aktualisiert die Zeile. Zusätzlich über der Liste Checkbox 'Nur Favoriten anzeigen' — bei Aktivierung wird favoritOnly=true an die Liste übergeben."
```

## Erwartetes Ergebnis

- Firmen-Tabelle hat `is_favorit` Spalte.
- `PATCH /api/firmen/:id/favorit` toggelt den Wert.
- Stern-Icon in der Liste: leer = kein Favorit, ausgefüllt = Favorit.
- Filter-Checkbox reduziert die Liste auf Favoriten.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| „no such column: is_favorit" | Migration lief nicht auf bestehende DB. `./start.sh --reset-db` oder manuell `ALTER TABLE firma ADD COLUMN is_favorit INTEGER NOT NULL DEFAULT 0` in `migrate.ts` als idempotente Prüfung. |
| Stern-Klick löst Row-Navigation aus | ag-Grid-Zeile navigiert bei Klick zur Detail-Seite. Im `cellRenderer` `event.stopPropagation()` beim Button-Click. |
| Nach Klick Stern bleibt unverändert | Frontend aktualisiert die Row-Daten nicht. Nach PATCH-Response die Row lokal patchen oder Liste neu laden. |
| Filter `favoritOnly=true` ignoriert | Query-Parameter wird im Service nicht durchgereicht. `firmaService.listPaginated(..., favoritOnly?)` erweitern. |
| Boolean vs. 0/1 | SQLite speichert als INTEGER. Im Service zu Boolean mappen. |

## Diskussionspunkte

- Pro-User-Favoriten: was würde sich ändern (Join-Tabelle `user_favorit`)?
- Optimistic UI: Stern sofort umschalten, bei Fehler zurückrollen.
