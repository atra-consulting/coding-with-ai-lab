# 03 — Aus der Story ein PRD

**Dauer:** 25 min
**Sozialform:** einzeln
**Werkzeug:** Chat-Assistent (Claude, ChatGPT, Gemini oder Microsoft 365 Copilot)
**Voraussetzung:** Story „Firmen als Favorit markieren“ aus Aufgabe 02; zum Vergleich das Muster-PRD [`material/PRD-FIRMA-FAVORIT.md`](material/PRD-FIRMA-FAVORIT.md)
**Ziel:** Aus der Story entsteht ein PRD von einer Seite — nummerierte Anforderungen, Nicht-Ziele, offene Fragen —, das ein Entwickler oder ein Agent umsetzen kann, ohne zu raten.

Ein PRD (Product Requirements Document) beschreibt, *was* ein Feature leisten
soll und *warum* — nicht, wie es gebaut wird. Es liegt zwischen der User
Story und dem Lastenheft:

| | User Story | PRD | Lastenheft |
|---|---|---|---|
| Umfang | ein Stück Nutzen | ein Feature | ein ganzes Vorhaben |
| Länge | drei Zeilen und Kriterien | eine bis zwei Seiten | oft Dutzende Seiten |
| Wer liest es | Team im Sprint | Team und Agent | Auftragnehmer, Vertrag |

Euer PRD geht weiter: In Aufgabe 11 legt ihr es als Datei ins Repository, in
Aufgabe 22 setzt der Agent es um. Jede Lücke, die ihr jetzt lasst, füllt er
später mit dem Wahrscheinlichen.

**Rahmen für den Nachmittag** (wie in Aufgabe 02): Ins PRD gehören das
Markieren mit einem **Stern** je Firma und der Filter **„Nur Favoriten
anzeigen“**, und die Favoriten **gelten für alle Benutzer**. Bleibt dabei, auch
wenn ihr offene Fragen entscheidet — persönliche Favoriten je Benutzer machen
das Feature für den Agenten am Nachmittag zu groß.

## Schritte

1. **Muster ansehen.** Lest das Muster-PRD einmal quer: Aufbau, Länge, wie
   die Anforderungen formuliert sind. Schreibt es nicht ab — es ist euer
   Maßstab und der Ersatz, falls euer PRD nicht fertig wird.
2. **Gerüst anfordern.** Gebt Prompt 1 im selben Gespräch wie Aufgabe 02 ein —
   der Assistent kennt eure Story dann schon. Neues Gespräch? Dann fügt die
   Story aus eurer Notizdatei unter den Prompt ein (oder die Ersatz-Story aus
   dem Troubleshooting).
3. **Offene Fragen entscheiden.** Lest die offenen Fragen am Ende des PRD.
   Entscheidet sie und lasst das PRD mit Prompt 2 überarbeiten.
   Achtet darauf, dass jede Entscheidung als nummerierte Anforderung oder als
   Nicht-Ziel im PRD steht. Der Agent liest am Nachmittag die Datei, nicht euren
   Chat. Und jede nummerierte Anforderung wird in Aufgabe 22 eine Zeile
   eurer Abnahme-Checkliste.
4. **Aus Entwicklersicht prüfen lassen.** Lasst das PRD mit Prompt 3
   prüfen: Welche Fragen bleiben einem Entwickler offen? Ein Agent fragt
   selten nach, er baut das Wahrscheinliche — darum schließt ihr die Lücken
   jetzt. Beantwortet die ein
   bis zwei Fragen, die eine echte fachliche Lücke zeigen — die Antwort wird
   eine Anforderung oder ein Nicht-Ziel. Technische Fragen (zum Beispiel, wo
   etwas gespeichert wird) entscheidet das Team, die lasst ihr weg. Unter
   „Offene Fragen“ bleibt nur, was jemand anderes entscheiden muss, mit Namen.
5. **Aufheben.** Kopiert das fertige PRD als Text in eure Notizdatei. Steht es
   beim Assistenten als eigenes Dokument neben dem Chat (Claude, Copilot), öffnet
   es dort und kopiert den ganzen Text. In Aufgabe 11
   fügt ihr den Text in den Prompt ein, und der Agent legt daraus die Datei
   `docs/prds/PRD-FIRMA-FAVORIT.md` im Projekt an.

## Folienschritte

1. Muster-PRD quer lesen: Aufbau und Länge.
2. PRD aus eurer Story schreiben lassen (Prompt 1).
3. Offene Fragen entscheiden, überarbeiten lassen (Prompt 2).
4. Aus Entwicklersicht prüfen lassen (Prompt 3).

## Prompt

Prompt 1:

```
Du bist Product Owner. Schreibe aus der User Story „Firmen als Favorit
markieren“ aus unserem Gespräch — mit meinen Entscheidungen — ein PRD von
höchstens einer Seite für unser CRM. Aufbau:
1. Problem — zwei Sätze: Wer hat heute welches Problem?
2. Anforderungen — nummeriert (A1, A2, …), je Anforderung ein Satz, der sich
   in der Oberfläche mit Ja oder Nein prüfen lässt.
3. Nicht-Ziele — was ausdrücklich nicht dazugehört.
4. Offene Fragen — höchstens drei, die die Umsetzung am stärksten verändern.
   Rate nicht.
Beschreibe, was das Feature leisten soll, nicht wie es technisch gebaut wird.
Rahmen: Markieren mit einem Stern je Firma, Filter „Nur Favoriten anzeigen“,
die Favoriten gelten für alle Benutzer.
```

Prompt 2:

```
Meine Entscheidungen zu den offenen Fragen:
- …
- …
- …
Überarbeite das PRD: Jede Entscheidung wird eine nummerierte Anforderung oder
ein Nicht-Ziel. Was ich nicht entschieden habe, bleibt unter „Offene Fragen“.
```

Prompt 3:

```
Lies das PRD als erfahrene Entwicklerin, die es morgen umsetzen soll. Welche
drei Fragen würdest du stellen, bevor du anfängst? Nenne zu jeder Frage die
Anforderung, auf die sie sich bezieht.
```

## Abnahme

- [ ] Das PRD passt auf eine Seite und hat die vier Abschnitte Problem,
      Anforderungen, Nicht-Ziele, offene Fragen.
- [ ] Die Anforderungen sind nummeriert, und jede lässt sich im Browser mit
      Ja oder Nein prüfen.
- [ ] Die offenen Fragen aus Prompt 1 sind entschieden und stehen als
      Anforderung oder Nicht-Ziel im PRD — oder als offene Frage mit Namen.
- [ ] Stern, Filter „Nur Favoriten anzeigen“ und „Favoriten für alle
      Benutzer“ stehen im PRD.
- [ ] Mindestens ein Einwand aus Prompt 3 hat das PRD verändert.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Das PRD beschreibt Datenbankfelder und Schnittstellen | Zurück an den Assistenten: „Nur, was die Nutzerin in der Oberfläche sieht und tut. Die Technik entscheidet das Team.“ |
| Das PRD ist drei Seiten lang | „Kürze auf eine Seite. Streiche Einleitung, Ziele und Zusammenfassung.“ |
| Keine Story aus Aufgabe 02 oder neues Gespräch | Fügt sie unter Prompt 1 ein, oder nehmt diese: „Als Key Account Manager möchte ich Firmen als Favorit markieren, damit ich meine wichtigsten Kunden schnell finde.“ |
| Die Zeit reicht nicht | Das Muster-PRD ist euer Ersatz — in Aufgabe 11 nehmt ihr dann dieses. |

## Diskussion

- Welche Frage aus Prompt 3 hättet ihr selbst nicht gestellt?
- Was unterscheidet euer PRD vom Muster — und welches würdet ihr lieber einem
  Entwickler geben?
