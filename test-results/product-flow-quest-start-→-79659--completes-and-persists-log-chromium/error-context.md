# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-flow.spec.ts >> quest start → upload → submit completes and persists log
- Location: e2e\product-flow.spec.ts:97:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^Submit Work$/i })
    - locator resolved to <button disabled type="button" class="btn-primary btn-session-primary text-base py-2.5 flex-1">Submit Work</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    109 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "Skip to main content" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - navigation "Main navigation" [ref=e5]:
      - generic [ref=e6]:
        - link "ArtQuest home" [ref=e7] [cursor=pointer]:
          - /url: "#/"
          - img [ref=e8]
          - text: Art
          - generic [ref=e9]: Quest
        - generic [ref=e11]:
          - link "Home" [ref=e13] [cursor=pointer]:
            - /url: "#/"
          - generic [ref=e14]:
            - generic [ref=e15]: ·
            - link "Quests" [ref=e16] [cursor=pointer]:
              - /url: "#/quests"
          - generic [ref=e17]:
            - generic [ref=e18]: ·
            - link "Skills" [ref=e19] [cursor=pointer]:
              - /url: "#/skills"
          - generic [ref=e20]:
            - generic [ref=e21]: ·
            - link "Gallery" [ref=e22] [cursor=pointer]:
              - /url: "#/gallery"
          - generic [ref=e23]:
            - generic [ref=e24]: ·
            - link "Resources" [ref=e25] [cursor=pointer]:
              - /url: "#/resources"
          - generic [ref=e26]:
            - generic [ref=e27]: ·
            - link "Progress" [ref=e28] [cursor=pointer]:
              - /url: "#/progress"
          - generic [ref=e29]:
            - generic [ref=e30]: ·
            - link "Settings" [ref=e31] [cursor=pointer]:
              - /url: "#/settings"
    - main [ref=e32]:
      - generic [ref=e33]:
        - status [ref=e35]:
          - generic [ref=e36]:
            - generic [ref=e37]:
              - paragraph [ref=e38]: Next action
              - paragraph [ref=e39]: Submit Work
            - generic [ref=e40]: 28 min · Cat Paw Structure
        - generic [ref=e42]:
          - generic [ref=e43]:
            - heading "Cat Paw Structure" [level=1] [ref=e44]
            - generic [ref=e45]:
              - button "Remove upload" [ref=e47] [cursor=pointer]: ×
              - button "Add reference" [ref=e49] [cursor=pointer]
              - button "Choose File" [ref=e50]
          - generic [ref=e52]:
            - paragraph [ref=e53]: All exercise phases done — finish your work and submit when ready.
            - paragraph [ref=e55]: 27:01
          - paragraph [ref=e56]: Study and draw a cat paw — pads, toe bones, fur direction. Top and bottom view.
          - generic [ref=e57]:
            - generic [ref=e58]: Novice
            - generic [ref=e59]: ⭐ 69 XP
  - generic [ref=e60]:
    - button "Back" [ref=e61]
    - generic [ref=e63]:
      - heading "📤 Submit Work" [level=2] [ref=e64]
      - generic [ref=e65]:
        - generic [ref=e66]:
          - group "Upload your work" [active] [ref=e67]:
            - button "📁 Choose File" [ref=e68] [cursor=pointer]
            - paragraph [ref=e69]: Drag & drop, paste from clipboard, or choose a file
          - paragraph [ref=e70]: Attach your work to complete this quest.
        - generic [ref=e71]:
          - paragraph [ref=e72]: Upload your work on the left, then rate difficulty — quality or mistakes follow based on your rating.
          - generic [ref=e73]:
            - status [ref=e74]: Upload your work on the left, then rate difficulty — quality or mistakes follow based on your rating.
            - button "Submit Work" [disabled]
            - button "Back" [ref=e75] [cursor=pointer]
```

# Test source

```ts
  25  |   await expect(page.locator('[data-onboarding="page-quests"]')).toBeVisible({ timeout: 20_000 })
  26  | })
  27  | 
  28  | test('materials learn mode opens from URL', async ({ page }) => {
  29  |   await seedProgress(page, MOCK_PROGRESS)
  30  |   await page.goto(seedUrl('/resources?view=learn'))
  31  |   await dismissE2eOverlays(page)
  32  |   await expect(page.locator('[data-onboarding="page-resources"]')).toBeVisible({ timeout: 20_000 })
  33  |   await expect(page.locator('[data-onboarding="materials-engagement-hint"]')).toBeVisible()
  34  |   const learnTab = page.getByRole('tab', { name: /learning now/i })
  35  |   await expect(learnTab).toHaveAttribute('aria-selected', 'true')
  36  | })
  37  | 
  38  | test('progress statistics shows data when logs exist', async ({ page }) => {
  39  |   await seedProgress(page, MOCK_PROGRESS)
  40  |   await page.goto(seedUrl('/progress/stats'))
  41  |   await dismissE2eOverlays(page)
  42  |   await expect(page.locator('[data-onboarding="page-statistics"]')).toBeVisible({ timeout: 20_000 })
  43  |   await expect(
  44  |     page.getByText('Complete some quests to see practice trends and breakdowns here.'),
  45  |   ).not.toBeVisible()
  46  |   await expect(page.getByText(/practice minutes/i)).toBeVisible({ timeout: 15_000 })
  47  |   await expect(page.locator('[data-onboarding="dashboard-next-action"]')).toHaveCount(0)
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
> 125 |   await page.getByRole('button', { name: /^Submit Work$/i }).click()
      |                                                              ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  148 |   await expect(page.getByText(/0\/10.*exercises/i)).toBeVisible()
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
```