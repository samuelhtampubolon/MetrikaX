import { defineConfig, devices } from '@playwright/test';

/**
 * The end to end suite runs against the real production build served over plain HTTP, not against
 * the dev server. The claims being checked, that the application works with the network disabled
 * and issues no requests at all, are only meaningful against the artefact that actually ships.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: process.env['CI'] === 'true' ? [['list']] : [['list']],
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    trace: 'off',
    // The application asks for no permission, no camera and no location, so nothing is granted.
    permissions: [],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // The browser is the one already on this machine. Nothing is downloaded to run a test.
          ...(process.env['PLAYWRIGHT_CHROMIUM_PATH'] === undefined
            ? {}
            : { executablePath: process.env['PLAYWRIGHT_CHROMIUM_PATH'] }),
        },
      },
    },
  ],
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
