import { sqlite } from '../config/db.js';
import { ValidationError } from '../utils/errors.js';
import { CHANCE_PHASE, REPORT_DIMENSION, REPORT_METRIK } from '../db/schema/enums.js';
import type { ReportDimension, ReportMetrik } from '../db/schema/enums.js';
import type { ReportQueryDTO } from '../utils/validation.js';

export interface ReportZeile {
  label: string;
  id: string | number | null;
  werte: Record<string, number>;
}

export interface ReportResult {
  dimension: string;
  metriken: string[];
  zeilen: ReportZeile[];
}

// SQLite date function translations
function yearExpr(col: string): string {
  return `CAST(strftime('%Y', ${col}) AS INTEGER)`;
}

function monthExpr(col: string): string {
  return `CAST(strftime('%m', ${col}) AS INTEGER)`;
}

function quarterExpr(col: string): string {
  return `((CAST(strftime('%m', ${col}) AS INTEGER) - 1) / 3 + 1)`;
}

// Build dimension SELECT + GROUP BY + label logic
function buildDimensionParts(dimension: ReportDimension): {
  selectDim: string;
  groupBy: string;
  idExpr: string;
  labelExpr: string;
  join: string;
} {
  switch (dimension) {
    case 'PHASE':
      return {
        selectDim: 'c.phase AS dim_phase',
        groupBy: 'c.phase',
        idExpr: 'c.phase',
        labelExpr: 'c.phase',
        join: '',
      };
    case 'FIRMA':
      return {
        selectDim: 'c.firmaId AS dim_firmaId, f.name AS dim_firmaName',
        groupBy: 'c.firmaId',
        idExpr: 'c.firmaId',
        labelExpr: 'COALESCE(f.name, CAST(c.firmaId AS TEXT))',
        join: 'LEFT JOIN firma f ON c.firmaId = f.id',
      };
    case 'PERSON':
      return {
        selectDim:
          'c.kontaktPersonId AS dim_personId, p.firstName AS dim_firstName, p.lastName AS dim_lastName',
        groupBy: 'c.kontaktPersonId',
        idExpr: 'c.kontaktPersonId',
        labelExpr:
          "COALESCE(p.firstName || ' ' || p.lastName, CAST(c.kontaktPersonId AS TEXT), 'Unbekannt')",
        join: 'LEFT JOIN person p ON c.kontaktPersonId = p.id',
      };
    case 'MONAT':
      return {
        selectDim: `${yearExpr('c.createdAt')} AS dim_year, ${monthExpr('c.createdAt')} AS dim_month`,
        groupBy: `${yearExpr('c.createdAt')}, ${monthExpr('c.createdAt')}`,
        idExpr: `${yearExpr('c.createdAt')} || '-' || printf('%02d', ${monthExpr('c.createdAt')})`,
        labelExpr: `${yearExpr('c.createdAt')} || '-' || printf('%02d', ${monthExpr('c.createdAt')})`,
        join: '',
      };
    case 'QUARTAL':
      return {
        selectDim: `${yearExpr('c.createdAt')} AS dim_year, ${quarterExpr('c.createdAt')} AS dim_quarter`,
        groupBy: `${yearExpr('c.createdAt')}, ${quarterExpr('c.createdAt')}`,
        idExpr: `'Q' || ${quarterExpr('c.createdAt')} || ' ' || ${yearExpr('c.createdAt')}`,
        labelExpr: `'Q' || ${quarterExpr('c.createdAt')} || ' ' || ${yearExpr('c.createdAt')}`,
        join: '',
      };
    case 'JAHR':
      return {
        selectDim: `${yearExpr('c.createdAt')} AS dim_year`,
        groupBy: yearExpr('c.createdAt'),
        idExpr: yearExpr('c.createdAt'),
        labelExpr: yearExpr('c.createdAt'),
        join: '',
      };
    default:
      throw new ValidationError(`Unbekannte Dimension: ${dimension as string}`);
  }
}

// Build metric SELECT expressions
function buildMetrikSelect(metriken: ReportMetrik[]): string[] {
  return metriken
    .filter((m) => m !== 'GEWINNRATE') // handled via post-processing
    .map((metrik) => {
      switch (metrik) {
        case 'ANZAHL':
          return 'COUNT(*) AS metrik_ANZAHL';
        case 'GESAMTWERT':
          return 'COALESCE(SUM(c.wert), 0) AS metrik_GESAMTWERT';
        case 'DURCHSCHNITTSWERT':
          return 'COALESCE(AVG(c.wert), 0) AS metrik_DURCHSCHNITTSWERT';
        case 'GEWICHTETER_WERT':
          return 'COALESCE(SUM(c.wert * c.wahrscheinlichkeit / 100.0), 0) AS metrik_GEWICHTETER_WERT';
        default:
          return '';
      }
    })
    .filter(Boolean);
}

export const reportService = {
  executeReport(query: ReportQueryDTO): ReportResult {
    const dimension = query.dimension as ReportDimension;
    const metriken = query.metriken as ReportMetrik[];

    if (!(REPORT_DIMENSION as readonly string[]).includes(dimension)) {
      throw new ValidationError(`Ungültige Dimension: ${dimension}`);
    }
    for (const m of metriken) {
      if (!(REPORT_METRIK as readonly string[]).includes(m)) {
        throw new ValidationError(`Ungültige Metrik: ${m}`);
      }
    }

    const dimParts = buildDimensionParts(dimension);
    const metrikSelects = buildMetrikSelect(metriken);

    // Build WHERE conditions
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    const filter = query.filter;
    if (filter?.phasen && filter.phasen.length > 0) {
      const inPlaceholders = filter.phasen.map((_, i) => `?`).join(', ');
      whereClauses.push(`c.phase IN (${inPlaceholders})`);
      params.push(...filter.phasen);
    }
    if (filter?.datumVon) {
      whereClauses.push('c.createdAt >= ?');
      params.push(filter.datumVon);
    }
    if (filter?.datumBis) {
      whereClauses.push('c.createdAt <= ?');
      params.push(filter.datumBis);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allSelects = [dimParts.selectDim, dimParts.labelExpr + ' AS dim_label', dimParts.idExpr + ' AS dim_id', ...metrikSelects];

    const sql = `
      SELECT ${allSelects.join(', ')}
      FROM chance c
      ${dimParts.join}
      ${where}
      GROUP BY ${dimParts.groupBy}
      ORDER BY ${dimParts.groupBy}
    `;

    const rows = sqlite.prepare(sql).all(...params) as Record<string, unknown>[];

    // Post-process GEWINNRATE if requested
    const needsGewinnrate = metriken.includes('GEWINNRATE');
    let gewinnrateMap: Map<string, number> = new Map();

    if (needsGewinnrate) {
      // Build separate query for win rate
      const gwSql = `
        SELECT ${dimParts.idExpr} AS dim_id,
               SUM(CASE WHEN c.phase = 'GEWONNEN' THEN 1 ELSE 0 END) AS gewonnen,
               SUM(CASE WHEN c.phase IN ('GEWONNEN','VERLOREN') THEN 1 ELSE 0 END) AS abgeschlossen
        FROM chance c
        ${dimParts.join}
        ${where}
        GROUP BY ${dimParts.groupBy}
      `;
      const gwRows = sqlite.prepare(gwSql).all(...params) as {
        dim_id: unknown;
        gewonnen: number;
        abgeschlossen: number;
      }[];
      for (const r of gwRows) {
        const key = String(r.dim_id ?? '');
        const rate =
          Number(r.abgeschlossen) > 0
            ? (Number(r.gewonnen) / Number(r.abgeschlossen)) * 100
            : 0;
        gewinnrateMap.set(key, Math.round(rate * 100) / 100);
      }
    }

    const zeilen: ReportZeile[] = rows.map((row) => {
      const label = String(row['dim_label'] ?? '');
      const id = row['dim_id'] as string | number | null;
      const werte: Record<string, number> = {};

      for (const metrik of metriken) {
        if (metrik === 'GEWINNRATE') {
          werte[metrik] = gewinnrateMap.get(String(id ?? '')) ?? 0;
        } else {
          const key = `metrik_${metrik}`;
          werte[metrik] = Number(row[key] ?? 0);
        }
      }

      return { label, id, werte };
    });

    // For PHASE dimension, fill in missing phases with zeros
    if (dimension === 'PHASE') {
      const existingPhases = new Set(zeilen.map((z) => z.label));
      for (const phase of CHANCE_PHASE) {
        if (!existingPhases.has(phase)) {
          const werte: Record<string, number> = {};
          for (const m of metriken) {
            werte[m] = 0;
          }
          zeilen.push({ label: phase, id: phase, werte });
        }
      }
      // Sort in CHANCE_PHASE order
      zeilen.sort(
        (a, b) =>
          (CHANCE_PHASE as readonly string[]).indexOf(a.label) -
          (CHANCE_PHASE as readonly string[]).indexOf(b.label)
      );
    }

    return { dimension, metriken, zeilen };
  },
};
