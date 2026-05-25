import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  webServer: {
    command: process.env.CI ? 'NITRO_PRESET=node-server PORT=3001 npm run build && PORT=3001 node .output/server/index.mjs' : 'PORT=3001 npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 5 * 60 * 1000,
    env: {
      CLOUDINARY_CLOUD_NAME: 'dummy',
      CLOUDINARY_NAME: 'dummy',
      SKIP_DB_CHECK: 'true',
      NUXT_SESSION_PASSWORD: 'dummy-password-for-testing-at-least-32-characters-long'
    }
  },
})
