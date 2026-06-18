import { client } from '../config/db.js';
import type { InValue } from '@libsql/client';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { PersonCreateDTO } from '../utils/validation.js';

export interface PersonDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  notes: string | null;
  firmaId: number;
  firmaName: string | null;
  abteilungId: number | null;
  abteilungName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PersonRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  notes: string | null;
  firmaId: number;
  firmaName: string | null;
  abteilungId: number | null;
  abteilungName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: PersonRow): PersonDTO {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    position: row.position,
    notes: row.notes,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    abteilungId: row.abteilungId,
    abteilungName: row.abteilungName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT p.id, p.firstName, p.lastName, p.email, p.phone, p.position, p.notes,
         p.firmaId, f.name AS firmaName,
         p.abteilungId, a.name AS abteilungName,
         p.createdAt, p.updatedAt
  FROM person p
  LEFT JOIN firma f ON p.firmaId = f.id
  LEFT JOIN abteilung a ON p.abteilungId = a.id
`;

export const personService = {
  async findAll(
    search: string | undefined,
    page: number,
    size: number,
    sort: SortParams,
    abteilungId?: number
  ): Promise<PageResult<PersonDTO>> {
    const conditions: string[] = [];
    const params: InValue[] = [];

    if (search) {
      conditions.push(
        `(LOWER(p.firstName) LIKE LOWER('%' || ? || '%') OR LOWER(p.lastName) LIKE LOWER('%' || ? || '%'))`
      );
      params.push(search, search);
    }

    if (abteilungId !== undefined) {
      conditions.push(`p.abteilungId = ?`);
      params.push(abteilungId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM person p ${where}`,
      args: [...params],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} ${where} ORDER BY p.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [...params, size, page * size],
    });
    const rows = rowsResult.rows as unknown as PersonRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async listAll(): Promise<PersonDTO[]> {
    const result = await client.execute({
      sql: `${BASE_QUERY} ORDER BY p.lastName ASC, p.firstName ASC`,
      args: [],
    });
    const rows = result.rows as unknown as PersonRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<PersonDTO> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE p.id = ?`,
      args: [id],
    });
    const row = result.rows[0] as unknown as PersonRow | undefined;
    if (!row) throw new NotFoundError(`Person mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async findByFirmaId(firmaId: number, page: number, size: number): Promise<PageResult<PersonDTO>> {
    const countResult = await client.execute({
      sql: 'SELECT COUNT(*) AS cnt FROM person WHERE firmaId = ?',
      args: [firmaId],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} WHERE p.firmaId = ? ORDER BY p.lastName ASC, p.firstName ASC LIMIT ? OFFSET ?`,
      args: [firmaId, size, page * size],
    });
    const rows = rowsResult.rows as unknown as PersonRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async create(dto: PersonCreateDTO): Promise<PersonDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO person (firstName, lastName, email, phone, position, notes, firmaId, abteilungId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        dto.firstName,
        dto.lastName,
        dto.email ?? null,
        dto.phone ?? null,
        dto.position ?? null,
        dto.notes ?? null,
        dto.firmaId,
        dto.abteilungId ?? null,
        now,
        now,
      ],
    });
    if (result.lastInsertRowid === undefined) {
      throw new Error('INSERT person returned no rowid');
    }
    return this.findById(Number(result.lastInsertRowid));
  },

  async update(id: number, dto: PersonCreateDTO): Promise<PersonDTO> {
    await this.findById(id);
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE person SET firstName=?, lastName=?, email=?, phone=?, position=?, notes=?, firmaId=?, abteilungId=?, updatedAt=? WHERE id=?`,
      args: [
        dto.firstName,
        dto.lastName,
        dto.email ?? null,
        dto.phone ?? null,
        dto.position ?? null,
        dto.notes ?? null,
        dto.firmaId,
        dto.abteilungId ?? null,
        now,
        id,
      ],
    });
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await client.execute({
      sql: 'DELETE FROM person WHERE id = ?',
      args: [id],
    });
  },
};
