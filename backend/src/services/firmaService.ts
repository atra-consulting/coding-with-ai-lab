import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { FirmaCreateDTO } from '../utils/validation.js';

export interface FirmaDTO {
  id: number;
  name: string;
  branche: string | null;
  website: string | null;
  telefon: string | null;
  email: string | null;
  beschreibung: string | null;
  personenCount: number;
  abteilungenCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FirmaRow {
  id: number;
  name: string;
  branche: string | null;
  website: string | null;
  telefon: string | null;
  email: string | null;
  beschreibung: string | null;
  createdAt: string;
  updatedAt: string;
  personenCount: number;
  abteilungenCount: number;
}

function toDTO(row: FirmaRow): FirmaDTO {
  return {
    id: row.id,
    name: row.name,
    branche: row.branche,
    website: row.website,
    telefon: row.telefon,
    email: row.email,
    beschreibung: row.beschreibung,
    personenCount: Number(row.personenCount),
    abteilungenCount: Number(row.abteilungenCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT f.id, f.name, f.branche, f.website, f.telefon, f.email, f.beschreibung,
         f.createdAt, f.updatedAt,
         (SELECT COUNT(*) FROM person p WHERE p.firmaId = f.id) AS personenCount,
         (SELECT COUNT(*) FROM abteilung a WHERE a.firmaId = f.id) AS abteilungenCount
  FROM firma f
`;

export const firmaService = {
  findAll(
    search: string | undefined,
    page: number,
    size: number,
    sort: SortParams
  ): PageResult<FirmaDTO> {
    const where = search
      ? `WHERE LOWER(f.name) LIKE LOWER('%' || ? || '%')`
      : '';
    const params: unknown[] = search ? [search] : [];

    const countRow = sqlite
      .prepare(`SELECT COUNT(*) AS cnt FROM firma f ${where}`)
      .get(...params) as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ${where} ORDER BY f.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(...params, size, page * size) as FirmaRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): FirmaDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY f.name ASC`)
      .all() as FirmaRow[];
    return rows.map(toDTO);
  },

  findById(id: number): FirmaDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE f.id = ?`)
      .get(id) as FirmaRow | undefined;
    if (!row) throw new NotFoundError(`Firma mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  create(dto: FirmaCreateDTO): FirmaDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO firma (name, branche, website, telefon, email, beschreibung, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.name,
        dto.branche ?? null,
        dto.website ?? null,
        dto.telefon ?? null,
        dto.email ?? null,
        dto.beschreibung ?? null,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: FirmaCreateDTO): FirmaDTO {
    this.findById(id); // throws 404 if not found
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE firma SET name=?, branche=?, website=?, telefon=?, email=?, beschreibung=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.name,
        dto.branche ?? null,
        dto.website ?? null,
        dto.telefon ?? null,
        dto.email ?? null,
        dto.beschreibung ?? null,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id); // throws 404 if not found
    sqlite.prepare('DELETE FROM firma WHERE id = ?').run(id);
  },
};
