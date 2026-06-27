import type { InArgs } from '@libsql/client';
import { client } from '../config/db.js';

interface TicketSeedRow {
  id: number;
  owner: string;
  type: string;
  title: string;
  body: string;
  status: string;
  solution: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketCommentSeedRow {
  id: number;
  ticketId: number;
  author: string;
  authorName: string | null;
  body: string;
  createdAt: string;
}

const TICKET_SEED: TicketSeedRow[] = [
  // 01-firmenkarte.md — TODO, owner=AI, FEATURE
  {
    id: 1,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Firmen auf einer Karte anzeigen',
    body: 'Es wäre schön, die Firmen irgendwo auf einer Karte zu sehen.\n\nBitte bau eine Karte ein, auf der man die Firmen findet.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T08:00:00.000Z',
    updatedAt: '2026-06-20T08:00:00.000Z',
  },
  // 02-crm-chat.md — TODO, owner=AI, FEATURE
  {
    id: 2,
    owner: 'AI',
    type: 'FEATURE',
    title: 'KI-Chat fürs CRM',
    body: 'Wir hätten gern einen KI-Chat im CRM, mit dem man Fragen zu den Daten stellen kann.\n\nMach das bitte.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T09:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
  },
  // 03-firmendossier.md — TODO, owner=AI, FEATURE
  {
    id: 3,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Firmendossier aus dem Internet',
    body: 'Zu jeder Firma sollen aktuelle Infos aus dem Internet angezeigt werden.\n\nSuch dir was Passendes und bau es ein.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
  },
  // 04-beziehungsanalyse.md — TODO, owner=AI, FEATURE
  {
    id: 4,
    owner: 'AI',
    type: 'FEATURE',
    title: 'KI-Beziehungsanalyse',
    body: 'Die KI soll die Beziehungen analysieren und etwas Sinnvolles dazu sagen.\n\nDie Details überlasse ich dir.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T11:00:00.000Z',
    updatedAt: '2026-06-20T11:00:00.000Z',
  },
  // 05-csv-import.md — TODO, owner=AI, FEATURE
  {
    id: 5,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Firmen aus Datei importieren',
    body: 'Man soll Firmen aus einer Datei importieren können. Die KI soll dabei helfen.\n\nBau das bitte so, dass es gut funktioniert.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-21T08:00:00.000Z',
    updatedAt: '2026-06-21T08:00:00.000Z',
  },
  // 06-dark-mode.md — TODO, owner=AI, FEATURE
  {
    id: 6,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Dunkelmodus-Umschalter im Header',
    body: '## Ziel\nEin Umschalter im Header schaltet die ganze App zwischen Hell- und Dunkelmodus um.\n\n## Anforderungen\n- Kleiner Icon-Button rechts oben im Header: Mond im Hellmodus, Sonne im Dunkelmodus.\n- Klick schaltet die gesamte App um.\n- Die Wahl wird in `localStorage` gespeichert und beim nächsten Laden wiederhergestellt.\n\n## Hinweise\n- Bootstrap 5.3 unterstützt Dunkelmodus nativ über das Attribut `data-bs-theme="dark"` am `<html>`-Element.\n- Icons über FontAwesome: `faMoon` / `faSun` aus `@fortawesome/free-solid-svg-icons`, gerendert mit `<fa-icon [icon]="…">`.\n- Reine Frontend-Aufgabe, keine Backend- oder DB-Änderung.\n\n## Fertig, wenn\n- [ ] Button im Header sichtbar, Icon passt zum aktuellen Modus.\n- [ ] Klick schaltet die ganze App um.\n- [ ] Nach Reload bleibt der gewählte Modus erhalten.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-21T09:00:00.000Z',
    updatedAt: '2026-06-21T09:00:00.000Z',
  },
  // 07-csv-export.md — ON_HOLD, owner=HUMAN, FEATURE (Will ask)
  {
    id: 7,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'CSV-Export für die Firmenliste',
    body: '## Ziel\nEin Button über der Firmenliste lädt alle Firmen als CSV-Datei herunter.\n\n## Anforderungen\n- Button „CSV-Export" über der Firmen-Liste.\n- Klick lädt `firmen-YYYY-MM-DD.csv` mit ALLEN Firmen herunter (nicht nur die aktuelle Seite).\n- Spalten: ID, Name, Branche, Telefon, E-Mail, Erstelldatum.\n- Excel öffnet die Datei korrekt, auch mit deutschen Umlauten.\n\n## Rückfrage erforderlich\nEine Entscheidung in dieser Aufgabe triffst du **nicht allein**: das Trennzeichen.\nKomma ist der CSV-Standard, aber deutsches Excel erwartet oft das Semikolon. Beides\nist vertretbar — die Wahl beeinflusst, ob die Datei mit einem Doppelklick sauber\nin Excel öffnet. Rate **nicht** und wähle keinen Standard. Bevor du Code schreibst:\n1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (Komma oder Semikolon?).\n2. Setze das Label `Input needed`.\n3. Warte auf die Antwort, bevor du weiterarbeitest.\n\n## Hinweise\n- Für Umlaute in Excel: UTF-8-BOM voranstellen und `Content-Type: text/csv; charset=utf-8` setzen.\n- Das Backend liefert die vollständige Liste (ohne Pagination), das Frontend stößt den Download an.\n\n## Fertig, wenn\n- [ ] Button vorhanden, Klick lädt die Datei.\n- [ ] Datei enthält alle Firmen mit den genannten Spalten.\n- [ ] Umlaute erscheinen in Excel korrekt.',
    status: 'ON_HOLD',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-21T10:00:00.000Z',
    updatedAt: '2026-06-21T10:00:00.000Z',
  },
  // 08-aktivitaet-icons.md — TODO, owner=AI, CHORE
  {
    id: 8,
    owner: 'AI',
    type: 'CHORE',
    title: 'Icons für Aktivitätstypen',
    body: '## Ziel\nIn der Aktivitäten-Liste erscheint vor dem Typ-Text ein passendes Icon.\n\n## Anforderungen\n- Mapping: Anruf → Telefon, E-Mail → Briefumschlag, Meeting → mehrere Personen, Notiz → Notizzettel, Aufgabe → Checkliste.\n- Unbekannte Typen bekommen ein neutrales Fallback-Icon.\n- Keine weiteren Änderungen.\n\n## Hinweise\n- FontAwesome: z. B. `faPhone`, `faEnvelope`, `faUsers`, `faNoteSticky`, `faListCheck` aus `@fortawesome/free-solid-svg-icons`, gerendert mit `<fa-icon [icon]="…">`.\n- Reine Frontend-Aufgabe.\n\n## Fertig, wenn\n- [ ] Jeder bekannte Typ zeigt sein Icon vor dem Text.\n- [ ] Unbekannte Typen zeigen das Fallback-Icon.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T08:00:00.000Z',
  },
  // 09-sidebar-counters.md — ON_HOLD, owner=HUMAN, FEATURE (Will ask)
  {
    id: 9,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Zähler-Badges im Seitenmenü',
    body: '## Ziel\nNeben den Menüpunkten im Seitenmenü steht jeweils ein kleiner grauer Badge mit der Anzahl der Einträge.\n\n## Anforderungen\n- Badge neben Firmen, Personen, Chancen und Aktivitäten.\n- Ein einziger Request beim Laden des Menüs.\n- Schlägt der Request fehl, wird einfach kein Badge angezeigt (kein Fehler).\n\n## Rückfrage erforderlich\nEine Entscheidung in dieser Aufgabe triffst du **nicht allein**: Soll der\nChancen-Badge **alle** Chancen zählen oder nur die **offenen**? Das Dashboard\nliefert nur `offeneChancenCount` — für „alle" wäre Backend-Arbeit nötig. Beide\nVarianten sind sinnvoll. Rate **nicht** und wähle keinen Standard. Bevor du Code\nschreibst:\n1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (alle oder nur offene Chancen?).\n2. Setze das Label `Input needed`.\n3. Warte auf die Antwort, bevor du weiterarbeitest.\n\n## Hinweise\n- Das Backend hat bereits `GET /api/dashboard` mit `firmenCount`, `personenCount` und `offeneChancenCount`. Für die Aktivitäten-Zahl ggf. einen kleinen Count ergänzen.\n- Badge mit Bootstrap: `<span class="badge bg-secondary">…</span>`, rechtsbündig über `ms-auto`.\n\n## Fertig, wenn\n- [ ] Vier Badges mit korrekten Zahlen sichtbar.\n- [ ] Nur ein Request beim Laden des Menüs.',
    status: 'ON_HOLD',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-22T09:00:00.000Z',
    updatedAt: '2026-06-22T09:00:00.000Z',
  },
  // 10-phasen-badges.md — TODO, owner=AI, CHORE
  {
    id: 10,
    owner: 'AI',
    type: 'CHORE',
    title: 'Chancen-Phase als farbiger Badge',
    body: '## Ziel\nDie Phase einer Chance erscheint in Liste und Detailseite als farbiger Badge statt als reiner Text.\n\n## Anforderungen\n- Farb-Mapping: NEU → blau (primary), QUALIFIZIERT → hellblau (info), ANGEBOT → gelb (warning), VERHANDLUNG → dunkelgrau (secondary), GEWONNEN → grün (success), VERLOREN → rot (danger).\n- Gleiche Darstellung in Chancen-Liste und Chancen-Detailseite.\n- Das Mapping wird nur EINMAL definiert und an beiden Stellen identisch genutzt (DRY).\n\n## Hinweise\n- Bootstrap-Badge: `<span class="badge bg-success">GEWONNEN</span>`.\n- Eine gemeinsame Angular-Pipe oder Helper-Funktion für das Farb-Mapping.\n- Die Enum-Werte stehen in `frontend/src/app/core/models/chance.model.ts`.\n- Reine Frontend-Aufgabe.\n\n## Fertig, wenn\n- [ ] Phase erscheint als farbiger Badge in Liste und Detail.\n- [ ] Farben stimmen mit dem Mapping überein.\n- [ ] Mapping nur an einer Stelle definiert.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-23T08:00:00.000Z',
    updatedAt: '2026-06-23T08:00:00.000Z',
  },
  // 11-chance-notiz.md — ON_HOLD, owner=HUMAN, FEATURE (Will ask)
  {
    id: 11,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Notiz-Feld für Chancen',
    body: '## Ziel\nChancen bekommen ein optionales, mehrzeiliges Notiz-Feld.\n\n## Anforderungen\n- Neue Spalte `notes` (TEXT, optional) in der Tabelle `chance`.\n- Backend akzeptiert und liefert `notes` (Create UND Update).\n- Im Formular: dreizeilige Textarea; das Zeichenlimit klärst du per Rückfrage (siehe unten).\n- Auf der Detailseite: Notiz mit erhaltenen Zeilenumbrüchen anzeigen.\n- In der Liste taucht die Notiz NICHT auf.\n\n## Rückfrage erforderlich\nEine Entscheidung in dieser Aufgabe triffst du **nicht allein**: die maximale\nZeichenzahl der Notiz. Diese Zahl steuert sowohl das Frontend-Limit als auch die\nZod-Validierung im Backend — sie muss bewusst gewählt werden. Rate **nicht** und\nnimm keinen Standardwert an. Bevor du Code schreibst:\n1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (welches Zeichenlimit?).\n2. Setze das Label `Input needed`.\n3. Warte auf die Antwort, bevor du weiterarbeitest.\n\n## Hinweise\n- Schema an zwei Stellen pflegen: Drizzle-Schema (Typ-Inferenz) und `migrate.ts` (Runtime-Source-of-Truth).\n- Zod: `z.string().max(<Limit>).optional().nullable()` — auch im Update-Schema.\n- Detail-Anzeige mit CSS `white-space: pre-wrap`, damit Zeilenumbrüche bleiben.\n- Die Entität `Person` hat bereits ein `notes`-Feld — als Vorlage nutzen.\n\n## Fertig, wenn\n- [ ] Notiz lässt sich anlegen, speichern und wieder laden.\n- [ ] Textarea mit dem abgestimmten Zeichenlimit im Formular.\n- [ ] Detailseite zeigt Zeilenumbrüche korrekt.',
    status: 'ON_HOLD',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-23T09:00:00.000Z',
    updatedAt: '2026-06-23T09:00:00.000Z',
  },
  // 12-firma-favorit.md — TODO, owner=AI, FEATURE
  {
    id: 12,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Firmen als Favorit markieren',
    body: '## Ziel\nFirmen lassen sich per Stern-Icon als Favorit markieren; ein Filter zeigt nur Favoriten.\n\n## Anforderungen\n- Neue Spalte `is_favorit` (Boolean, Default false) in der Tabelle `firma`.\n- Endpoint `PATCH /api/firmen/:id/favorit` toggelt den Wert.\n- Stern-Icon in der Firmenliste vor dem Namen: voll = Favorit, transparent = kein Favorit. Klick toggelt.\n- Checkbox „Nur Favoriten anzeigen" über der Liste filtert auf Favoriten.\n- Der Favoritenstatus gilt pro Firma (nicht pro User).\n\n## Hinweise\n- SQLite speichert Boolean als INTEGER (0/1) — im Service zu Boolean mappen.\n- Migration in `migrate.ts` idempotent ergänzen: `ALTER TABLE firma ADD COLUMN is_favorit INTEGER NOT NULL DEFAULT 0`.\n- Stern-Klick in ag-Grid: `event.stopPropagation()`, damit nicht die Zeilen-Navigation auslöst. Nach dem PATCH die Row lokal aktualisieren.\n- FontAwesome `faStar`, gerendert mit `<fa-icon [icon]="faStar">`; voll/transparent über Opacity.\n\n## Fertig, wenn\n- [ ] Stern in der Liste, Klick toggelt und bleibt nach Reload erhalten.\n- [ ] Filter-Checkbox zeigt nur Favoriten.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-24T08:00:00.000Z',
    updatedAt: '2026-06-24T08:00:00.000Z',
  },
];

const TICKET_COMMENT_SEED: TicketCommentSeedRow[] = [
  // 07 CSV-Export: question about separator (comma vs semicolon)
  {
    id: 1,
    ticketId: 7,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: 'Welches Trennzeichen soll die CSV-Datei verwenden: Komma (Standard) oder Semikolon (für deutsches Excel)? Die Wahl beeinflusst, ob die Datei per Doppelklick korrekt in Excel öffnet.',
    createdAt: '2026-06-21T10:05:00.000Z',
  },
  // 09 Sidebar Counters: question about all vs open Chancen
  {
    id: 2,
    ticketId: 9,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: 'Soll der Chancen-Badge im Seitenmenü alle Chancen zählen oder nur die offenen? Für „alle" ist eine neue Backend-Abfrage nötig, da `GET /api/dashboard` nur `offeneChancenCount` liefert.',
    createdAt: '2026-06-22T09:05:00.000Z',
  },
  // 11 Chance Notiz: question about max character limit
  {
    id: 3,
    ticketId: 11,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: 'Welches maximale Zeichenlimit soll das Notiz-Feld einer Chance haben? Das Limit steuert sowohl die Zod-Validierung im Backend als auch das Frontend-Textarea-Limit.',
    createdAt: '2026-06-23T09:05:00.000Z',
  },
];

const TICKET_INSERT_SQL =
  `INSERT OR IGNORE INTO ticket (id, owner, type, title, body, status, solution, pickedUpAt, resolvedAt, createdAt, updatedAt)` +
  ` VALUES (@id, @owner, @type, @title, @body, @status, @solution, @pickedUpAt, @resolvedAt, @createdAt, @updatedAt)`;

const TICKET_COMMENT_INSERT_SQL =
  `INSERT OR IGNORE INTO ticket_comment (id, ticketId, author, authorName, body, createdAt)` +
  ` VALUES (@id, @ticketId, @author, @authorName, @body, @createdAt)`;

export const TICKET_SEED_COUNT = TICKET_SEED.length;

export async function seedTickets(): Promise<void> {
  // First batch: all ticket rows (parent table)
  const ticketStmts = TICKET_SEED.map((row) => ({
    sql: TICKET_INSERT_SQL,
    args: row as unknown as InArgs,
  }));
  await client.batch(ticketStmts, 'write');

  // Second batch: all ticket_comment rows (child table — FK order)
  const commentStmts = TICKET_COMMENT_SEED.map((row) => ({
    sql: TICKET_COMMENT_INSERT_SQL,
    args: row as unknown as InArgs,
  }));
  await client.batch(commentStmts, 'write');

  console.log(
    `=== Seeder: ticket ensured (${TICKET_SEED.length} rows, INSERT OR IGNORE) ===`,
  );
  console.log(
    `=== Seeder: ticket_comment ensured (${TICKET_COMMENT_SEED.length} rows, INSERT OR IGNORE) ===`,
  );
}
