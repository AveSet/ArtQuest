# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-flow.spec.ts >> beginner tier shows fundamentals gate on dashboard and quests catalog
- Location: e2e\product-flow.spec.ts:143:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/0\/10.*exercises/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/0\/10.*exercises/i)

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
    - text: Goal
    - textbox "Goal":
      - /placeholder: What is your next goal?
    - button "Save goal" [disabled]
  - region "Due for review":
    - heading "Due for review" [level=2]
    - list:
      - listitem:
        - 'button "Studio Style Analysis: Water Splashes (Ufotable/Pixar) Last practiced 13 days ago — time to repeat"'
  - button "Next action"
  - button "Today's practice" [pressed]
  - text: 3/3
  - heading "Fundamentals" [level=2]
  - link "View all":
    - /url: "#/fundamentals"
  - paragraph: Complete one fundamentals exercise to unlock daily quests.
  - paragraph: Up next
  - paragraph: Fundamentals — Novice
  - button "Start fundamentals"
  - heading "Today's practice" [level=2]
  - paragraph: Finish today’s daily lineup
  - status:
    - paragraph: Complete one fundamentals exercise to unlock daily quests.
```

# Test source

```ts
  48  | })
  49  | 
  50  | test('skills page loads node panel area', async ({ page }) => {
  51  |   await seedProgress(page, MOCK_PROGRESS)
  52  |   await page.goto(seedUrl('/skills'))
  53  |   await expect(page.locator('[data-onboarding="page-skills"]')).toBeVisible({ timeout: 20_000 })
  54  | })
  55  | 
  56  | test('gallery page loads empty or grid', async ({ page }) => {
  57  |   await seedProgress(page, MOCK_PROGRESS)
  58  |   await page.goto(seedUrl('/gallery'))
  59  |   await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
  60  | })
  61  | 
  62  | test('mobile More menu opens Materials and Progress', async ({ page }) => {
  63  |   await seedProgress(page, MOCK_PROGRESS)
  64  |   await page.setViewportSize({ width: 390, height: 844 })
  65  |   await page.goto(seedUrl('/'))
  66  |   await dismissE2eOverlays(page)
  67  |   await expect(page.locator('#nav-mobile-more-trigger')).toBeVisible({ timeout: 20_000 })
  68  |   await page.locator('#nav-mobile-more-trigger').click()
  69  |   await expect(page.locator('#nav-mobile-more-menu')).toBeVisible()
  70  |   await page.getByRole('menuitem', { name: /resources/i }).click()
  71  |   await expect(page.locator('[data-onboarding="page-resources"]')).toBeVisible({ timeout: 20_000 })
  72  |   await page.goto('/#/')
  73  |   await page.locator('#nav-mobile-more-trigger').click()
  74  |   await page.getByRole('menuitem', { name: /progress/i }).click()
  75  |   await expect(page.locator('[data-onboarding="page-statistics"]')).toBeVisible({ timeout: 20_000 })
  76  | })
  77  | 
  78  | test('dashboard goal card links to completed goals history', async ({ page }) => {
  79  |   await seedProgress(page, MOCK_PROGRESS_WITH_GOALS)
  80  |   await page.goto(seedUrl('/'))
  81  |   await dismissE2eOverlays(page)
  82  |   await expect(page.locator('[data-onboarding="dashboard-goals-history"]')).toBeVisible({
  83  |     timeout: 20_000,
  84  |   })
  85  |   await page.locator('[data-onboarding="dashboard-goals-history"]').click()
  86  |   await expect(page).toHaveURL(/#\/progress\/goals/)
  87  | })
  88  | 
  89  | test('gallery grouped view shows works from saved progress', async ({ page }) => {
  90  |   await seedProgress(page, MOCK_PROGRESS_WITH_GALLERY)
  91  |   await page.goto(seedUrl('/gallery'))
  92  |   await dismissE2eOverlays(page)
  93  |   await expect(page.locator('[data-onboarding="page-gallery"]')).toBeVisible({ timeout: 20_000 })
  94  |   await expect(page.getByRole('button', { name: /growth wall/i })).toBeVisible({ timeout: 15_000 })
  95  | })
  96  | 
  97  | test('quest start → upload → submit completes and persists log', async ({ page }) => {
  98  |   await seedProgress(page, MOCK_PROGRESS, { mockSaveImage: true })
  99  |   await page.goto(seedUrl(`/quests/${E2E_SUBMIT_QUEST_ID}`))
  100 |   await dismissE2eOverlays(page)
  101 |   await expect(page.getByRole('heading', { name: /Cat Paw Structure/i })).toBeVisible({
  102 |     timeout: 25_000,
  103 |   })
  104 |   await page.getByRole('button', { name: /Start quest/i }).click()
  105 |   await expect(page.locator('.quest-session-page--active')).toBeVisible({ timeout: 10_000 })
  106 |   for (let phase = 0; phase < 5; phase += 1) {
  107 |     const nextPhase = page.getByRole('button', { name: /Next phase/i })
  108 |     if (!(await nextPhase.isVisible().catch(() => false))) break
  109 |     await nextPhase.click()
  110 |   }
  111 |   const submitPanel = page.locator('.submit-step-panel')
  112 |   if (!(await submitPanel.isVisible().catch(() => false))) {
  113 |     await page.getByRole('button', { name: /Submit Work/i }).first().click()
  114 |   }
  115 |   await expect(submitPanel).toBeVisible()
  116 |   const fileInput = page.locator('input[type="file"]').first()
  117 |   await fileInput.setInputFiles({
  118 |     name: 'e2e-work.png',
  119 |     mimeType: 'image/png',
  120 |     buffer: Buffer.from(
  121 |       'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  122 |       'base64',
  123 |     ),
  124 |   })
  125 |   await page.getByRole('button', { name: /^Submit Work$/i }).click()
  126 |   await expect(page).toHaveURL(/#\/(\?.*)?$/, { timeout: 25_000 })
  127 |   await expect(page.locator('[data-onboarding="dashboard-dailies"]')).toBeVisible({ timeout: 20_000 })
  128 | 
  129 |   await expect
  130 |     .poll(
  131 |       async () =>
  132 |         page.evaluate((questId) => {
  133 |           const getter = (window as unknown as { __e2eGetSavedProgress?: () => Record<string, unknown> })
  134 |             .__e2eGetSavedProgress
  135 |           const saved = getter?.() as { questCompletionLogs?: { questId: number }[] } | null
  136 |           return saved?.questCompletionLogs?.some((row) => row.questId === questId) ?? false
  137 |         }, E2E_SUBMIT_QUEST_ID),
  138 |       { timeout: 15_000 },
  139 |     )
  140 |     .toBe(true)
  141 | })
  142 | 
  143 | test('beginner tier shows fundamentals gate on dashboard and quests catalog', async ({ page }) => {
  144 |   await seedProgress(page, MOCK_PROGRESS_BEGINNER)
  145 |   await page.goto(seedUrl('/'))
  146 |   await dismissE2eOverlays(page)
  147 |   await expect(page.getByRole('heading', { name: /^Fundamentals$/i })).toBeVisible({ timeout: 20_000 })
> 148 |   await expect(page.getByText(/0\/10.*exercises/i)).toBeVisible()
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  149 | 
  150 |   await page.goto('/#/quests')
  151 |   await dismissE2eOverlays(page)
  152 |   await expect(page.getByRole('link', { name: /Continue fundamentals/i })).toBeVisible({
  153 |     timeout: 20_000,
  154 |   })
  155 | })
  156 | 
  157 | test('fundamentals catalog page lists tier sections', async ({ page }) => {
  158 |   await seedProgress(page, MOCK_PROGRESS_BEGINNER)
  159 |   await page.goto(seedUrl('/fundamentals'))
  160 |   await dismissE2eOverlays(page)
  161 |   await expect(page.getByRole('heading', { name: /^Fundamentals$/i })).toBeVisible({
  162 |     timeout: 20_000,
  163 |   })
  164 |   await expect(page.getByRole('heading', { name: /Novice|Beginner/i }).first()).toBeVisible()
  165 | })
  166 | 
  167 | test('dashboard review shelf lists overdue spaced-review quest', async ({ page }) => {
  168 |   await seedProgress(page, MOCK_PROGRESS_WITH_REVIEW)
  169 |   await page.goto(seedUrl('/'))
  170 |   await dismissE2eOverlays(page)
  171 |   await expect(page.locator('.review-shelf:not(.review-shelf--empty)')).toBeVisible({
  172 |     timeout: 20_000,
  173 |   })
  174 |   await expect(page.getByRole('button', { name: /Water Splashes/i })).toBeVisible()
  175 | })
  176 | 
  177 | test('statistics page shows monthly summary block', async ({ page }) => {
  178 |   await seedProgress(page, MOCK_PROGRESS)
  179 |   await page.goto(seedUrl('/progress/stats'))
  180 |   await dismissE2eOverlays(page)
  181 |   await expect(page.getByRole('heading', { name: /This month/i })).toBeVisible({ timeout: 20_000 })
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
```