# 06 — Duplikat-Erkennung für Firmen/Personen

**Dauer:** 60 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200` (`GOOGLE_GEMINI_KEY` nur für den optionalen Schritt 3)
**Ziel:** Beim Anlegen einer Firma oder Person warnt die Anwendung vor einem sehr ähnlichen bestehenden Eintrag.
**Ergebnis:** Ein Dialog, der mögliche Duplikate mit Ähnlichkeits-Score zeigt und drei Wege anbietet.

Klassisches Fuzzy-Matching plus optionale KI-Validierung. Bei Verdacht kann
der User die Einträge zusammenführen.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und eine Firma anlegen, deren Name einer
   bestehenden fast gleicht.
4. Im Dialog „Vorhandenen öffnen" wählen und — falls gebaut — die beiden
   Einträge zusammenführen, dann prüfen, ob Aktivitäten und Chancen noch
   hängen.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "Duplikat-Erkennung für Firmen und Personen. Schritt 1: Beim Speichern einer neuen Firma oder Person prüft das System, ob es schon einen sehr ähnlichen Eintrag gibt (Namensvergleich, bei Personen zusätzlich E-Mail). Schritt 2: Findet das System mögliche Duplikate, erscheint ein Dialog mit dem Text 'Möglicher Duplikat: [Name]. Trotzdem speichern?' und den Optionen 'Trotzdem anlegen', 'Vorhandenen öffnen', 'Abbrechen'. Schritt 3 (optional): Ist der Treffer nur knapp ein Duplikat, fragt zusätzlich die Google Gemini API, ob es wirklich dieselbe Firma oder Person ist. Schritt 4 (optional): Ein 'Zusammenführen'-Button auf der Detailseite kombiniert zwei Einträge zu einem und erhält dabei alle bestehenden Verknüpfungen (Aktivitäten, Chancen, Adressen)."
```

## Abnahme

- Neue Firma / Person lösen vor dem Speichern eine Duplikat-Prüfung aus.
- Bei Treffer zeigt ein Dialog mögliche Duplikate mit Ähnlichkeits-Score.
- Optional: „Zusammenführen"-Button im Detail-View.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Levenshtein ist O(n·m) und langsam bei vielen Datensätzen | Vor-Filter per `LOWER(name) LIKE '%xyz%'` auf erstem Buchstaben / Trigramm. Danach Levenshtein nur auf Vorauswahl. |
| Umlaute zerstören den Vergleich | Normalisieren: NFKD + Diacritics entfernen, dann vergleichen. |
| KI-Validierung dauert zu lange | Nur in Grenzfällen einsetzen (z. B. Score zwischen 0.7 und 0.85), nicht bei jedem Check. |
| Merge bricht FK-Constraints | Referenzen (Aktivitäten, Chancen, Adressen, Personen → Firma) VOR dem Löschen umhängen. Transaktion verwenden. |
| False Positives bei kurzen Namen („ABC GmbH" vs. „ABD GmbH") | Mindestlänge für Match (> 4 Zeichen) oder gewichteter Score mit mehreren Feldern (Name + Email + Stadt). |

## Diskussion

- Wann lohnt sich klassisches Fuzzy-Matching, wann ein ML-Klassifikator,
  wann direkt das LLM?
- UX-Frage: Pre-Check vor dem Speichern vs. Hinweis nach dem Speichern —
  Vor- und Nachteile?
- Audit-Trail: Wie protokolliert man Merge-Operationen rückverfolgbar?
