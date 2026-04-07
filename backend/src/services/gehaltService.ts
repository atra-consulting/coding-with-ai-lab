import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { GehaltCreateDTO } from '../utils/validation.js';

export interface GehaltDTO {
  id: number;
  amount: number;
  typ: string;
  effectiveDate: string;
  beschreibung: string | null;
  personId: number;
  personName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GehaltRow {
  id: number;
  amount: number;
  typ: string;
  effectiveDate: string;
  beschreibung: string | null;
  personId: number;
  personFirstName: string | null;
  personLastName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: GehaltRow): GehaltDTO {
  const personName =
    row.personFirstName && row.personLastName
      ? `${row.personFirstName} ${row.personLastName}`
      : row.personFirstName ?? row.personLastName ?? null;

  return {
    id: row.id,
    amount: row.amount,
    typ: row.typ,
    effectiveDate: row.effectiveDate,
    beschreibung: row.beschreibung,
    personId: row.personId,
    personName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT g.id, g.amount, g.typ, g.effectiveDate, g.beschreibung,
         g.personId, p.firstName AS personFirstName, p.lastName AS personLastName,
         g.createdAt, g.updatedAt
  FROM gehalt g
  LEFT JOIN person p ON g.personId = p.id
`;

export const gehaltService = {
  findAll(page: number, size: number, sort: SortParams): PageResult<GehaltDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM gehalt')
      .get() as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ORDER BY g.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(size, page * size) as GehaltRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): GehaltDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY g.effectiveDate DESC`)
      .all() as GehaltRow[];
    return rows.map(toDTO);
  },

  findById(id: number): GehaltDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE g.id = ?`)
      .get(id) as GehaltRow | undefined;
    if (!row) throw new NotFoundError(`Gehalt mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  create(dto: GehaltCreateDTO): GehaltDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO gehalt (amount, typ, effectiveDate, beschreibung, personId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.amount,
        dto.typ ?? 'MONATLICH',
        dto.effectiveDate,
        dto.beschreibung ?? null,
        dto.personId,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: GehaltCreateDTO): GehaltDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE gehalt SET amount=?, typ=?, effectiveDate=?, beschreibung=?, personId=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.amount,
        dto.typ ?? 'MONATLICH',
        dto.effectiveDate,
        dto.beschreibung ?? null,
        dto.personId,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM gehalt WHERE id = ?').run(id);
  },
};
