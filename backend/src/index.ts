// MUST be first: loads backend/.env into process.env before db.ts / middleware
// read it at module-load time.
import './config/loadEnv.js';
import app from './app.js';
import { runMigrations } from './config/migrate.js';
import { runDataMigration } from './seed/dataMigration.js';

const PORT = parseInt(process.env['PORT'] ?? '7070', 10);

async function main(): Promise<void> {
  // Migrations must complete before the server accepts requests —
  // Playwright globalSetup polls the health endpoint as its ready signal.
  await runMigrations();
  await runDataMigration();

  app.listen(PORT, () => {
    console.log(`CRM backend running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
