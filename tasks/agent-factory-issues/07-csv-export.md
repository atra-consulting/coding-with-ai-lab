---
title: CSV-Export für die Firmenliste
labels: Refinement needed, Will ask
---
## Ziel
Ein Button über der Firmenliste lädt alle Firmen als CSV-Datei herunter.

## Anforderungen
- Button „CSV-Export" über der Firmen-Liste.
- Klick lädt `firmen-YYYY-MM-DD.csv` mit ALLEN Firmen herunter (nicht nur die aktuelle Seite).
- Spalten: ID, Name, Branche, Telefon, E-Mail, Erstelldatum.
- Excel öffnet die Datei korrekt, auch mit deutschen Umlauten.

## Rückfrage erforderlich
Eine Entscheidung in dieser Aufgabe triffst du **nicht allein**: das Trennzeichen.
Komma ist der CSV-Standard, aber deutsches Excel erwartet oft das Semikolon. Beides
ist vertretbar — die Wahl beeinflusst, ob die Datei mit einem Doppelklick sauber
in Excel öffnet. Rate **nicht** und wähle keinen Standard. Bevor du Code schreibst:
1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (Komma oder Semikolon?).
2. Setze das Label `Input needed`.
3. Warte auf die Antwort, bevor du weiterarbeitest.

## Hinweise
- Für Umlaute in Excel: UTF-8-BOM voranstellen und `Content-Type: text/csv; charset=utf-8` setzen.
- Das Backend liefert die vollständige Liste (ohne Pagination), das Frontend stößt den Download an.

## Fertig, wenn
- [ ] Button vorhanden, Klick lädt die Datei.
- [ ] Datei enthält alle Firmen mit den genannten Spalten.
- [ ] Umlaute erscheinen in Excel korrekt.
