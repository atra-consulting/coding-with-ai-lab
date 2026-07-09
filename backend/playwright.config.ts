import { defineConfig } from '@playwright/test';

// Spec files import `client` from src/config/db.ts to query the DB directly, in
// THIS runner process. globalSetup sets NODE_ENV=test only for the spawned backend
// child — set it here too so the runner's client opens the same isolated test DB
// (crmdb.test.sqlite) instead of the dev DB (crmdb.sqlite). Must run before Playwright
// imports the spec files. Turso/CI still wins in db.ts when TURSO_DATABASE_URL is set.
process.env['NODE_ENV'] = 'test';

export default defineConfig({
  testDir: './src/test',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  globalSetup: './src/test/globalSetup.ts',
  use: {
    baseURL: 'http://localhost:7070',
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
});
