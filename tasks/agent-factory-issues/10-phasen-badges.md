---
title: Chancen-Phase als farbiger Badge
labels: Refinement needed
---
## Ziel
Die Phase einer Chance erscheint in Liste und Detailseite als farbiger Badge statt als reiner Text.

## Anforderungen
- Farb-Mapping: NEU → blau (primary), QUALIFIZIERT → hellblau (info), ANGEBOT → gelb (warning), VERHANDLUNG → dunkelgrau (secondary), GEWONNEN → grün (success), VERLOREN → rot (danger).
- Gleiche Darstellung in Chancen-Liste und Chancen-Detailseite.
- Das Mapping wird nur EINMAL definiert und an beiden Stellen identisch genutzt (DRY).

## Hinweise
- Bootstrap-Badge: `<span class="badge bg-success">GEWONNEN</span>`.
- Eine gemeinsame Angular-Pipe oder Helper-Funktion für das Farb-Mapping.
- Die Enum-Werte stehen in `frontend/src/app/core/models/chance.model.ts`.
- Reine Frontend-Aufgabe.

## Fertig, wenn
- [ ] Phase erscheint als farbiger Badge in Liste und Detail.
- [ ] Farben stimmen mit dem Mapping überein.
- [ ] Mapping nur an einer Stelle definiert.
