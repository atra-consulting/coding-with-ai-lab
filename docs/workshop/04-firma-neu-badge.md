# 04 — „Neu"-Kennzeichnung für junge Firmen

**Umfang:** klein · **Bereiche:** Backend + Frontend · **Dauer:** ~20 Min

## Ziel

Firmen, die in den letzten 7 Tagen angelegt wurden, bekommen in der Liste
einen kleinen grünen „NEU"-Badge neben dem Namen. So sehen Anwender sofort,
was frisch ist.

Dafür muss das `createdAt`-Feld aus der Datenbank im API-Response enthalten
sein und im Frontend ausgewertet werden.

## Prompt

```
/plan-and-do "Firmen, die jünger als 7 Tage sind, in der Firmen-Liste mit einem kleinen grünen NEU-Badge neben dem Firmennamen kennzeichnen. Backend: sicherstellen, dass createdAt der Firma im GET /api/firmen und GET /api/firmen/:id Response enthalten ist (FirmaDTO ergänzen, falls nicht). Frontend: in der Liste (firma-list) Cell-Renderer, der Firmenname plus optionalen Badge rendert. Badge nur wenn createdAt innerhalb der letzten 7 Tage liegt."
```

## Erwartetes Ergebnis

- `FirmaDTO` / Service-Response enthält `createdAt` (ISO-Datum).
- Firmen-Liste: neben dem Namen steht ein Badge, wenn Firma < 7 Tage alt ist.
- Badge verschwindet automatisch nach 7 Tagen.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `createdAt` ist `null` für alte Firmen | Migration hat die Spalte nicht gefüllt. Entweder `./start.sh --reset-db` für frische DB oder `createdAt ?? null` im Frontend defensiv behandeln — Badge einfach nicht anzeigen. |
| Badge erscheint bei allen Firmen | Datums-Vergleich falsch. Millisekunden-Differenz: `(Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000`. |
| `createdAt` fehlt im JSON | Spalte existiert in `config/migrate.ts` (`created_at`), aber Service mappt nicht. In `firmaService.ts` im `toDTO`-Mapping ergänzen. |
| Badge überlappt Firmenname | Bootstrap-Klasse `ms-2` (margin-start) hinzufügen für Abstand. |

## Diskussionspunkte

- Sollte „Neu" konfigurierbar sein (7 Tage vs. 30 Tage)?
- Könnte man das gleiche Muster für „Zuletzt aktualisiert" nutzen?
