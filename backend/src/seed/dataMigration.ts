import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqlite } from '../config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  firma: Record<string, unknown>[];
  abteilung: Record<string, unknown>[];
  person: Record<string, unknown>[];
  adresse: Record<string, unknown>[];
  aktivitaet: Record<string, unknown>[];
  chance: Record<string, unknown>[];
}

// Insert order must respect FK dependencies:
// firma -> abteilung -> person -> adresse, aktivitaet, chance
const INSERT_SQL: Record<keyof Fixture, string> = {
  firma: `INSERT INTO firma (id, name, industry, website, phone, email, notes, createdAt, updatedAt)
          VALUES (@id, @name, @industry, @website, @phone, @email, @notes, @createdAt, @updatedAt)`,
  abteilung: `INSERT INTO abteilung (id, name, description, firmaId, createdAt, updatedAt)
              VALUES (@id, @name, @description, @firmaId, @createdAt, @updatedAt)`,
  person: `INSERT INTO person (id, firstName, lastName, email, phone, position, notes, firmaId, abteilungId, createdAt, updatedAt)
           VALUES (@id, @firstName, @lastName, @email, @phone, @position, @notes, @firmaId, @abteilungId, @createdAt, @updatedAt)`,
  adresse: `INSERT INTO adresse (id, street, houseNumber, postalCode, city, country, latitude, longitude, typ, firmaId, personId, createdAt, updatedAt)
            VALUES (@id, @street, @houseNumber, @postalCode, @city, @country, @latitude, @longitude, @typ, @firmaId, @personId, @createdAt, @updatedAt)`,
  aktivitaet: `INSERT INTO aktivitaet (id, typ, subject, description, datum, firmaId, personId, createdAt, updatedAt)
               VALUES (@id, @typ, @subject, @description, @datum, @firmaId, @personId, @createdAt, @updatedAt)`,
  chance: `INSERT INTO chance (id, titel, beschreibung, wert, currency, phase, wahrscheinlichkeit, erwartetesDatum, firmaId, kontaktPersonId, createdAt, updatedAt)
           VALUES (@id, @titel, @beschreibung, @wert, @currency, @phase, @wahrscheinlichkeit, @erwartetesDatum, @firmaId, @kontaktPersonId, @createdAt, @updatedAt)`,
};

const INSERT_ORDER: (keyof Fixture)[] = [
  'firma', 'abteilung', 'person', 'adresse', 'aktivitaet', 'chance',
];

export function runDataMigration(): void {
  const count = (sqlite.prepare('SELECT COUNT(*) as cnt FROM firma').get() as { cnt: number }).cnt;
  if (count > 0) {
    console.log(`=== Seeder: Datenbank enthält bereits ${count} Firmen, übersprungen ===`);
    return;
  }

  const fixture = JSON.parse(readFileSync(join(__dirname, 'fixture.json'), 'utf8')) as Fixture;

  const loadAll = sqlite.transaction(() => {
    for (const table of INSERT_ORDER) {
      const stmt = sqlite.prepare(INSERT_SQL[table]);
      for (const row of fixture[table]) {
        stmt.run(row);
      }
    }
  });

  loadAll();

  console.log(
    `=== Seeder: ${fixture.firma.length} Firmen, ${fixture.abteilung.length} Abteilungen, ` +
    `${fixture.person.length} Personen, ${fixture.adresse.length} Adressen, ` +
    `${fixture.aktivitaet.length} Aktivitaeten, ` +
    `${fixture.chance.length} Chancen aus Fixture geladen ===`
  );
}
