import { sqlite } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import type { SavedReportCreateDTO } from '../utils/validation.js';

export interface SavedReportDTO {
  id: number;
  name: string;
  beschreibung: string | null;
  queryJson: string;
  benutzerId: number;
  createdAt: string;
  updatedAt: string;
}

interface SavedReportRow {
  id: number;
  name: string;
  beschreibung: string | null;
  queryJson: string;
  benutzerId: number;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: SavedReportRow): SavedReportDTO {
  return {
    id: row.id,
    name: row.name,
    beschreibung: row.beschreibung,
    queryJson: row.queryJson,
    benutzerId: row.benutzerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireOwned(id: number, benutzerId: number): SavedReportDTO {
  const row = sqlite
    .prepare('SELECT * FROM savedReport WHERE id = ?')
    .get(id) as SavedReportRow | undefined;
  // Return 404 regardless of whether the record exists or is owned by someone else
  if (!row || row.benutzerId !== benutzerId) {
    throw new NotFoundError(`SavedReport mit ID ${id} nicht gefunden`);
  }
  return toDTO(row);
}

export const savedReportService = {
  getByBenutzer(benutzerId: number): SavedReportDTO[] {
    const rows = sqlite
      .prepare('SELECT * FROM savedReport WHERE benutzerId = ? ORDER BY createdAt DESC')
      .all(benutzerId) as SavedReportRow[];
    return rows.map(toDTO);
  },

  create(benutzerId: number, dto: SavedReportCreateDTO): SavedReportDTO {
    const now = new Date().toISOString();
    const result = sqlite
      .prepare(
        `INSERT INTO savedReport (name, beschreibung, queryJson, benutzerId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(dto.name, dto.beschreibung ?? null, dto.queryJson, benutzerId, now, now);
    const row = sqlite
      .prepare('SELECT * FROM savedReport WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as SavedReportRow;
    return toDTO(row);
  },

  update(id: number, benutzerId: number, dto: SavedReportCreateDTO): SavedReportDTO {
    requireOwned(id, benutzerId);
    const now = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE savedReport SET name=?, beschreibung=?, queryJson=?, updatedAt=? WHERE id=?`
      )
      .run(dto.name, dto.beschreibung ?? null, dto.queryJson, now, id);
    return requireOwned(id, benutzerId);
  },

  delete(id: number, benutzerId: number): void {
    requireOwned(id, benutzerId);
    sqlite.prepare('DELETE FROM savedReport WHERE id = ?').run(id);
  },
};
