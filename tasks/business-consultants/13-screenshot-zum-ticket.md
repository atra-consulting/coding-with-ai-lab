# 13 — Vom Screenshot zum Ticket

**Dauer:** 25 min
**Sozialform:** einzeln
**Werkzeug:** Chat-Assistent mit Bild-Upload, Ticket-Board
**Voraussetzung:** Lab läuft unter `localhost:7200`; Screenshot [`bilder/13-chancen-neu-blau.png`](bilder/13-chancen-neu-blau.png) oder ein eigener vom Trainer
**Ziel:** Aus einem Screenshot mit handschriftlicher Änderung wird ein Ticket im Ticket-Board: geprüfte User Story mit Akzeptanzkriterien, Status Definition, nichts verloren und nichts dazuerfunden.

Ein Screenshot aus dem CRM, auf dem jemand von Hand eine Änderung eingezeichnet
hat — so landen Anforderungen oft auf deinem Tisch. Du machst daraus ein Ticket,
mit dem das Team arbeiten kann: Der Chat-Assistent liest das Bild und schreibt
eine User Story, du prüfst sie gegen den Screenshot und legst das Ticket im
Ticket-Board des Labs an.

Das Ticket-Board kennt keine Anhänge. Deshalb muss alles, was im Bild steckt,
als Text ins Ticket — genau das ist die Übung.

## Schritte

1. **Erst selbst hinsehen.** Öffne den Screenshot. Notiere in zwei, drei
   Stichpunkten, was sich ändern soll und welcher Bildschirm des CRM betroffen
   ist. Was kannst du nicht eindeutig lesen?
2. **Den Assistenten lesen lassen.** Gib den Screenshot deinem Chat-Assistenten
   und nutze den Prompt unten.
3. **Gegen das Bild prüfen.** Vergleiche die Antwort mit dem Screenshot und mit
   deinen Notizen: Steht jede handschriftliche Änderung in der Story? Hat der
   Assistent etwas dazuerfunden? Sind seine offenen Fragen berechtigt?
   Beantworte sie oder lass sie bewusst als offene Frage im Ticket stehen.
4. **Ticket anlegen.** Öffne <http://localhost:7200/admin/tickets>
   (Login `admin` / `admin123`) und klicke **Neues Ticket**.
   - **Typ:** `FEATURE` — oder `BUG`, wenn der Screenshot einen Fehler zeigt.
   - **Titel:** kurz und fachlich, aus Sicht des Nutzers.
   - **Beschreibung:** die geprüfte User Story mit Akzeptanzkriterien, offenen
     Fragen und einer Zeile zur Herkunft: „Vorlage: Screenshot
     ‹Dateiname› vom ‹Datum›".
5. **Ticket prüfen.** Das Ticket steht in der Spalte **Definition**, Owner ist
   der Mensch. Öffne es und lies es so, als hättest du den Screenshot nie
   gesehen: Versteht man, was zu tun ist? Merk dir die Ticketnummer — Aufgabe
   23 macht mit genau diesem Ticket weiter.

**Gib das Ticket noch nicht an die KI ab** — kein „An KI übergeben", kein „Nach
Bereit". Es bleibt in Definition; die nächsten Schritte im Prozess kommen in
Aufgabe 23.

## Folienschritte

1. Screenshot ansehen, Änderung in Stichpunkten notieren.
2. Screenshot und Prompt an den Chat-Assistenten.
3. Antwort gegen das Bild prüfen: nichts fehlt, nichts erfunden.
4. Ticket im Ticket-Board anlegen — es bleibt in Definition.

## Prompt

```
Im angehängten Screenshot aus unserem CRM hat jemand von Hand eine Änderung
eingezeichnet.

1. Beschreibe zuerst nur, was du siehst: Welcher Bildschirm ist das, und was
   ist von Hand eingezeichnet oder dazugeschrieben?
2. Schreibe daraus eine User Story („Als … möchte ich …, damit …") mit
   3 bis 5 prüfbaren Akzeptanzkriterien.
3. Liste offene Fragen auf: alles, was im Bild nicht eindeutig ist. Rate
   nicht — wenn du etwas nicht sicher lesen kannst, schreib es als Frage.

Halte dich an das, was im Bild steht. Keine zusätzlichen Features.
```

## Abnahme

- [ ] Im Ticket-Board steht ein neues Ticket in der Spalte **Definition**,
      Owner Mensch.
- [ ] Die Beschreibung enthält eine User Story und mindestens drei prüfbare
      Akzeptanzkriterien.
- [ ] Jede handschriftliche Änderung aus dem Screenshot findet sich im Ticket
      wieder — und nichts, was nicht im Bild steht.
- [ ] Offene Fragen sind beantwortet oder ausdrücklich als offen markiert.
- [ ] Jemand, der den Screenshot nicht kennt, versteht das Ticket.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Kein „Neues Ticket" auf dem Board | Anlegen dürfen nur Admins: ab- und als `admin` / `admin123` wieder anmelden. |
| Der Assistent liest die Handschrift falsch | Nachfragen mit dem, was du siehst: „Im Kreis steht ‚…', nicht ‚…'." Oder den Ausschnitt größer zuschneiden und noch einmal geben. |
| Die Story enthält Dinge, die nicht im Bild stehen | Streichen. Wenn sie dir sinnvoll erscheinen: als offene Frage ins Ticket, nicht als Anforderung. |
| Kein Bild-Upload im Chat-Assistenten | Freie Stufen begrenzen manchmal Uploads — zu zweit an einem Rechner weiterarbeiten, auf dem es geht. |

## Diskussion

- Was hat der Assistent im Bild gesehen, das dir entgangen war — und umgekehrt?
- Welche Information aus dem Screenshot ging auf dem Weg ins Ticket verloren?
- Hätte ein Entwickler (oder ein Agent) mit dem Screenshot allein mehr oder
  weniger verstanden als mit deinem Ticket?
