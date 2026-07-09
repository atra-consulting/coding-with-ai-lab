import { defineConfig } from '@playwright/test';

// Manual/exploratory config: assumes a backend is ALREADY running (no globalSetup).
// CAVEAT: this config does NOT set NODE_ENV. Spec files import `client` from
// src/config/db.ts, so the runner's direct DB client opens whatever file NODE_ENV
// selects in THIS shell. Keep NODE_ENV consistent between the already-running backend
// and this runner: start the backend with NODE_ENV=test AND run this config with
// NODE_ENV=test (both hit crmdb.test.sqlite), or neither (both hit crmdb.sqlite, the
// dev DB — which the tests will then mutate). Mismatched NODE_ENV = split-brain: the
// runner asserts against one DB while the backend serves another. The default
// `npm test` path (playwright.config.ts) handles this automatically.

export default defineConfig({
  testDir: './src/test',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  // Skip globalSetup since backend is already running
  use: {
    baseURL: 'http://localhost:7070',
    ignoreHTTPSErrors: true,
  },
  reporter: [['list']],
});
