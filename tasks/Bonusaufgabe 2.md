# B 2 — Dunkelmodus-Umschalter

**Umfang:** klein · **Bereiche:** Frontend · **Dauer:** ~20 Min

## Ziel

Rechts oben in der Kopfzeile erscheint ein kleiner Mond-/Sonne-Icon-Button.
Klick schaltet zwischen Hell- und Dunkelmodus. Die Wahl wird in
`localStorage` gespeichert und beim nächsten Seitenladen wiederhergestellt.

Bootstrap 5.3 unterstützt das nativ über `data-bs-theme="dark"` am
`<html>`-Element — kein eigenes CSS nötig.

## Prompt

Claude starten und mit Tab den Auto-Modus schalten. Mit `/model` Sonnet
auswählen und dann folgenden Prompt ausführen, der den
`/project:plan-and-do` Skill aufruft. 

```
/plan-and-do Dunkelmodus-Umschalter im Header. 
Erstellen keinen PR und pushe nicht - du hast bei diesem Repo nicht
die Rechte dazu. Schreibe keine Tests, die den Browser automatisieren,
und mache nur eine statt drei Review-Runden. Aktualisiere am Schluss
auch nicht die Specs und Subagents.

Kleiner Icon-Button rechts oben: Klick schaltet die gesamte App
zwischen hell und dunkel um. Die Wahl wird gespeichert und beim
nächsten Öffnen wiederhergestellt.
```

## Erwartetes Ergebnis

- Button im Header (`layout/header` oder Sidebar-Nähe).
- Nach Klick wechselt die komplette App-Farbpalette.
- Nach Seitenaktualisierung bleibt der gewählte Modus erhalten.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Nichts passiert beim Klick | Bootstrap-Version prüfen — `data-bs-theme` funktioniert erst ab Bootstrap 5.3. `package.json` checken. |
| Nur teilweise dunkel (z. B. Cards bleiben hell) | Custom-CSS überschreibt Bootstrap-Variablen. Im dunklen Modus muss SCSS die `--bs-*` Variablen respektieren, keine Hex-Codes direkt. |
| Icon wechselt nicht | Getter im Component basierend auf aktuellem Theme-State; `@if` (nicht `*ngIf`) im Template. `FaIconComponent` muss in `imports: [...]` stehen. |
| Flackern beim Laden (FOUC) | Theme aus `localStorage` bereits in `index.html` via Inline-Script setzen, bevor Angular bootstrapped. |
| ag-Grid bleibt hell | Separates Theme — CSS-Klasse `ag-theme-alpine-dark` dynamisch setzen, wenn Dark Mode aktiv. |

## Diskussionspunkte

- System-Präferenz respektieren: `window.matchMedia('(prefers-color-scheme: dark)')`?
- Warum `localStorage` und nicht Backend-Profil?
