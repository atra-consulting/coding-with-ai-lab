# B 3 — Firmen als Favorit markieren

**Umfang:** mittel · **Bereiche:** Datenbank + Backend + Frontend · **Dauer:** ~30 Min

## Ziel

Nutzer sollen Firmen per Stern-Icon als Favorit markieren können. Der Zustand
wird pro Firma (nicht pro User) in der Datenbank gespeichert. In der Liste
gibt es zusätzlich einen Filter „Nur Favoriten".

Zeigt Full-Stack mit PATCH-Endpoint, Boolean-Toggle und Filter-Logik.

## Prompt

Claude starten und mit Tab den Auto-Modus schalten. Mit `/model` Sonnet
auswählen und dann folgenden Prompt ausführen, der den
`/project:plan-and-do` Skill aufruft. 

```
/plan-and-do "Firmen als Favorit markieren. 
Erstellen keinen PR und pushe nicht - du hast bei diesem Repo nicht
die Rechte dazu. Schreibe keine Tests, die den Browser automatisieren,
und mache nur eine statt drei Review-Runden. Aktualisiere am Schluss
auch nicht die Specs und Subagents.

In der Firmenliste erscheint vor dem Namen ein Stern-Icon. Klick auf den Stern macht die Firma zum Favoriten (voller Stern) oder hebt den Favoriten wieder auf (transparenter Stern). Der Favoritenstatus wird pro Firma (nicht pro User) gespeichert. Über der Liste steht eine Checkbox 'Nur Favoriten anzeigen'; aktiviert sie der User, zeigt die Liste nur noch Favoriten."
```

## Erwartetes Ergebnis

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

## Diskussionspunkte

- Pro-User-Favoriten: was würde sich ändern (Join-Tabelle `user_favorit`)?
- Optimistic UI: Stern sofort umschalten, bei Fehler zurückrollen.
- Voll/leer über zwei Icon-Varianten statt Opacity — benötigt
  `free-regular-svg-icons`. Wann lohnt sich das extra Paket?
