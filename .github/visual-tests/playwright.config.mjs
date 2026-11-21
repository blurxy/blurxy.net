import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: '.',
  workers: 2,
  timeout: 20_000,
  reporter: [['list']],
  webServer: {
    command: 'node serve.mjs',
    url: baseURL,
    reuseExistingServer: false,
  },
  use: {
    baseURL,
    browserName: 'chromium',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    actionTimeout: 6_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
