import { client } from '../config/db.js';
import type { InValue } from '@libsql/client';
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
  isFavorit: boolean;
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
  is_favorit: number;
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
    isFavorit: row.is_favorit === 1,
    personenCount: Number(row.personenCount),
    abteilungenCount: Number(row.abteilungenCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT f.id, f.name, f.industry, f.website, f.phone, f.email, f.notes,
         f.is_favorit,
         f.createdAt, f.updatedAt,
         (SELECT COUNT(*) FROM person p WHERE p.firmaId = f.id) AS personenCount,
         (SELECT COUNT(*) FROM abteilung a WHERE a.firmaId = f.id) AS abteilungenCount
  FROM firma f
`;

export const firmaService = {
  async findAll(
    search: string | undefined,
    page: number,
    size: number,
    sort: SortParams,
    favoritenOnly: boolean = false
  ): Promise<PageResult<FirmaDTO>> {
    const conditions: string[] = [];
    const params: InValue[] = [];

    if (search) {
      conditions.push(`LOWER(f.name) LIKE LOWER('%' || ? || '%')`);
      params.push(search);
    }
    if (favoritenOnly) {
      conditions.push(`f.is_favorit = 1`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM firma f ${where}`,
      args: [...params],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} ${where} ORDER BY f.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [...params, size, page * size],
    });
    const rows = rowsResult.rows as unknown as FirmaRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async listAll(favoritenOnly: boolean = false): Promise<FirmaDTO[]> {
    const where = favoritenOnly ? 'WHERE f.is_favorit = 1' : '';
    const result = await client.execute({
      sql: `${BASE_QUERY} ${where} ORDER BY f.name ASC`,
      args: [],
    });
    const rows = result.rows as unknown as FirmaRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<FirmaDTO> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE f.id = ?`,
      args: [id],
    });
    const row = result.rows[0] as unknown as FirmaRow | undefined;
    if (!row) throw new NotFoundError(`Firma mit ID ${id} nicht gefunden`);

    const adressenResult = await client.execute({
      sql: `SELECT id, street, houseNumber, postalCode, city, country, latitude, longitude, typ
            FROM adresse
            WHERE firmaId = ?
            ORDER BY typ ASC, id ASC`,
      args: [id],
    });
    const adressen = adressenResult.rows as unknown as FirmaAddressSummary[];
    return { ...toDTO(row), adressen };
  },

  async create(dto: FirmaCreateDTO): Promise<FirmaDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO firma (name, industry, website, phone, email, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        dto.name,
        dto.industry ?? null,
        dto.website ?? null,
        dto.phone ?? null,
        dto.email ?? null,
        dto.notes ?? null,
        now,
        now,
      ],
    });
    if (result.lastInsertRowid === undefined) {
      throw new Error('INSERT firma returned no rowid');
    }
    return this.findById(Number(result.lastInsertRowid));
  },

  async update(id: number, dto: FirmaCreateDTO): Promise<FirmaDTO> {
    await this.findById(id); // throws 404 if not found
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE firma SET name=?, industry=?, website=?, phone=?, email=?, notes=?, updatedAt=? WHERE id=?`,
      args: [
        dto.name,
        dto.industry ?? null,
        dto.website ?? null,
        dto.phone ?? null,
        dto.email ?? null,
        dto.notes ?? null,
        now,
        id,
      ],
    });
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id); // throws 404 if not found
    await client.execute({
      sql: 'DELETE FROM firma WHERE id = ?',
      args: [id],
    });
  },

  async toggleFavorit(id: number): Promise<FirmaDTO> {
    await this.findById(id); // throws 404 if not found
    await client.execute({
      sql: 'UPDATE firma SET is_favorit = CASE WHEN is_favorit = 1 THEN 0 ELSE 1 END WHERE id = ?',
      args: [id],
    });
    return this.findById(id);
  },
};
