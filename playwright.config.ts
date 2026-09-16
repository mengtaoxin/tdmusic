import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'
import { resolveE2ePlatforms } from './src/lib/e2ePlatforms'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

const selectedPlatforms = new Set(resolveE2ePlatforms(process.env.TDMUSIC_E2E_PLATFORMS))

const allProjects = [
  {
    name: 'chromium' as const,
    use: {
      ...devices['Desktop Chrome'],
    },
  },
  {
    name: 'firefox' as const,
    use: {
      ...devices['Desktop Firefox'],
    },
  },
  {
    name: 'webkit' as const,
    use: {
      ...devices['Desktop Safari'],
    },
  },
]

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Parallel workers (default ~50% of CPUs). */
  fullyParallel: true,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `goto`. */
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    headless: true,
  },

  /* Default: chromium only. Override with TDMUSIC_E2E_PLATFORMS / test.sh --platform. */
  projects: allProjects.filter((project) => selectedPlatforms.has(project.name)),

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    /**
     * Use the dev server by default for faster feedback loop.
     * Use the preview server on CI for more realistic testing.
     * Playwright will re-use the local server if there is already a dev-server running.
     */
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    port: process.env.CI ? 4173 : 3000,
    reuseExistingServer: !process.env.CI,
  },
})
