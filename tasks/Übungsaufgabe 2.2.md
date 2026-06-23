# 2.2 — Chance-Erweiterungen: Phasen-Badges + Notiz-Feld

**Umfang:** mittel · **Bereiche:** Datenbank + Backend + Frontend · **Dauer:** ~40 Min

## Ziel

Zwei komplementäre Erweiterungen für die Entität `Chance` in einem Durchlauf:

1. **Phasen-Badges (Frontend):** Die Phase wird in Liste und Detail bislang
   als reiner Text angezeigt. Wir rendern sie als farbigen Bootstrap-Badge,
   damit der Status auf einen Blick erkennbar ist:
   - `NEU` → blau (primary)
   - `QUALIFIZIERT` → hellblau (info)
   - `ANGEBOT` → gelb (warning)
   - `VERHANDLUNG` → dunkelgrau (secondary)
   - `GEWONNEN` → grün (success)
   - `VERLOREN` → rot (danger)
2. **Notiz-Feld (Full-Stack):** Chancen bekommen ein freies, mehrzeiliges
   Notiz-Feld (z. B. für Protokoll-Auszüge wie „Kunde braucht noch
   Budget-Freigabe"). Die Änderung geht durch den kompletten Stack:
   Schema → Service → DTO → Form → Detail.

Gute Aufgabe, um zu zeigen, wie Claude `db-coder`, `be-coder` und `fe-coder` Subagents 
parallel orchestriert und gleichzeitig eine rein visuelle Frontend-Änderung bündelt.

## Prompt

Claude starten und mit Tein den Auto-Modus schalten. Dann folgenden Prompt ausführen, der den `/project:plan-and-do` Skill aufruft.

```
/project:plan-and-do Zwei Erweiterungen für Chance in einem Durchlauf.

Teil 1: In der Chancen-Liste und auf der Chancen-Detailseite
die Phase nicht mehr als Text, sondern als farbigen Badge anzeigen.

Teil 2: Chance bekommt ein neues, optionales Notiz-Feld für freien,
mehrzeiligen Text (bis 2000 Zeichen). Im Formular ist es eine dreizeilige
Textarea, auf der Detailseite wird die Notiz mit erhaltenen Zeilenumbrüchen
angezeigt. In der Liste taucht die Notiz nicht auf.
```

## Erwartetes Ergebnis

### Teil 1 — Phasen-Badges
- `chance-list.component`: ag-Grid `cellRenderer` oder `cellClassRules` zeigt
  `<span class="badge bg-success">GEWONNEN</span>` etc.
- `chance-detail.component`: gleiche Badge-Darstellung.
- Gemeinsame Helper-Funktion oder Pipe für das Farb-Mapping (DRY).

### Teil 2 — Notiz-Feld
- Neue Spalte `notes TEXT` in der `chance`-Tabelle.
- Drizzle-Schema + Migration konsistent.
- Backend akzeptiert und liefert `notes`.
- Form hat Textarea mit `maxLength=2000`.
- Detail zeigt Notiz als vorformatierten Text (Zeilenumbrüche erhalten).

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Badge wird als Text `<span>…</span>` angezeigt | ag-Grid rendert HTML nicht per Default. `cellRenderer` als Funktion nutzen, die Element zurückgibt, **oder** Angular-Template-Renderer. |
| Badges zu klein / zu groß | Bootstrap-Klasse `badge` erzeugt kleine Badges. Bei Bedarf zusätzlich `fs-6` oder custom CSS. |
| Farbe stimmt nicht mit Enum-Wert überein | Enum-Werte in `frontend/src/app/core/models/chance.model.ts` prüfen — Groß-/Kleinschreibung. |
| Pipe wird nicht erkannt | Standalone-Pipe muss in `imports: [...]` der Komponente eingetragen sein. |
| „no such column: notes" beim Laden | Migration lief nicht. App-Restart hilft meist, sonst `./start.sh --reset-db`. |
| Validation schlägt fehl, obwohl Feld leer | Feld ist als optional gedacht. Im Zod-Schema: `z.string().max(2000).optional().nullable()`. |
| Zeilenumbrüche im Detail verschwinden | CSS `white-space: pre-wrap` auf das Detail-Element setzen. |
| Drizzle-Schema und migrate.ts driften auseinander | Beide müssen die Spalte haben. `migrate.ts` ist Runtime-Source-of-Truth, Drizzle-Schema für Typ-Inferenz. Claude bitten, beide zu synchronisieren. |
| Update-Request liefert 400 | Zod-Schema für Update ebenfalls ergänzen (nicht nur Create). |
| Person hat bereits ein Notes-Feld — Verwirrung | Ja, das ist gewollt. Chance hat noch keines. Claude darf den Person-Weg als Vorlage nehmen. |

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
