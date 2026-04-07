import { sqlite } from '../config/db.js';
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
  findAll(page: number, size: number, sort: SortParams): PageResult<AbteilungDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM abteilung')
      .get() as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ORDER BY a.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(size, page * size) as AbteilungRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): AbteilungDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY a.name ASC`)
      .all() as AbteilungRow[];
    return rows.map(toDTO);
  },

  findById(id: number): AbteilungDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE a.id = ?`)
      .get(id) as AbteilungRow | undefined;
    if (!row) throw new NotFoundError(`Abteilung mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  findByFirmaId(firmaId: number, page: number, size: number): PageResult<AbteilungDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM abteilung WHERE firmaId = ?')
      .get(firmaId) as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} WHERE a.firmaId = ? ORDER BY a.name ASC LIMIT ? OFFSET ?`
      )
      .all(firmaId, size, page * size) as AbteilungRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  findByFirmaIdAll(firmaId: number): AbteilungDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} WHERE a.firmaId = ? ORDER BY a.name ASC`)
      .all(firmaId) as AbteilungRow[];
    return rows.map(toDTO);
  },

  findPersonenByAbteilungId(
    abteilungId: number,
    page: number,
    size: number
  ): PageResult<PersonDTO> {
    // Implementation is set via module-level override below to avoid circular reference issues
    void abteilungId;
    void page;
    void size;
    return {} as PageResult<PersonDTO>;
  },

  create(dto: AbteilungCreateDTO): AbteilungDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO abteilung (name, description, firmaId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`
      )
      .run(dto.name, dto.description ?? null, dto.firmaId, now, now);
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: AbteilungCreateDTO): AbteilungDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(`UPDATE abteilung SET name=?, description=?, firmaId=?, updatedAt=? WHERE id=?`)
      .run(dto.name, dto.description ?? null, dto.firmaId, now, id);
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM abteilung WHERE id = ?').run(id);
  },
};

// Override findPersonenByAbteilungId with proper implementation
abteilungService.findPersonenByAbteilungId = function (
  abteilungId: number,
  page: number,
  size: number
): PageResult<PersonDTO> {
  abteilungService.findById(abteilungId); // throws 404 if not found

  const BASE_PERSON_QUERY = `
    SELECT p.id, p.firstName, p.lastName, p.email, p.phone, p.position, p.notes,
           p.firmaId, f.name AS firmaName,
           p.abteilungId, a.name AS abteilungName,
           p.createdAt, p.updatedAt
    FROM person p
    LEFT JOIN firma f ON p.firmaId = f.id
    LEFT JOIN abteilung a ON p.abteilungId = a.id
  `;

  const countRow = sqlite
    .prepare('SELECT COUNT(*) AS cnt FROM person WHERE abteilungId = ?')
    .get(abteilungId) as { cnt: number };
  const total = Number(countRow.cnt);

  const rows = sqlite
    .prepare(
      `${BASE_PERSON_QUERY} WHERE p.abteilungId = ? ORDER BY p.lastName ASC, p.firstName ASC LIMIT ? OFFSET ?`
    )
    .all(abteilungId, size, page * size) as PersonDTO[];

  return buildPage(rows, total, page, size);
};
