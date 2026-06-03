import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: 120000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'test-results/html-report', open: 'never' }]],
  outputDir: 'test-results/artifacts',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
})
