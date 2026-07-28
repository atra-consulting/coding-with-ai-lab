import { client } from '../config/db.js';
import type { InValue } from '@libsql/client';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { AdresseCreateDTO } from '../utils/validation.js';

export interface AdresseDTO {
  id: number;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  typ: string | null;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personName: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

interface AdresseRow {
  id: number;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  typ: string | null;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personFirstName: string | null;
  personLastName: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: AdresseRow): AdresseDTO {
  const personName =
    row.personFirstName && row.personLastName
      ? `${row.personFirstName} ${row.personLastName}`
      : row.personFirstName ?? row.personLastName ?? null;

  return {
    id: row.id,
    street: row.street,
    houseNumber: row.houseNumber,
    postalCode: row.postalCode,
    city: row.city,
    country: row.country,
    typ: row.typ,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    personId: row.personId,
    personName,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT a.id, a.street, a.houseNumber, a.postalCode, a.city, a.country, a.typ,
         a.firmaId, f.name AS firmaName,
         a.personId, p.firstName AS personFirstName, p.lastName AS personLastName,
         a.latitude, a.longitude,
         a.createdAt, a.updatedAt
  FROM adresse a
  LEFT JOIN firma f ON a.firmaId = f.id
  LEFT JOIN person p ON a.personId = p.id
`;

export const adresseService = {
  async findAll(search: string | undefined, page: number, size: number, sort: SortParams): Promise<PageResult<AdresseDTO>> {
    const where = search
      ? `WHERE LOWER(a.city) LIKE LOWER('%' || ? || '%')`
      : '';
    const params: InValue[] = search ? [search] : [];

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM adresse a ${where}`,
      args: [...params],
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `${BASE_QUERY} ${where} ORDER BY a.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [...params, size, page * size],
    });
    const rows = rowsResult.rows as unknown as AdresseRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async listAll(): Promise<AdresseDTO[]> {
    const result = await client.execute({
      sql: `${BASE_QUERY} ORDER BY a.city ASC`,
      args: [],
    });
    const rows = result.rows as unknown as AdresseRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<AdresseDTO> {
    const result = await client.execute({
      sql: `${BASE_QUERY} WHERE a.id = ?`,
      args: [id],
    });
    const row = result.rows[0] as unknown as AdresseRow | undefined;
    if (!row) throw new NotFoundError(`Adresse mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async create(dto: AdresseCreateDTO): Promise<AdresseDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO adresse (street, houseNumber, postalCode, city, country, typ, firmaId, personId, latitude, longitude, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        dto.street ?? null,
        dto.houseNumber ?? null,
        dto.postalCode ?? null,
        dto.city ?? null,
        dto.country ?? null,
        dto.typ ?? null,
        dto.firmaId ?? null,
        dto.personId ?? null,
        dto.latitude ?? null,
        dto.longitude ?? null,
        now,
        now,
      ],
    });
    if (result.lastInsertRowid === undefined) {
      throw new Error('INSERT adresse returned no rowid');
    }
    return this.findById(Number(result.lastInsertRowid));
  },

  async update(id: number, dto: AdresseCreateDTO): Promise<AdresseDTO> {
    const current = await this.findById(id);
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE adresse SET street=?, houseNumber=?, postalCode=?, city=?, country=?, typ=?, firmaId=?, personId=?, latitude=?, longitude=?, updatedAt=? WHERE id=?`,
      args: [
        dto.street ?? null,
        dto.houseNumber ?? null,
        dto.postalCode ?? null,
        dto.city ?? null,
        dto.country ?? null,
        dto.typ ?? null,
        dto.firmaId ?? null,
        dto.personId ?? null,
        dto.latitude === undefined ? current.latitude : dto.latitude,
        dto.longitude === undefined ? current.longitude : dto.longitude,
        now,
        id,
      ],
    });
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await client.execute({
      sql: 'DELETE FROM adresse WHERE id = ?',
      args: [id],
    });
  },
};
