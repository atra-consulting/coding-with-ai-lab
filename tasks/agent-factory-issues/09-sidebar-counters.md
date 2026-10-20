---
title: Zähler-Badges im Seitenmenü
labels: Refinement needed, Will ask
---
## Ziel
Neben den Menüpunkten im Seitenmenü steht jeweils ein kleiner grauer Badge mit der Anzahl der Einträge.

## Anforderungen
- Badge neben Firmen, Personen, Chancen und Aktivitäten.
- Ein einziger Request beim Laden des Menüs.
- Schlägt der Request fehl, wird einfach kein Badge angezeigt (kein Fehler).

## Rückfrage erforderlich
Eine Entscheidung in dieser Aufgabe triffst du **nicht allein**: Soll der
Chancen-Badge **alle** Chancen zählen oder nur die **offenen**? Das Dashboard
liefert nur `offeneChancenCount` — für „alle" wäre Backend-Arbeit nötig. Beide
Varianten sind sinnvoll. Rate **nicht** und wähle keinen Standard. Bevor du Code
schreibst:
1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (alle oder nur offene Chancen?).
2. Setze das Label `Input needed`.
3. Warte auf die Antwort, bevor du weiterarbeitest.

## Hinweise
- Das Backend hat bereits `GET /api/dashboard` mit `firmenCount`, `personenCount` und `offeneChancenCount`. Für die Aktivitäten-Zahl ggf. einen kleinen Count ergänzen.
- Badge mit Bootstrap: `<span class="badge bg-secondary">…</span>`, rechtsbündig über `ms-auto`.

## Fertig, wenn
- [ ] Vier Badges mit korrekten Zahlen sichtbar.
- [ ] Nur ein Request beim Laden des Menüs.
