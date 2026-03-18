# Aufgabe 7: Duplikat-Erkennung für Firmen/Personen

## Beschreibung

Implementiere eine Duplikat-Erkennung, die bei der Neuanlage oder als Background-Job ähnliche Einträge identifiziert.

## Anforderungen

1. **Fuzzy-Matching** – Bei Neuanlage einer Firma oder Person werden ähnliche bestehende Einträge erkannt (z.B. via Levenshtein-Distanz oder ähnliche Algorithmen)
2. **KI-Validierung (optional)** – Ein LLM bestätigt, ob es sich wirklich um ein Duplikat handelt oder nur um eine Namensähnlichkeit
3. **UI-Warnhinweis** – Wird ein mögliches Duplikat erkannt, zeigt die UI einen Warnhinweis an
4. **Merge-Option** – Der User kann die Einträge zusammenführen

## Lernziel

- Kombination klassischer Algorithmen (Fuzzy-Matching) mit KI-Validierung
- Wann lohnt sich der KI-Einsatz und wann reichen klassische Methoden?
