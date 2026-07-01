import { test, expect } from '@playwright/test'
import { MOCK_PROGRESS } from './fixtures/mockProgress'
import { MOCK_PROGRESS_WITH_GALLERY, MOCK_PROGRESS_WITH_GALLERY_NOTES, MOCK_PROGRESS_WITH_GOALS, MOCK_PROGRESS_BEGINNER, MOCK_PROGRESS_WITH_REVIEW, MOCK_PROGRESS_WITH_FEEDBACK, MOCK_PROGRESS_EXPORT_SHAPE, MOCK_PROGRESS_CHEST_READY } from './fixtures/mockProgressExtras'
import { seedProgress, dismissE2eOverlays } from './fixtures/seedProgress'

/** First navigation in a test — seeds fresh progress from the registered mock payload. */
function seedUrl(hashPath: string): string {
  const path = hashPath.startsWith('#') ? hashPath : `#${hashPath}`
  return `/?e2eReset=1${path}`
}

/** Repeatable novice quest with no prerequisites (drawing catalog). */
const E2E_SUBMIT_QUEST_ID = 9802

test('dashboard loads daily quests panel', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="dashboard-dailies"]')).toBeVisible({ timeout: 20_000 })
})

test('quests catalog loads', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/quests'))
  await expect(page.locator('[data-onboarding="page-quests"]')).toBeVisible({ timeout: 20_000 })
})

test('materials learn mode opens from URL', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/resources?view=learn'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-resources"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[data-onboarding="materials-engagement-hint"]')).toBeVisible()
  const learnTab = page.getByRole('tab', { name: /learning now/i })
  await expect(learnTab).toHaveAttribute('aria-selected', 'true')
})

test('progress statistics shows data when logs exist', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/progress/stats'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-statistics"]')).toBeVisible({ timeout: 20_000 })
  await expect(
    page.getByText('Complete some quests to see practice trends and breakdowns here.'),
  ).not.toBeVisible()
  await expect(page.getByText(/practice minutes/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[data-onboarding="dashboard-next-action"]')).toHaveCount(0)
})

test('skills page loads node panel area', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/skills'))
  await expect(page.locator('[data-onboarding="page-skills"]')).toBeVisible({ timeout: 20_000 })
})

test('gallery page loads empty or grid', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/gallery'))
  await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
})

test('mobile More menu opens Materials and Progress', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.locator('#nav-mobile-more-trigger')).toBeVisible({ timeout: 20_000 })
  await page.locator('#nav-mobile-more-trigger').click()
  await expect(page.locator('#nav-mobile-more-menu')).toBeVisible()
  await page.getByRole('menuitem', { name: /resources/i }).click()
  await expect(page.locator('[data-onboarding="page-resources"]')).toBeVisible({ timeout: 20_000 })
  await page.goto('/#/')
  await page.locator('#nav-mobile-more-trigger').click()
  await page.getByRole('menuitem', { name: /progress/i }).click()
  await expect(page.locator('[data-onboarding="page-statistics"]')).toBeVisible({ timeout: 20_000 })
})

test('dashboard goal card links to completed goals history', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_GOALS)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="dashboard-goals-history"]')).toBeVisible({
    timeout: 20_000,
  })
  await page.locator('[data-onboarding="dashboard-goals-history"]').click()
  await expect(page).toHaveURL(/#\/progress\/goals/)
})

test('gallery grouped view shows works from saved progress', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_GALLERY)
  await page.goto(seedUrl('/gallery'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /growth wall/i })).toBeVisible({ timeout: 15_000 })
})

test('quest start → upload → submit completes and persists log', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS, { mockSaveImage: true })
  await page.goto(seedUrl(`/quests/${E2E_SUBMIT_QUEST_ID}`))
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
  await expect(submitPanel).toBeVisible()
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles({
    name: 'e2e-work.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await page.getByRole('button', { name: /^Submit Work$/i }).click()
  await expect(page).toHaveURL(/#\/(\?.*)?$/, { timeout: 25_000 })
  await expect(page.locator('[data-onboarding="dashboard-dailies"]')).toBeVisible({ timeout: 20_000 })

  await expect
    .poll(
      async () =>
        page.evaluate((questId) => {
          const getter = (window as unknown as { __e2eGetSavedProgress?: () => Record<string, unknown> })
            .__e2eGetSavedProgress
          const saved = getter?.() as { questCompletionLogs?: { questId: number }[] } | null
          return saved?.questCompletionLogs?.some((row) => row.questId === questId) ?? false
        }, E2E_SUBMIT_QUEST_ID),
      { timeout: 15_000 },
    )
    .toBe(true)
})

test('beginner tier shows fundamentals gate on dashboard and quests catalog', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_BEGINNER)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.getByRole('heading', { name: /^Fundamentals$/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/0\/11.*exercises/i)).toBeVisible()

  await page.goto('/#/quests')
  await dismissE2eOverlays(page)
  await expect(page.getByRole('link', { name: /Continue fundamentals/i })).toBeVisible({
    timeout: 20_000,
  })
})

test('fundamentals catalog page lists tier sections', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_BEGINNER)
  await page.goto(seedUrl('/fundamentals'))
  await dismissE2eOverlays(page)
  await expect(page.getByRole('heading', { name: /^Fundamentals$/i })).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByRole('heading', { name: /Novice|Beginner/i }).first()).toBeVisible()
})

test('dashboard review shelf lists overdue spaced-review quest', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_REVIEW)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.locator('.review-shelf:not(.review-shelf--empty)')).toBeVisible({
    timeout: 20_000,
  })
  await expect(page.getByRole('button', { name: /Water Splashes/i })).toBeVisible()
})

test('statistics page shows monthly summary block', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/progress/stats'))
  await dismissE2eOverlays(page)
  await expect(page.getByRole('heading', { name: /This month/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/quests completed/i)).toBeVisible()
})

test('materials engagement chip persists after autosave and reload', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl('/resources?view=learn'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-resources"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('tab', { name: /learning now/i })).toHaveAttribute('aria-selected', 'true')

  const helpful = page.getByRole('button', { name: /^Helpful$/i }).first()
  await expect(helpful).toBeVisible({ timeout: 20_000 })
  await helpful.click()
  await expect(helpful).toHaveAttribute('aria-pressed', 'true')

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const getter = (
            window as unknown as { __e2eGetSavedProgress?: () => Record<string, unknown> }
          ).__e2eGetSavedProgress
          const saved = getter?.() as
            | { settings?: { materialEngagement?: Record<string, string> } }
            | undefined
          const engagement = saved?.settings?.materialEngagement ?? {}
          return Object.values(engagement).includes('helpful')
        }),
      { timeout: 12_000 },
    )
    .toBe(true)

  await page.reload()
  await dismissE2eOverlays(page)
  await expect(page.getByRole('tab', { name: /learning now/i })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: /^Helpful$/i }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('statistics monthly summary reflects recurring mistake from feedback logs', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_FEEDBACK)
  await page.goto(seedUrl('/progress/stats'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-statistics"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/Recurring focus:.*Line confidence/i)).toBeVisible({ timeout: 15_000 })
})

test('gallery lightbox shows saved work review notes', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_GALLERY_NOTES)
  await page.goto(seedUrl('/gallery'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
  await page.locator('.gallery-card img, .gallery-thumb').first().click()
  await expect(page.getByText('Warmup sketch')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Push line weight on the outer contour')).toBeVisible()
})

test('dashboard also-practice block appears when feedback tags suggest weak line', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_WITH_FEEDBACK)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.locator('[data-onboarding="dashboard-next-action"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/Also practice/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/Line confidence/i).first()).toBeVisible()
})

test('quest session focus mode hides overview and shows active session page', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS)
  await page.goto(seedUrl(`/quests/${E2E_SUBMIT_QUEST_ID}`))
  await dismissE2eOverlays(page)
  await page.getByRole('button', { name: /Start quest/i }).click()
  await expect(page.locator('.quest-session-page--active')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: /Start quest/i })).toHaveCount(0)
})

test('export envelope preserves materialEngagement and improvementNotes', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_EXPORT_SHAPE)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  const envelope = await page.evaluate(() => {
    const builder = (window as unknown as { __e2eBuildExportEnvelope?: () => { payload?: Record<string, unknown> } })
      .__e2eBuildExportEnvelope
    return builder?.()
  })
  const settings = envelope?.payload?.settings as { materialEngagement?: Record<string, string> } | undefined
  const works = envelope?.payload?.completedWorks as { improvementNotes?: string }[] | undefined
  expect(settings?.materialEngagement?.['vid-1']).toBe('helpful')
  expect(works?.[0]?.improvementNotes).toContain('shadows')
})

test('dashboard share progress web fallback generates PNG', async ({ page }) => {
  await seedProgress(page, {
    ...MOCK_PROGRESS_WITH_GOALS,
    streakState: { current: 3, longest: 5, lastActiveDate: '2026-06-12' },
  })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await expect(page.getByRole('button', { name: /share progress/i })).toBeVisible()
  const result = await page.evaluate(async () => {
    const fn = (window as unknown as { __e2eTryShareCardDownload?: () => Promise<{ ok: boolean; blobSize?: number }> })
      .__e2eTryShareCardDownload
    return fn?.()
  })
  expect(result?.ok).toBe(true)
  expect(result?.blobSize).toBeGreaterThan(500)
})

test('chest reveal modal opens after fifth daily chest day', async ({ page }) => {
  await seedProgress(page, MOCK_PROGRESS_CHEST_READY)
  await page.goto(seedUrl('/'))
  await dismissE2eOverlays(page)
  await page.evaluate(() => {
    ;(window as unknown as { __e2eRecordAllDailiesComplete?: () => void }).__e2eRecordAllDailiesComplete?.()
  })
  await expect(page.getByRole('heading', { name: /Reward cycle complete!/i })).toBeVisible({ timeout: 10_000 })
})
