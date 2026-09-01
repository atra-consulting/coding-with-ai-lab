---
title: Notiz-Feld für Chancen
labels: Refinement needed, Will ask
---
## Ziel
Chancen bekommen ein optionales, mehrzeiliges Notiz-Feld.

## Anforderungen
- Neue Spalte `notes` (TEXT, optional) in der Tabelle `chance`.
- Backend akzeptiert und liefert `notes` (Create UND Update).
- Im Formular: dreizeilige Textarea; das Zeichenlimit klärst du per Rückfrage (siehe unten).
- Auf der Detailseite: Notiz mit erhaltenen Zeilenumbrüchen anzeigen.
- In der Liste taucht die Notiz NICHT auf.

## Rückfrage erforderlich
Eine Entscheidung in dieser Aufgabe triffst du **nicht allein**: die maximale
Zeichenzahl der Notiz. Diese Zahl steuert sowohl das Frontend-Limit als auch die
Zod-Validierung im Backend — sie muss bewusst gewählt werden. Rate **nicht** und
nimm keinen Standardwert an. Bevor du Code schreibst:
1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (welches Zeichenlimit?).
2. Setze das Label `Input needed`.
3. Warte auf die Antwort, bevor du weiterarbeitest.

## Hinweise
- Schema an zwei Stellen pflegen: Drizzle-Schema (Typ-Inferenz) und `migrate.ts` (Runtime-Source-of-Truth).
- Zod: `z.string().max(<Limit>).optional().nullable()` — auch im Update-Schema.
- Detail-Anzeige mit CSS `white-space: pre-wrap`, damit Zeilenumbrüche bleiben.
- Die Entität `Person` hat bereits ein `notes`-Feld — als Vorlage nutzen.

## Fertig, wenn
- [ ] Notiz lässt sich anlegen, speichern und wieder laden.
- [ ] Textarea mit dem abgestimmten Zeichenlimit im Formular.
- [ ] Detailseite zeigt Zeilenumbrüche korrekt.
