# 11 — Branch, Änderung, Commit

**Dauer:** 25 min
**Sozialform:** einzeln oder Paare
**Werkzeug:** Terminal
**Voraussetzung:** Lab geklont und gestartet (Aufgabe 10)
**Ziel:** Ihr durchlauft den Arbeitszyklus einmal selbst — Branch anlegen, ändern, Unterschied ansehen, festschreiben: `git log --oneline -3` zeigt zwei eigene Commits auf eurem Branch, `git diff main --stat` genau eine geänderte Datei.

An Tag 2 tut der Agent genau das — ihr sollt es einmal selbst getan haben,
um zu wissen, was ein Diff und ein Commit sind.

Die Änderung ist echt: Euer PRD aus Aufgabe 03 kommt als Datei ins Repo,
dort, wo das Lab seine PRDs ablegt. Der Agent liest sie an Tag 2.

Die Aufgabe geht gut in Paaren: Eine Person tippt, die andere liest die
Schritte vor und sagt nach jedem Befehl, was `git status` jetzt zeigen
müsste. Nach Schritt 4 tauscht ihr. Jede Person arbeitet dabei in ihrem
eigenen Lab — der Branch und das PRD liegen auf dem Rechner, auf dem
getippt wurde.

## Schritte

1. Prüft im Projektordner `coding-with-ai-lab` (zweites Terminal) den
   Stand mit `git status` — sauber, und auf welchem Branch? — und
   `git log --oneline -5`.
2. Legt euren Branch nach dem Namensschema des Lab-Repos an:
   `git checkout -b training-0926/max-mustermann`, wobei `MMJJ` für Monat
   und Jahr steht, dann `git status` zur Kontrolle.
3. Legt `docs/prds/PRD-FIRMA-FAVORIT.md` an und kopiert das PRD aus
   Aufgabe 03 hinein — wer keins hat, kopiert das Muster-PRD aus Aufgabe 03:
   `cp tasks/business-consultants/material/PRD-FIRMA-FAVORIT.md docs/prds/`.
4. Schreibt die Datei fest: `git status` (neue Datei, „untracked"),
   `git add docs/prds/PRD-FIRMA-FAVORIT.md`, `git status` (jetzt „to be
   committed"), `git commit -m "docs: PRD Firmen als Favorit markieren"`,
   dann `git log --oneline -3` und `git show --stat`.
5. Ändert einen Satz im PRD, seht euch mit `git diff` die Zeilen mit − und
   + an — so sieht der Agent seine Änderung — und committet erneut mit
   `git add -A && git commit -m "docs: PRD präzisiert"`.
6. Öffnet im Browser einen Pull Request des Lab-Repos
   (<https://github.com/atra-consulting/coding-with-ai-lab/pulls>, auch
   geschlossene) und lest Beschreibung, Reiter „Files changed" und
   Kommentare — pushen könnt ihr nicht, im Lab-Repo fehlen die Rechte, und
   euer Branch bleibt lokal.

## Folienschritte

1. `git status` und `git log --oneline -5` ansehen.
2. Branch `training-<MMJJ>/<vornamenachname>` anlegen.
3. PRD aus Aufgabe 03 unter `docs/prds/` ablegen.
4. `git add`, `git commit`, `git log --oneline -3`.
5. Einen Satz ändern, `git diff` lesen, erneut committen.

## Abnahme

- Ihr könnt in einem Satz sagen, was `git status`, `git diff` und
  `git log` jeweils zeigen.
- Ihr wisst, warum der Agent an Tag 2 auf einem eigenen Branch arbeitet.

## Zwei Fallen beim ersten Commit

**Git kennt euch noch nicht.** Git schreibt in jeden Commit, wer ihn gemacht
hat. Auf einem Rechner, auf dem noch nie committet wurde, fehlen Name und
E-Mail — dann bricht der Commit mit `Please tell me who you are` ab. Das ist
kein Fehler von euch, sondern eine Einrichtung, die einmal pro Rechner nötig
ist:

```
git config --global user.name "Max Mustermann"
git config --global user.email "max@example.com"
```

Danach den Commit wiederholen. `git config --global --list` zeigt, was
eingetragen ist. Das Lab bleibt lokal; jede Adresse genügt.

**Ein Editor geht auf.** Wer `git commit` ohne `-m "…"` eintippt, landet in
einem Editor im Terminal, meist vim: links eine Spalte mit `~`, oben ein
leerer Bereich für die Commit-Nachricht, die Maus tut nichts. Raus kommt ihr
mit `Esc`, dann `:q!` und Enter — der Commit wird abgebrochen, kaputt ist
nichts. Danach den Commit mit `-m "Nachricht"` wiederholen. Unter Windows
erscheint statt vim manchmal nano (unten eine Zeile mit `^X Exit`): `Ctrl+X`
beendet ihn.

## Troubleshooting

| Problem | Lösung |
|---|---|
| `Please tell me who you are` beim Commit | `git config --global user.name "Max Mustermann"` und `git config --global user.email "max@example.com"`, dann Commit wiederholen. |
| Editor öffnet sich beim Commit (vim) | `Esc`, dann `:q!` — und `-m "…"` mitgeben. |
| `nothing to commit` | `git add` vergessen, oder Datei liegt außerhalb des Projektordners: `git status` sagt es. |
