# 09 — Dunkelmodus-Umschalter

**Dauer:** 20 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code
**Voraussetzung:** Lab läuft unter `localhost:7200`
**Ziel:** Ein Icon-Button im Header schaltet die App zwischen hell und dunkel, und die Wahl überlebt das Neuladen.
**Ergebnis:** Ein Umschalter, dessen Zustand in `localStorage` steht und beim nächsten Öffnen wiederhergestellt wird.

Bootstrap 5.3 kann das nativ über `data-bs-theme="dark"` am `<html>`-Element —
eigenes CSS braucht es dafür nicht.

## Schritte

1. Claude Code im Projekt-Root starten: `claude --dangerously-skip-permissions`.
2. Den Prompt einfügen und an den Checkpoints PRD, Plan und Review lesen,
   dann `Continue`.
3. App neu starten (`./start.sh`) und den Button rechts oben klicken.
4. Neu laden und prüfen, ob der Modus geblieben ist.
5. Diff ansehen: `git diff main --stat`.

## Prompt

```
/plan-and-do "Dunkelmodus-Umschalter im Header. Kleiner Icon-Button rechts oben: Mond im Hellmodus, Sonne im Dunkelmodus. Klick schaltet die gesamte App zwischen hell und dunkel um. Die Wahl wird gespeichert und beim nächsten Öffnen wiederhergestellt."
```

## Abnahme

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

## Diskussion

- System-Präferenz respektieren: `window.matchMedia('(prefers-color-scheme: dark)')`?
- Warum `localStorage` und nicht Backend-Profil?
