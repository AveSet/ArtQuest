# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-flow.spec.ts >> dashboard also-practice block appears when feedback tags suggest weak line
- Location: e2e\product-flow.spec.ts:241:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-onboarding="dashboard-next-action"]')
Expected: visible
Error: strict mode violation: locator('[data-onboarding="dashboard-next-action"]') resolved to 2 elements:
    1) <div data-onboarding="dashboard-next-action" class="card-fantasy p-3 dashboard-toggle-strip">…</div> aka locator('div').filter({ hasText: /^Next actionToday's practice3\/3$/ }).first()
    2) <div data-onboarding="dashboard-next-action" class="card-fantasy dashboard-next-action-card">…</div> aka getByText('Best for today0/3 dailies')

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('[data-onboarding="dashboard-next-action"]')

```

# Page snapshot

```yaml
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
    - generic [ref=e35]:
      - complementary [ref=e36]:
        - generic [ref=e38]:
          - button "Click to choose a custom avatar photo" [ref=e39] [cursor=pointer]:
            - generic:
              - generic:
                - img
            - generic: 📷
          - button [ref=e40]
          - generic [ref=e41]:
            - generic [ref=e42]: Artist
            - generic [ref=e43]:
              - generic [ref=e44]: Level 0
              - text: ·Novice
          - generic [ref=e45]:
            - generic [ref=e46]:
              - heading "SKILLS" [level=3] [ref=e47]
              - button "Show less" [expanded] [ref=e48]
            - generic [ref=e49]:
              - generic [ref=e51]:
                - generic [ref=e52]:
                  - generic [ref=e53]:
                    - generic [ref=e54]: 🎨
                    - generic [ref=e55]: Drawing
                  - generic [ref=e56]: Level 0
                - generic [ref=e58]:
                  - generic [ref=e59]: 0 / 300 XP
                  - generic [ref=e60]: 0%
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - generic [ref=e64]:
                    - generic [ref=e65]: 🦴
                    - generic [ref=e66]: Anatomy
                  - generic [ref=e67]: Level 0
                - generic [ref=e69]:
                  - generic [ref=e70]: 0 / 300 XP
                  - generic [ref=e71]: 0%
              - generic [ref=e73]:
                - generic [ref=e74]:
                  - generic [ref=e75]:
                    - generic [ref=e76]: ✨
                    - generic [ref=e77]: Effects
                  - generic [ref=e78]: Level 0
                - generic [ref=e80]:
                  - generic [ref=e81]: 0 / 300 XP
                  - generic [ref=e82]: 0%
              - generic [ref=e84]:
                - generic [ref=e85]:
                  - generic [ref=e86]:
                    - generic [ref=e87]: 📖
                    - generic [ref=e88]: Storytelling
                  - generic [ref=e89]: Level 0
                - generic [ref=e91]:
                  - generic [ref=e92]: 0 / 300 XP
                  - generic [ref=e93]: 0%
              - generic [ref=e95]:
                - generic [ref=e96]:
                  - generic [ref=e97]:
                    - generic [ref=e98]: 🎭
                    - generic [ref=e99]: Character Design
                  - generic [ref=e100]: Level 0
                - generic [ref=e102]:
                  - generic [ref=e103]: 0 / 300 XP
                  - generic [ref=e104]: 0%
              - generic [ref=e106]:
                - generic [ref=e107]:
                  - generic [ref=e108]:
                    - generic [ref=e109]: 🏞️
                    - generic [ref=e110]: Environment
                  - generic [ref=e111]: Level 0
                - generic [ref=e113]:
                  - generic [ref=e114]: 0 / 300 XP
                  - generic [ref=e115]: 0%
          - generic [ref=e117]:
            - generic [ref=e119]: Daily reward · 0/5
            - progressbar "Daily reward · 0/5" [ref=e120]
            - paragraph [ref=e122]: Complete all daily quests — one star per day. Fill all five stars to complete the streak cycle.
            - img "Daily reward · 0/5" [ref=e123]:
              - generic [ref=e124]: ✦
              - generic [ref=e125]: ✦
              - generic [ref=e126]: ✦
              - generic [ref=e127]: ✦
              - generic [ref=e128]: ✦
      - generic [ref=e129]:
        - region "Goal" [ref=e130]:
          - generic [ref=e131]:
            - heading "Goal" [level=2] [ref=e132]
            - paragraph [ref=e133]: Write what you want to achieve with ArtQuest — it stays here as your daily reminder.
          - generic [ref=e134]:
            - generic [ref=e135]: Goal
            - textbox "Goal" [ref=e136]:
              - /placeholder: What is your next goal?
            - generic [ref=e137]:
              - button "Save goal" [disabled]
        - region "Focus this week" [ref=e138]:
          - heading "Focus this week" [level=2] [ref=e139]
          - paragraph [ref=e140]: line
          - generic [ref=e141]:
            - button "Line confidence" [ref=e142]
            - button "sketch" [ref=e143]
        - region "Due for review" [ref=e144]:
          - heading "Due for review" [level=2] [ref=e145]
          - list [ref=e146]:
            - listitem [ref=e147]:
              - 'button "Studio Style Analysis: Water Splashes (Ufotable/Pixar) Last practiced 13 days ago — time to repeat" [ref=e148]':
                - generic [ref=e149]: "Studio Style Analysis: Water Splashes (Ufotable/Pixar)"
                - text: Last practiced 13 days ago — time to repeat
        - generic [ref=e151]:
          - button "Next action" [ref=e152]
          - button "Today's practice" [pressed] [ref=e153]
          - generic [ref=e154]: 3/3
        - generic [ref=e155]:
          - generic:
            - generic:
              - heading [level=2]: Best for today
              - paragraph: 0/3 dailies done — finish today's lineup for streak and stars.
              - generic:
                - generic: Daily quest
                - heading [level=3]: "Flat Color Fill: transport"
                - generic:
                  - generic: Drawing
                  - generic: ⏱ 26 min
                  - generic: ⭐ 70 XP
                - generic:
                  - button: Details
                  - button: Take Quest
              - generic:
                - paragraph: Also practice
                - paragraph: Matched to recurring mistakes from your recent work.
                - heading [level=3]: Mileage — 30 Loose Lines
                - generic:
                  - generic: Drawing
                  - generic: ⏱ 12 min
                  - generic: ⭐ 69 XP
                - button: Start focus quest
              - generic:
                - heading [level=3]: Today's plan
                - list:
                  - listitem:
                    - generic: "1"
                    - generic:
                      - generic: Materials for weak spot
                      - generic: "Theory and demos: line."
          - generic [ref=e156]:
            - generic [ref=e157]:
              - heading "Today's practice" [level=2] [ref=e158]
              - paragraph [ref=e159]: Finish today’s daily lineup
            - generic [ref=e160]:
              - generic [ref=e161]:
                - heading "Today" [level=2] [ref=e162]
                - generic [ref=e164]: 0/3 completed
              - list [ref=e166]:
                - listitem [ref=e167]:
                  - generic [ref=e168]:
                    - generic [ref=e169]: ·
                    - generic [ref=e170]:
                      - 'heading "Flat Color Fill: transport" [level=3] [ref=e171]'
                      - generic [ref=e172]:
                        - generic [ref=e173]: Drawing
                        - generic [ref=e174]: ⏱ 26 min
                        - generic [ref=e175]: ⭐ 70 XP
                      - note [ref=e176]: "Trains: Color · Drawing · ~26 min · Fill with base colors on separate layers. Do not add shadows or gradients."
                      - generic [ref=e177]:
                        - button "Take Quest" [ref=e178] [cursor=pointer]
                        - button "Details" [ref=e179] [cursor=pointer]
                - listitem [ref=e180]:
                  - generic [ref=e181]:
                    - generic [ref=e182]: ·
                    - generic [ref=e183]:
                      - 'heading "Draw digital gestures: hand" [level=3] [ref=e184]'
                      - generic [ref=e185]:
                        - generic [ref=e186]: Anatomy
                        - generic [ref=e187]: ⏱ 26 min
                        - generic [ref=e188]: ⭐ 70 XP
                      - note [ref=e189]: "Trains: Gesture / pose · Anatomy · ~26 min · Quick gestures on a tablet. Line of action, general dynamics, without details."
                      - generic [ref=e190]:
                        - button "Take Quest" [ref=e191] [cursor=pointer]
                        - button "Details" [ref=e192] [cursor=pointer]
                - listitem [ref=e193]:
                  - generic [ref=e194]:
                    - generic [ref=e195]: ·
                    - generic [ref=e196]:
                      - 'heading "Build a proportions grid: facial expressions" [level=3] [ref=e197]'
                      - generic [ref=e198]:
                        - generic [ref=e199]: Anatomy
                        - generic [ref=e200]: ⏱ 27 min
                        - generic [ref=e201]: ⭐ 100 XP
                      - note [ref=e202]: "Trains: Proportions · Anatomy · ~27 min · Construct a grid of proportions. Use guides and layer alignment."
                      - generic [ref=e203]:
                        - button "Take Quest" [ref=e204] [cursor=pointer]
                        - button "Details" [ref=e205] [cursor=pointer]
            - region "Weekly challenge" [ref=e206]:
              - paragraph [ref=e207]: Weekly challenge
              - paragraph [ref=e208]: Gesture Set — 15 poses × 90s
              - paragraph [ref=e209]: Finish today’s daily quests to unlock this week’s challenge.
```

# Test source

```ts
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
> 245 |   await expect(page.locator('[data-onboarding="dashboard-next-action"]')).toBeVisible({ timeout: 20_000 })
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
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
  282 |   await expect(page.getByRole('button', { name: /share progress/i })).toBeVisible()
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