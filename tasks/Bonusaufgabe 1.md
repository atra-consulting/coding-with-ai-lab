# B 1 — Chance-Erweiterungen: Phasen-Badges

**Umfang:** mittel · **Bereiche:** Frontend · **Dauer:** ~20 Min

## Ziel

Eine Erweiterungen für die Entität `Chance` :

**Phasen-Badges (Frontend):** Die Phase wird in Liste und Detail bislang
als reiner Text angezeigt. Wir rendern sie als farbigen Bootstrap-Badge,
damit der Status auf einen Blick erkennbar ist.

## Prompt

Claude starten und mit Tab den Auto-Modus schalten. Mit `/model` Sonnet
auswählen und dann folgenden Prompt ausführen, der den
`/project:plan-and-do` Skill aufruft. 

```
/plan-and-do Eine Erweiterungen für Chance.
Erstellen keinen PR und pushe nicht - du hast bei diesem Repo nicht
die Rechte dazu. Schreibe keine Tests, die den Browser automatisieren,
und mache nur eine statt drei Review-Runden. Aktualisiere am Schluss
auch nicht die Specs und Subagents.

Auf der Chancen-Detailseite sind die Phasen als farbige Badge angezeigt.
Zege auch in der Tabelle Chancen als farbige Badges.
```

## Erwartetes Ergebnis

- chance-list.component`: ag-Grid `cellRenderer` oder `cellClassRules` zeigt
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

- Wie würde man die Badge-Logik später auch für Aktivitätstypen
  wiederverwenden?
- Angular Pipe vs. Helper-Function — was ist idiomatischer in Angular 21?
- Person hat bereits ein `notes`-Feld — wie würde man beide vereinheitlichen?
- Wann würde man Notizen als eigene Entität mit Historie modellieren?
- Warum gibt es in diesem Projekt zwei Schema-Definitionen (migrate.ts +
  Drizzle)? Stichwort: Source of Truth.
- Lohnt es sich, solche unabhängigen Änderungen (Frontend-only vs. Full-Stack)
  in einem `/plan-and-do`-Durchlauf zu bündeln, oder besser in zwei
  separaten Runs mit jeweils eigenem Branch?
