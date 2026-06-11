import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InArgs } from '@libsql/client';
import { client } from '../config/db.js';

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
//
// Named-parameter SQL (@column) is kept intentionally — libsql accepts a plain
// object for named args and strips the @ sigil when matching object keys.
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

export async function runDataMigration(): Promise<void> {
  const result = await client.execute('SELECT COUNT(*) as cnt FROM firma');
  const count = Number(result.rows[0]['cnt']);
  if (count > 0) {
    console.log(`=== Seeder: Datenbank enthält bereits ${count} Firmen, übersprungen ===`);
    return;
  }

  const fixture = JSON.parse(readFileSync(join(__dirname, 'fixture.json'), 'utf8')) as Fixture;

  // Build one atomic batch (write mode) respecting INSERT_ORDER FK dependencies.
  // Using a single batch instead of client.transaction() — see architectural
  // constraints in PLAN-VERCEL-TURSO-DEPLOYMENT.md: client.transaction() nulls
  // its connection and the lazily-reopened one has foreign_keys=OFF.
  const stmts: { sql: string; args: InArgs }[] = [];
  for (const table of INSERT_ORDER) {
    for (const row of fixture[table]) {
      stmts.push({ sql: INSERT_SQL[table], args: row as InArgs });
    }
  }

  await client.batch(stmts, 'write');

  console.log(
    `=== Seeder: ${fixture.firma.length} Firmen, ${fixture.abteilung.length} Abteilungen, ` +
    `${fixture.person.length} Personen, ${fixture.adresse.length} Adressen, ` +
    `${fixture.aktivitaet.length} Aktivitaeten, ` +
    `${fixture.chance.length} Chancen aus Fixture geladen ===`
  );
}
