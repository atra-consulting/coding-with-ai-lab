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
  // 01-firmenkarte.md — DEFINITION, owner=HUMAN, FEATURE (too vague, needs detail)
  {
    id: 1,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Firmen auf einer Karte anzeigen',
    body: '## Business\nEs wäre schön, die Firmen auf einer Karte zu sehen. Eine Karte in der App soll zeigen, wo die Firmen sitzen.\n\n## Technical\nNoch offen. Welche Karten-Bibliothek oder welcher Anbieter? Woher kommen die Koordinaten der Firmen? Was passiert beim Klick auf eine Firma? Das klärt das Refinement.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T08:00:00.000Z',
    updatedAt: '2026-06-20T08:00:00.000Z',
  },
  // 02-crm-chat.md — DEFINITION, owner=HUMAN, FEATURE (too vague, needs detail)
  {
    id: 2,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'KI-Chat fürs CRM',
    body: '## Business\nWir hätten gern einen KI-Chat im CRM. Damit soll man Fragen zu den Daten stellen können.\n\n## Technical\nNoch offen. Auf welche Daten greift der Chat zu (Firmen, Personen, Chancen)? Wo erscheint er in der Oberfläche? Welche Art von Fragen soll er beantworten? Das klärt das Refinement.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T09:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
  },
  // 03-firmendossier.md — DEFINITION, owner=HUMAN, FEATURE (too vague, needs detail)
  {
    id: 3,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Firmendossier aus dem Internet',
    body: '## Business\nZu jeder Firma sollen aktuelle Infos aus dem Internet erscheinen.\n\n## Technical\nNoch offen. Welche Infos gehören ins Dossier, aus welcher Quelle (welche API oder Website), und an welcher Stelle in der App erscheinen sie? Das klärt das Refinement.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:00:00.000Z',
  },
  // 04-beziehungsanalyse.md — DEFINITION, owner=HUMAN, FEATURE (too vague, needs detail)
  {
    id: 4,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'KI-Beziehungsanalyse',
    body: '## Business\nDie KI soll die Beziehungen analysieren und etwas Sinnvolles dazu sagen.\n\n## Technical\nNoch offen. Welche Beziehungen genau (Firma–Person, Person–Person, Chancen)? Was kommt als Ergebnis heraus — ein Text, eine Bewertung, eine Visualisierung? Das klärt das Refinement.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-20T11:00:00.000Z',
    updatedAt: '2026-06-20T11:00:00.000Z',
  },
  // 05-csv-import.md — DEFINITION, owner=HUMAN, FEATURE (too vague, needs detail)
  {
    id: 5,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Firmen aus Datei importieren',
    body: '## Business\nMan soll Firmen aus einer Datei importieren können. Die KI soll dabei helfen.\n\n## Technical\nNoch offen. Welche Dateiformate (CSV, Excel)? Welche Spalten erwartet der Import? Wie behandeln wir Duplikate oder fehlerhafte Zeilen? Das klärt das Refinement.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-21T08:00:00.000Z',
    updatedAt: '2026-06-21T08:00:00.000Z',
  },
  // 06-dark-mode.md — TODO, owner=AI, FEATURE (well-specified, ready to build)
  {
    id: 6,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Dunkelmodus-Umschalter im Header',
    body: '## Business\nEin Umschalter im Header wechselt zwischen Hell- und Dunkelmodus für die ganze App.\n\nDer Button sitzt rechts oben im Header: Mond-Icon im Hellmodus, Sonne im Dunkelmodus. Ein Klick schaltet sofort die ganze App um. Die Wahl bleibt erhalten — beim nächsten Besuch zeigt die App wieder den zuletzt gewählten Modus.\n\n## Technical\n- Bootstrap 5.3 unterstützt Dunkelmodus nativ über das Attribut `data-bs-theme="dark"` am `<html>`-Element.\n- Icons über FontAwesome: `faMoon` / `faSun` aus `@fortawesome/free-solid-svg-icons`, gerendert mit `<fa-icon [icon]="…">`.\n- Die Wahl wird in `localStorage` gespeichert und beim Start aus `localStorage` gelesen.\n- Reine Frontend-Aufgabe, keine Backend- oder DB-Änderung.\n\n## Fertig, wenn\n- [ ] Button im Header sichtbar, Icon passt zum aktuellen Modus.\n- [ ] Klick schaltet die ganze App um.\n- [ ] Nach Reload bleibt der gewählte Modus erhalten.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-21T09:00:00.000Z',
    updatedAt: '2026-06-21T09:00:00.000Z',
  },
  // 07-csv-export.md — ON_HOLD, owner=HUMAN, FEATURE (AI asked a question, waiting)
  {
    id: 7,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'CSV-Export für die Firmenliste',
    body: '## Business\nEin Button über der Firmenliste lädt alle Firmen als CSV-Datei herunter.\n\nDer Button „CSV-Export" steht über der Firmen-Liste. Ein Klick lädt die Datei `firmen-YYYY-MM-DD.csv` mit ALLEN Firmen herunter — nicht nur der aktuellen Seite. Die Datei enthält die Spalten ID, Name, Branche, Telefon, E-Mail, Erstelldatum. Excel öffnet die Datei korrekt, auch mit deutschen Umlauten.\n\n## Technical\n- Für Umlaute in Excel: UTF-8-BOM voranstellen und `Content-Type: text/csv; charset=utf-8` setzen.\n- Das Backend liefert die vollständige Liste (ohne Pagination), das Frontend stößt den Download an.\n\n## Rückfrage erforderlich\nEine Entscheidung in dieser Aufgabe triffst du **nicht allein**: das Trennzeichen.\nKomma ist der CSV-Standard, aber deutsches Excel erwartet oft das Semikolon. Beides\nist vertretbar — die Wahl beeinflusst, ob die Datei mit einem Doppelklick sauber\nin Excel öffnet. Rate **nicht** und wähle keinen Standard. Bevor du Code schreibst:\n1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (Komma oder Semikolon?).\n2. Setze das Label `Input needed`.\n3. Warte auf die Antwort, bevor du weiterarbeitest.\n\n## Fertig, wenn\n- [ ] Button vorhanden, Klick lädt die Datei.\n- [ ] Datei enthält alle Firmen mit den genannten Spalten.\n- [ ] Umlaute erscheinen in Excel korrekt.',
    status: 'ON_HOLD',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-21T10:00:00.000Z',
    updatedAt: '2026-06-21T10:00:00.000Z',
  },
  // 08-aktivitaet-icons.md — TODO, owner=AI, CHORE (well-specified, ready to build)
  {
    id: 8,
    owner: 'AI',
    type: 'CHORE',
    title: 'Icons für Aktivitätstypen',
    body: '## Business\nIn der Aktivitäten-Liste erscheint vor dem Typ-Text ein passendes Icon.\n\nJeder Aktivitätstyp bekommt ein eigenes Icon: Anruf → Telefon, E-Mail → Briefumschlag, Meeting → mehrere Personen, Notiz → Notizzettel, Aufgabe → Checkliste. Unbekannte Typen zeigen ein neutrales Fallback-Icon. Sonst ändert sich nichts.\n\n## Technical\n- FontAwesome: z. B. `faPhone`, `faEnvelope`, `faUsers`, `faNoteSticky`, `faListCheck` aus `@fortawesome/free-solid-svg-icons`, gerendert mit `<fa-icon [icon]="…">`.\n- Reine Frontend-Aufgabe.\n\n## Fertig, wenn\n- [ ] Jeder bekannte Typ zeigt sein Icon vor dem Text.\n- [ ] Unbekannte Typen zeigen das Fallback-Icon.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T08:00:00.000Z',
  },
  // 09-sidebar-counters.md — ON_HOLD, owner=HUMAN, FEATURE (AI asked a question, waiting)
  {
    id: 9,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Zähler-Badges im Seitenmenü',
    body: '## Business\nNeben den Menüpunkten im Seitenmenü steht jeweils ein kleiner grauer Badge mit der Anzahl der Einträge.\n\nDer Badge steht neben Firmen, Personen, Chancen und Aktivitäten. Ein einziger Request lädt alle Zahlen beim Öffnen des Menüs. Schlägt der Request fehl, zeigt die App einfach keinen Badge — keinen Fehler.\n\n## Rückfrage erforderlich\nEine Entscheidung in dieser Aufgabe triffst du **nicht allein**: Soll der\nChancen-Badge **alle** Chancen zählen oder nur die **offenen**? Das Dashboard\nliefert nur `offeneChancenCount` — für „alle" wäre Backend-Arbeit nötig. Beide\nVarianten sind sinnvoll. Rate **nicht** und wähle keinen Standard. Bevor du Code\nschreibst:\n1. Schreibe einen Kommentar an dieses Issue mit deiner konkreten Frage (alle oder nur offene Chancen?).\n2. Setze das Label `Input needed`.\n3. Warte auf die Antwort, bevor du weiterarbeitest.\n\n## Technical\n- Das Backend hat bereits `GET /api/dashboard` mit `firmenCount`, `personenCount` und `offeneChancenCount`. Für die Aktivitäten-Zahl ggf. einen kleinen Count ergänzen.\n- Badge mit Bootstrap: `<span class="badge bg-secondary">…</span>`, rechtsbündig über `ms-auto`.\n\n## Fertig, wenn\n- [ ] Vier Badges mit korrekten Zahlen sichtbar.\n- [ ] Nur ein Request beim Laden des Menüs.',
    status: 'ON_HOLD',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-22T09:00:00.000Z',
    updatedAt: '2026-06-22T09:00:00.000Z',
  },
  // 10-phasen-badges.md — TODO, owner=AI, CHORE (well-specified, ready to build)
  {
    id: 10,
    owner: 'AI',
    type: 'CHORE',
    title: 'Chancen-Phase als farbiger Badge',
    body: '## Business\nDie Phase einer Chance erscheint in Liste und Detailseite als farbiger Badge statt als reiner Text.\n\nFarb-Mapping: NEU → blau, QUALIFIZIERT → hellblau, ANGEBOT → gelb, VERHANDLUNG → dunkelgrau, GEWONNEN → grün, VERLOREN → rot. Die Chancen-Liste und die Chancen-Detailseite zeigen die Phase gleich an.\n\n## Technical\n- Farb-Mapping als Bootstrap-Klassen: NEU → `bg-primary`, QUALIFIZIERT → `bg-info`, ANGEBOT → `bg-warning`, VERHANDLUNG → `bg-secondary`, GEWONNEN → `bg-success`, VERLOREN → `bg-danger`.\n- Bootstrap-Badge: `<span class="badge bg-success">GEWONNEN</span>`.\n- Eine gemeinsame Angular-Pipe oder Helper-Funktion für das Farb-Mapping — nur EINMAL definiert und an beiden Stellen identisch genutzt (DRY).\n- Die Enum-Werte stehen in `frontend/src/app/core/models/chance.model.ts`.\n- Reine Frontend-Aufgabe.\n\n## Fertig, wenn\n- [ ] Phase erscheint als farbiger Badge in Liste und Detail.\n- [ ] Farben stimmen mit dem Mapping überein.\n- [ ] Mapping nur an einer Stelle definiert.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-23T08:00:00.000Z',
    updatedAt: '2026-06-23T08:00:00.000Z',
  },
  // 11-chance-notiz.md — TODO, owner=AI, FEATURE (open question answered in the body: limit = 1000)
  {
    id: 11,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Notiz-Feld für Chancen',
    body: '## Business\nChancen bekommen ein optionales, mehrzeiliges Notiz-Feld.\n\nIm Formular gibt es eine dreizeilige Textarea mit maximal 1000 Zeichen. Auf der Detailseite erscheint die Notiz mit den erhaltenen Zeilenumbrüchen. In der Liste taucht die Notiz NICHT auf.\n\n## Technical\n- Neue Spalte `notes` (TEXT, optional) in der Tabelle `chance`.\n- Backend akzeptiert und liefert `notes` (Create UND Update).\n- Schema an zwei Stellen pflegen: Drizzle-Schema (Typ-Inferenz) und `migrate.ts` (Runtime-Source-of-Truth).\n- Zod: `z.string().max(1000).optional().nullable()` — auch im Update-Schema.\n- Detail-Anzeige mit CSS `white-space: pre-wrap`, damit Zeilenumbrüche bleiben.\n- Die Entität `Person` hat bereits ein `notes`-Feld — als Vorlage nutzen.\n\n## Fertig, wenn\n- [ ] Notiz lässt sich anlegen, speichern und wieder laden.\n- [ ] Textarea mit maximal 1000 Zeichen im Formular.\n- [ ] Detailseite zeigt Zeilenumbrüche korrekt.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-23T09:00:00.000Z',
    updatedAt: '2026-06-23T09:00:00.000Z',
  },
  // 12-firma-favorit.md — TODO, owner=AI, FEATURE (well-specified, ready to build)
  {
    id: 12,
    owner: 'AI',
    type: 'FEATURE',
    title: 'Firmen als Favorit markieren',
    body: '## Business\nFirmen lassen sich per Stern-Icon als Favorit markieren; ein Filter zeigt nur Favoriten.\n\nDas Stern-Icon steht in der Firmenliste vor dem Namen: voll = Favorit, transparent = kein Favorit. Ein Klick toggelt den Status. Die Checkbox „Nur Favoriten anzeigen" über der Liste filtert auf Favoriten. Der Favoritenstatus gilt pro Firma, nicht pro User.\n\n## Technical\n- Neue Spalte `is_favorit` (Boolean, Default false) in der Tabelle `firma`.\n- Endpoint `PATCH /api/firmen/:id/favorit` toggelt den Wert.\n- SQLite speichert Boolean als INTEGER (0/1) — im Service zu Boolean mappen.\n- Migration in `migrate.ts` idempotent ergänzen: `ALTER TABLE firma ADD COLUMN is_favorit INTEGER NOT NULL DEFAULT 0`.\n- Stern-Klick in ag-Grid: `event.stopPropagation()`, damit nicht die Zeilen-Navigation auslöst. Nach dem PATCH die Row lokal aktualisieren.\n- FontAwesome `faStar`, gerendert mit `<fa-icon [icon]="faStar">`; voll/transparent über Opacity.\n\n## Fertig, wenn\n- [ ] Stern in der Liste, Klick toggelt und bleibt nach Reload erhalten.\n- [ ] Filter-Checkbox zeigt nur Favoriten.',
    status: 'TODO',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2026-06-24T08:00:00.000Z',
    updatedAt: '2026-06-24T08:00:00.000Z',
  },
];

const TICKET_COMMENT_SEED: TicketCommentSeedRow[] = [
  // 01 Firmenkarte (DEFINITION): too vague — ask for detail
  {
    id: 1,
    ticketId: 1,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Business Analyst: Diese Anforderung ist noch zu vage, um sie zu bauen. Bitte beschreib genauer: Welche Karten-Bibliothek oder welchen Anbieter nutzen wir, woher kommen die Koordinaten der Firmen (aus der Adresse?), und was passiert beim Klick auf eine Firma?',
    createdAt: '2026-06-20T08:05:00.000Z',
  },
  // 02 KI-Chat (DEFINITION): too vague — ask for detail
  {
    id: 2,
    ticketId: 2,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Business Analyst: Bitte erklär genauer, was der KI-Chat können soll: Auf welche Daten greift er zu (Firmen, Personen, Chancen?), wo erscheint er in der Oberfläche, und welche Art von Fragen soll er beantworten?',
    createdAt: '2026-06-20T09:05:00.000Z',
  },
  // 03 Firmendossier (DEFINITION): too vague — ask for detail
  {
    id: 3,
    ticketId: 3,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Business Analyst: Diese Aufgabe ist noch zu offen. Bitte beschreib genauer: Welche Infos sollen im Dossier stehen, aus welcher Quelle (welche API oder Website), und an welcher Stelle in der App werden sie angezeigt?',
    createdAt: '2026-06-20T10:05:00.000Z',
  },
  // 04 KI-Beziehungsanalyse (DEFINITION): too vague — ask for detail
  {
    id: 4,
    ticketId: 4,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Business Analyst: Diese Anforderung ist noch sehr offen. Bitte gib mehr Details: Welche Beziehungen genau soll die KI analysieren (Firma–Person, Person–Person, Chancen?), und was soll als Ergebnis herauskommen — ein Text, eine Bewertung, eine Visualisierung?',
    createdAt: '2026-06-20T11:05:00.000Z',
  },
  // 05 CSV-Import (DEFINITION): too vague — ask for detail
  {
    id: 5,
    ticketId: 5,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Business Analyst: Hier fehlen noch Details. Bitte gib mehr Infos: Welche Dateiformate sollen wir unterstützen (CSV, Excel?), welche Spalten erwartet der Import, und wie behandeln wir Duplikate oder fehlerhafte Zeilen?',
    createdAt: '2026-06-21T08:05:00.000Z',
  },
  // 07 CSV-Export (ON_HOLD): question about separator (comma vs semicolon)
  {
    id: 6,
    ticketId: 7,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Entwickler: Welches Trennzeichen soll die CSV-Datei verwenden: Komma (Standard) oder Semikolon (für deutsches Excel)? Die Wahl entscheidet, ob die Datei per Doppelklick korrekt in Excel öffnet.',
    createdAt: '2026-06-21T10:05:00.000Z',
  },
  // 09 Sidebar Counters (ON_HOLD): question about all vs open Chancen
  {
    id: 7,
    ticketId: 9,
    author: 'AGENT',
    authorName: 'Claude Code',
    body: '@Business Analyst: Soll der Chancen-Badge im Seitenmenü alle Chancen zählen oder nur die offenen? Für „alle" brauchen wir eine neue Backend-Abfrage, da `GET /api/dashboard` nur `offeneChancenCount` liefert.',
    createdAt: '2026-06-22T09:05:00.000Z',
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
