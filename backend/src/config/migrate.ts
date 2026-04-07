import { sqlite } from './db.js';

export function runMigrations(): void {
  console.log('Running database migrations...');

  // Tables created in FK dependency order:
  // firma -> abteilung -> person -> adresse, aktivitaet, chance, vertrag, gehalt
  // savedReport and dashboardConfig reference only benutzerId (not a DB FK)

  sqlite.exec(`
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

    CREATE TABLE IF NOT EXISTS vertrag (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      titel           TEXT NOT NULL,
      notes           TEXT,
      wert            REAL,
      currency        TEXT NOT NULL DEFAULT 'EUR',
      status          TEXT NOT NULL DEFAULT 'ENTWURF',
      startDate       TEXT,
      endDate         TEXT,
      firmaId         INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      kontaktPersonId INTEGER REFERENCES person(id) ON DELETE SET NULL,
      createdAt       TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gehalt (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      amount        REAL NOT NULL,
      currency      TEXT NOT NULL DEFAULT 'EUR',
      typ           TEXT NOT NULL DEFAULT 'GRUNDGEHALT',
      effectiveDate TEXT NOT NULL,
      personId      INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
      createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS savedReport (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      config      TEXT NOT NULL,
      benutzerId  INTEGER NOT NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboardConfig (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      benutzerId     INTEGER NOT NULL UNIQUE,
      config         TEXT NOT NULL,
      createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('Database migrations complete.');
}
