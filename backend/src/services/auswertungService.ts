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
  count: number;
  summeWert: number;
  durchschnittWert: number;
  gewichteterWert: number;
}

export interface TopFirmaChanceDTO {
  id: number;
  name: string;
  personenCount: number;
  vertragswert: number;
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
                COUNT(*) AS count,
                COALESCE(SUM(wert), 0) AS summeWert,
                COALESCE(AVG(wert), 0) AS durchschnittWert,
                COALESCE(SUM(wert * wahrscheinlichkeit / 100.0), 0) AS gewichteterWert
         FROM chance
         GROUP BY phase`
      )
      .all() as {
      phase: string;
      count: number;
      summeWert: number;
      durchschnittWert: number;
      gewichteterWert: number;
    }[];

    const map = new Map(rows.map((r) => [r.phase, r]));

    return CHANCE_PHASE.map((phase) => {
      const row = map.get(phase);
      return {
        phase,
        count: row ? Number(row.count) : 0,
        summeWert: row ? Number(row.summeWert) : 0,
        durchschnittWert: row ? Number(row.durchschnittWert) : 0,
        gewichteterWert: row ? Number(row.gewichteterWert) : 0,
      };
    });
  },

  getTopFirmen(limit: number): TopFirmaChanceDTO[] {
    const rows = sqlite
      .prepare(
        `SELECT f.id, f.name,
                COUNT(DISTINCT p.id) AS personenCount,
                COALESCE(SUM(c.wert), 0) AS vertragswert
         FROM firma f
         LEFT JOIN person p ON p.firmaId = f.id
         LEFT JOIN chance c ON c.firmaId = f.id
         GROUP BY f.id, f.name
         ORDER BY vertragswert DESC
         LIMIT ?`
      )
      .all(limit) as { id: number; name: string; personenCount: number; vertragswert: number }[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      personenCount: Number(row.personenCount),
      vertragswert: Number(row.vertragswert),
    }));
  },
};
