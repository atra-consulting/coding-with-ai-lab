# PRD: Firmen als Favorit markieren

Muster-PRD aus Aufgabe 03 und Ersatz für alle, deren eigenes PRD nicht fertig
geworden ist. In Aufgabe 11 kommt es unter `docs/prds/PRD-FIRMA-FAVORIT.md`
ins Repository, in Aufgabe 22 setzt der Agent es um.

## Herkunft

User Story aus der Vertriebsrunde vom 12.03. (Rohnotizen, Punkt 2): „Als Key
Account Manager möchte ich Firmen als Favorit markieren, damit ich meine
wichtigsten Kunden schnell finde.“

## Problem

Key Account Manager arbeiten täglich mit etwa 15 Firmen, die Firmenliste
enthält über 200. Heute suchen sie jede dieser Firmen jedes Mal neu.

## Anforderungen

- **A1** In der Firmenliste steht vor jedem Firmennamen ein Stern-Symbol.
- **A2** Ein Klick auf einen leeren Stern markiert die Firma als Favorit; der
  Stern wird gefüllt.
- **A3** Ein Klick auf einen gefüllten Stern hebt die Markierung auf; der
  Stern wird leer.
- **A4** Die Markierung bleibt nach dem Neuladen der Seite erhalten.
- **A5** Die Markierung gilt für die Firma, nicht für einzelne Benutzer: Alle
  Benutzer sehen dieselben Favoriten.
- **A6** Über der Liste steht eine Checkbox „Nur Favoriten anzeigen“. Ist sie
  aktiv, zeigt die Liste nur Firmen mit gefülltem Stern.
- **A7** Wer eine Firma bearbeitet und speichert, verändert ihre Markierung
  nicht.

## Nicht-Ziele

- Keine persönlichen Favoriten je Benutzer.
- Keine Favoriten für Personen, Chancen oder Aktivitäten.
- Keine Sortierung nach Favoriten und keine Anzeige im Dashboard.

## Offene Fragen

- Soll die Checkbox „Nur Favoriten anzeigen“ beim Neuladen der Seite aktiv
  bleiben, wenn sie vorher aktiv war? (entscheidet: Sandra K.)

## Abnahme

Jede Anforderung A1 bis A7 wird im Browser einzeln mit Ja oder Nein geprüft.
