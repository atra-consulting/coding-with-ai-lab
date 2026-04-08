import { sqlite } from '../config/db.js';
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
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personName: string | null;
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
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personFirstName: string | null;
  personLastName: string | null;
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
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    personId: row.personId,
    personName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT a.id, a.street, a.houseNumber, a.postalCode, a.city, a.country,
         a.firmaId, f.name AS firmaName,
         a.personId, p.firstName AS personFirstName, p.lastName AS personLastName,
         a.createdAt, a.updatedAt
  FROM adresse a
  LEFT JOIN firma f ON a.firmaId = f.id
  LEFT JOIN person p ON a.personId = p.id
`;

export const adresseService = {
  findAll(page: number, size: number, sort: SortParams): PageResult<AdresseDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM adresse')
      .get() as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ORDER BY a.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(size, page * size) as AdresseRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): AdresseDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY a.city ASC`)
      .all() as AdresseRow[];
    return rows.map(toDTO);
  },

  findById(id: number): AdresseDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE a.id = ?`)
      .get(id) as AdresseRow | undefined;
    if (!row) throw new NotFoundError(`Adresse mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  create(dto: AdresseCreateDTO): AdresseDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO adresse (street, houseNumber, postalCode, city, country, firmaId, personId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.street ?? null,
        dto.houseNumber ?? null,
        dto.postalCode ?? null,
        dto.city ?? null,
        dto.country ?? null,
        dto.firmaId ?? null,
        dto.personId ?? null,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: AdresseCreateDTO): AdresseDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE adresse SET street=?, houseNumber=?, postalCode=?, city=?, country=?, firmaId=?, personId=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.street ?? null,
        dto.houseNumber ?? null,
        dto.postalCode ?? null,
        dto.city ?? null,
        dto.country ?? null,
        dto.firmaId ?? null,
        dto.personId ?? null,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM adresse WHERE id = ?').run(id);
  },
};
