// Route the test runner process (not just the spawned backend child) onto
// the isolated test DB. Several spec files and helpers.ts import `client`
// from config/db.ts directly into this process, so globalSetup alone does
// not cover it — this must run before that import happens.
process.env['NODE_ENV'] = 'test';

import { defineConfig } from '@playwright/test';

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
