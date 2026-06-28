import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { MOCK_PROGRESS } from './fixtures/mockProgress'
import { MOCK_PROGRESS_WITH_GALLERY } from './fixtures/mockProgressExtras'
import { seedProgress, dismissE2eOverlays } from './fixtures/seedProgress'

const E2E_SUBMIT_QUEST_ID = 9802

const routes = [
  { name: 'dashboard', path: '/?e2eReset=1#/', ready: '[data-onboarding="dashboard-dailies"]' },
  { name: 'quests', path: '/?e2eReset=1#/quests', ready: '[data-onboarding="page-quests"]' },
  { name: 'skills', path: '/?e2eReset=1#/skills', ready: '[data-onboarding="page-skills"]' },
  { name: 'gallery', path: '/?e2eReset=1#/gallery', ready: '[data-onboarding="page-gallery"]' },
  { name: 'resources', path: '/?e2eReset=1#/resources?view=learn', ready: '[data-onboarding="page-resources"]' },
  { name: 'settings', path: '/?e2eReset=1#/settings', ready: '[data-onboarding="page-settings"]' },
]

async function expectNoSeriousViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
  if (include) {
    builder = builder.include(include)
  }

  const results = await builder.analyze()

  const severe = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  )
  expect(severe, JSON.stringify(severe, null, 2)).toEqual([])
}

test.describe('route pages', () => {
  test.beforeEach(async ({ page }) => {
    await seedProgress(page, MOCK_PROGRESS)
  })

  for (const route of routes) {
    test(`has no serious accessibility violations on ${route.name}`, async ({ page }) => {
      await page.goto(route.path)
      await dismissE2eOverlays(page)
      await expect(page.locator(route.ready)).toBeVisible({ timeout: 20_000 })
      await expectNoSeriousViolations(page)
    })
  }
})

test('gallery lightbox has no serious accessibility violations', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_GALLERY)
  await page.goto('/?e2eReset=1#/gallery')
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Grid', exact: true }).click()
  await page.locator('.gallery-grid-tile__open').first().click()
  await expect(page.locator('.gallery-lightbox')).toBeVisible({ timeout: 10_000 })

  await expectNoSeriousViolations(page, '.gallery-lightbox')
})

test('quest submit panel has no serious accessibility violations', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(`/?e2eReset=1#/quests/${E2E_SUBMIT_QUEST_ID}`)
  await dismissE2eOverlays(page)
  await expect(page.getByRole('heading', { name: /Cat Paw Structure/i })).toBeVisible({
    timeout: 25_000,
  })

  await page.getByRole('button', { name: /Start quest/i }).click()
  await expect(page.locator('.quest-session-page--active')).toBeVisible({ timeout: 10_000 })

  for (let phase = 0; phase < 5; phase += 1) {
    const nextPhase = page.getByRole('button', { name: /Next phase/i })
    if (!(await nextPhase.isVisible().catch(() => false))) break
    await nextPhase.click()
  }

  const submitPanel = page.locator('.submit-step-panel')
  if (!(await submitPanel.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /Submit Work/i }).first().click()
  }
  await expect(submitPanel).toBeVisible({ timeout: 10_000 })

  await expectNoSeriousViolations(page, '.submit-step-backdrop')
})
