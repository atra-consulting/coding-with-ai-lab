import { Store, SessionData } from 'express-session';
import { client } from '../config/db.js';

// TTL fallback: 24 hours in milliseconds, matching the memorystore default.
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * TTL source order matters: cookie.maxAge is a getter computed as
 * `expires - now`, so it shrinks on every read — using it for renewals would
 * make rolling sessions expire ever sooner. cookie.originalMaxAge is the
 * configured value and survives the JSON round-trip through the DB.
 */
function sessionTtlMs(session: SessionData): number {
  const original = session.cookie?.originalMaxAge;
  if (original != null && original > 0) return original;
  const remaining = session.cookie?.maxAge;
  if (remaining != null && remaining > 0) return remaining;
  return DEFAULT_TTL_MS;
}

/**
 * LibsqlSessionStore
 *
 * express-session Store backed by the `sessions` table in the libsql/Turso DB.
 * Table layout (DDL in config/migrate.ts, schema in db/schema/schema.ts):
 *   sid    TEXT PRIMARY KEY
 *   sess   TEXT NOT NULL   -- JSON-serialised SessionData
 *   expire TEXT NOT NULL   -- ISO-8601 expiry timestamp
 *
 * Constraints:
 * - Uses only single client.execute() statements — NEVER client.transaction()
 *   (local Sqlite3Client.transaction() nulls the connection; FK pragmas break).
 * - Promise→callback bridge: callback(null, value) on success, callback(err) on rejection.
 * - Expired sessions are treated as missing; the row is opportunistically deleted.
 */
export class LibsqlSessionStore extends Store {
  private sweepStarted = false;

  /**
   * Sweep expired rows once per process lifetime (= once per serverless cold
   * start). Lazy — triggered by the first get/set, NOT the constructor: the
   * store is instantiated at module-eval time, before runMigrations() has
   * created the sessions table on a fresh database. Requests only arrive
   * after migrations complete, so by first use the table exists.
   * Fire-and-forget; the per-read cleanup in get() covers anything missed.
   */
  private sweepExpiredOnce(): void {
    if (this.sweepStarted) return;
    this.sweepStarted = true;
    client
      .execute({
        sql: 'DELETE FROM sessions WHERE expire <= ?',
        args: [new Date().toISOString()],
      })
      .catch(() => {
        // Ignore errors on background cleanup.
      });
  }

  // ---------------------------------------------------------------------------
  // get — retrieve session; treat missing OR expired as not-found
  // ---------------------------------------------------------------------------
  get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void,
  ): void {
    this.sweepExpiredOnce();
    const now = new Date().toISOString();

    client
      .execute({
        sql: 'SELECT sess, expire FROM sessions WHERE sid = ?',
        args: [sid],
      })
      .then((result) => {
        const row = result.rows[0];

        if (!row) {
          callback(null, null);
          return;
        }

        const expire = row['expire'] as string;

        if (expire <= now) {
          // Opportunistic cleanup — fire-and-forget; never block the callback.
          client
            .execute({ sql: 'DELETE FROM sessions WHERE sid = ?', args: [sid] })
            .catch(() => {
              // Ignore errors on background cleanup.
            });

          callback(null, null);
          return;
        }

        try {
          const session = JSON.parse(row['sess'] as string) as SessionData;
          callback(null, session);
        } catch (parseErr) {
          callback(parseErr);
        }
      })
      .catch((err: unknown) => {
        callback(err);
      });
  }

  // ---------------------------------------------------------------------------
  // set — upsert session with computed expiry
  // ---------------------------------------------------------------------------
  set(sid: string, session: SessionData, callback: (err?: unknown) => void): void {
    this.sweepExpiredOnce();
    const expire = new Date(Date.now() + sessionTtlMs(session)).toISOString();
    const sess = JSON.stringify(session);

    client
      .execute({
        sql: 'INSERT OR REPLACE INTO sessions (sid, sess, expire) VALUES (?, ?, ?)',
        args: [sid, sess, expire],
      })
      .then(() => {
        callback(null);
      })
      .catch((err: unknown) => {
        callback(err);
      });
  }

  // ---------------------------------------------------------------------------
  // destroy — delete session by sid
  // ---------------------------------------------------------------------------
  destroy(sid: string, callback: (err?: unknown) => void): void {
    client
      .execute({
        sql: 'DELETE FROM sessions WHERE sid = ?',
        args: [sid],
      })
      .then(() => {
        callback(null);
      })
      .catch((err: unknown) => {
        callback(err);
      });
  }

  // ---------------------------------------------------------------------------
  // touch — extend expiry without modifying session data
  // ---------------------------------------------------------------------------
  touch(sid: string, session: SessionData, callback: (err?: unknown) => void): void {
    const expire = new Date(Date.now() + sessionTtlMs(session)).toISOString();

    client
      .execute({
        sql: 'UPDATE sessions SET expire = ? WHERE sid = ?',
        args: [expire, sid],
      })
      .then(() => {
        callback(null);
      })
      .catch((err: unknown) => {
        callback(err);
      });
  }
}
