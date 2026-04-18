# 08 — Icons für Aktivitätstypen

**Umfang:** klein · **Bereiche:** Frontend · **Dauer:** ~10 Min

## Ziel

In der Aktivitäten-Liste wird der `typ` (z. B. ANRUF, EMAIL, MEETING, NOTIZ)
mit einem passenden Bootstrap-Icon versehen. Klein, aber visuell
aufwertend.

Mapping-Vorschlag:

- `ANRUF` → `bi-telephone`
- `EMAIL` → `bi-envelope`
- `MEETING` → `bi-people`
- `NOTIZ` → `bi-sticky`
- sonst → `bi-circle`

## Prompt

```
/plan-and-do "In der Aktivitäten-Liste (frontend/src/app/features/aktivitaet/aktivitaet-list) vor dem Typ-Text ein Bootstrap-Icon rendern. Mapping: ANRUF=bi-telephone, EMAIL=bi-envelope, MEETING=bi-people, NOTIZ=bi-sticky, Fallback=bi-circle. Icon + Typ in einer Zelle, Abstand durch me-2. Genaue Enum-Werte aus frontend/src/app/core/models/aktivitaet.model.ts übernehmen. Keine Backend-Änderungen."
```

## Erwartetes Ergebnis

- Jede Zeile in der Aktivitäten-Liste zeigt links vom Typ ein Icon.
- Icons sind über Bootstrap Icons (bereits im Projekt verfügbar) eingebunden.
- Unbekannte Typen bekommen ein neutrales Fallback-Icon.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Icon wird als Kasten / Text angezeigt | Bootstrap-Icons-CSS nicht geladen. In `styles.scss` oder `angular.json` prüfen, ob `bootstrap-icons/font/bootstrap-icons.css` importiert ist. |
| Enum-Werte weichen ab (z. B. `CALL` statt `ANRUF`) | Claude Model-Datei lesen lassen und Mapping anpassen. |
| ag-Grid rendert HTML nicht | `cellRenderer` als Funktion oder Angular-Component-Renderer. Template-String alleine reicht nicht. |
| Icons in verschiedenen Größen | `fs-5` oder `fs-6` für einheitliche Größe ergänzen. |

## Diskussionspunkte

- Würde eine eigene `ActivityTypeIconComponent` lohnen?
- Wie skaliert das, wenn 20 Typen dazukommen — Konfigurationsdatei?
