import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import { type ChancePhase } from '../db/schema/enums.js';
import type { ChanceCreateDTO } from '../utils/validation.js';

export interface ChanceDTO {
  id: number;
  titel: string;
  beschreibung: string | null;
  wert: number | null;
  currency: string;
  phase: string;
  wahrscheinlichkeit: number | null;
  erwartetesDatum: string | null;
  firmaId: number;
  firmaName: string | null;
  kontaktPersonId: number | null;
  kontaktPersonName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChanceRow {
  id: number;
  titel: string;
  beschreibung: string | null;
  wert: number | null;
  currency: string;
  phase: string;
  wahrscheinlichkeit: number | null;
  erwartetesDatum: string | null;
  firmaId: number;
  firmaName: string | null;
  kontaktPersonId: number | null;
  kontaktPersonFirstName: string | null;
  kontaktPersonLastName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: ChanceRow): ChanceDTO {
  const kontaktPersonName =
    row.kontaktPersonFirstName && row.kontaktPersonLastName
      ? `${row.kontaktPersonFirstName} ${row.kontaktPersonLastName}`
      : row.kontaktPersonFirstName ?? row.kontaktPersonLastName ?? null;

  return {
    id: row.id,
    titel: row.titel,
    beschreibung: row.beschreibung,
    wert: row.wert,
    currency: row.currency,
    phase: row.phase,
    wahrscheinlichkeit: row.wahrscheinlichkeit,
    erwartetesDatum: row.erwartetesDatum,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    kontaktPersonId: row.kontaktPersonId,
    kontaktPersonName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT c.id, c.titel, c.beschreibung, c.wert, c.currency, c.phase, c.wahrscheinlichkeit, c.erwartetesDatum,
         c.firmaId, f.name AS firmaName,
         c.kontaktPersonId, p.firstName AS kontaktPersonFirstName, p.lastName AS kontaktPersonLastName,
         c.createdAt, c.updatedAt
  FROM chance c
  LEFT JOIN firma f ON c.firmaId = f.id
  LEFT JOIN person p ON c.kontaktPersonId = p.id
`;

export const chanceService = {
  findAll(page: number, size: number, sort: SortParams): PageResult<ChanceDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM chance')
      .get() as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ORDER BY c.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(size, page * size) as ChanceRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): ChanceDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY c.createdAt DESC`)
      .all() as ChanceRow[];
    return rows.map(toDTO);
  },

  findById(id: number): ChanceDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE c.id = ?`)
      .get(id) as ChanceRow | undefined;
    if (!row) throw new NotFoundError(`Chance mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  create(dto: ChanceCreateDTO): ChanceDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO chance (titel, beschreibung, wert, currency, phase, wahrscheinlichkeit, erwartetesDatum, firmaId, kontaktPersonId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.titel,
        dto.beschreibung ?? null,
        dto.wert ?? null,
        dto.currency ?? 'EUR',
        (dto.phase as ChancePhase) ?? 'NEU',
        dto.wahrscheinlichkeit ?? null,
        dto.erwartetesDatum ?? null,
        dto.firmaId,
        dto.kontaktPersonId ?? null,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: ChanceCreateDTO): ChanceDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE chance SET titel=?, beschreibung=?, wert=?, currency=?, phase=?, wahrscheinlichkeit=?, erwartetesDatum=?, firmaId=?, kontaktPersonId=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.titel,
        dto.beschreibung ?? null,
        dto.wert ?? null,
        dto.currency ?? 'EUR',
        (dto.phase as ChancePhase) ?? 'NEU',
        dto.wahrscheinlichkeit ?? null,
        dto.erwartetesDatum ?? null,
        dto.firmaId,
        dto.kontaktPersonId ?? null,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM chance WHERE id = ?').run(id);
  },
};
