---
name: chance-feedback-traps
description: Recurring gaps in Chance feedback — existing beschreibung field duplication, vague "bunt" color requests, bundled two-in-one changes
metadata:
  type: project
---

Chance-Feedback hat wiederkehrende Fallen. Vor dem BAUEN prüfen.

**1. "Freie Notiz" dupliziert oft das bestehende `beschreibung`-Feld.**
Chance hat schon `beschreibung` (nullable TEXT). Frontend `chance-form.component.html` rendert es als `<textarea rows="3">`, optional, ohne Formatierung, bearbeitbar bei Anlegen+Ändern. Deckt "freie mehrzeilige optionale Notiz" bereits ab.
**Why:** Nutzer kennt das Feld oft nicht und fordert dasselbe nochmal.
**How to apply:** Bei jedem "Notiz/Kommentar/freies Textfeld"-Wunsch an Chance fragen: neues Feld ODER reicht `beschreibung`? Sonst baut man ein Duplikat.
**AUSNAHME:** Wenn der Nutzer `beschreibung` explizit nennt und ausdrücklich ein ZWEITES, getrenntes Feld will (z.B. "Es gibt schon ein Beschreibungs-Feld - ich will ein neues Feld"), ist es KEIN versehentliches Duplikat. Dann buildbar; nicht ablehnen. Feldname "notiz"/Label "Notiz" ist naheliegender Default, kein Blocker.

**2. "Bunt"/"farbig" ohne Farb-Map ist eine Design-Entscheidung.**
Chance hat 6 Phasen: NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN. Phase-Spalte in `chance-list.component.ts` ist heute reiner Text (kein cellRenderer/cellClass).
Detail-Ansicht `chance-detail.component.ts` hat `getPhaseBadgeClass()` mit voller 6-Phasen-Map: NEU=bg-primary, QUALIFIZIERT=bg-info, ANGEBOT=bg-warning text-dark, VERHANDLUNG=bg-secondary, GEWONNEN=bg-success, VERLOREN=bg-danger.
**Why:** Grün/Rot für GEWONNEN/VERLOREN ist naheliegend, die 4 mittleren Stufen sind Raten.
**How to apply:** "bunt"/"farbig" ohne Referenz → nach konkreter Farbe pro Phase fragen. **AUSNAHME:** "gleiche Farbe wie in der Detail-Ansicht" ist buildbar — Map existiert schon in `getPhaseBadgeClass()`. Kein Raten, kein Blocker; einfach als AG-Grid cellRenderer/cellClass in der Liste wiederverwenden.

**3. Feedback bündelt oft zwei unabhängige Änderungen.**
**How to apply:** Prüfen ob "A + B" drinsteckt (z.B. Notiz + buntes Label). Falls ja: in zwei Tickets trennen empfehlen.

Siehe [[project_agent_task_reject_patterns]].
