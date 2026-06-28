import { client } from './db.js';
import { seedAgentTasks } from '../seed/agentTaskSeed.js';
import { seedTickets } from '../seed/ticketSeed.js';

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');

  // PRAGMA foreign_keys MUST be a standalone execute — SQLite ignores pragmas
  // inside a transaction, and client.batch() wraps statements in BEGIN/COMMIT.
  await client.execute('PRAGMA foreign_keys = ON');

  // Tables created in FK dependency order:
  // firma -> abteilung -> person -> adresse, aktivitaet, chance
  // Sessions table added for Phase 4 DB-backed session store.
  // agent_task has no FK dependencies — appended last.
  //
  // executeMultiple issues each statement non-transactionally (like the old
  // sqlite.exec), which is safe here because every statement is IF NOT EXISTS.
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS firma (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      industry  TEXT,
      website   TEXT,
      phone     TEXT,
      email     TEXT,
      notes     TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS abteilung (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      firmaId     INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS person (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName   TEXT NOT NULL,
      lastName    TEXT NOT NULL,
      email       TEXT,
      phone       TEXT,
      position    TEXT,
      notes       TEXT,
      firmaId     INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      abteilungId INTEGER REFERENCES abteilung(id) ON DELETE SET NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS adresse (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      street      TEXT,
      houseNumber TEXT,
      postalCode  TEXT,
      city        TEXT,
      country     TEXT,
      latitude    REAL,
      longitude   REAL,
      typ         TEXT,
      firmaId     INTEGER REFERENCES firma(id) ON DELETE CASCADE,
      personId    INTEGER REFERENCES person(id) ON DELETE CASCADE,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS aktivitaet (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      typ         TEXT NOT NULL,
      subject     TEXT NOT NULL,
      description TEXT,
      datum       TEXT NOT NULL,
      firmaId     INTEGER REFERENCES firma(id) ON DELETE CASCADE,
      personId    INTEGER REFERENCES person(id) ON DELETE CASCADE,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chance (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      titel             TEXT NOT NULL,
      beschreibung      TEXT,
      wert              REAL,
      currency          TEXT NOT NULL DEFAULT 'EUR',
      phase             TEXT NOT NULL DEFAULT 'NEU',
      wahrscheinlichkeit INTEGER,
      erwartetesDatum   TEXT,
      firmaId           INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      kontaktPersonId   INTEGER REFERENCES person(id) ON DELETE SET NULL,
      createdAt         TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid    TEXT PRIMARY KEY,
      sess   TEXT NOT NULL,
      expire TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_task (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      source      TEXT NOT NULL,
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'OPEN',
      comment     TEXT,
      metadata    TEXT,
      pickedUpAt  TEXT,
      resolvedAt  TEXT,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      owner       TEXT NOT NULL DEFAULT 'HUMAN',
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'TODO',
      solution    TEXT,
      pickedUpAt  TEXT,
      resolvedAt  TEXT,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_comment (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId    INTEGER NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
      author      TEXT NOT NULL,
      authorName  TEXT,
      body        TEXT NOT NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cron_run (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      job          TEXT NOT NULL,
      status       TEXT NOT NULL,
      "trigger"    TEXT NOT NULL,
      startedAt    TEXT NOT NULL,
      finishedAt   TEXT,
      durationMs   INTEGER,
      result       TEXT,
      githubRunUrl TEXT,
      error        TEXT
    );
  `);

  await client.executeMultiple(`
    CREATE INDEX IF NOT EXISTS idx_person_firmaId ON person(firmaId);
    CREATE INDEX IF NOT EXISTS idx_person_abteilungId ON person(abteilungId);
    CREATE INDEX IF NOT EXISTS idx_abteilung_firmaId ON abteilung(firmaId);
    CREATE INDEX IF NOT EXISTS idx_aktivitaet_firmaId ON aktivitaet(firmaId);
    CREATE INDEX IF NOT EXISTS idx_aktivitaet_personId ON aktivitaet(personId);
    CREATE INDEX IF NOT EXISTS idx_aktivitaet_datum ON aktivitaet(datum DESC);
    CREATE INDEX IF NOT EXISTS idx_chance_firmaId ON chance(firmaId);
    CREATE INDEX IF NOT EXISTS idx_chance_phase ON chance(phase);
    CREATE INDEX IF NOT EXISTS idx_chance_createdAt ON chance(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_aktivitaet_createdAt ON aktivitaet(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_adresse_firmaId ON adresse(firmaId);
    CREATE INDEX IF NOT EXISTS idx_adresse_personId ON adresse(personId);
    CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
    CREATE INDEX IF NOT EXISTS idx_agent_task_status_createdAt ON agent_task(status, createdAt);
    CREATE INDEX IF NOT EXISTS idx_agent_task_source_status ON agent_task(source, status);
    CREATE INDEX IF NOT EXISTS idx_cron_run_startedAt ON cron_run(startedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_cron_run_job_startedAt ON cron_run(job, startedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_ticket_status_owner_createdAt ON ticket(status, owner, createdAt);
    CREATE INDEX IF NOT EXISTS idx_ticket_type_status ON ticket(type, status);
    CREATE INDEX IF NOT EXISTS idx_ticket_comment_ticketId ON ticket_comment(ticketId);
  `);

  // Idempotent data seed: agent tasks are inserted on every deployment via
  // INSERT OR IGNORE so they are always present (Vercel/Turso included),
  // independent of the firma-empty guard in runDataMigration(). Existing rows
  // (e.g. DONE/REJECTED/IN_PROGRESS) are never overwritten.
  await seedAgentTasks();
  await seedTickets();

  console.log('Database migrations complete.');
}
