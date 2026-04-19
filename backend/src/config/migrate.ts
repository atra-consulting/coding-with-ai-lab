import { sqlite } from './db.js';

export function runMigrations(): void {
  console.log('Running database migrations...');

  // Tables created in FK dependency order:
  // firma -> abteilung -> person -> adresse, aktivitaet, chance

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

  `);

  sqlite.exec(`
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
  `);

  console.log('Database migrations complete.');
}
