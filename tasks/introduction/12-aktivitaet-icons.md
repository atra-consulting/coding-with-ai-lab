# 12 — Icons für Aktivitätstypen

**Dauer:** 10 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** In der Aktivitäten-Liste steht vor dem Typ ein passendes FontAwesome-Icon.
**Ergebnis:** Fünf Typ-Icons plus ein neutrales Fallback, klein im Code und sofort sichtbar.

Mapping-Vorschlag (FontAwesome Solid): `ANRUF` → `faPhone`, `EMAIL` →
`faEnvelope`, `MEETING` → `faUsers`, `NOTIZ` → `faNoteSticky`, `AUFGABE` →
`faListCheck`, sonst → `faCircle`.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und die Aktivitäten-Liste öffnen.
4. Prüfen, ob jede Zeile links vom Typ ein Icon zeigt und ein unbekannter
   Typ das Fallback bekommt.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "In der Aktivitäten-Liste vor dem Typ-Text ein passendes Icon anzeigen. Mapping: Anruf → Telefon-Icon, E-Mail → Briefumschlag, Meeting → mehrere Personen, Notiz → Notizzettel, Aufgabe → Checkliste. Unbekannte Typen bekommen ein neutrales Fallback-Icon. Keine weiteren Änderungen."
```

## Abnahme

- Jede Zeile in der Aktivitäten-Liste zeigt links vom Typ ein Icon.
- Icons werden über `FaIconComponent` gerendert (`<fa-icon [icon]="…"></fa-icon>`).
- Unbekannte Typen bekommen ein neutrales Fallback-Icon.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `FaIconComponent` wird nicht erkannt | Standalone-Component importieren: `imports: [FaIconComponent]` in `@Component`. |
| Icon wird nicht angezeigt | Import prüfen: `import { faPhone, faEnvelope, ... } from '@fortawesome/free-solid-svg-icons';`. Icon-Referenzen als Properties im Component ablegen. |
| Enum-Werte weichen ab | Claude Model-Datei lesen lassen und Mapping anpassen. |
| ag-Grid rendert Angular-Component nicht | `cellRenderer` als Angular-Component-Renderer registrieren — reiner Template-String reicht nicht. Alternative: String mit HTML-Badge, aber dann kein FA-Icon. |
| Icons in verschiedenen Größen | FontAwesome-Größen-Attribut nutzen: `<fa-icon [icon]="…" size="lg"></fa-icon>`. |

## Diskussion

- Würde eine eigene `ActivityTypeIconComponent` lohnen?
- Wie skaliert das, wenn 20 Typen dazukommen — Konfigurationsdatei?
