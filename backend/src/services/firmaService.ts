import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { FirmaCreateDTO } from '../utils/validation.js';

export interface FirmaAddressSummary {
  id: number;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  typ: string | null;
}

export interface FirmaDTO {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  personenCount: number;
  abteilungenCount: number;
  adressen?: FirmaAddressSummary[];
  createdAt: string;
  updatedAt: string;
}

interface FirmaRow {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  personenCount: number;
  abteilungenCount: number;
}

function toDTO(row: FirmaRow): FirmaDTO {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    website: row.website,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    personenCount: Number(row.personenCount),
    abteilungenCount: Number(row.abteilungenCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT f.id, f.name, f.industry, f.website, f.phone, f.email, f.notes,
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
    const adressen = sqlite
      .prepare(
        `SELECT id, street, houseNumber, postalCode, city, country, latitude, longitude, typ
         FROM adresse
         WHERE firmaId = ?
         ORDER BY typ ASC, id ASC`
      )
      .all(id) as FirmaAddressSummary[];
    return { ...toDTO(row), adressen };
  },

  create(dto: FirmaCreateDTO): FirmaDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO firma (name, industry, website, phone, email, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.name,
        dto.industry ?? null,
        dto.website ?? null,
        dto.phone ?? null,
        dto.email ?? null,
        dto.notes ?? null,
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
        `UPDATE firma SET name=?, industry=?, website=?, phone=?, email=?, notes=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.name,
        dto.industry ?? null,
        dto.website ?? null,
        dto.phone ?? null,
        dto.email ?? null,
        dto.notes ?? null,
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
