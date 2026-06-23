# Claude Code — Spickzettel für Einsteiger

> KI-gestützte Entwicklung direkt im Terminal. Schnellreferenz für den ersten Tag.

---

## Was ist Claude Code?

Anthropics offizieller CLI für KI-gestütztes Programmieren. Läuft in jedem Terminal, liest den Projektkontext, bearbeitet Dateien und führt Befehle aus.

---

## Starten

```bash
claude                 # Claude Code starten
claude --model sonnet  # Mit bestimmtem Modell starten
claude -c              # Letzte Konversation fortsetzen
claude -r              # Bestimmte Konversation wieder aufnehmen
```

Beim ersten Start öffnet Claude Code einen Browser für den Login (Anthropic-Konto oder API-Key).

---

## Slash-Befehle

| Befehl | Bedeutung |
|--------|-----------|
| `/help` | Hilfe anzeigen |
| `/clear` (alias: `/reset`) | Gesprächsverlauf löschen |
| `/compact` | Gesprächsverlauf durch eine Zusammenfassung ersetzen (gibt Kontext frei) |
| `/model [name]` | KI-Modell wechseln (z.B. `sonnet`, `opus`, `haiku`) |
| `/config` | Einstellungen öffnen |
| `/cost` | Sessionkosten anzeigen |
| `/memory` | Erinnerungen anzeigen und verwalten |

---

## Tastenkombinationen

| Taste | Aktion |
|-------|--------|
| `Enter` | Nachricht senden |
| `Shift+Enter` | Neue Zeile (kein Absenden) |
| `Ctrl+C` | Laufende Antwort abbrechen / Eingabe löschen |
| `Ctrl+D` | Claude Code beenden |
| `↑ / ↓` | Verlauf navigieren |
| `Tab` | Slash-Befehle autocomplete |
| `Esc` | Auswahl/Dialog abbrechen |
| `!befehl` | Shell-Befehl inline ausführen (z.B. `!ls`) |

---

## Gute Anweisungen geben

- **Konkret sein.** Dateinamen, Zeilennummern und erwartetes Verhalten nennen.
- **Einen Schritt auf einmal.** Nicht mehrere unabhängige Aufgaben in einer Nachricht.
- **Fehler einfügen.** Fehlermeldung direkt in die Nachricht kopieren.
- **Kontext geben.** "Ich bin Anfänger", "Nur TypeScript", "Kein Framework."
- **Nachfragen.** "Erkläre das" oder "Zeig mir alle Änderungen" sind gültige Anweisungen.

---

## Statuszeile verstehen

```
Sonnet 4.6: 40% | mein-projekt main | +1 ~2 -1
```

| Teil | Bedeutung |
|------|-----------|
| `Sonnet 4.6` | Aktuelles KI-Modell |
| `40%` | Kontextfenster-Auslastung — ab ~80% `/compact` nutzen |
| `mein-projekt` | Aktuelles Verzeichnis |
| `main` | Aktueller Git-Branch |
| `+1 ~2 -1` | Git-uncommittete Änderungen (nur mit Custom-Script): neue / geänderte / gelöschte Dateien |

**Statuszeile konfigurieren** — in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "/pfad/zu/statusline.sh"
  }
}
```

Das Shell-Script bekommt JSON via stdin (Modell, Kontext, Workspace-Infos). Git-Informationen ermittelt das Script selbst via `git status`.

---

## Berechtigungen

Claude Code fragt bei riskanten Aktionen nach (Dateien löschen, Befehle ausführen).

| Eingabe | Bedeutung |
|---------|-----------|
| `y` oder `Enter` | Erlauben (einmalig) |
| `a` | Immer erlauben (diese Session) |
| `n` | Ablehnen |
| `s` | Ablehnen und stoppen |

---

## Wenn du nicht weiterkommst

| Problem | Lösung |
|---------|--------|
| Claude wirkt "verwirrt" | `/clear` — neues Gespräch starten |
| Kontextfenster voll (>80%) | `/compact` |
| Antwort läuft in die falsche Richtung | `Ctrl+C`, dann neu formulieren |
| Ergebnisse passen nicht | Mehr Details, Fehlertexte und Dateinamen angeben |
| Aufgabe zu groß | In kleinere Schritte aufteilen |

---

> Claude Code liest deinen Code — du gibst die Richtung vor.
