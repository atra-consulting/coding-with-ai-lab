import { Store, SessionData } from 'express-session';
import { client } from '../config/db.js';

// TTL fallback: 24 hours in milliseconds, matching the memorystore default.
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

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
  // ---------------------------------------------------------------------------
  // get — retrieve session; treat missing OR expired as not-found
  // ---------------------------------------------------------------------------
  get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void,
  ): void {
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
    const ttlMs =
      session.cookie?.maxAge != null && session.cookie.maxAge > 0
        ? session.cookie.maxAge
        : DEFAULT_TTL_MS;

    const expire = new Date(Date.now() + ttlMs).toISOString();
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
    const ttlMs =
      session.cookie?.maxAge != null && session.cookie.maxAge > 0
        ? session.cookie.maxAge
        : DEFAULT_TTL_MS;

    const expire = new Date(Date.now() + ttlMs).toISOString();

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
