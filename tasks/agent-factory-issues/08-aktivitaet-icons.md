---
title: Icons für Aktivitätstypen
labels: Refinement needed
---
## Ziel
In der Aktivitäten-Liste erscheint vor dem Typ-Text ein passendes Icon.

## Anforderungen
- Mapping: Anruf → Telefon, E-Mail → Briefumschlag, Meeting → mehrere Personen, Notiz → Notizzettel, Aufgabe → Checkliste.
- Unbekannte Typen bekommen ein neutrales Fallback-Icon.
- Keine weiteren Änderungen.

## Hinweise
- FontAwesome: z. B. `faPhone`, `faEnvelope`, `faUsers`, `faNoteSticky`, `faListCheck` aus `@fortawesome/free-solid-svg-icons`, gerendert mit `<fa-icon [icon]="…">`.
- Reine Frontend-Aufgabe.

## Fertig, wenn
- [ ] Jeder bekannte Typ zeigt sein Icon vor dem Text.
- [ ] Unbekannte Typen zeigen das Fallback-Icon.
