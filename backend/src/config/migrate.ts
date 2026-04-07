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
      branche   TEXT,
      website   TEXT,
      telefon   TEXT,
      email     TEXT,
      beschreibung TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS abteilung (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      firmaId   INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS person (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName   TEXT NOT NULL,
      lastName    TEXT NOT NULL,
      email       TEXT,
      telefon     TEXT,
      position    TEXT,
      firmaId     INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      abteilungId INTEGER REFERENCES abteilung(id) ON DELETE SET NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS adresse (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      strasse    TEXT,
      hausnummer TEXT,
      plz        TEXT,
      stadt      TEXT,
      land       TEXT,
      typ        TEXT,
      firmaId    INTEGER REFERENCES firma(id) ON DELETE CASCADE,
      personId   INTEGER REFERENCES person(id) ON DELETE CASCADE,
      createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS aktivitaet (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      typ          TEXT NOT NULL,
      subject      TEXT NOT NULL,
      beschreibung TEXT,
      datum        TEXT NOT NULL,
      firmaId      INTEGER REFERENCES firma(id) ON DELETE CASCADE,
      personId     INTEGER REFERENCES person(id) ON DELETE CASCADE,
      createdAt    TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chance (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      titel             TEXT NOT NULL,
      beschreibung      TEXT,
      wert              REAL,
      phase             TEXT NOT NULL DEFAULT 'LEAD',
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
      beschreibung    TEXT,
      wert            REAL,
      status          TEXT NOT NULL DEFAULT 'ENTWURF',
      startDatum      TEXT,
      endDatum        TEXT,
      firmaId         INTEGER NOT NULL REFERENCES firma(id) ON DELETE CASCADE,
      kontaktPersonId INTEGER REFERENCES person(id) ON DELETE SET NULL,
      createdAt       TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gehalt (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      amount        REAL NOT NULL,
      typ           TEXT NOT NULL DEFAULT 'MONATLICH',
      effectiveDate TEXT NOT NULL,
      beschreibung  TEXT,
      personId      INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
      createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS savedReport (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      beschreibung TEXT,
      queryJson   TEXT NOT NULL,
      benutzerId  INTEGER NOT NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboardConfig (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      benutzerId     INTEGER NOT NULL UNIQUE,
      visibleWidgets TEXT NOT NULL,
      createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('Database migrations complete.');
}
