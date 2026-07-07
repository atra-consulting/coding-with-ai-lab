import { client } from '../config/db.js';

// Agile mit Menschen (19 steps). Sum: work 1,000 + wait 2,880 = 3,880.
const HUMAN_WORKS = [0,60,30,60,30,15,240,30,60,60,30,15,120,15,120,20,20,15,60];
const HUMAN_WAITS = [120,120,120,960,480,0,30,120,120,120,30,240,60,0,30,240,30,60];

// Agile mit KI (19 steps) — work minutes shrink vs. Agile mit Menschen; waits
// are halved from step 5 onward, so they are no longer identical to the
// human waits. Sum: work 90 + wait 2,100 = 2,190.
// Must stay byte-identical to AGILE_KI_DEFAULT_JSON in config/migrate.ts.
const AGILE_KI_WORKS = [0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5];
const AGILE_KI_WAITS = [120,120,120,960,240,0,15,60,60,60,15,120,30,0,15,120,15,30];

// KI-Prozess mit Feedback (11 steps). Sum: work 115 + wait 325 = 440.
const SEMI_WORKS = [0,5,10,10,5,10,10,5,10,30,20];
const SEMI_WAITS = [5,60,5,60,60,5,60,5,60,5];

// KI-Prozess vollautomatisch (2 steps). Sum: work 20 + wait 5 = 25.
const AUTO_WORKS = [0,20];
const AUTO_WAITS = [5];

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export async function seedSzenario(): Promise<void> {
  await client.execute({
    sql: `INSERT OR IGNORE INTO szenario (id, name, humanSteps, agileKiSteps, semiAutomatedSteps, automatedSteps, createdAt, updatedAt)
          VALUES (@id, @name, @humanSteps, @agileKiSteps, @semiAutomatedSteps, @automatedSteps, @createdAt, @updatedAt)`,
    args: {
      id: 1,
      name: 'Standard-Szenario',
      humanSteps: JSON.stringify({ works: HUMAN_WORKS, waits: HUMAN_WAITS }),
      agileKiSteps: JSON.stringify({ works: AGILE_KI_WORKS, waits: AGILE_KI_WAITS }),
      semiAutomatedSteps: JSON.stringify({ works: SEMI_WORKS, waits: SEMI_WAITS }),
      automatedSteps: JSON.stringify({ works: AUTO_WORKS, waits: AUTO_WAITS }),
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
  });

  // Permanent, standing overwrite — NOT a one-shot migration. INSERT OR
  // IGNORE above never updates an already-seeded row, so this UPDATE runs
  // unconditionally on every startup, forever, to keep the Standard-Szenario
  // row pinned to the current canonical defaults. Any UI edit to this row is
  // reverted on next restart, by design. Requires ensureSzenarioAgileKiColumn()
  // (config/migrate.ts) to have already added the agileKiSteps column.
  await client.execute({
    sql: `UPDATE szenario
          SET humanSteps=@humanSteps, agileKiSteps=@agileKiSteps, semiAutomatedSteps=@semiAutomatedSteps, automatedSteps=@automatedSteps, updatedAt=@updatedAt
          WHERE id=1 AND name='Standard-Szenario'`,
    args: {
      humanSteps: JSON.stringify({ works: HUMAN_WORKS, waits: HUMAN_WAITS }),
      agileKiSteps: JSON.stringify({ works: AGILE_KI_WORKS, waits: AGILE_KI_WAITS }),
      semiAutomatedSteps: JSON.stringify({ works: SEMI_WORKS, waits: SEMI_WAITS }),
      automatedSteps: JSON.stringify({ works: AUTO_WORKS, waits: AUTO_WAITS }),
      updatedAt: FIXED_TIMESTAMP,
    },
  });

  console.log('=== Seeder: szenario ensured (1 row, INSERT OR IGNORE + defaults overwrite) ===');
}
