import { sqlite } from '../config/db.js';
import { CHANCE_PHASE } from '../db/schema/enums.js';

export interface PipelineKpisDTO {
  gesamtwert: number;
  anzahlOffen: number;
  gewinnrate: number;
  durchschnittlicherWert: number;
}

export interface PhaseAggregateDTO {
  phase: string;
  anzahl: number;
  summeWert: number;
  durchschnittWert: number;
  summeGewichtet: number;
}

export interface TopFirmaChanceDTO {
  firmaId: number;
  firmaName: string;
  anzahlChancen: number;
  summeWert: number;
}

const CLOSED_PHASES = ['GEWONNEN', 'VERLOREN'];

export const auswertungService = {
  getPipelineKpis(): PipelineKpisDTO {
    const openPlaceholders = CLOSED_PHASES.map(() => '?').join(',');

    const totals = sqlite
      .prepare(
        `SELECT
           COUNT(*) AS total,
           COALESCE(SUM(wert), 0) AS gesamtwert,
           COALESCE(AVG(wert), 0) AS durchschnitt
         FROM chance
         WHERE phase NOT IN (${openPlaceholders})`
      )
      .get(...CLOSED_PHASES) as { total: number; gesamtwert: number; durchschnitt: number };

    const gewonnen = Number(
      (
        sqlite
          .prepare(`SELECT COUNT(*) AS cnt FROM chance WHERE phase = 'GEWONNEN'`)
          .get() as { cnt: number }
      ).cnt
    );
    const verloren = Number(
      (
        sqlite
          .prepare(`SELECT COUNT(*) AS cnt FROM chance WHERE phase = 'VERLOREN'`)
          .get() as { cnt: number }
      ).cnt
    );
    const abgeschlossen = gewonnen + verloren;
    const gewinnrate = abgeschlossen > 0 ? (gewonnen / abgeschlossen) * 100 : 0;

    return {
      gesamtwert: Number(totals.gesamtwert),
      anzahlOffen: Number(totals.total),
      gewinnrate: Math.round(gewinnrate * 100) / 100,
      durchschnittlicherWert: Number(totals.durchschnitt),
    };
  },

  getPhaseAggregates(): PhaseAggregateDTO[] {
    const rows = sqlite
      .prepare(
        `SELECT phase,
                COUNT(*) AS anzahl,
                COALESCE(SUM(wert), 0) AS summeWert,
                COALESCE(AVG(wert), 0) AS durchschnittWert,
                COALESCE(SUM(wert * wahrscheinlichkeit / 100.0), 0) AS summeGewichtet
         FROM chance
         GROUP BY phase`
      )
      .all() as {
      phase: string;
      anzahl: number;
      summeWert: number;
      durchschnittWert: number;
      summeGewichtet: number;
    }[];

    const map = new Map(rows.map((r) => [r.phase, r]));

    return CHANCE_PHASE.map((phase) => {
      const row = map.get(phase);
      return {
        phase,
        anzahl: row ? Number(row.anzahl) : 0,
        summeWert: row ? Number(row.summeWert) : 0,
        durchschnittWert: row ? Number(row.durchschnittWert) : 0,
        summeGewichtet: row ? Number(row.summeGewichtet) : 0,
      };
    });
  },

  getTopFirmen(limit: number): TopFirmaChanceDTO[] {
    const rows = sqlite
      .prepare(
        `SELECT f.id AS firmaId, f.name AS firmaName,
                COUNT(c.id) AS anzahlChancen,
                COALESCE(SUM(c.wert), 0) AS summeWert
         FROM firma f
         LEFT JOIN chance c ON c.firmaId = f.id
         GROUP BY f.id, f.name
         ORDER BY summeWert DESC
         LIMIT ?`
      )
      .all(limit) as { firmaId: number; firmaName: string; anzahlChancen: number; summeWert: number }[];

    return rows.map((row) => ({
      firmaId: row.firmaId,
      firmaName: row.firmaName,
      anzahlChancen: Number(row.anzahlChancen),
      summeWert: Number(row.summeWert),
    }));
  },
};
