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

// ─── Prepared statements (module-level for performance) ───────────────────────

const stmtFirmenCount = sqlite.prepare<[], CountRow>('SELECT COUNT(*) AS cnt FROM firma');
const stmtPersonenCount = sqlite.prepare<[], CountRow>('SELECT COUNT(*) AS cnt FROM person');
const stmtOffeneChancen = sqlite.prepare<[], CountRow>(
  "SELECT COUNT(*) AS cnt FROM chance WHERE phase NOT IN ('GEWONNEN','VERLOREN')"
);
const stmtGewonnenSumme = sqlite.prepare<[], SumRow>(
  "SELECT COALESCE(SUM(wert), 0) AS total FROM chance WHERE phase = 'GEWONNEN'"
);
const stmtRecentChancen = sqlite.prepare<[], RecentChanceRow>(`
  SELECT c.id, c.titel, c.wert, c.currency, c.phase, f.name AS firmaName, c.createdAt
  FROM chance c
  JOIN firma f ON f.id = c.firmaId
  ORDER BY c.createdAt DESC
  LIMIT 5
`);
const stmtRecentAktivitaeten = sqlite.prepare<[], RecentAktivitaetRow>(`
  SELECT a.id, a.typ, a.subject, a.datum,
         f.name AS firmaName,
         (p.firstName || ' ' || p.lastName) AS personName,
         a.createdAt
  FROM aktivitaet a
  LEFT JOIN firma f ON f.id = a.firmaId
  LEFT JOIN person p ON p.id = a.personId
  ORDER BY a.createdAt DESC
  LIMIT 5
`);

// ─── Service ──────────────────────────────────────────────────────────────────

export function getDashboard(): DashboardData {
  // Query 1: total Firmen
  const firmenRow = stmtFirmenCount.get() as CountRow;

  // Query 2: total Personen
  const personenRow = stmtPersonenCount.get() as CountRow;

  // Query 3: open Chancen (not GEWONNEN or VERLOREN)
  const offeneRow = stmtOffeneChancen.get() as CountRow;

  // Query 4: sum of won Chancen (NOTE: sums across all currencies as EUR — acceptable for training project)
  const sumRow = stmtGewonnenSumme.get() as SumRow;

  // Query 5: 5 most recent Chancen with firma name
  const recentChancenRows = stmtRecentChancen.all() as RecentChanceRow[];

  // Query 6: 5 most recent Aktivitaeten with firma and person names
  const recentAktivitaetenRows = stmtRecentAktivitaeten.all() as RecentAktivitaetRow[];

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
