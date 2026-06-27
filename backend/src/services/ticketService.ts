import { client } from '../config/db.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import {
  TICKET_OWNER,
  TICKET_TYPE,
  TICKET_STATUS,
  type TicketOwner,
  type TicketType,
  type TicketStatus,
  type TicketSolution,
} from '../db/schema/enums.js';
import { seedTickets, TICKET_SEED_COUNT } from '../seed/ticketSeed.js';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface TicketCommentDTO {
  id: number;
  ticketId: number;
  author: string;
  authorName: string | null;
  body: string;
  createdAt: string;
}

export interface TicketDTO {
  id: number;
  owner: string;
  type: string;
  title: string;
  body: string;
  status: string;
  solution: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: TicketCommentDTO[];
}

export interface TicketListItemDTO {
  id: number;
  owner: string;
  type: string;
  title: string;
  body: string;
  status: string;
  solution: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface TicketBoardDTO {
  TODO: TicketListItemDTO[];
  IN_PROGRESS: TicketListItemDTO[];
  ON_HOLD: TicketListItemDTO[];
  DONE: TicketListItemDTO[];
}

/**
 * TicketSummaryDTO shape:
 * {
 *   byStatus: { TODO, IN_PROGRESS, ON_HOLD, DONE },
 *   byType:   { FEATURE, BUG, CHORE },
 *   byOwner:  { AI, HUMAN },
 *   bySolution: { DONE, WONT_DO }   // counts only among resolved tickets
 * }
 */
export interface TicketSummaryDTO {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byOwner: Record<string, number>;
  bySolution: Record<string, number>;
}

export interface TicketFilters {
  type?: string;
  status?: string;
  owner?: string;
}

// ─── Internal row types ────────────────────────────────────────────────────────

interface TicketRow {
  id: number;
  owner: string;
  type: string;
  title: string;
  body: string;
  status: string;
  solution: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketCommentRow {
  id: number;
  ticketId: number;
  author: string;
  authorName: string | null;
  body: string;
  createdAt: string;
}

interface TicketListRow extends TicketRow {
  commentCount: number;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toCommentDTO(row: TicketCommentRow): TicketCommentDTO {
  return {
    id: row.id,
    ticketId: row.ticketId,
    author: row.author,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt,
  };
}

function toDTO(row: TicketRow, comments: TicketCommentDTO[]): TicketDTO {
  return {
    id: row.id,
    owner: row.owner,
    type: row.type,
    title: row.title,
    body: row.body,
    status: row.status,
    solution: row.solution,
    pickedUpAt: row.pickedUpAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    comments,
  };
}

function toListItemDTO(row: TicketListRow): TicketListItemDTO {
  return {
    id: row.id,
    owner: row.owner,
    type: row.type,
    title: row.title,
    body: row.body,
    status: row.status,
    solution: row.solution,
    pickedUpAt: row.pickedUpAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    commentCount: Number(row.commentCount),
  };
}

// ─── Helper: load comments for one ticket ─────────────────────────────────────

async function loadComments(ticketId: number): Promise<TicketCommentDTO[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM ticket_comment WHERE ticketId = ? ORDER BY createdAt ASC',
    args: [ticketId],
  });
  return (result.rows as unknown as TicketCommentRow[]).map(toCommentDTO);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ticketService = {
  /**
   * Atomic claim: flip oldest TODO+AI ticket to IN_PROGRESS.
   * Optional type filter is added to the WHERE clause only when provided.
   */
  async findNext(type?: string): Promise<TicketDTO | null> {
    const now = new Date().toISOString();

    let sql: string;
    let args: (string | null)[];

    if (type !== undefined) {
      sql = `UPDATE ticket
             SET status = 'IN_PROGRESS', pickedUpAt = ?, updatedAt = ?
             WHERE id = (
               SELECT id FROM ticket
               WHERE status = 'TODO' AND owner = 'AI' AND type = ?
               ORDER BY createdAt ASC LIMIT 1
             )
             RETURNING *`;
      args = [now, now, type];
    } else {
      sql = `UPDATE ticket
             SET status = 'IN_PROGRESS', pickedUpAt = ?, updatedAt = ?
             WHERE id = (
               SELECT id FROM ticket
               WHERE status = 'TODO' AND owner = 'AI'
               ORDER BY createdAt ASC LIMIT 1
             )
             RETURNING *`;
      args = [now, now];
    }

    const result = await client.execute({ sql, args });
    const row = result.rows[0] as unknown as TicketRow | undefined;
    if (!row) return null;

    const comments = await loadComments(row.id);
    return toDTO(row, comments);
  },

  /** Load ticket + comments; throws NotFoundError if missing. */
  async findById(id: number): Promise<TicketDTO> {
    const result = await client.execute({
      sql: 'SELECT * FROM ticket WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0] as unknown as TicketRow | undefined;
    if (!row) throw new NotFoundError(`Ticket mit ID ${id} nicht gefunden`);
    const comments = await loadComments(id);
    return toDTO(row, comments);
  },

  /**
   * Mark ticket done (agent). Guard: status must be IN_PROGRESS.
   * Optional closing AGENT comment inserted after the guarded UPDATE succeeds.
   */
  async done(id: number, comment?: string): Promise<TicketDTO> {
    const now = new Date().toISOString();

    // Step 1: guarded UPDATE alone
    const result = await client.execute({
      sql: `UPDATE ticket
            SET status = 'DONE', solution = 'DONE', resolvedAt = ?, updatedAt = ?
            WHERE id = ? AND status = 'IN_PROGRESS'`,
      args: [now, now, id],
    });

    // Step 2: 0 rows → 404 if missing, 409 if wrong state
    if (result.rowsAffected === 0) {
      await this.findById(id); // throws NotFoundError 404 if missing
      throw new ConflictError(
        `Ticket ${id} ist nicht in Bearbeitung und kann nicht abgeschlossen werden`,
      );
    }

    // Step 3: UPDATE succeeded → insert comment if provided
    if (comment !== undefined) {
      await client.execute({
        sql: `INSERT INTO ticket_comment (ticketId, author, authorName, body, createdAt)
              VALUES (?, 'AGENT', NULL, ?, ?)`,
        args: [id, comment, now],
      });
    }

    // Step 4: return fresh ticket
    return this.findById(id);
  },

  /**
   * Hand ticket back to human with a question (agent).
   * Guard: status must be IN_PROGRESS.
   * Sequential: UPDATE first, then INSERT AGENT comment only on success.
   */
  async ask(id: number, question: string): Promise<TicketDTO> {
    const now = new Date().toISOString();

    // Step 1: guarded UPDATE alone
    const result = await client.execute({
      sql: `UPDATE ticket
            SET status = 'ON_HOLD', owner = 'HUMAN', updatedAt = ?
            WHERE id = ? AND status = 'IN_PROGRESS'`,
      args: [now, id],
    });

    // Step 2: 0 rows → 404 if missing, 409 if wrong state
    if (result.rowsAffected === 0) {
      await this.findById(id); // throws NotFoundError 404 if missing
      throw new ConflictError(
        `Ticket ${id} ist nicht in Bearbeitung und kann daher nicht auf Halten gesetzt werden`,
      );
    }

    // Step 3: UPDATE succeeded → insert the AGENT question comment
    await client.execute({
      sql: `INSERT INTO ticket_comment (ticketId, author, authorName, body, createdAt)
            VALUES (?, 'AGENT', NULL, ?, ?)`,
      args: [id, question, now],
    });

    // Step 4: return fresh ticket
    return this.findById(id);
  },

  /**
   * Human-only resolution as Won't Do.
   * Guard: status != DONE AND owner = HUMAN.
   * Sequential: UPDATE first, then INSERT HUMAN comment only on success.
   */
  async wontDo(id: number, comment?: string): Promise<TicketDTO> {
    const now = new Date().toISOString();

    // Step 1: guarded UPDATE alone
    const result = await client.execute({
      sql: `UPDATE ticket
            SET status = 'DONE', solution = 'WONT_DO', resolvedAt = ?, updatedAt = ?
            WHERE id = ? AND status != 'DONE' AND owner = 'HUMAN'`,
      args: [now, now, id],
    });

    // Step 2: 0 rows → 404 if missing, 409 if wrong state
    if (result.rowsAffected === 0) {
      await this.findById(id); // throws NotFoundError 404 if missing
      throw new ConflictError(
        `Ticket ${id} kann nicht als "Won't Do" markiert werden: entweder bereits erledigt oder nicht dem Menschen zugewiesen`,
      );
    }

    // Step 3: UPDATE succeeded → insert comment if provided
    if (comment !== undefined) {
      await client.execute({
        sql: `INSERT INTO ticket_comment (ticketId, author, authorName, body, createdAt)
              VALUES (?, 'HUMAN', NULL, ?, ?)`,
        args: [id, comment, now],
      });
    }

    // Step 4: return fresh ticket
    return this.findById(id);
  },

  /** Paginated list with optional filters. */
  async findAll(
    filters: TicketFilters,
    page: number,
    size: number,
    sort: SortParams,
  ): Promise<PageResult<TicketListItemDTO>> {
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (filters.type) {
      conditions.push('t.type = ?');
      args.push(filters.type);
    }
    if (filters.status) {
      conditions.push('t.status = ?');
      args.push(filters.status);
    }
    if (filters.owner) {
      conditions.push('t.owner = ?');
      args.push(filters.owner);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM ticket t ${where}`,
      args,
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `SELECT t.*,
                   (SELECT COUNT(*) FROM ticket_comment tc WHERE tc.ticketId = t.id) AS commentCount
            FROM ticket t
            ${where}
            ORDER BY t.${sort.field} ${sort.direction}
            LIMIT ? OFFSET ?`,
      args: [...args, size, page * size],
    });
    const rows = rowsResult.rows as unknown as TicketListRow[];

    return buildPage(rows.map(toListItemDTO), total, page, size);
  },

  /** Board grouped by status, each ticket includes commentCount, ordered by createdAt ASC within column. */
  async getBoard(): Promise<TicketBoardDTO> {
    const result = await client.execute({
      sql: `SELECT t.*,
                   (SELECT COUNT(*) FROM ticket_comment tc WHERE tc.ticketId = t.id) AS commentCount
            FROM ticket t
            ORDER BY t.status ASC, t.createdAt ASC`,
      args: [],
    });

    const board: TicketBoardDTO = { TODO: [], IN_PROGRESS: [], ON_HOLD: [], DONE: [] };

    for (const rawRow of result.rows) {
      const row = rawRow as unknown as TicketListRow;
      const item = toListItemDTO(row);
      if (row.status === 'TODO') board.TODO.push(item);
      else if (row.status === 'IN_PROGRESS') board.IN_PROGRESS.push(item);
      else if (row.status === 'ON_HOLD') board.ON_HOLD.push(item);
      else if (row.status === 'DONE') board.DONE.push(item);
    }

    return board;
  },

  /**
   * Summary counts.
   * byStatus:   counts per Kanban column
   * byType:     counts per ticket type
   * byOwner:    counts per owner
   * bySolution: counts among DONE tickets split by solution value
   */
  async getSummary(): Promise<TicketSummaryDTO> {
    const statusResult = await client.execute({
      sql: `SELECT status, COUNT(*) AS cnt FROM ticket GROUP BY status`,
      args: [],
    });
    const typeResult = await client.execute({
      sql: `SELECT type, COUNT(*) AS cnt FROM ticket GROUP BY type`,
      args: [],
    });
    const ownerResult = await client.execute({
      sql: `SELECT owner, COUNT(*) AS cnt FROM ticket GROUP BY owner`,
      args: [],
    });
    const solutionResult = await client.execute({
      sql: `SELECT solution, COUNT(*) AS cnt FROM ticket WHERE solution IS NOT NULL GROUP BY solution`,
      args: [],
    });

    interface CountRow {
      status?: string;
      type?: string;
      owner?: string;
      solution?: string;
      cnt: number;
    }

    // Initialise with all known enum values at zero
    const byStatus: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, ON_HOLD: 0, DONE: 0 };
    for (const r of statusResult.rows as unknown as CountRow[]) {
      if (r.status) byStatus[r.status] = Number(r.cnt);
    }

    const byType: Record<string, number> = { FEATURE: 0, BUG: 0, CHORE: 0 };
    for (const r of typeResult.rows as unknown as CountRow[]) {
      if (r.type) byType[r.type] = Number(r.cnt);
    }

    const byOwner: Record<string, number> = { AI: 0, HUMAN: 0 };
    for (const r of ownerResult.rows as unknown as CountRow[]) {
      if (r.owner) byOwner[r.owner] = Number(r.cnt);
    }

    const bySolution: Record<string, number> = { DONE: 0, WONT_DO: 0 };
    for (const r of solutionResult.rows as unknown as CountRow[]) {
      if (r.solution) bySolution[r.solution] = Number(r.cnt);
    }

    return { byStatus, byType, byOwner, bySolution };
  },

  /** Create a new ticket (human-owned, TODO). */
  async create(data: {
    type: TicketType;
    title: string;
    body: string;
  }): Promise<TicketDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `INSERT INTO ticket (owner, type, title, body, status, solution, pickedUpAt, resolvedAt, createdAt, updatedAt)
            VALUES ('HUMAN', ?, ?, ?, 'TODO', NULL, NULL, NULL, ?, ?)
            RETURNING *`,
      args: [data.type, data.title, data.body, now, now],
    });
    const row = result.rows[0] as unknown as TicketRow;
    return toDTO(row, []);
  },

  /**
   * Admin drag-drop: change status only.
   * Into DONE → set solution=DONE, resolvedAt.
   * Out of DONE → clear solution, resolvedAt.
   * Owner is never touched.
   */
  async setStatus(id: number, status: TicketStatus): Promise<TicketDTO> {
    const now = new Date().toISOString();

    let sql: string;
    let args: (string | number | null)[];

    if (status === 'DONE') {
      sql = `UPDATE ticket
             SET status = ?, solution = 'DONE', resolvedAt = ?, updatedAt = ?
             WHERE id = ?`;
      args = [status, now, now, id];
    } else {
      sql = `UPDATE ticket
             SET status = ?, solution = NULL, resolvedAt = NULL, updatedAt = ?
             WHERE id = ?`;
      args = [status, now, id];
    }

    const result = await client.execute({ sql, args });
    if (result.rowsAffected === 0) throw new NotFoundError(`Ticket mit ID ${id} nicht gefunden`);
    return this.findById(id);
  },

  /** Admin: change owner only. */
  async setOwner(id: number, owner: TicketOwner): Promise<TicketDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `UPDATE ticket SET owner = ?, updatedAt = ? WHERE id = ?`,
      args: [owner, now, id],
    });
    if (result.rowsAffected === 0) throw new NotFoundError(`Ticket mit ID ${id} nicht gefunden`);
    return this.findById(id);
  },

  /**
   * Human answers (admin). Inserts a HUMAN comment.
   * If handBackToAi: also set status=TODO, owner=AI, clear solution+resolvedAt.
   * All in one batch.
   */
  async addComment(
    id: number,
    body: string,
    handBackToAi?: boolean,
  ): Promise<TicketDTO> {
    // Verify ticket exists first
    await this.findById(id);

    const now = new Date().toISOString();

    const stmts: { sql: string; args: (string | number | null)[] }[] = [
      {
        sql: `INSERT INTO ticket_comment (ticketId, author, authorName, body, createdAt)
              VALUES (?, 'HUMAN', NULL, ?, ?)`,
        args: [id, body, now],
      },
    ];

    if (handBackToAi) {
      stmts.push({
        sql: `UPDATE ticket
              SET status = 'TODO', owner = 'AI', solution = NULL, resolvedAt = NULL, updatedAt = ?
              WHERE id = ?`,
        args: [now, id],
      });
    }

    await client.batch(stmts, 'write');
    return this.findById(id);
  },

  /**
   * Workshop reset: delete all ticket data and re-run the seed.
   * Returns the count of seeded tickets.
   */
  async resetAll(): Promise<number> {
    await client.batch(
      [
        { sql: 'DELETE FROM ticket_comment', args: [] },
        { sql: 'DELETE FROM ticket', args: [] },
      ],
      'write',
    );
    await seedTickets();
    return TICKET_SEED_COUNT;
  },
};

// Re-export enum types for use in routes
export type { TicketOwner, TicketType, TicketStatus, TicketSolution };
export { TICKET_OWNER, TICKET_TYPE, TICKET_STATUS };
