# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-flow.spec.ts >> dashboard share progress web fallback generates PNG
- Location: e2e\product-flow.spec.ts:274:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /share progress/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /share progress/i })

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- navigation "Main navigation":
  - link "ArtQuest home":
    - /url: "#/"
    - text: Art Quest
  - link "Home":
    - /url: "#/"
  - link "Quests":
    - /url: "#/quests"
  - link "Skills":
    - /url: "#/skills"
  - link "Gallery":
    - /url: "#/gallery"
  - link "Resources":
    - /url: "#/resources"
  - link "Progress":
    - /url: "#/progress"
  - link "Settings":
    - /url: "#/settings"
- main:
  - complementary:
    - button "Click to choose a custom avatar photo"
    - text: Artist Level 0Novice
    - heading "SKILLS" [level=3]
    - button "Show less" [expanded]
    - text: 🎨 Drawing Level 0 0 / 300 XP 0% 🦴 Anatomy Level 0 0 / 300 XP 0% ✨ Effects Level 0 0 / 300 XP 0% 📖 Storytelling Level 0 0 / 300 XP 0% 🎭 Character Design Level 0 0 / 300 XP 0% 🏞️ Environment Level 0 0 / 300 XP 0% Daily reward · 0/5
    - progressbar "Daily reward · 0/5"
    - paragraph: Complete all daily quests — one star per day. Fill all five stars to complete the streak cycle.
    - img "Daily reward · 0/5"
  - region "Goal":
    - heading "Goal" [level=2]
    - paragraph: Write what you want to achieve with ArtQuest — it stays here as your daily reminder.
    - link "View 1 completed goals →":
      - /url: "#/progress/goals"
    - paragraph: Finish a portrait study this week
    - button "Mark as achieved"
    - button "Edit"
  - region "Due for review":
    - heading "Due for review" [level=2]
    - list:
      - listitem:
        - 'button "Studio Style Analysis: Water Splashes (Ufotable/Pixar) Last practiced 13 days ago — time to repeat"'
  - button "Next action"
  - button "Today's practice" [pressed]
  - text: 3/3
  - heading "Today's practice" [level=2]
  - paragraph: Finish today’s daily lineup
  - heading "Today" [level=2]
  - text: 0/3 completed
  - list:
    - listitem:
      - 'heading "Flat Color Fill: transport" [level=3]'
      - text: Drawing ⏱ 26 min ⭐ 70 XP
      - note: "Trains: Color · Drawing · ~26 min · Fill with base colors on separate layers. Do not add shadows or gradients."
      - button "Take Quest"
      - button "Details"
    - listitem:
      - 'heading "Draw digital gestures: hand" [level=3]'
      - text: Anatomy ⏱ 26 min ⭐ 70 XP
      - note: "Trains: Gesture / pose · Anatomy · ~26 min · Quick gestures on a tablet. Line of action, general dynamics, without details."
      - button "Take Quest"
      - button "Details"
    - listitem:
      - 'heading "Build a proportions grid: facial expressions" [level=3]'
      - text: Anatomy ⏱ 27 min ⭐ 100 XP
      - note: "Trains: Proportions · Anatomy · ~27 min · Construct a grid of proportions. Use guides and layer alignment."
      - button "Take Quest"
      - button "Details"
  - region "Weekly challenge":
    - paragraph: Weekly challenge
    - paragraph: Gesture Set — 15 poses × 90s
    - paragraph: Finish today’s daily quests to unlock this week’s challenge.
- dialog "Welcome back!":
  - text: 🎨
  - heading "Welcome back!" [level=2]
  - paragraph: You were away for 16 days.
  - paragraph: "Your best streak: 5 days"
  - paragraph: "Skills unlocked: 7"
  - paragraph: Start fresh with easier dailies, or keep your current progress.
  - button "Fresh start (keep gallery)"
  - button "Keep playing"
```

# Test source

```ts
  182 |   await expect(page.getByText(/quests completed/i)).toBeVisible()
  183 | })
  184 | 
  185 | test('materials engagement chip persists after autosave and reload', async ({ page }) => {
  186 |   await seedProgress(page, MOCK_PROGRESS)
  187 |   await page.goto(seedUrl('/resources?view=learn'))
  188 |   await dismissE2eOverlays(page)
  189 |   await expect(page.locator('[data-onboarding="page-resources"]')).toBeVisible({ timeout: 20_000 })
  190 |   await expect(page.getByRole('tab', { name: /learning now/i })).toHaveAttribute('aria-selected', 'true')
  191 | 
  192 |   const helpful = page.getByRole('button', { name: /^Helpful$/i }).first()
  193 |   await expect(helpful).toBeVisible({ timeout: 20_000 })
  194 |   await helpful.click()
  195 |   await expect(helpful).toHaveAttribute('aria-pressed', 'true')
  196 | 
  197 |   await expect
  198 |     .poll(
  199 |       async () =>
  200 |         page.evaluate(() => {
  201 |           const getter = (
  202 |             window as unknown as { __e2eGetSavedProgress?: () => Record<string, unknown> }
  203 |           ).__e2eGetSavedProgress
  204 |           const saved = getter?.() as
  205 |             | { settings?: { materialEngagement?: Record<string, string> } }
  206 |             | undefined
  207 |           const engagement = saved?.settings?.materialEngagement ?? {}
  208 |           return Object.values(engagement).includes('helpful')
  209 |         }),
  210 |       { timeout: 12_000 },
  211 |     )
  212 |     .toBe(true)
  213 | 
  214 |   await page.reload()
  215 |   await dismissE2eOverlays(page)
  216 |   await expect(page.getByRole('tab', { name: /learning now/i })).toHaveAttribute('aria-selected', 'true')
  217 |   await expect(page.getByRole('button', { name: /^Helpful$/i }).first()).toHaveAttribute(
  218 |     'aria-pressed',
  219 |     'true',
  220 |   )
  221 | })
  222 | 
  223 | test('statistics monthly summary reflects recurring mistake from feedback logs', async ({ page }) => {
  224 |   await seedProgress(page, MOCK_PROGRESS_WITH_FEEDBACK)
  225 |   await page.goto(seedUrl('/progress/stats'))
  226 |   await dismissE2eOverlays(page)
  227 |   await expect(page.locator('[data-onboarding="page-statistics"]')).toBeVisible({ timeout: 20_000 })
  228 |   await expect(page.getByText(/Recurring focus:.*Line confidence/i)).toBeVisible({ timeout: 15_000 })
  229 | })
  230 | 
  231 | test('gallery lightbox shows saved work review notes', async ({ page }) => {
  232 |   await seedProgress(page, MOCK_PROGRESS_WITH_GALLERY_NOTES)
  233 |   await page.goto(seedUrl('/gallery'))
  234 |   await dismissE2eOverlays(page)
  235 |   await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
  236 |   await page.locator('.gallery-card img, .gallery-thumb').first().click()
  237 |   await expect(page.getByText('Warmup sketch')).toBeVisible({ timeout: 10_000 })
  238 |   await expect(page.getByText('Push line weight on the outer contour')).toBeVisible()
  239 | })
  240 | 
  241 | test('dashboard also-practice block appears when feedback tags suggest weak line', async ({ page }) => {
  242 |   await seedProgress(page, MOCK_PROGRESS_WITH_FEEDBACK)
  243 |   await page.goto(seedUrl('/'))
  244 |   await dismissE2eOverlays(page)
  245 |   await expect(page.locator('[data-onboarding="dashboard-next-action"]')).toBeVisible({ timeout: 20_000 })
  246 |   await expect(page.getByText(/Also practice/i)).toBeVisible({ timeout: 15_000 })
  247 |   await expect(page.getByText(/Line confidence/i).first()).toBeVisible()
  248 | })
  249 | 
  250 | test('quest session focus mode hides overview and shows active session page', async ({ page }) => {
  251 |   await seedProgress(page, MOCK_PROGRESS)
  252 |   await page.goto(seedUrl(`/quests/${E2E_SUBMIT_QUEST_ID}`))
  253 |   await dismissE2eOverlays(page)
  254 |   await page.getByRole('button', { name: /Start quest/i }).click()
  255 |   await expect(page.locator('.quest-session-page--active')).toBeVisible({ timeout: 10_000 })
  256 |   await expect(page.getByRole('button', { name: /Start quest/i })).toHaveCount(0)
  257 | })
  258 | 
  259 | test('export envelope preserves materialEngagement and improvementNotes', async ({ page }) => {
  260 |   await seedProgress(page, MOCK_PROGRESS_EXPORT_SHAPE)
  261 |   await page.goto(seedUrl('/'))
  262 |   await dismissE2eOverlays(page)
  263 |   const envelope = await page.evaluate(() => {
  264 |     const builder = (window as unknown as { __e2eBuildExportEnvelope?: () => { payload?: Record<string, unknown> } })
  265 |       .__e2eBuildExportEnvelope
  266 |     return builder?.()
  267 |   })
  268 |   const settings = envelope?.payload?.settings as { materialEngagement?: Record<string, string> } | undefined
  269 |   const works = envelope?.payload?.completedWorks as { improvementNotes?: string }[] | undefined
  270 |   expect(settings?.materialEngagement?.['vid-1']).toBe('helpful')
  271 |   expect(works?.[0]?.improvementNotes).toContain('shadows')
  272 | })
  273 | 
  274 | test('dashboard share progress web fallback generates PNG', async ({ page }) => {
  275 |   await seedProgress(page, {
  276 |     ...MOCK_PROGRESS_WITH_GOALS,
  277 |     streakState: { current: 3, longest: 5, lastActiveDate: '2026-06-12' },
  278 |   })
  279 |   await page.setViewportSize({ width: 1280, height: 900 })
  280 |   await page.goto(seedUrl('/'))
  281 |   await dismissE2eOverlays(page)
> 282 |   await expect(page.getByRole('button', { name: /share progress/i })).toBeVisible()
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  283 |   const result = await page.evaluate(async () => {
  284 |     const fn = (window as unknown as { __e2eTryShareCardDownload?: () => Promise<{ ok: boolean; blobSize?: number }> })
  285 |       .__e2eTryShareCardDownload
  286 |     return fn?.()
  287 |   })
  288 |   expect(result?.ok).toBe(true)
  289 |   expect(result?.blobSize).toBeGreaterThan(500)
  290 | })
  291 | 
  292 | test('chest reveal modal opens after fifth daily chest day', async ({ page }) => {
  293 |   await seedProgress(page, MOCK_PROGRESS_CHEST_READY)
  294 |   await page.goto(seedUrl('/'))
  295 |   await dismissE2eOverlays(page)
  296 |   await page.evaluate(() => {
  297 |     ;(window as unknown as { __e2eRecordAllDailiesComplete?: () => void }).__e2eRecordAllDailiesComplete?.()
  298 |   })
  299 |   await expect(page.getByRole('heading', { name: /Reward cycle complete!/i })).toBeVisible({ timeout: 10_000 })
  300 | })
  301 | 
```