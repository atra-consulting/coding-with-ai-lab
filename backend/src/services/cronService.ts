import { z } from 'zod';
import { client } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPage, parsePaginationParams, parseSort, type PageResult, type SortParams } from '../utils/pagination.js';
import { CRON_JOBS } from '../config/cronJobs.js';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface CronRunDTO {
  id: number;
  job: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  result: string | null;
  githubRunUrl: string | null;
  error: string | null;
}

// Internal row type returned by raw SQL queries (field names == column names)
interface CronRunRow {
  id: number;
  job: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  result: string | null;
  githubRunUrl: string | null;
  error: string | null;
}

function toDTO(row: CronRunRow): CronRunDTO {
  return {
    id: row.id,
    job: row.job,
    status: row.status,
    trigger: row.trigger,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    durationMs: row.durationMs !== null ? Number(row.durationMs) : null,
    result: row.result,
    githubRunUrl: row.githubRunUrl,
    error: row.error,
  };
}

// ─── Zod schema for POST /runs/:id/complete ───────────────────────────────────

export const CompleteRunBodySchema = z.object({
  status: z.enum(['SUCCESS', 'FAILED']),
  tasksSolved: z.number().int().min(0),
  tasksRejected: z.number().int().min(0),
  githubRunUrl: z.string().url(),
});

export type CompleteRunBody = z.infer<typeof CompleteRunBodySchema>;

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new RUNNING cron run.
 * startedAt is always an explicit ISO-8601 string — never datetime('now') —
 * so that the orphan guard's lexicographic comparison is safe.
 */
export async function createRun(job: string, trigger: string): Promise<CronRunDTO> {
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: `INSERT INTO cron_run (job, status, "trigger", startedAt)
          VALUES (?, 'RUNNING', ?, ?)
          RETURNING *`,
    args: [job, trigger, now],
  });
  const row = result.rows[0] as unknown as CronRunRow;
  return toDTO(row);
}

/**
 * Record a skipped run (nothing to do / already running).
 */
export async function recordSkip(
  job: string,
  trigger: string,
  skipReason: string,
): Promise<CronRunDTO> {
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: `INSERT INTO cron_run (job, status, "trigger", startedAt, finishedAt, durationMs, result)
          VALUES (?, 'SKIPPED', ?, ?, ?, 0, ?)
          RETURNING *`,
    args: [job, trigger, now, now, JSON.stringify({ skipReason })],
  });
  const row = result.rows[0] as unknown as CronRunRow;
  return toDTO(row);
}

/**
 * Mark a RUNNING run as FAILED (e.g. dispatch error).
 */
export async function markFailed(id: number, error: string): Promise<CronRunDTO> {
  const now = new Date().toISOString();

  // First fetch startedAt so we can compute durationMs
  const fetchResult = await client.execute({
    sql: 'SELECT startedAt FROM cron_run WHERE id = ?',
    args: [id],
  });
  const existing = fetchResult.rows[0] as unknown as { startedAt: string } | undefined;
  const durationMs = existing
    ? Math.max(0, new Date(now).getTime() - new Date(existing.startedAt).getTime())
    : 0;

  const result = await client.execute({
    sql: `UPDATE cron_run
          SET status='FAILED', finishedAt=?, durationMs=?, error=?
          WHERE id=?
          RETURNING *`,
    args: [now, durationMs, error, id],
  });
  const row = result.rows[0] as unknown as CronRunRow;
  return toDTO(row);
}

/**
 * Complete a run with final status, counts, and the GitHub Actions run URL.
 * Throws NotFoundError if the id does not exist.
 */
export async function completeRun(
  id: number,
  body: CompleteRunBody,
): Promise<CronRunDTO> {
  const now = new Date().toISOString();
  const { status, tasksSolved, tasksRejected, githubRunUrl } = body;

  // Fetch the existing row to compute durationMs
  const fetchResult = await client.execute({
    sql: 'SELECT startedAt FROM cron_run WHERE id = ?',
    args: [id],
  });
  const existing = fetchResult.rows[0] as unknown as { startedAt: string } | undefined;
  if (!existing) {
    throw new NotFoundError(`CronRun mit ID ${id} nicht gefunden`);
  }

  const durationMs = Math.max(
    0,
    new Date(now).getTime() - new Date(existing.startedAt).getTime(),
  );

  const result = await client.execute({
    sql: `UPDATE cron_run
          SET status=?, finishedAt=?, durationMs=?, result=?, githubRunUrl=?
          WHERE id=?
          RETURNING *`,
    args: [
      status,
      now,
      durationMs,
      JSON.stringify({ tasksSolved, tasksRejected }),
      githubRunUrl,
      id,
    ],
  });

  const row = result.rows[0] as unknown as CronRunRow | undefined;
  if (!row) {
    // Shouldn't happen after the SELECT above, but guard defensively
    throw new NotFoundError(`CronRun mit ID ${id} nicht gefunden`);
  }
  return toDTO(row);
}

/**
 * Expire orphaned RUNNING rows older than 30 min, then check if any run
 * for this job is still RUNNING. Returns true if a run is in progress.
 */
export async function isRunInProgress(job: string): Promise<boolean> {
  const nowISO = new Date().toISOString();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Expire orphans: RUNNING rows for this job older than 30 minutes.
  // Compute durationMs per-row via a subquery reading startedAt from the same row.
  // SQLite does not support window functions in UPDATE FROM, so we use a CASE
  // expression: durationMs = (finishedAt - startedAt) in JS terms; here we
  // use CAST((julianday(finishedAt) - julianday(startedAt)) * 86400000 AS INTEGER).
  await client.execute({
    sql: `UPDATE cron_run
          SET status   = 'FAILED',
              error    = 'Orphaned: no callback within 30 min',
              finishedAt = ?,
              durationMs = CAST((julianday(?) - julianday(startedAt)) * 86400000 AS INTEGER)
          WHERE job = ? AND status = 'RUNNING' AND startedAt < ?`,
    args: [nowISO, nowISO, job, cutoff],
  });

  const countResult = await client.execute({
    sql: `SELECT COUNT(*) AS cnt FROM cron_run WHERE job = ? AND status = 'RUNNING'`,
    args: [job],
  });
  const countRow = countResult.rows[0] as unknown as { cnt: number };
  return Number(countRow.cnt) > 0;
}

/**
 * Paginated list of cron runs, optionally filtered by job name.
 */
export async function listRuns(
  job: string | undefined,
  page: number,
  size: number,
  sort: SortParams,
): Promise<PageResult<CronRunDTO>> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (job !== undefined && job !== '') {
    conditions.push('job = ?');
    args.push(job);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Quote "trigger" in ORDER BY to be safe, but the sort field comes from the
  // whitelist so it is already a known safe column name.
  const orderField =
    sort.field === 'trigger' ? '"trigger"' : sort.field;

  const countResult = await client.execute({
    sql: `SELECT COUNT(*) AS cnt FROM cron_run ${where}`,
    args,
  });
  const countRow = countResult.rows[0] as unknown as { cnt: number };
  const total = Number(countRow.cnt);

  const rowsResult = await client.execute({
    sql: `SELECT * FROM cron_run ${where}
          ORDER BY ${orderField} ${sort.direction}
          LIMIT ? OFFSET ?`,
    args: [...args, size, page * size],
  });
  const rows = rowsResult.rows as unknown as CronRunRow[];

  return buildPage(rows.map(toDTO), total, page, size);
}

// ─── Job-level view ───────────────────────────────────────────────────────────

export interface CronJobWithLastRun {
  name: string;
  schedule: string;
  description: string;
  dispatchEventType: string;
  lastRun: CronRunDTO | null;
}

/**
 * For each entry in CRON_JOBS, fetch the newest cron_run row (or null).
 */
export async function deriveJobsWithLastRun(): Promise<CronJobWithLastRun[]> {
  const results: CronJobWithLastRun[] = [];

  for (const job of CRON_JOBS) {
    const result = await client.execute({
      sql: `SELECT * FROM cron_run
            WHERE job = ?
            ORDER BY startedAt DESC
            LIMIT 1`,
      args: [job.name],
    });
    const row = result.rows[0] as unknown as CronRunRow | undefined;
    results.push({
      name: job.name,
      schedule: job.schedule,
      description: job.description,
      dispatchEventType: job.dispatchEventType,
      lastRun: row ? toDTO(row) : null,
    });
  }

  return results;
}
