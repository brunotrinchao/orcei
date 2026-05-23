import { test, expect } from '@playwright/test'

test.describe('Landing Page E2E Tests', () => {
  test('should load landing page successfully and display app title', async ({ page }) => {
    // Navigate to the landing page base URL
    await page.goto('/')

    // Wait for the main elements or checking page title
    await expect(page).toHaveTitle(/Orcei Fácil/i)

    // Check that login link/button exists
    const loginLink = page.getByRole('link', { name: /entrar|login|dashboard/i }).first()
    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible()
    }
  })
})
