import { defineConfig, devices } from '@playwright/test'

// End-to-end tests drive a real browser against the running app: `make e2e`.
// If the stack is already up (`make up`), the tests use it; otherwise Playwright starts the
// backend and frontend itself (Postgres must be running: `make db`).
export default defineConfig({
  testDir: './e2e',
  // One test at a time: the tests share the one QR link, and the admin test opens and closes it
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'uv run fastapi run app/main.py --port 8000',
      cwd: '../backend',
      url: 'http://localhost:8000/api/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
