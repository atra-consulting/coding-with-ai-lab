---
title: Dunkelmodus-Umschalter im Header
labels: Refinement needed
---
## Ziel
Ein Umschalter im Header schaltet die ganze App zwischen Hell- und Dunkelmodus um.

## Anforderungen
- Kleiner Icon-Button rechts oben im Header: Mond im Hellmodus, Sonne im Dunkelmodus.
- Klick schaltet die gesamte App um.
- Die Wahl wird in `localStorage` gespeichert und beim nächsten Laden wiederhergestellt.

## Hinweise
- Bootstrap 5.3 unterstützt Dunkelmodus nativ über das Attribut `data-bs-theme="dark"` am `<html>`-Element.
- Icons über FontAwesome: `faMoon` / `faSun` aus `@fortawesome/free-solid-svg-icons`, gerendert mit `<fa-icon [icon]="…">`.
- Reine Frontend-Aufgabe, keine Backend- oder DB-Änderung.

## Fertig, wenn
- [ ] Button im Header sichtbar, Icon passt zum aktuellen Modus.
- [ ] Klick schaltet die ganze App um.
- [ ] Nach Reload bleibt der gewählte Modus erhalten.
