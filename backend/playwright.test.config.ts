import { defineConfig } from '@playwright/test';

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
