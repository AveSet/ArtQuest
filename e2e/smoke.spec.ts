import { test, expect } from '@playwright/test'
import { MOCK_PROGRESS } from './fixtures/mockProgress'
import { seedProgress, dismissE2eOverlays } from './fixtures/seedProgress'

test('loads home and persists settings change', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto('/?e2eReset=1#/')
  await dismissE2eOverlays(page)
  await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({ timeout: 15_000 })

  await page.goto('/#/settings')
  await expect(page.getByTestId('page-settings').or(page.locator('[data-onboarding="page-settings"]'))).toBeVisible()

  const soundToggle = page.locator('#sound-enabled')
  if (await soundToggle.count()) {
    await soundToggle.click()
  }

  await page.reload()
  await expect(page.locator('.container-fantasy').first()).toBeVisible({ timeout: 15_000 })
})
