import { expect, test } from '@playwright/test'
import { MOCK_PROGRESS } from './fixtures/mockProgress'
import { MOCK_PROGRESS_LARGE } from './fixtures/mockProgressLarge'
import { dismissE2eOverlays, seedProgress } from './fixtures/seedProgress'

const DASHBOARD_PERF_BUDGET_MS = 12_000

test('shows corrupt load banner when progress load fails validation', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS, { loadStatus: 'corrupt' })
  await page.goto('/?e2eReset=1#/')
  await dismissE2eOverlays(page)

  await expect(page.getByTestId('load-progress-error-banner')).toBeVisible({ timeout: 20_000 })
  await expect(
    page.getByText(/saved progress could not be read|не удалось прочитать сохран/i),
  ).toBeVisible()
})

test('shows save error banner after injected save failure and clears on retry', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto('/?e2eReset=1#/settings')
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-settings"]')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('tab', { name: /technical/i }).click()

  await page.evaluate(() => {
    window.__e2eInjectSaveFailure?.()
  })

  await page.locator('#sound-enabled').click()
  await expect(page.getByTestId('save-error-banner')).toBeVisible({ timeout: 12_000 })

  await page.getByRole('button', { name: /dismiss|закрыть/i }).click()
  await expect(page.getByTestId('save-error-banner')).toHaveCount(0)

  await page.locator('#sound-enabled').click()
  await expect(page.getByTestId('save-error-banner')).toHaveCount(0)
})

test('dashboard hydrates large progress within soft perf budget', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_LARGE)
  const startedAt = Date.now()
  await page.goto('/?e2eReset=1#/')
  await dismissE2eOverlays(page)
  await expect(page.locator('.dashboard-toggle-strip[data-onboarding="dashboard-next-action"]')).toBeVisible({ timeout: 20_000 })

  const elapsedMs = Date.now() - startedAt
  expect(elapsedMs).toBeLessThan(DASHBOARD_PERF_BUDGET_MS)

  const hydrationMs = await page.evaluate(() => window.__e2eGetHydrationMs?.() ?? null)
  if (hydrationMs != null) {
    expect(hydrationMs).toBeLessThan(DASHBOARD_PERF_BUDGET_MS)
  }
})
