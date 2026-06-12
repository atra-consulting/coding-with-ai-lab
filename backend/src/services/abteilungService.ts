import { client } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { PersonDTO } from './personService.js';
import type { AbteilungCreateDTO } from '../utils/validation.js';

export interface AbteilungDTO {
  id: number;
  name: string;
  description: string | null;
  firmaId: number;
  firmaName: string | null;
  personenCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AbteilungRow {
  id: number;
  name: string;
  description: string | null;
  firmaId: number;
  firmaName: string | null;
  personenCount: number;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: AbteilungRow): AbteilungDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    personenCount: Number(row.personenCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT a.id, a.name, a.description, a.firmaId, f.name AS firmaName,
         (SELECT COUNT(*) FROM person p WHERE p.abteilungId = a.id) AS personenCount,
         a.createdAt, a.updatedAt
  FROM abteilung a
  LEFT JOIN firma f ON a.firmaId = f.id
`;

export const abteilungService = {
  async findAll(page: number, size: number, sort: SortParams): Promise<PageResult<AbteilungDTO>> {
    const countResult = await client.execute({
      sql: 'SELECT COUNT(*) AS cnt FROM abteilung',
      args: [],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} ORDER BY a.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [size, page * size],
    });
    const rows = rowsResult.rows as unknown as AbteilungRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async listAll(): Promise<AbteilungDTO[]> {
    const result = await client.execute({
      sql: `${BASE_QUERY} ORDER BY a.name ASC`,
      args: [],
    });
    const rows = result.rows as unknown as AbteilungRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<AbteilungDTO> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE a.id = ?`,
      args: [id],
    });
    const row = result.rows[0] as unknown as AbteilungRow | undefined;
    if (!row) throw new NotFoundError(`Abteilung mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async findByFirmaId(firmaId: number, page: number, size: number): Promise<PageResult<AbteilungDTO>> {
    const countResult = await client.execute({
      sql: 'SELECT COUNT(*) AS cnt FROM abteilung WHERE firmaId = ?',
      args: [firmaId],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} WHERE a.firmaId = ? ORDER BY a.name ASC LIMIT ? OFFSET ?`,
      args: [firmaId, size, page * size],
    });
    const rows = rowsResult.rows as unknown as AbteilungRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async findByFirmaIdAll(firmaId: number): Promise<AbteilungDTO[]> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE a.firmaId = ? ORDER BY a.name ASC`,
      args: [firmaId],
    });
    const rows = result.rows as unknown as AbteilungRow[];
    return rows.map(toDTO);
  },

  async findPersonenByAbteilungId(
    abteilungId: number,
    page: number,
    size: number
  ): Promise<PageResult<PersonDTO>> {
    await this.findById(abteilungId); // throws 404 if not found

    const BASE_PERSON_QUERY = `
      SELECT p.id, p.firstName, p.lastName, p.email, p.phone, p.position, p.notes,
             p.firmaId, f.name AS firmaName,
             p.abteilungId, a.name AS abteilungName,
             p.createdAt, p.updatedAt
      FROM person p
      LEFT JOIN firma f ON p.firmaId = f.id
      LEFT JOIN abteilung a ON p.abteilungId = a.id
    `;

    const countResult = await client.execute({
      sql: 'SELECT COUNT(*) AS cnt FROM person WHERE abteilungId = ?',
      args: [abteilungId],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_PERSON_QUERY} WHERE p.abteilungId = ? ORDER BY p.lastName ASC, p.firstName ASC LIMIT ? OFFSET ?`,
      args: [abteilungId, size, page * size],
    });
    const rows = rowsResult.rows as unknown as PersonDTO[];

    return buildPage(rows, total, page, size);
  },

  async create(dto: AbteilungCreateDTO): Promise<AbteilungDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO abteilung (name, description, firmaId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [dto.name, dto.description ?? null, dto.firmaId, now, now],
    });
    if (result.lastInsertRowid === undefined) {
      throw new Error('INSERT abteilung returned no rowid');
    }
    return this.findById(Number(result.lastInsertRowid));
  },

  async update(id: number, dto: AbteilungCreateDTO): Promise<AbteilungDTO> {
    await this.findById(id);
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE abteilung SET name=?, description=?, firmaId=?, updatedAt=? WHERE id=?`,
      args: [dto.name, dto.description ?? null, dto.firmaId, now, id],
    });
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await client.execute({
      sql: 'DELETE FROM abteilung WHERE id = ?',
      args: [id],
    });
  },
};
