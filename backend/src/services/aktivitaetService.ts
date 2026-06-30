import type { InValue } from '@libsql/client';
import { client } from '../config/db.js';
import { type AktivitaetTyp } from '../db/schema/enums.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { AktivitaetCreateDTO } from '../utils/validation.js';

export interface AktivitaetDTO {
  id: number;
  typ: string;
  subject: string;
  description: string | null;
  datum: string;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AktivitaetRow {
  id: number;
  typ: string;
  subject: string;
  description: string | null;
  datum: string;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personFirstName: string | null;
  personLastName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: AktivitaetRow): AktivitaetDTO {
  const personName =
    row.personFirstName && row.personLastName
      ? `${row.personFirstName} ${row.personLastName}`
      : row.personFirstName ?? row.personLastName ?? null;

  return {
    id: row.id,
    typ: row.typ,
    subject: row.subject,
    description: row.description,
    datum: row.datum,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    personId: row.personId,
    personName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT ak.id, ak.typ, ak.subject, ak.description, ak.datum,
         ak.firmaId, f.name AS firmaName,
         ak.personId, p.firstName AS personFirstName, p.lastName AS personLastName,
         ak.createdAt, ak.updatedAt
  FROM aktivitaet ak
  LEFT JOIN firma f ON ak.firmaId = f.id
  LEFT JOIN person p ON ak.personId = p.id
`;

export const aktivitaetService = {
  async findAll(page: number, size: number, sort: SortParams, firmaId?: number, typ?: AktivitaetTyp, search?: string): Promise<PageResult<AktivitaetDTO>> {
    const conditions: string[] = [];
    const params: InValue[] = [];

    if (firmaId !== undefined) {
      conditions.push('ak.firmaId = ?');
      params.push(firmaId);
    }

    if (typ !== undefined) {
      conditions.push('ak.typ = ?');
      params.push(typ);
    }

    if (search !== undefined && search.trim() !== '') {
      conditions.push("LOWER(ak.subject) LIKE LOWER('%' || ? || '%')");
      params.push(search.trim());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM aktivitaet ak${where ? ' ' + where : ''}`,
      args: [...params],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY}${where ? ' ' + where : ''} ORDER BY ak.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [...params, size, page * size],
    });
    const rows = rowsResult.rows as unknown as AktivitaetRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async listAll(): Promise<AktivitaetDTO[]> {
    const result = await client.execute({
      sql: `${BASE_QUERY} ORDER BY ak.datum DESC`,
      args: [],
    });
    const rows = result.rows as unknown as AktivitaetRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<AktivitaetDTO> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE ak.id = ?`,
      args: [id],
    });
    const row = result.rows[0] as unknown as AktivitaetRow | undefined;
    if (!row) throw new NotFoundError(`Aktivität mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async create(dto: AktivitaetCreateDTO): Promise<AktivitaetDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO aktivitaet (typ, subject, description, datum, firmaId, personId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        dto.typ,
        dto.subject,
        dto.description ?? null,
        dto.datum,
        dto.firmaId ?? null,
        dto.personId ?? null,
        now,
        now,
      ],
    });
    if (result.lastInsertRowid === undefined) {
      throw new Error('INSERT aktivitaet returned no rowid');
    }
    return this.findById(Number(result.lastInsertRowid));
  },

  async update(id: number, dto: AktivitaetCreateDTO): Promise<AktivitaetDTO> {
    await this.findById(id);
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE aktivitaet SET typ=?, subject=?, description=?, datum=?, firmaId=?, personId=?, updatedAt=? WHERE id=?`,
      args: [
        dto.typ,
        dto.subject,
        dto.description ?? null,
        dto.datum,
        dto.firmaId ?? null,
        dto.personId ?? null,
        now,
        id,
      ],
    });
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await client.execute({
      sql: 'DELETE FROM aktivitaet WHERE id = ?',
      args: [id],
    });
  },
};
