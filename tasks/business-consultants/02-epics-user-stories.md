# 02 — Epics und User Stories aus Notizen

**Dauer:** 25 min
**Sozialform:** einzeln
**Werkzeug:** Chat-Assistent (Claude, ChatGPT, Gemini oder Microsoft 365 Copilot)
**Voraussetzung:** Rohnotizen [`material/vertriebsrunde-rohnotizen.md`](material/vertriebsrunde-rohnotizen.md), am besten im selben Gespräch wie Aufgabe 01
**Ziel:** Aus denselben Notizen entstehen zwei bis drei Epics, je Epic User Stories mit prüfbaren Akzeptanzkriterien — und jede Annahme ist entweder von euch entschieden oder als offene Frage markiert.

Ein Epic ist ein großes Vorhaben, das zu groß für einen Arbeitsschritt ist.
Eine User Story schneidet daraus ein Stück, das ein Team in wenigen Tagen
liefern kann: „Als … möchte ich …, damit …“. Akzeptanzkriterien sagen, woran
man erkennt, dass die Story fertig ist — jedes muss sich mit Ja oder Nein
prüfen lassen.

Der Assistent schreibt Stories schnell und in gutem Format. Dabei trifft er
Annahmen, die nur ihr treffen dürft: Sieht jeder die Favoriten oder nur ich?
Zählt eine Wiedervorlage als Aktivität? Diese Übung macht die Annahmen
sichtbar, und ihr entscheidet sie selbst. Die Story „Firmen als Favorit
markieren“ nehmt ihr in Aufgabe 03 mit.

## Schritte

1. **Epics und Stories anfordern.** Gebt Prompt 1 ein — im selben Gespräch
   wie Aufgabe 01 oder in einem neuen mit den Rohnotizen im Anhang.
2. **Annahmen lesen.** Der Assistent listet seine Annahmen auf. Markiert die,
   die eine fachliche Entscheidung sind — nicht eine technische.
3. **Selbst entscheiden.** Entscheidet mindestens drei Annahmen und schreibt
   die Entscheidungen mit Prompt 2 zurück. Was ihr nicht entscheiden könnt,
   bleibt als offene Frage stehen — mit dem Namen der Person aus den Notizen,
   die es entscheiden müsste.
4. **Angreifen lassen.** Lasst die Stories mit Prompt 3 aus Sicht einer
   Testerin prüfen. Schärft die Kriterien nach, die sich nicht mit Ja oder
   Nein prüfen lassen.
5. **Aufheben.** Speichert die Story „Firmen als Favorit markieren“ samt
   Kriterien in eurer Notizdatei — Aufgabe 03 macht daraus ein PRD.

## Folienschritte

1. Epics und Stories mit Annahmen anfordern (Prompt 1).
2. Annahmen lesen: Welche sind fachliche Entscheidungen?
3. Drei davon selbst entscheiden und zurückschreiben (Prompt 2).
4. Aus Testersicht angreifen lassen, Kriterien nachschärfen (Prompt 3).

## Prompt

Prompt 1:

```
Du bist Business Analyst. Leite aus den Rohnotizen zwei bis drei Epics für
unser CRM ab. Schreibe je Epic zwei bis drei User Stories im Format
„Als … möchte ich …, damit …“, je Story drei bis fünf Akzeptanzkriterien,
die sich mit Ja oder Nein prüfen lassen.

Liste danach alle Annahmen auf, die du treffen musstest, weil die Notizen
dazu nichts sagen — nummeriert, je Annahme ein Satz. Triff keine Annahme
stillschweigend.
```

Prompt 2:

```
Meine Entscheidungen zu deinen Annahmen:
- Annahme …: …
- Annahme …: …
- Annahme …: …
Offen bleibt: … (entscheidet …).
Überarbeite die betroffenen Stories und Kriterien. Ändere sonst nichts.
```

Prompt 3:

```
Prüfe die Stories aus Sicht einer Testerin. Nenne jedes Akzeptanzkriterium,
das sich nicht eindeutig mit Ja oder Nein prüfen lässt, und schlage eine
prüfbare Fassung vor. Nenne außerdem Fälle, die keine Story abdeckt.
```

## Abnahme

- [ ] Zwei bis drei Epics, darunter eines zu „Wichtige Kunden schneller
      finden“ mit der Story „Firmen als Favorit markieren“.
- [ ] Jede Story hat das Format „Als … möchte ich …, damit …“ und mindestens
      drei Akzeptanzkriterien.
- [ ] Jedes Kriterium lässt sich mit Ja oder Nein prüfen — „schnell“,
      „übersichtlich“ oder „benutzerfreundlich“ kommen nicht vor.
- [ ] Mindestens drei Annahmen habt ihr selbst entschieden; die übrigen
      stehen als offene Frage mit Namen da.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Assistent liefert zehn Epics | Nachschärfen: „Höchstens drei Epics. Fasse zusammen, was zusammengehört.“ |
| Keine Annahmen in der Antwort | Nachfragen: „Welche Entscheidungen hast du getroffen, die nicht in den Notizen stehen?“ |
| Kriterien beschreiben Technik („REST-Endpoint“, „Datenbankfeld“) | Zurück an den Assistenten: „Formuliere jedes Kriterium so, dass ich es in der Oberfläche prüfen kann.“ |
| Unsicher, ob etwas Epic oder Story ist | Faustregel: Passt es in eine Woche Arbeit eines Teams, ist es eine Story. |

## Diskussion

- Welche Annahme des Assistenten hättet ihr fast übernommen, ohne sie zu
  bemerken?
- Wer im Projekt entscheidet die Fragen, die ihr offen gelassen habt — und
  wie erfährt das Entwicklungsteam die Antwort?
