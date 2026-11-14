# 01 — Protokoll aus Notizen, mit Fehlerjagd

**Dauer:** 20 min
**Sozialform:** einzeln
**Werkzeug:** Chat-Assistent (Claude, ChatGPT, Gemini oder Microsoft 365 Copilot)
**Voraussetzung:** Rohnotizen [`material/vertriebsrunde-rohnotizen.md`](material/vertriebsrunde-rohnotizen.md); das KI-Protokoll zum Vergleich erst in Schritt 5
**Ziel:** Aus Rohnotizen wird ein Protokoll, das jemand versteht, der nicht dabei war — und jede Zeile darin geht auf eine Notiz zurück.

Ein Protokoll schreibt der Assistent in Sekunden. Ob es stimmt, nicht. Er
glättet: Aus „ca. 80k“ wird eine genaue Zahl, aus einer offenen Frage eine
Entscheidung, und eine leere Spalte „Bis“ füllt er mit einem Datum, das nie
gefallen ist. Deshalb besteht die Übung zur Hälfte aus Fehlerjagd: Was steht
im Protokoll, das nicht in den Notizen stand? Dieselbe Frage stellt ihr am
Nachmittag dem Agenten — dann ist die Vorlage euer PRD.

Die Rohnotizen stammen aus einer erfundenen Vertriebsrunde zu genau dem CRM,
das ihr in Aufgabe 10 startet. Sie begleiten euch weiter: Aufgabe 02 macht
daraus User Stories, Aufgabe 03 ein PRD, und die Support-Meldung zum grauen
Speichern-Knopf kommt in Aufgabe 20 als Bugfix zurück.

**Eure Notizdatei:** Legt euch jetzt ein leeres Dokument an — in Word, in
den Notizen oder einem Texteditor. Dort sammelt ihr den Tag über Prompts und
geprüfte Ergebnisse. Das PRD daraus braucht ihr nach der Mittagspause.

## Schritte

1. **Notizen lesen.** Öffnet die Rohnotizen und lest sie einmal ganz. Was ist
   entschieden, was ist offen geblieben? So merkt ihr gleich, wenn das Protokoll
   aus einer offenen Frage eine Entscheidung macht.
2. **Protokoll schreiben lassen.** Öffnet ein neues Gespräch im
   Chat-Assistenten, kopiert Prompt 1 hinein und hängt **nur** die Rohnotizen an.
   Das KI-Protokoll zum Vergleich bleibt zu — sonst nimmt der Assistent euch
   die Fehlerjagd ab.
3. **Fehlerjagd.** Lest das Protokoll Zeile für Zeile gegen die Notizen:
   Steht das so in den Notizen? Achtet besonders auf Namen, Zahlen, Fristen
   und auf Sätze, die eine offene Frage wie eine Entscheidung klingen lassen.
   Jeden Fund notiert ihr mit der Stelle in den Notizen.
4. **Nachschärfen.** Gebt eure Funde mit Prompt 2 zurück und lasst das
   Protokoll korrigieren. Prüft die neue Fassung noch einmal. Ihr übt dabei,
   genau zu sagen, was falsch ist — „Woher kommt das Datum?“ wirkt besser als
   „Sei sorgfältig“. Auch die korrigierte Fassung kommt vom Assistenten,
   deshalb die zweite Prüfung.
5. **Gegenprobe — nur, wenn ihr im eigenen Protokoll nichts findet.** Erst
   jetzt öffnet ihr das vorbereitete
   [`material/vertriebsrunde-zum-vergleich-ki-protokoll.md`](material/vertriebsrunde-zum-vergleich-ki-protokoll.md):
   Darin stecken fünf Fehler. Wie viele findet ihr in fünf Minuten? Lest es
   selbst gegen die Notizen — gebt es nicht dem Assistenten.

## Folienschritte

1. Rohnotizen lesen: Was ist entschieden, was offen?
2. Protokoll schreiben lassen (Prompt 1).
3. Fehlerjagd: Steht das so in den Notizen?
4. Funde zurückgeben, Protokoll korrigieren lassen (Prompt 2).

## Prompt

Prompt 1:

```
Du bist Assistenz im Vertrieb. Schreibe aus den angehängten Rohnotizen ein
Protokoll für Kolleginnen und Kollegen, die nicht dabei waren.

Aufbau: Kopf (Datum, Teilnehmende, Protokoll), je Tagesordnungspunkt zwei bis
vier Sätze, am Ende eine Tabelle „Aufgaben“ mit Wer, Was, Bis.

Halte dich streng an die Notizen. Was dort offen ist, bleibt offen und steht
als offene Frage im Protokoll. Erfinde keine Zahlen, Namen oder Fristen —
fehlt eine Angabe, schreibe „nicht festgelegt“.
```

Prompt 2:

```
Ich habe dein Protokoll gegen die Rohnotizen geprüft. Diese Stellen stehen so
nicht in den Notizen:
- …
- …
Korrigiere genau diese Stellen und ändere sonst nichts. Nenne mir danach jede
Stelle, an der du etwas ergänzt hast, das nicht wörtlich in den Notizen steht.
```

## Abnahme

- [ ] Euer Protokoll hat einen Kopf, einen Absatz je Tagesordnungspunkt und
      eine Aufgabentabelle.
- [ ] Jede Zeile lässt sich auf eine Stelle in den Rohnotizen zurückführen.
- [ ] Was in den Notizen offen ist — wer die Markierung sieht, ob eine
      Wiedervorlage als Aktivität zählt, bis wann Jonas liefert —, steht als
      offen im Protokoll.
- [ ] Ihr habt mindestens drei Funde notiert: in eurem Protokoll oder im
      vorbereiteten.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Assistent findet nach Prompt 2 „keine Ergänzungen“ | Konkret nachfragen: „Woher kommt das Datum in der Aufgabentabelle?“ Eine Frage nach der Quelle wirkt besser als eine Bitte um Sorgfalt. |
| Das Protokoll ist viel länger als die Notizen | Nachschärfen: „Höchstens eine halbe Seite, keine Einleitung, keine Zusammenfassung am Ende.“ |
| Kein Datei-Upload im Chat | Den Text der Rohnotizen (grau hinterlegter Kasten) kopieren und direkt unter den Prompt einfügen. |
| Ihr findet im eigenen Protokoll nichts | Gut — dann Schritt 5 mit dem vorbereiteten Protokoll. |

## Diskussion

- Welche Art Fehler hat der Assistent gemacht: Zahlen, Namen, Fristen,
  Entscheidungen? Welche davon wäre beim Kunden am teuersten gewesen?
- Hat Prompt 1 mit „erfinde nichts“ gereicht — oder braucht es die Prüfung
  trotzdem?
