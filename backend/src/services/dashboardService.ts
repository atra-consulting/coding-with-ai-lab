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
  total: number | null;
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

// ─── Service ──────────────────────────────────────────────────────────────────

export function getDashboard(): DashboardData {
  // Query 1: total Firmen
  const firmenRow = sqlite
    .prepare('SELECT COUNT(*) AS cnt FROM firma')
    .get() as CountRow;

  // Query 2: total Personen
  const personenRow = sqlite
    .prepare('SELECT COUNT(*) AS cnt FROM person')
    .get() as CountRow;

  // Query 3: open Chancen (not GEWONNEN or VERLOREN)
  const offeneRow = sqlite
    .prepare("SELECT COUNT(*) AS cnt FROM chance WHERE phase NOT IN ('GEWONNEN', 'VERLOREN')")
    .get() as CountRow;

  // Query 4: sum of won Chancen (NOTE: sums across all currencies as EUR — acceptable for training project)
  const sumRow = sqlite
    .prepare("SELECT COALESCE(SUM(wert), 0) AS total FROM chance WHERE phase = 'GEWONNEN'")
    .get() as SumRow;

  // Query 5: 5 most recent Chancen with firma name
  const recentChancenRows = sqlite
    .prepare(`
      SELECT c.id, c.titel, c.wert, c.currency, c.phase, f.name AS firmaName, c.createdAt
      FROM chance c
      JOIN firma f ON f.id = c.firmaId
      ORDER BY c.createdAt DESC
      LIMIT 5
    `)
    .all() as RecentChanceRow[];

  // Query 6: 5 most recent Aktivitaeten with firma and person names
  const recentAktivitaetenRows = sqlite
    .prepare(`
      SELECT a.id, a.typ, a.subject, a.datum,
             f.name AS firmaName,
             (p.firstName || ' ' || p.lastName) AS personName,
             a.createdAt
      FROM aktivitaet a
      LEFT JOIN firma f ON f.id = a.firmaId
      LEFT JOIN person p ON p.id = a.personId
      ORDER BY a.createdAt DESC
      LIMIT 5
    `)
    .all() as RecentAktivitaetRow[];

  return {
    firmenCount: Number(firmenRow.cnt),
    personenCount: Number(personenRow.cnt),
    offeneChancenCount: Number(offeneRow.cnt),
    gewonneneChancenSumme: Number(sumRow.total ?? 0),
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
