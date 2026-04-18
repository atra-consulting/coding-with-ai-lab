# 02 — Farbige Phasen-Badges für Chancen

**Umfang:** klein · **Bereiche:** Frontend · **Dauer:** ~15 Min

## Ziel

In der Chancen-Liste wird die Phase bislang als reiner Text angezeigt. Wir
rendern sie als farbigen Badge, damit der Status auf einen Blick erkennbar
ist:

- `NEU` → blau (primary)
- `QUALIFIZIERT` → hellblau (info)
- `ANGEBOT` → gelb (warning)
- `VERHANDLUNG` → orange (custom oder warning dunkler)
- `GEWONNEN` → grün (success)
- `VERLOREN` → rot (danger)

## Prompt

```
/plan-and-do "In der Chancen-Liste (frontend/src/app/features/chance/chance-list) die Phase als farbigen Bootstrap-Badge rendern statt als Text. Mapping: NEU=primary, QUALIFIZIERT=info, ANGEBOT=warning, VERHANDLUNG=warning, GEWONNEN=success, VERLOREN=danger. Gleiches Mapping auch in der Detail-Ansicht verwenden, damit die Farben konsistent sind. Keine Backend-Änderungen."
```

## Erwartetes Ergebnis

- `chance-list.component`: ag-Grid `cellRenderer` oder `cellClassRules` zeigt
  `<span class="badge bg-success">GEWONNEN</span>` etc.
- `chance-detail.component`: gleiche Badge-Darstellung.
- Gemeinsame Helper-Funktion oder Pipe für das Farb-Mapping (DRY).

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Badge wird als Text `<span>…</span>` angezeigt | ag-Grid rendert HTML nicht per Default. `cellRenderer` als Funktion nutzen, die Element zurückgibt, **oder** Angular-Template-Renderer. |
| Badges zu klein / zu groß | Bootstrap-Klasse `badge` erzeugt kleine Badges. Bei Bedarf zusätzlich `fs-6` oder custom CSS. |
| Farbe stimmt nicht mit Enum-Wert überein | Enum-Werte in `frontend/src/app/core/models/chance.model.ts` prüfen — Groß-/Kleinschreibung. |
| Pipe wird nicht erkannt | Standalone-Pipe muss in `imports: [...]` der Komponente eingetragen sein. |

## Diskussionspunkte

- Wie würde man die gleiche Logik für Verträge in Aufgabe 03 wiederverwenden?
- Angular Pipe vs. Helper-Function — was ist idiomatischer in Angular 21?
