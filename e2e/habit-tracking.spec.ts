import { test, expect } from '@playwright/test'

// Primary habit-tracking workflow: register → create habit → toggle → persist.
// Uses a unique email per run so the test is self-contained against any database.
test('primary habit tracking workflow', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  const habitName = 'Morning Run'

  // ── Register ────────────────────────────────────────────────────────────────
  await page.goto('/register')
  await page.fill('#name', 'E2E User')
  await page.fill('#email', email)
  await page.fill('#password', 'password123')
  await page.fill('#confirmPassword', 'password123')
  await page.click('button[type="submit"]')

  // ── Dashboard (empty state) ─────────────────────────────────────────────────
  await page.waitForURL('**/dashboard')
  await expect(page.getByText('No habits yet')).toBeVisible()

  // ── Create a habit ──────────────────────────────────────────────────────────
  await page.getByRole('link', { name: 'New habit' }).click()
  await page.waitForURL('**/habits/new')
  await page.fill('#name', habitName)
  await page.getByRole('button', { name: 'Create habit' }).click()

  // ── Navigate to dashboard to see the habit ─────────────────────────────────
  await page.waitForURL('**/habits')
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()

  // ── Toggle completion ───────────────────────────────────────────────────────
  // Scope to the article so the locator survives the aria-label change that
  // happens on toggle (label flips between "done today" and "not done today").
  const habitCard = page.getByRole('article').filter({ hasText: habitName })
  const toggleBtn = habitCard.getByRole('button')

  await expect(toggleBtn).toBeVisible()
  await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')

  await toggleBtn.click()
  await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')

  // ── Reload and confirm persistence ─────────────────────────────────────────
  await page.reload()
  await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')
})
