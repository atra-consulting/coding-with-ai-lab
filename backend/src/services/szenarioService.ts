import { client } from '../config/db.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import type { SzenarioCreateDTO } from '../utils/validation.js';

export interface ProzessDauer {
  works: number[];
  waits: number[];
}

export interface SzenarioDTO {
  id: number;
  name: string;
  humanSteps: ProzessDauer;
  semiAutomatedSteps: ProzessDauer;
  automatedSteps: ProzessDauer;
  createdAt: string;
  updatedAt: string;
}

interface SzenarioRow {
  id: number;
  name: string;
  humanSteps: string;
  semiAutomatedSteps: string;
  automatedSteps: string;
  createdAt: string;
  updatedAt: string;
}

function toDTO(row: SzenarioRow): SzenarioDTO {
  return {
    id: row.id,
    name: row.name,
    humanSteps: JSON.parse(row.humanSteps) as ProzessDauer,
    semiAutomatedSteps: JSON.parse(row.semiAutomatedSteps) as ProzessDauer,
    automatedSteps: JSON.parse(row.automatedSteps) as ProzessDauer,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes('UNIQUE constraint failed') ||
      err.message.includes('SQLITE_CONSTRAINT_UNIQUE'))
  );
}

export const szenarioService = {
  async list(): Promise<SzenarioDTO[]> {
    const result = await client.execute({
      sql: 'SELECT * FROM szenario ORDER BY createdAt DESC',
      args: [],
    });
    const rows = result.rows as unknown as SzenarioRow[];
    return rows.map(toDTO);
  },

  async findById(id: number): Promise<SzenarioDTO> {
    const result = await client.execute({
      sql: 'SELECT * FROM szenario WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0] as unknown as SzenarioRow | undefined;
    if (!row) throw new NotFoundError(`Szenario mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async create(dto: SzenarioCreateDTO): Promise<SzenarioDTO> {
    const now = new Date().toISOString();
    try {
      const result = await client.execute({
        sql: `INSERT INTO szenario (name, humanSteps, semiAutomatedSteps, automatedSteps, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          dto.name,
          JSON.stringify(dto.humanSteps),
          JSON.stringify(dto.semiAutomatedSteps),
          JSON.stringify(dto.automatedSteps),
          now,
          now,
        ],
      });
      if (result.lastInsertRowid === undefined) {
        throw new Error('INSERT szenario returned no rowid');
      }
      return this.findById(Number(result.lastInsertRowid));
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictError('Ein Szenario mit diesem Namen existiert bereits');
      }
      throw err;
    }
  },

  async update(id: number, dto: SzenarioCreateDTO): Promise<SzenarioDTO> {
    await this.findById(id);
    const now = new Date().toISOString();
    try {
      await client.execute({
        sql: `UPDATE szenario SET name=?, humanSteps=?, semiAutomatedSteps=?, automatedSteps=?, updatedAt=? WHERE id=?`,
        args: [
          dto.name,
          JSON.stringify(dto.humanSteps),
          JSON.stringify(dto.semiAutomatedSteps),
          JSON.stringify(dto.automatedSteps),
          now,
          id,
        ],
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictError('Ein Szenario mit diesem Namen existiert bereits');
      }
      throw err;
    }
    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await client.execute({
      sql: 'DELETE FROM szenario WHERE id = ?',
      args: [id],
    });
  },
};
