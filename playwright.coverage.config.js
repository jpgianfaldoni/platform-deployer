// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration with code coverage enabled
 * Use this config when running coverage tests: playwright test --config=playwright.coverage.config.js
 */

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'coverage/coverage.json' }],
    ['list'],
  ],
  
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable JavaScript coverage collection
        launchOptions: {
          args: ['--js-flags=--expose-gc'],
        },
      },
    },
  ],

  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    cwd: './deploy',
    timeout: 120 * 1000,
  },
});

