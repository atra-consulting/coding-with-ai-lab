import { sqlite } from '../config/db.js';
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
  findAll(
    search: string | undefined,
    page: number,
    size: number,
    sort: SortParams
  ): PageResult<PersonDTO> {
    const where = search
      ? `WHERE LOWER(p.firstName) LIKE LOWER('%' || ? || '%') OR LOWER(p.lastName) LIKE LOWER('%' || ? || '%')`
      : '';
    const params: unknown[] = search ? [search, search] : [];

    const countRow = sqlite
      .prepare(`SELECT COUNT(*) AS cnt FROM person p ${where}`)
      .get(...params) as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ${where} ORDER BY p.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(...params, size, page * size) as PersonRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): PersonDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY p.lastName ASC, p.firstName ASC`)
      .all() as PersonRow[];
    return rows.map(toDTO);
  },

  findById(id: number): PersonDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE p.id = ?`)
      .get(id) as PersonRow | undefined;
    if (!row) throw new NotFoundError(`Person mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  findByFirmaId(firmaId: number, page: number, size: number): PageResult<PersonDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM person WHERE firmaId = ?')
      .get(firmaId) as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(`${BASE_QUERY} WHERE p.firmaId = ? ORDER BY p.lastName ASC, p.firstName ASC LIMIT ? OFFSET ?`)
      .all(firmaId, size, page * size) as PersonRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  create(dto: PersonCreateDTO): PersonDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO person (firstName, lastName, email, phone, position, notes, firmaId, abteilungId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.firstName,
        dto.lastName,
        dto.email ?? null,
        dto.phone ?? null,
        dto.position ?? null,
        dto.notes ?? null,
        dto.firmaId,
        dto.abteilungId ?? null,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: PersonCreateDTO): PersonDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE person SET firstName=?, lastName=?, email=?, phone=?, position=?, notes=?, firmaId=?, abteilungId=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.firstName,
        dto.lastName,
        dto.email ?? null,
        dto.phone ?? null,
        dto.position ?? null,
        dto.notes ?? null,
        dto.firmaId,
        dto.abteilungId ?? null,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM person WHERE id = ?').run(id);
  },
};
