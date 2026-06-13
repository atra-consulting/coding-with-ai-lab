import { client } from '../config/db.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { buildPage, type PageResult, type SortParams } from '../utils/pagination.js';
import { AGENT_TASK_SOURCE, type AgentTaskSource, type AgentTaskStatus } from '../db/schema/enums.js';

export interface AgentTaskDTO {
  id: number;
  source: string;
  title: string;
  body: string;
  status: string;
  comment: string | null;
  metadata: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentTaskRow {
  id: number;
  source: string;
  title: string;
  body: string;
  status: string;
  comment: string | null;
  metadata: string | null;
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTaskSummaryDTO {
  source: string;
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  rejectedCount: number;
}

function toDTO(row: AgentTaskRow): AgentTaskDTO {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    body: row.body,
    status: row.status,
    comment: row.comment,
    metadata: row.metadata,
    pickedUpAt: row.pickedUpAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface AgentTaskFilters {
  source?: string;
  status?: string;
}

export const agentTaskService = {
  async findNext(source: string): Promise<AgentTaskDTO | null> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `UPDATE agent_task SET status='IN_PROGRESS', pickedUpAt=?, updatedAt=?
            WHERE id=(SELECT id FROM agent_task WHERE status='OPEN' AND source=? ORDER BY createdAt ASC LIMIT 1)
            RETURNING *`,
      args: [now, now, source],
    });
    const row = result.rows[0] as unknown as AgentTaskRow | undefined;
    return row ? toDTO(row) : null;
  },

  async findById(id: number): Promise<AgentTaskDTO> {
    const result = await client.execute({
      sql: 'SELECT * FROM agent_task WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0] as unknown as AgentTaskRow | undefined;
    if (!row) throw new NotFoundError(`AgentTask mit ID ${id} nicht gefunden`);
    return toDTO(row);
  },

  async reject(id: number, comment: string): Promise<AgentTaskDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `UPDATE agent_task SET status='REJECTED', comment=?, resolvedAt=?, updatedAt=? WHERE id=? AND status NOT IN ('DONE','REJECTED')`,
      args: [comment, now, now, id],
    });
    if (result.rowsAffected === 0) {
      // Either not found or already in a terminal status
      await this.findById(id); // throws NotFoundError (404) if row doesn't exist
      throw new ConflictError(
        `AgentTask ${id} ist bereits in einem terminalen Status und kann nicht abgelehnt werden`,
      );
    }
    return this.findById(id);
  },

  async done(id: number, comment?: string): Promise<AgentTaskDTO> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `UPDATE agent_task SET status='DONE', comment=?, resolvedAt=?, updatedAt=? WHERE id=? AND status NOT IN ('DONE','REJECTED')`,
      args: [comment ?? null, now, now, id],
    });
    if (result.rowsAffected === 0) {
      // Either not found or already in a terminal status
      await this.findById(id); // throws NotFoundError (404) if row doesn't exist
      throw new ConflictError(
        `AgentTask ${id} ist bereits in einem terminalen Status und kann nicht abgeschlossen werden`,
      );
    }
    return this.findById(id);
  },

  async findAll(
    filters: AgentTaskFilters,
    page: number,
    size: number,
    sort: SortParams,
  ): Promise<PageResult<AgentTaskDTO>> {
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (filters.source) {
      conditions.push('source = ?');
      args.push(filters.source);
    }
    if (filters.status) {
      conditions.push('status = ?');
      args.push(filters.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await client.execute({
      sql: `SELECT COUNT(*) AS cnt FROM agent_task ${where}`,
      args,
    });
    const countRow = countResult.rows[0] as unknown as { cnt: number };
    const total = Number(countRow.cnt);

    const rowsResult = await client.execute({
      sql: `SELECT * FROM agent_task ${where} ORDER BY ${sort.field} ${sort.direction} LIMIT ? OFFSET ?`,
      args: [...args, size, page * size],
    });
    const rows = rowsResult.rows as unknown as AgentTaskRow[];

    return buildPage(rows.map(toDTO), total, page, size);
  },

  async resetAll(): Promise<number> {
    const now = new Date().toISOString();
    const result = await client.execute({
      sql: `UPDATE agent_task SET status='OPEN', comment=NULL, pickedUpAt=NULL, resolvedAt=NULL, updatedAt=?`,
      args: [now],
    });
    return result.rowsAffected;
  },

  async getSummary(): Promise<AgentTaskSummaryDTO[]> {
    const result = await client.execute({
      sql: `SELECT source,
                   SUM(CASE WHEN status='OPEN' THEN 1 ELSE 0 END) AS openCount,
                   SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END) AS inProgressCount,
                   SUM(CASE WHEN status='DONE' THEN 1 ELSE 0 END) AS doneCount,
                   SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) AS rejectedCount
            FROM agent_task
            GROUP BY source`,
      args: [],
    });

    interface SummaryRow {
      source: string;
      openCount: number;
      inProgressCount: number;
      doneCount: number;
      rejectedCount: number;
    }

    const rows = result.rows as unknown as SummaryRow[];
    const summaryMap = new Map<string, AgentTaskSummaryDTO>();
    for (const row of rows) {
      summaryMap.set(row.source, {
        source: row.source,
        openCount: Number(row.openCount),
        inProgressCount: Number(row.inProgressCount),
        doneCount: Number(row.doneCount),
        rejectedCount: Number(row.rejectedCount),
      });
    }

    // Backfill all four sources with zero counts if absent
    for (const source of AGENT_TASK_SOURCE as readonly AgentTaskSource[]) {
      if (!summaryMap.has(source)) {
        summaryMap.set(source, {
          source,
          openCount: 0,
          inProgressCount: 0,
          doneCount: 0,
          rejectedCount: 0,
        });
      }
    }

    return Array.from(summaryMap.values());
  },
};

// Re-export status type for use in routes
export type { AgentTaskStatus };
