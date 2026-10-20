---
title: Firmen als Favorit markieren
labels: Refinement needed
---
## Ziel
Firmen lassen sich per Stern-Icon als Favorit markieren; ein Filter zeigt nur Favoriten.

## Anforderungen
- Neue Spalte `is_favorit` (Boolean, Default false) in der Tabelle `firma`.
- Endpoint `PATCH /api/firmen/:id/favorit` toggelt den Wert.
- Stern-Icon in der Firmenliste vor dem Namen: voll = Favorit, transparent = kein Favorit. Klick toggelt.
- Checkbox „Nur Favoriten anzeigen" über der Liste filtert auf Favoriten.
- Der Favoritenstatus gilt pro Firma (nicht pro User).

## Hinweise
- SQLite speichert Boolean als INTEGER (0/1) — im Service zu Boolean mappen.
- Migration in `migrate.ts` idempotent ergänzen: `ALTER TABLE firma ADD COLUMN is_favorit INTEGER NOT NULL DEFAULT 0`.
- Stern-Klick in ag-Grid: `event.stopPropagation()`, damit nicht die Zeilen-Navigation auslöst. Nach dem PATCH die Row lokal aktualisieren.
- FontAwesome `faStar`, gerendert mit `<fa-icon [icon]="faStar">`; voll/transparent über Opacity.

## Fertig, wenn
- [ ] Stern in der Liste, Klick toggelt und bleibt nach Reload erhalten.
- [ ] Filter-Checkbox zeigt nur Favoriten.
