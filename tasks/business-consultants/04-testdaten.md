# 04 — Testdaten aus einer Fachfrage

**Dauer:** 20 min
**Sozialform:** einzeln oder Paare
**Werkzeug:** Chat-Assistent (Claude, ChatGPT, Gemini oder Microsoft 365 Copilot)
**Voraussetzung:** Rohnotizen [`material/vertriebsrunde-rohnotizen.md`](material/vertriebsrunde-rohnotizen.md), Punkt 4 „Kontaktpflege“
**Ziel:** Aus einer Fachfrage entstehen Testfälle und ein Testdatensatz mit Erwartungswerten — und ihr habt die Erwartungswerte selbst nachgezählt.

In der Vertriebsrunde wünscht sich Sandra eine Liste aller Firmen, bei denen
seit 90 Tagen niemand Kontakt hatte. Bevor so eine Liste gebaut wird, braucht
das Team Testdaten: ein paar erfundene Firmen und Aktivitäten, bei denen
vorher feststeht, welche Firmen auf der Liste landen müssen. Mit diesen Daten
prüft später jemand — ein Tester oder ein Agent —, ob die Liste stimmt.

Das Wertvollste daran sind die Grenzfälle: genau 90 Tage, eine Firma ganz
ohne Aktivität, eine Wiedervorlage in der Zukunft. Ob eine geplante Aufgabe
als Kontakt zählt, ist in den Notizen offen — das entscheidet ihr, nicht der
Assistent.

## Schritte

1. **Selbst entscheiden.** Legt vor dem Prompt fest: Zählt eine geplante
   Aufgabe (Wiedervorlage) in der Zukunft als Kontakt? Zählt eine Aktivität,
   die genau 90 Tage vor dem Stichtag liegt? Schreibt eure Antworten auf.
2. **Testfälle anfordern.** Gebt Prompt 1 ein und tragt eure beiden
   Entscheidungen ein.
3. **Nachzählen.** Prüft den Testdatensatz Zeile für Zeile von Hand: Gehört
   jede Firma, die der Assistent als „auf der Liste“ markiert, wirklich
   darauf? Rechnet die Tage zum Stichtag selbst nach.
4. **Zweite Runde.** Ändert eine Entscheidung aus Schritt 1 und lasst die
   Erwartungswerte mit Prompt 2 neu bestimmen. Ändern sich genau die Firmen,
   die sich ändern müssten?

## Folienschritte

1. Vorher entscheiden: Zählt eine Wiedervorlage? Zählen genau 90 Tage?
2. Testfälle und Testdaten anfordern (Prompt 1).
3. Erwartungswerte selbst nachzählen.
4. Eine Entscheidung ändern, neu bestimmen lassen (Prompt 2).

## Prompt

Prompt 1:

```
Fachfrage: Welche Firmen hatten in den letzten 90 Tagen keinen Kontakt?
Stichtag ist der 15.03.2026. Kontakt ist jede Aktivität (Anruf, E-Mail,
Meeting, Notiz) mit dieser Firma.

Meine Entscheidungen:
- Eine geplante Aufgabe (Wiedervorlage) mit Datum nach dem Stichtag zählt
  [als Kontakt / nicht als Kontakt].
- Eine Aktivität genau 90 Tage vor dem Stichtag zählt [als Kontakt / nicht
  als Kontakt].

1. Nenne die Testfälle, die man für diese Liste braucht — besonders die
   Grenzfälle. Je Testfall ein Satz.
2. Erzeuge einen Testdatensatz als Tabelle mit den Spalten Firma, Aktivität,
   Typ, Datum. Höchstens 8 Firmen; jeder Testfall kommt mindestens einmal vor.
3. Schreibe als Erwartungswert dazu, welche Firmen auf der Liste stehen
   müssen und welche nicht — je Firma mit Begründung und Anzahl der Tage bis
   zum Stichtag.
```

Prompt 2:

```
Ich ändere eine Entscheidung: … zählt jetzt [als Kontakt / nicht als
Kontakt]. Bestimme die Erwartungswerte für denselben Testdatensatz neu und
nenne nur die Firmen, die sich dadurch ändern.
```

## Abnahme

- [ ] Der Testdatensatz enthält mindestens diese Grenzfälle: eine Firma ohne
      jede Aktivität, eine Aktivität genau 90 Tage vor dem Stichtag, eine
      Wiedervorlage nach dem Stichtag.
- [ ] Zu jeder Firma steht ein Erwartungswert: auf der Liste oder nicht.
- [ ] Ihr habt jeden Erwartungswert selbst nachgerechnet — und notiert, ob
      der Assistent sich irgendwo verzählt hat.
- [ ] Nach der zweiten Runde ändern sich genau die Firmen, die von der
      geänderten Entscheidung betroffen sind.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Assistent schreibt SQL oder Programmcode | Zurück: „Keine Abfrage, kein Code — nur Testfälle, eine Tabelle und Erwartungswerte.“ |
| Die Tage stimmen nicht | Nachfragen: „Rechne für Firma … die Tage zwischen … und dem 15.03.2026 Schritt für Schritt.“ Ein Kalender hilft beim Gegenprüfen. |
| Der Assistent ignoriert eure Entscheidungen | Die Entscheidungen an den Anfang des Prompts stellen, nicht ans Ende. |
| Zu viele Firmen | „Höchstens 8 Firmen, jeder Grenzfall genau einmal.“ |

## Diskussion

- An welcher Stelle hat der Assistent sich verrechnet oder einen Grenzfall
  vergessen?
- Wer im Projekt sollte entscheiden, ob eine Wiedervorlage als Kontakt
  zählt — und wo wird diese Entscheidung festgehalten?
