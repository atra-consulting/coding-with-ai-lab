import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import type { AktivitaetCreateDTO } from '../utils/validation.js';

export interface AktivitaetDTO {
  id: number;
  typ: string;
  subject: string;
  beschreibung: string | null;
  datum: string;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AktivitaetRow {
  id: number;
  typ: string;
  subject: string;
  beschreibung: string | null;
  datum: string;
  firmaId: number | null;
  firmaName: string | null;
  personId: number | null;
  personFirstName: string | null;
  personLastName: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: AktivitaetRow): AktivitaetDTO {
  const personName =
    row.personFirstName && row.personLastName
      ? `${row.personFirstName} ${row.personLastName}`
      : row.personFirstName ?? row.personLastName ?? null;

  return {
    id: row.id,
    typ: row.typ,
    subject: row.subject,
    beschreibung: row.beschreibung,
    datum: row.datum,
    firmaId: row.firmaId,
    firmaName: row.firmaName,
    personId: row.personId,
    personName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BASE_QUERY = `
  SELECT ak.id, ak.typ, ak.subject, ak.beschreibung, ak.datum,
         ak.firmaId, f.name AS firmaName,
         ak.personId, p.firstName AS personFirstName, p.lastName AS personLastName,
         ak.createdAt, ak.updatedAt
  FROM aktivitaet ak
  LEFT JOIN firma f ON ak.firmaId = f.id
  LEFT JOIN person p ON ak.personId = p.id
`;

export const aktivitaetService = {
  findAll(page: number, size: number, sort: SortParams): PageResult<AktivitaetDTO> {
    const countRow = sqlite
      .prepare('SELECT COUNT(*) AS cnt FROM aktivitaet')
      .get() as { cnt: number };
    const total = Number(countRow.cnt);

    const rows = sqlite
      .prepare(
        `${BASE_QUERY} ORDER BY ak.${sort.field} ${sort.direction} LIMIT ? OFFSET ?`
      )
      .all(size, page * size) as AktivitaetRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  listAll(): AktivitaetDTO[] {
    const rows = sqlite
      .prepare(`${BASE_QUERY} ORDER BY ak.datum DESC`)
      .all() as AktivitaetRow[];
    return rows.map(toDTO);
  },

  findById(id: number): AktivitaetDTO {
    const row = sqlite
      .prepare(`${BASE_QUERY} WHERE ak.id = ?`)
      .get(id) as AktivitaetRow | undefined;
    if (!row) throw new NotFoundError(`Aktivität mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  create(dto: AktivitaetCreateDTO): AktivitaetDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO aktivitaet (typ, subject, beschreibung, datum, firmaId, personId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dto.typ,
        dto.subject,
        dto.beschreibung ?? null,
        dto.datum,
        dto.firmaId ?? null,
        dto.personId ?? null,
        now,
        now
      );
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id: number, dto: AktivitaetCreateDTO): AktivitaetDTO {
    this.findById(id);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE aktivitaet SET typ=?, subject=?, beschreibung=?, datum=?, firmaId=?, personId=?, updatedAt=? WHERE id=?`
      )
      .run(
        dto.typ,
        dto.subject,
        dto.beschreibung ?? null,
        dto.datum,
        dto.firmaId ?? null,
        dto.personId ?? null,
        now,
        id
      );
    return this.findById(id);
  },

  delete(id: number): void {
    this.findById(id);
    sqlite.prepare('DELETE FROM aktivitaet WHERE id = ?').run(id);
  },
};
