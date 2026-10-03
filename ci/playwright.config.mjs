import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.mjs',
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/report.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'off',
  },
  webServer: {
    command: 'npx --yes serve .. -l 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
