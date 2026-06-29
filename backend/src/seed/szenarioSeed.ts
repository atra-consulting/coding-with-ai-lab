import { client } from '../config/db.js';

const HUMAN_WORKS = [0,60,30,60,30,15,240,30,60,60,30,15,120,15,120,20,30,30,20,15,60,30,30];
const HUMAN_WAITS = [240,480,240,1440,2880,0,480,480,480,240,480,1440,480,240,480,480,240,240,480,1440,1440,480];

const SEMI_WORKS = [0,5,15,10,30,20];
const SEMI_WAITS = [240,480,0,480,0];

const AUTO_WORKS = [0,20];
const AUTO_WAITS = [240];

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export async function seedSzenario(): Promise<void> {
  await client.execute({
    sql: `INSERT OR IGNORE INTO szenario (id, name, humanSteps, semiAutomatedSteps, automatedSteps, createdAt, updatedAt)
          VALUES (@id, @name, @humanSteps, @semiAutomatedSteps, @automatedSteps, @createdAt, @updatedAt)`,
    args: {
      id: 1,
      name: 'Standard-Szenario',
      humanSteps: JSON.stringify({ works: HUMAN_WORKS, waits: HUMAN_WAITS }),
      semiAutomatedSteps: JSON.stringify({ works: SEMI_WORKS, waits: SEMI_WAITS }),
      automatedSteps: JSON.stringify({ works: AUTO_WORKS, waits: AUTO_WAITS }),
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
  });

  console.log('=== Seeder: szenario ensured (1 row, INSERT OR IGNORE) ===');
}
