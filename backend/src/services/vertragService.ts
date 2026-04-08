import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { VertragCreateDTO } from '../utils/validation.js';

export interface VertragDTO {
  id: number;
  titel: string;
  notes: string | null;
  wert: number | null;
  currency: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  firmaId: number;
  firmaName: string | null;
  kontaktPersonId: number | null;
  kontaktPersonName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VertragRow {
  id: number;
  titel: string;
  notes: string | null;
  wert: number | null;
  currency: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  firmaId: number;
  firmaName: string | null;
  kontaktPersonId: number | null;
  kontaktPersonFirstName: string | null;
  kontaktPersonLastName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: VertragRow): VertragDTO {
  const kontaktPersonName =
    row.kontaktPersonFirstName && row.kontaktPersonLastName
      ? `${row.kontaktPersonFirstName} ${row.kontaktPersonLastName}`
      : row.kontaktPersonFirstName ?? row.kontaktPersonLastName ?? null;

  return {
    id: row.id,
    titel: row.titel,
    notes: row.notes,
    wert: row.wert,
    currency: row.currency,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    kontaktPersonId: row.kontaktPersonId,
    kontaktPersonName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT v.id, v.titel, v.notes, v.wert, v.currency, v.status, v.startDate, v.endDate,
         v.firmaId, f.name AS firmaName,
         v.kontaktPersonId, p.firstName AS kontaktPersonFirstName, p.lastName AS kontaktPersonLastName,
         v.createdAt, v.updatedAt
  FROM vertrag v
  LEFT JOIN firma f ON v.firmaId = f.id
  LEFT JOIN person p ON v.kontaktPersonId = p.id
`;

export const vertragService = {
  findAll(page: number, size: number, sort: SortParams): PageResult<VertragDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM vertrag')
      .get() as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ORDER BY v.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(size, page * size) as VertragRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): VertragDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY v.createdAt DESC`)
      .all() as VertragRow[];
    return rows.map(toDTO);
  },

  findById(id: number): VertragDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE v.id = ?`)
      .get(id) as VertragRow | undefined;
    if (!row) throw new NotFoundError(`Vertrag mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  create(dto: VertragCreateDTO): VertragDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO vertrag (titel, notes, wert, currency, status, startDate, endDate, firmaId, kontaktPersonId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.titel,
        dto.notes ?? null,
        dto.wert ?? null,
        dto.currency ?? 'EUR',
        dto.status ?? 'ENTWURF',
        dto.startDate ?? null,
        dto.endDate ?? null,
        dto.firmaId,
        dto.kontaktPersonId ?? null,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: VertragCreateDTO): VertragDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE vertrag SET titel=?, notes=?, wert=?, currency=?, status=?, startDate=?, endDate=?, firmaId=?, kontaktPersonId=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.titel,
        dto.notes ?? null,
        dto.wert ?? null,
        dto.currency ?? 'EUR',
        dto.status ?? 'ENTWURF',
        dto.startDate ?? null,
        dto.endDate ?? null,
        dto.firmaId,
        dto.kontaktPersonId ?? null,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM vertrag WHERE id = ?').run(id);
  },
};
