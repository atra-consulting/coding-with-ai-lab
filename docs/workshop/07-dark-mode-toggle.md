# 07 — Dunkelmodus-Umschalter

**Umfang:** klein · **Bereiche:** Frontend · **Dauer:** ~20 Min

## Ziel

Rechts oben in der Kopfzeile erscheint ein kleiner Mond-/Sonne-Icon-Button.
Klick schaltet zwischen Hell- und Dunkelmodus. Die Wahl wird in
`localStorage` gespeichert und beim nächsten Seitenladen wiederhergestellt.

Bootstrap 5.3 unterstützt das nativ über `data-bs-theme="dark"` am
`<html>`-Element — kein eigenes CSS nötig.

## Prompt

```
/plan-and-do "Dunkelmodus-Umschalter im Header hinzufügen. Icon-Button (Bootstrap Icons bi-moon / bi-sun) rechts oben. Klick setzt data-bs-theme am document.documentElement zwischen 'light' und 'dark' um. Aktuelle Wahl in localStorage unter Schlüssel 'app-theme' speichern und beim App-Start via APP_INITIALIZER oder im AppComponent ngOnInit wiederherstellen. Icon wechselt je nach Modus (Mond im Hellmodus, Sonne im Dunkelmodus). Keine Backend-Änderung."
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
| Icon wechselt nicht | Getter im Component basierend auf aktuellem Theme-State; `@if` (nicht `*ngIf`) im Template. |
| Flackern beim Laden (FOUC) | Theme aus `localStorage` bereits in `index.html` via Inline-Script setzen, bevor Angular bootstrapped. |
| ag-Grid bleibt hell | Separates Theme — CSS-Klasse `ag-theme-alpine-dark` dynamisch setzen, wenn Dark Mode aktiv. |

## Diskussionspunkte

- System-Präferenz respektieren: `window.matchMedia('(prefers-color-scheme: dark)')`?
- Warum `localStorage` und nicht Backend-Profil?
