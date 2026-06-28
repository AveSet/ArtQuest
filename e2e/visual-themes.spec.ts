import { test, expect } from '@playwright/test'
import { MOCK_PROGRESS } from './fixtures/mockProgress'
import { MOCK_PROGRESS_WITH_GALLERY } from './fixtures/mockProgressExtras'
import { seedProgress, dismissE2eOverlays } from './fixtures/seedProgress'

const THEMES = ['modern', 'light', 'rpg', 'studio'] as const
const E2E_SUBMIT_QUEST_ID = 9802

type Theme = (typeof THEMES)[number]

function progressWithTheme(base: Record<string, unknown>, theme: Theme) {
  const settings = (base.settings ?? {}) as Record<string, unknown>
  return {
    ...base,
    settings: {
      ...settings,
      theme,
      reduceMotion: true,
    },
  }
}

function seedUrl(hashPath: string): string {
  const path = hashPath.startsWith('#') ? hashPath : `#${hashPath}`
  return `/?e2eReset=1${path}`
}

for (const theme of THEMES) {
  test.describe(`visual regression (${theme})`, () => {
    test.use({ viewport: { width: 1280, height: 900 } })

    test(`dashboard — ${theme}`, async ({ page }) => {
      await seedProgress(page, progressWithTheme(MOCK_PROGRESS, theme))
      await page.goto(seedUrl('/'))
      await dismissE2eOverlays(page)
      await expect(page.locator('[data-onboarding="dashboard-dailies"]')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('#main-content, .container-fantasy').first()).toHaveScreenshot(
        `dashboard-${theme}.png`,
        { animations: 'disabled' },
      )
    })

    test(`gallery — ${theme}`, async ({ page }) => {
      await seedProgress(page, progressWithTheme(MOCK_PROGRESS_WITH_GALLERY, theme))
      await page.goto(seedUrl('/gallery'))
      await dismissE2eOverlays(page)
      await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('[data-onboarding="page-gallery"]')).toHaveScreenshot(
        `gallery-${theme}.png`,
        { animations: 'disabled' },
      )
    })

    test(`quest session — ${theme}`, async ({ page }) => {
      await seedProgress(page, progressWithTheme(MOCK_PROGRESS, theme))
      await page.goto(seedUrl(`/quests/${E2E_SUBMIT_QUEST_ID}`))
      await dismissE2eOverlays(page)
      await expect(page.getByRole('heading', { name: /Cat Paw Structure/i })).toBeVisible({
        timeout: 25_000,
      })
      await page.getByRole('button', { name: /Start quest/i }).click()
      const session = page.locator('.quest-session-page--active')
      await expect(session).toBeVisible({ timeout: 10_000 })
      await expect(session).toHaveScreenshot(`quest-session-${theme}.png`, { animations: 'disabled' })
    })
  })
}
