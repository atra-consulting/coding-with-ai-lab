import { client } from '../config/db.js';
import type { InValue } from '@libsql/client';
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
  async findAll(page: number, size: number, sort: SortParams, phase?: ChancePhase): Promise<PageResult<ChanceDTO>> {
    const conditions: string[] = [];
    const params: InValue[] = [];

    if (phase !== undefined) {
      conditions.push('c.phase = ?');
      params.push(phase);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM chance c ${where}`,
      args: [...params],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} ${where} ORDER BY c.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [...params, size, page * size],
    });
    const rows = rowsResult.rows as unknown as ChanceRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async listAll(): Promise<ChanceDTO[]> {
    const result = await client.execute({
      sql: `${BASE_QUERY} ORDER BY c.createdAt DESC`,
      args: [],
    });
    const rows = result.rows as unknown as ChanceRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<ChanceDTO> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE c.id = ?`,
      args: [id],
    });
    const row = result.rows[0] as unknown as ChanceRow | undefined;
    if (!row) throw new NotFoundError(`Chance mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async create(dto: ChanceCreateDTO): Promise<ChanceDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO chance (titel, beschreibung, wert, currency, phase, wahrscheinlichkeit, erwartetesDatum, firmaId, kontaktPersonId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
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
        now,
      ],
    });
    if (result.lastInsertRowid === undefined) {
      throw new Error('INSERT chance returned no rowid');
    }
    return this.findById(Number(result.lastInsertRowid));
  },

  async update(id: number, dto: ChanceCreateDTO): Promise<ChanceDTO> {
    await this.findById(id);
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE chance SET titel=?, beschreibung=?, wert=?, currency=?, phase=?, wahrscheinlichkeit=?, erwartetesDatum=?, firmaId=?, kontaktPersonId=?, updatedAt=? WHERE id=?`,
      args: [
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
        id,
      ],
    });
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await client.execute({
      sql: 'DELETE FROM chance WHERE id = ?',
      args: [id],
    });
  },
};
