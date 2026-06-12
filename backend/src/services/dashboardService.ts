import { client } from '../config/db.js';
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

// ─── Raw row shapes returned by libsql ────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  const firmenResult = await client.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM firma',
    args: [],
  });
  const firmenRow = firmenResult.rows[0] as unknown as CountRow;

  const personenResult = await client.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM person',
    args: [],
  });
  const personenRow = personenResult.rows[0] as unknown as CountRow;

  const offeneResult = await client.execute({
    sql: "SELECT COUNT(*) AS cnt FROM chance WHERE phase NOT IN ('GEWONNEN','VERLOREN')",
    args: [],
  });
  const offeneRow = offeneResult.rows[0] as unknown as CountRow;

  const sumResult = await client.execute({
    sql: "SELECT COALESCE(SUM(wert), 0) AS total FROM chance WHERE phase = 'GEWONNEN'",
    args: [],
  });
  const sumRow = sumResult.rows[0] as unknown as SumRow;

  const recentChancenResult = await client.execute({
    sql: `SELECT c.id, c.titel, c.wert, c.currency, c.phase, f.name AS firmaName, c.createdAt
          FROM chance c
          JOIN firma f ON f.id = c.firmaId
          ORDER BY c.createdAt DESC
          LIMIT 5`,
    args: [],
  });
  const recentChancenRows = recentChancenResult.rows as unknown as RecentChanceRow[];

  const recentAktivitaetenResult = await client.execute({
    sql: `SELECT a.id, a.typ, a.subject, a.datum,
                 f.name AS firmaName,
                 (p.firstName || ' ' || p.lastName) AS personName,
                 a.createdAt
          FROM aktivitaet a
          LEFT JOIN firma f ON f.id = a.firmaId
          LEFT JOIN person p ON p.id = a.personId
          ORDER BY a.createdAt DESC
          LIMIT 5`,
    args: [],
  });
  const recentAktivitaetenRows = recentAktivitaetenResult.rows as unknown as RecentAktivitaetRow[];

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
      // personName is NULL when no person is linked — LEFT JOIN miss returns null
      firmaName: row.firmaName,
      personName: row.personName,
      createdAt: row.createdAt,
    })),
  };
}
