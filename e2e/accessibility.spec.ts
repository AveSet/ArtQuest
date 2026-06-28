import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { MOCK_PROGRESS } from './fixtures/mockProgress'
import { seedProgress, dismissE2eOverlays } from './fixtures/seedProgress'

const routes = [
  { name: 'dashboard', path: '/?e2eReset=1#/', ready: '[data-onboarding="dashboard-dailies"]' },
  { name: 'quests', path: '/?e2eReset=1#/quests', ready: '[data-onboarding="page-quests"]' },
  { name: 'skills', path: '/?e2eReset=1#/skills', ready: '[data-onboarding="page-skills"]' },
  { name: 'gallery', path: '/?e2eReset=1#/gallery', ready: '[data-onboarding="page-gallery"]' },
  { name: 'resources', path: '/?e2eReset=1#/resources?view=learn', ready: '[data-onboarding="page-resources"]' },
  { name: 'settings', path: '/?e2eReset=1#/settings', ready: '[data-onboarding="page-settings"]' },
]

test.beforeEach(async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
})

for (const route of routes) {
  test(`has no serious accessibility violations on ${route.name}`, async ({ page }) => {
    await page.goto(route.path)
    await dismissE2eOverlays(page)
    await expect(page.locator(route.ready)).toBeVisible({ timeout: 20_000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
      .analyze()

    const severe = results.violations.filter((violation) =>
      violation.impact === 'critical' || violation.impact === 'serious'
    )
    expect(severe, JSON.stringify(severe, null, 2)).toEqual([])
  })
}
