import { sqlite } from '../config/db.js';
import type { ChancePhase, AktivitaetTyp } from '../db/schema/enums.js';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

interface RecentChance {
  id: number;
  titel: string;
  wert: number | null;
  currency: string;
  phase: ChancePhase;
  firmaName: string;
  createdAt: string;
}

interface RecentAktivitaet {
  id: number;
  typ: AktivitaetTyp;
  subject: string;
  datum: string;
  firmaName: string | null;
  personName: string | null;
  createdAt: string;
}

export interface DashboardData {
  firmenCount: number;
  personenCount: number;
  offeneChancenCount: number;
  gewonneneChancenSumme: number;
  recentChancen: RecentChance[];
  recentAktivitaeten: RecentAktivitaet[];
}

// ─── Raw row shapes returned by SQLite ────────────────────────────────────────

interface CountRow {
  cnt: number;
}

interface SumRow {
  total: number;
}

interface RecentChanceRow {
  id: number;
  titel: string;
  wert: number | null;
  currency: string;
  phase: string;
  firmaName: string;
  createdAt: string;
}

interface RecentAktivitaetRow {
  id: number;
  typ: string;
  subject: string;
  datum: string;
  firmaName: string | null;
  personName: string | null;
  createdAt: string;
}

// ─── Prepared statements (lazy to avoid preparing before migrations run) ──────

// Module-level prepare() fails because routes import this module before
// runMigrations() executes in index.ts. Lazy init keeps the per-request
// overhead at zero on subsequent calls while respecting startup order.
interface Statements {
  firmenCount: ReturnType<typeof sqlite.prepare<[], CountRow>>;
  personenCount: ReturnType<typeof sqlite.prepare<[], CountRow>>;
  offeneChancen: ReturnType<typeof sqlite.prepare<[], CountRow>>;
  gewonnenSumme: ReturnType<typeof sqlite.prepare<[], SumRow>>;
  recentChancen: ReturnType<typeof sqlite.prepare<[], RecentChanceRow>>;
  recentAktivitaeten: ReturnType<typeof sqlite.prepare<[], RecentAktivitaetRow>>;
}

let stmts: Statements | null = null;

function getStatements(): Statements {
  if (stmts) return stmts;
  stmts = {
    firmenCount: sqlite.prepare<[], CountRow>('SELECT COUNT(*) AS cnt FROM firma'),
    personenCount: sqlite.prepare<[], CountRow>('SELECT COUNT(*) AS cnt FROM person'),
    offeneChancen: sqlite.prepare<[], CountRow>(
      "SELECT COUNT(*) AS cnt FROM chance WHERE phase NOT IN ('GEWONNEN','VERLOREN')"
    ),
    gewonnenSumme: sqlite.prepare<[], SumRow>(
      "SELECT COALESCE(SUM(wert), 0) AS total FROM chance WHERE phase = 'GEWONNEN'"
    ),
    recentChancen: sqlite.prepare<[], RecentChanceRow>(`
      SELECT c.id, c.titel, c.wert, c.currency, c.phase, f.name AS firmaName, c.createdAt
      FROM chance c
      JOIN firma f ON f.id = c.firmaId
      ORDER BY c.createdAt DESC
      LIMIT 5
    `),
    recentAktivitaeten: sqlite.prepare<[], RecentAktivitaetRow>(`
      SELECT a.id, a.typ, a.subject, a.datum,
             f.name AS firmaName,
             (p.firstName || ' ' || p.lastName) AS personName,
             a.createdAt
      FROM aktivitaet a
      LEFT JOIN firma f ON f.id = a.firmaId
      LEFT JOIN person p ON p.id = a.personId
      ORDER BY a.createdAt DESC
      LIMIT 5
    `),
  };
  return stmts;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export function getDashboard(): DashboardData {
  const s = getStatements();

  const firmenRow = s.firmenCount.get() as CountRow;
  const personenRow = s.personenCount.get() as CountRow;
  const offeneRow = s.offeneChancen.get() as CountRow;
  const sumRow = s.gewonnenSumme.get() as SumRow;
  const recentChancenRows = s.recentChancen.all() as RecentChanceRow[];
  const recentAktivitaetenRows = s.recentAktivitaeten.all() as RecentAktivitaetRow[];

  return {
    firmenCount: Number(firmenRow.cnt),
    personenCount: Number(personenRow.cnt),
    offeneChancenCount: Number(offeneRow.cnt),
    gewonneneChancenSumme: sumRow.total,
    recentChancen: recentChancenRows.map((row) => ({
      id: row.id,
      titel: row.titel,
      wert: row.wert,
      currency: row.currency,
      phase: row.phase as ChancePhase,
      firmaName: row.firmaName,
      createdAt: row.createdAt,
    })),
    recentAktivitaeten: recentAktivitaetenRows.map((row) => ({
      id: row.id,
      typ: row.typ as AktivitaetTyp,
      subject: row.subject,
      datum: row.datum,
      // personName is NULL when no person is linked — SQLite returns null for LEFT JOIN miss
      firmaName: row.firmaName,
      personName: row.personName,
      createdAt: row.createdAt,
    })),
  };
}
