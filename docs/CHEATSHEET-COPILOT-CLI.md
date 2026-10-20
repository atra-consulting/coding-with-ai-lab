# Copilot CLI — Spickzettel für Einsteiger

> KI-gestützte Entwicklung direkt im Terminal. Schnellreferenz für den ersten Tag.

---

## Was ist Copilot CLI?

GitHubs CLI für KI-gestütztes Programmieren. Läuft in jedem Terminal, liest den Projektkontext (`CLAUDE.md`), bearbeitet Dateien und führt Befehle aus.

---

## Installieren und starten

```bash
npm install -g @github/copilot   # Installieren (Node.js 22+)
copilot                          # Copilot CLI starten
copilot --resume                 # Frühere Session wieder aufnehmen
copilot -p "Was macht dieses Projekt?"   # Headless: ein Prompt, dann Ende
```

Beim ersten Start: Ordner als vertrauenswürdig bestätigen, dann `/login` (GitHub-Konto im Browser).

---

## Projekt-Skills und Subagents

| Befehl | Bedeutung |
|--------|-----------|
| `/review` | Projekt-Skill: Code-Änderungen mit iterativem Feedback prüfen (ersetzt das eingebaute `/review`) |
| `/write-ticket` | Projekt-Skill: Feedback in ein neues Kanban-Ticket verwandeln |
| `/update-agent-files` | Projekt-Skill: Agents, Specs und `CLAUDE.md` mit dem Code synchron halten |
| `/skills` | Alle Skills anzeigen |
| `/agent` | Subagents anzeigen und auswählen |

Subagents kannst du auch im Klartext anfordern: „Nutze den `be-reviewer`, um diese Route zu prüfen."

Skills liegen in `.claude/skills/`, Subagents in `.github/agents/` (generiert, nicht von Hand ändern).

---

## Slash-Befehle

| Befehl | Bedeutung |
|--------|-----------|
| `/help` | Hilfe anzeigen |
| `/login` | Mit GitHub anmelden |
| `/model` | KI-Modell wechseln |
| `/context` | Kontext-Auslastung anzeigen |
| `/compact` | Gesprächsverlauf zusammenfassen (gibt Kontext frei) |
| `/usage` | Verbrauch der Session anzeigen |
| `/diff` | Änderungen der Session anzeigen |
| `/rewind` | Zu einem früheren Stand zurückgehen |
| `/resume` | Frühere Session fortsetzen |
| `/session` | Infos zur aktuellen Session |
| `/permissions` | Berechtigungen anzeigen und verwalten |
| `/allow-all` | Alle Aktionen ohne Rückfrage erlauben |
| `/add-dir` | Weiteres Verzeichnis freigeben |
| `/mcp` | MCP-Server verwalten |
| `/init` | Projekt-Anweisungen für Copilot anlegen |

---

## Tastenkombinationen

| Taste | Aktion |
|-------|--------|
| `Enter` | Nachricht senden |
| `Shift+Tab` | Modus wechseln (z. B. Plan-Modus) |
| `Esc` | Laufende Antwort abbrechen |
| `↑ / ↓` | Verlauf navigieren |
| `@datei` | Datei in den Prompt holen |
| `!befehl` | Shell-Befehl direkt ausführen (z. B. `!ls`) |

---

## Gute Anweisungen geben

- **Konkret sein.** Dateinamen, Zeilennummern und erwartetes Verhalten nennen.
- **Einen Schritt auf einmal.** Nicht mehrere unabhängige Aufgaben in einer Nachricht.
- **Fehler einfügen.** Fehlermeldung direkt in die Nachricht kopieren.
- **Kontext geben.** "Ich bin Anfänger", "Nur TypeScript", "Kein Framework."
- **Nachfragen.** "Erkläre das" oder "Zeig mir alle Änderungen" sind gültige Anweisungen.
- **Erst planen.** Mit `Shift+Tab` in den Plan-Modus. Plan lesen, dann bauen lassen.

---

## Kontext im Blick behalten

| Befehl | Wann |
|--------|------|
| `/context` | Wie voll ist das Kontextfenster? |
| `/compact` | Kontext fast voll — Verlauf zusammenfassen |
| `/usage` | Wie viel hat die Session verbraucht? |

---

## Berechtigungen

Copilot CLI fragt vor riskanten Aktionen nach (Dateien ändern, Befehle ausführen). Du erlaubst einmal, erlaubst für die ganze Session oder lehnst ab.

| Befehl / Flag | Bedeutung |
|---------------|-----------|
| `/permissions` | Erteilte Berechtigungen ansehen |
| `/allow-all` | Ab jetzt alles ohne Rückfrage erlauben |
| `copilot --allow-all` | Ohne Rückfragen starten — nur in isolierten Workshop-Umgebungen |
| `copilot -p "..." --allow-all --no-ask-user` | Headless, ohne Rückfragen an dich |

---

## Wenn du nicht weiterkommst

| Problem | Lösung |
|---------|--------|
| Copilot wirkt "verwirrt" | Neue Session starten |
| Kontextfenster voll | `/compact` |
| Antwort läuft in die falsche Richtung | `Esc`, dann neu formulieren |
| Falsche Änderung gemacht | `/rewind` |
| Ergebnisse passen nicht | Mehr Details, Fehlertexte und Dateinamen angeben |
| Aufgabe zu groß | In kleinere Schritte aufteilen |

---

> Copilot CLI liest deinen Code — du gibst die Richtung vor.
