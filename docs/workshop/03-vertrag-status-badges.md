# 03 — Status-Badges für Verträge

**Umfang:** klein · **Bereiche:** Frontend · **Dauer:** ~15 Min

## Ziel

Analog zu den Phasen-Badges für Chancen (Aufgabe 02) zeigen wir den
Vertrags-Status als farbigen Bootstrap-Badge — in Liste **und**
Detail-Ansicht.

Mapping:

- `ENTWURF` → secondary (grau)
- `AKTIV` → success (grün)
- `PAUSIERT` → warning (gelb)
- `BEENDET` → dark (dunkelgrau)
- `GEKUENDIGT` → danger (rot)

## Prompt

```
/plan-and-do "Status-Feld im Vertrags-Modul als farbigen Bootstrap-Badge darstellen. In der Liste (frontend/src/app/features/vertrag/vertrag-list) und im Detail (frontend/src/app/features/vertrag/vertrag-detail). Mapping: ENTWURF=secondary, AKTIV=success, PAUSIERT=warning, BEENDET=dark, GEKUENDIGT=danger. Falls es in Aufgabe 02 bereits einen BadgePipe oder Helper gibt, diesen Ansatz wiederverwenden."
```

## Erwartetes Ergebnis

- Vertrags-Liste zeigt bunte Status-Badges.
- Detail-Ansicht zeigt den gleichen Badge.
- Keine Backend-Änderungen.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Enum-Werte unbekannt | Claude bitten, `frontend/src/app/core/models/vertrag.model.ts` zu lesen und Mapping an die tatsächlichen Werte anzupassen. |
| Badge-Text abgeschnitten in ag-Grid | Spaltenbreite anpassen oder `white-space: nowrap` im CSS. |
| `dark`-Badge kaum lesbar | Bootstrap `text-light` zusätzlich, oder auf `bg-secondary` wechseln. |
| Inkonsistent zu Chance-Badges | Prüfen, ob Helper/Pipe aus Aufgabe 02 wiederverwendet wurde. Falls nicht, gemeinsame Basis schaffen. |

## Diskussionspunkte

- Wann lohnt sich eine gemeinsame `StatusBadgeComponent`?
- Wie geht man vor, wenn ein neuer Status dazukommt — welche Stellen müssen
  aktualisiert werden?
