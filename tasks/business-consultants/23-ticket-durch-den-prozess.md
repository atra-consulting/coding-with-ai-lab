# 23 — Ein Ticket durch den Prozess

**Dauer:** 40 min
**Sozialform:** Paare
**Werkzeug:** Ticket-Board, Claude Code oder GitHub Copilot CLI
**Voraussetzung:** Ticket aus Aufgabe 13 steht in Definition; Lab läuft unter `localhost:7200`
**Ziel:** Euer Ticket aus Aufgabe 13 läuft einmal durch alle Spalten des Ticket-Boards — Definition, Bereit, In Arbeit, gegebenenfalls Wartet, Erledigt —, und ihr entscheidet an jeder Übergabe, ob es weitergeht.

Das Ticket aus Aufgabe 13 liegt in **Definition**, Owner (zuständig) Mensch. Jetzt geht es
den Weg, den im Team jedes Ticket geht: Ihr verfeinert es, gebt es an die KI,
die KI arbeitet es ab — und fragt nach, wenn etwas fehlt. Am Ende prüft ihr das
Ergebnis im Browser gegen eure Akzeptanzkriterien.

Wer Aufgabe 13 nicht gemacht hat, legt schnell ein Ticket an: Typ `FEATURE`,
Titel „Phase NEU in der Chancen-Liste blau unterlegen", Beschreibung aus dem
Screenshot [`bilder/13-chancen-neu-blau.png`](bilder/13-chancen-neu-blau.png).

## Schritte

1. **Verfeinern (Definition).** Öffnet euer Ticket unter
   <http://localhost:7200/admin/tickets> (Kachel `admin` anklicken). Lest es
   wie ein Entwickler: Was würde er fragen? Welches Blau? Nur NEU oder auch die
   anderen Phasen? Ganze Zeile oder nur die Zelle? Schreibt eure Antworten als
   Kommentar und klickt **Kommentar senden**. Die KI liest gleich Beschreibung
   und alle Kommentare — was ihr jetzt beantwortet, muss sie nicht fragen
   oder raten. Offene Fragen, die ihr nicht
   beantworten könnt, dürfen stehen bleiben — die KI wird sie stellen.
2. **Übergeben (Bereit).** Klickt **Nach Bereit**. Das Ticket wandert in die
   Spalte **Bereit**, Owner ist jetzt die KI. Damit sagt ihr: Das Ticket ist klar genug, um es
   abzugeben. Das Board zeigt allen, wer gerade dran ist. (Daneben gibt es „An KI
   übergeben" — das lässt das Ticket in Definition, damit die KI es nur
   verfeinert. Das brauchen wir heute nicht.)
3. **Die KI nimmt es (In Arbeit).** Startet den Agenten im Projektordner —
   `claude` oder `copilot` — und gebt den Prompt unten ein — mit eurer
   Ticketnummer. Lasst das Board offen: Das Ticket springt auf **In Arbeit**.
4. **Plan prüfen.** Der Agent zeigt euch einen Plan, bevor er baut. Steht darin
   genau das, was im Ticket steht — und nicht mehr? Wenn nicht, korrigiert es.
5. **Rückfrage beantworten (Wartet).** Stellt die KI eine Frage, springt das
   Ticket auf **Wartet**, Owner Mensch. Öffnet es, beantwortet die Frage als
   Kommentar und klickt **Zurück an KI** — das Ticket geht nach **Bereit**. Die
   Antwort bleibt so beim Ticket: Wer es später liest, sieht, was gefragt und
   was entschieden wurde.
   Sagt dem Agenten dann: „Ticket ‹Nr› ist beantwortet, mach weiter."
6. **Abnehmen (Erledigt).** Ist das Ticket in **Erledigt**, lest den letzten
   Kommentar der KI. Dann ladet <http://localhost:7200/chancen> neu und geht
   eure Akzeptanzkriterien einzeln durch. Der Kommentar sagt, was die KI
   geändert hat; geprüft wird trotzdem gegen eure Kriterien, nicht gegen
   ihre Beschreibung. Zum Schluss: `git diff main --stat`.

## Folienschritte

1. Ticket verfeinern: Antworten als Kommentar.
2. „Nach Bereit" — die KI ist dran.
3. Der Agent holt das Ticket, ihr prüft den Plan.
4. Rückfrage? Beantworten und „Zurück an KI".
5. Erledigt: im Browser gegen die Akzeptanzkriterien abnehmen.

## Prompt

```
Arbeite Ticket <Nr> aus dem Ticket-Board ab. Die API ist in
docs/specs/SPEC-API-TICKETS.md beschrieben, sie läuft unter
http://localhost:7070; von localhost brauchst du kein Token.

1. Setze das Ticket auf In Arbeit (POST /api/tickets/<Nr>/start) und lies
   Beschreibung und alle Kommentare (GET /api/tickets/<Nr>).
2. Ist etwas unklar, rate nicht: Stelle genau eine Frage mit
   POST /api/tickets/<Nr>/ask und hör dann auf.
3. Sonst zeig mir einen kurzen Plan und warte auf mein Okay.
4. Lege von main aus den Branch feature/ticket-<Nr> an. Setze nur um, was im
   Ticket steht. Nur Frontend.
5. Committe die Änderung auf dem Branch.
6. Schließe mit POST /api/tickets/<Nr>/done und einem Kommentar, was du
   geändert hast und wie man es prüft.

Erstelle keinen PR und pushe nicht — du hast bei diesem Repo nicht die Rechte
dazu. Schreibe keine Tests, die den Browser automatisieren.
```

## Abnahme

- [ ] Das Ticket steht in **Erledigt** und hat Kommentare von euch und von der
      KI — der Verlauf zeigt jede Übergabe.
- [ ] In der Chancen-Liste ist die Phase NEU blau unterlegt; alle anderen
      Phasen sehen aus wie vorher.
- [ ] Jedes Akzeptanzkriterium aus dem Ticket ist im Browser geprüft —
      mit Ja oder Nein.
- [ ] `git diff main --stat`: Änderungen nur unter `frontend/`.

## Troubleshooting

| Problem | Lösung |
|---|---|
| „Nach Bereit" fehlt oder ist ausgegraut | Sichtbar nur als Admin und nur, solange das Ticket in Definition steht; gehört es schon der KI, ist der Knopf ausgegraut. |
| Der Agent bekommt `401` von der API | Handheben — oder dem Agenten sagen: „Die Ticket-API antwortet mit 401. Prüfe die Einstellungen in backend/.env nach docs/SETUP.md." |
| Der Agent bekommt `409` beim Start | Das Ticket steht nicht in Bereit oder gehört nicht der KI — auf dem Board prüfen, ggf. „Nach Bereit" klicken. |
| Das Ticket bleibt in In Arbeit hängen | Der Agent hat `done` vergessen: „Schließe Ticket ‹Nr› mit POST /done und einem Kommentar." |
| Der Agent baut mehr als verlangt | Am Plan stoppen: „Nur das, was im Ticket steht." |
| NEU ist nach dem Neuladen nicht blau | Frontend neu gebaut? Im Terminal mit `./start.sh` nach Fehlern sehen, sonst zurück an den Agenten mit dem, was ihr seht. |

## Diskussion

- Welche Frage hat die KI gestellt — und hätte euer Ticket sie schon
  beantworten können?
- An welcher Übergabe habt ihr am meisten entschieden: Verfeinern, Plan oder
  Abnahme?
- Was würde sich ändern, wenn niemand den Plan liest und die KI direkt
  von Bereit bis Erledigt durchläuft?
