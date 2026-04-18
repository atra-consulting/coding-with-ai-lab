# 05 — Notiz-Feld für Personen

**Umfang:** mittel · **Bereiche:** Datenbank + Backend + Frontend · **Dauer:** ~25 Min

## Ziel

Personen sollen ein freies, mehrzeiliges Notiz-Feld bekommen (z. B. für
Zusatzinfos wie „bevorzugt Kommunikation per E-Mail"). Die Änderung geht
durch den kompletten Stack: Schema → Service → DTO → Form → Detail.

Gute Aufgabe, um zu zeigen, wie Claude den `db-coder`, `be-coder` und
`fe-coder` Sub-Agents parallel nutzt.

## Prompt

```
/plan-and-do "Person bekommt ein neues optionales Feld 'notiz' (TEXT, freier mehrzeiliger Text, bis 2000 Zeichen). Datenbank: Spalte in backend/src/config/migrate.ts und Drizzle-Schema in backend/src/db/schema/schema.ts ergänzen. Backend: PersonDTO, Create-/Update-Validation, Service — notiz durchreichen. Frontend: im Person-Formular (person-form) ein <textarea> mit drei Zeilen einfügen, im Person-Detail (person-detail) das Feld anzeigen, falls gesetzt. Keine Auswirkung auf Liste."
```

## Erwartetes Ergebnis

- Neue Spalte `notiz TEXT` in der `person`-Tabelle.
- Drizzle-Schema + Migration konsistent.
- Backend akzeptiert und liefert `notiz`.
- Form hat Textarea mit `maxLength=2000`.
- Detail zeigt Notiz als vorformatierten Text (Zeilenumbrüche erhalten).

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| „no such column: notiz" beim Laden | Migration lief nicht. App-Restart hilft meist, sonst `./start.sh --reset-db`. |
| Validation schlägt fehl, obwohl Feld leer | Feld ist als optional gedacht. Im Zod-Schema: `z.string().max(2000).optional().nullable()`. |
| Zeilenumbrüche im Detail verschwinden | CSS `white-space: pre-wrap` auf das Detail-Element setzen. |
| Drizzle-Schema und migrate.ts driften auseinander | Beide müssen die Spalte haben. `migrate.ts` ist Runtime-Source-of-Truth, Drizzle-Schema für Typ-Inferenz. Claude bitten, beide zu synchronisieren. |
| Update-Request liefert 400 | Zod-Schema für Update ebenfalls ergänzen (nicht nur Create). |

## Diskussionspunkte

- Warum gibt es in diesem Projekt zwei Schema-Definitionen (migrate.ts +
  Drizzle)? Stichwort: Source of Truth.
- Wann würde man Notizen als eigene Entität mit Historie modellieren?
