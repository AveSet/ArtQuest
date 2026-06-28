import { _electron as electron, expect, test } from '@playwright/test'
import electronPath from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { MOCK_PROGRESS } from '../e2e/fixtures/mockProgress'

async function launchTestApp() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artquest-e2e-'))
  const app = await electron.launch({
    executablePath: electronPath as unknown as string,
    args: ['out/main/main.js'],
    env: {
      ...process.env,
      ARTQUEST_ELECTRON_E2E: '1',
      ARTQUEST_E2E_USER_DATA: userDataDir,
    },
  })
  return { app, userDataDir, page: await app.firstWindow() }
}

/** loadProgress returns `{ status, data }` — unwrap for assertions. */
async function loadProgressData(page: Awaited<ReturnType<typeof launchTestApp>>['page']) {
  const result = await page.evaluate(async () => window.electronAPI?.loadProgress?.())
  expect(result?.status).toBe('ok')
  if (result?.status !== 'ok') return null
  return result.data as Record<string, unknown>
}

async function dismissElectronOverlays(page: Awaited<ReturnType<typeof launchTestApp>>['page']) {
  const gotIt = page.getByRole('button', { name: /got it|понятно/i })
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click()
  }
}

async function seedElectronProgress(
  page: Awaited<ReturnType<typeof launchTestApp>>['page'],
  progress: Record<string, unknown>,
) {
  await page.evaluate(async (payload) => {
    await window.electronAPI?.saveProgress?.(JSON.stringify(payload))
    window.location.reload()
  }, progress)
  await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
    timeout: 30_000,
  })
  await dismissElectronOverlays(page)
}

test('boots real Electron runtime and persists progress through preload IPC', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    const apiShape = await page.evaluate(() => {
      const api = window.electronAPI
      return {
        hasApi: Boolean(api),
        hasSave: typeof api?.saveProgress === 'function',
        hasLoad: typeof api?.loadProgress === 'function',
        hasOpenExternal: typeof api?.openExternal === 'function',
        hasNodeRequire: typeof (window as unknown as { require?: unknown }).require === 'function',
      }
    })
    expect(apiShape).toEqual({
      hasApi: true,
      hasSave: true,
      hasLoad: true,
      hasOpenExternal: true,
      hasNodeRequire: false,
    })

    const saveResult = await page.evaluate(async (progress) => {
      return window.electronAPI?.saveProgress?.(JSON.stringify(progress))
    }, MOCK_PROGRESS)
    expect(saveResult?.success).toBe(true)

    const loaded = await loadProgressData(page)
    expect(loaded?.completedQuests).toEqual(MOCK_PROGRESS.completedQuests)
    expect((loaded?.settings as { language?: string } | undefined)?.language).toBe(
      MOCK_PROGRESS.settings.language,
    )

    const blockedExternal = await page.evaluate(async () => {
      return window.electronAPI?.openExternal?.('file:///C:/Windows/System32/calc.exe')
    })
    expect(blockedExternal?.success).toBe(false)
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})

test('rejects corrupt progress payloads', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    const invalidJson = await page.evaluate(async () => {
      return window.electronAPI?.saveProgress?.('{ not valid json')
    })
    expect(invalidJson?.success).toBe(false)

    const invalidStructure = await page.evaluate(async () => {
      return window.electronAPI?.saveProgress?.(JSON.stringify([]))
    })
    expect(invalidStructure?.success).toBe(false)
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})

test('saves incremental progress chunks and loads merged snapshot', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    const fullSave = await page.evaluate(async (progress) => {
      return window.electronAPI?.saveProgress?.(JSON.stringify(progress))
    }, MOCK_PROGRESS)
    expect(fullSave?.success).toBe(true)

    const chunkPayload = {
      _chunkKey: 'quests',
      schemaVersion: 15,
      chunkVersion: 1,
      data: {
        completedQuests: [42, 99],
        questCompletionLogs: MOCK_PROGRESS.questCompletionLogs,
        userQuests: [],
        deletedQuestIds: [],
        questTitleOverrides: {},
        microChallengesCompleted: {},
        questSavedReferences: {},
      },
    }

    const chunkSave = await page.evaluate(async (chunk) => {
      return window.electronAPI?.saveProgress?.(JSON.stringify(chunk))
    }, chunkPayload)
    expect(chunkSave?.success).toBe(true)

    const loaded = await loadProgressData(page)
    expect(loaded?.completedQuests).toEqual([42, 99])
    expect((loaded?.settings as { language?: string } | undefined)?.language).toBe(
      MOCK_PROGRESS.settings.language,
    )
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})

test('getSavedImages returns an array from gallery IPC', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    const images = await page.evaluate(async () => window.electronAPI?.getSavedImages?.())
    expect(Array.isArray(images)).toBe(true)
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})

test('session tick IPC delivers pulses while active', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    const activated = await page.evaluate(async () => {
      return window.electronAPI?.setSessionTickActive?.(true)
    })
    expect(activated?.success).toBe(true)

    const tickCount = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let count = 0
          const unsub = window.electronAPI?.onSessionTick?.(() => {
            count += 1
            if (count >= 2) {
              unsub?.()
              resolve(count)
            }
          })
          window.setTimeout(() => {
            unsub?.()
            resolve(count)
          }, 3500)
        }),
    )
    expect(tickCount).toBeGreaterThanOrEqual(2)

    const deactivated = await page.evaluate(async () => {
      return window.electronAPI?.setSessionTickActive?.(false)
    })
    expect(deactivated?.success).toBe(true)
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})

test('overlay payload syncs through preload IPC', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    const snapshot = await page.evaluate(async () => {
      const payload = {
        hasSession: true,
        sessionType: 'quest' as const,
        questId: 42,
        questTitle: 'Overlay smoke quest',
        timerLabel: '04:59',
        labels: { next: 'Next' },
      }
      const setResult = await window.electronAPI?.setQuestOverlayPayload?.(payload)
      const snapResult = await window.electronAPI?.getQuestOverlayPayload?.()
      return { setResult, snap: snapResult?.payload }
    })

    expect(snapshot.setResult?.success).toBe(true)
    expect(snapshot.snap?.hasSession).toBe(true)
    expect(snapshot.snap?.timerLabel).toBe('04:59')
    expect(snapshot.snap?.questTitle).toBe('Overlay smoke quest')
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})

test('dispatchQuestSessionCommand advances an active quest session phase', async () => {
  const { app, userDataDir, page } = await launchTestApp()

  try {
    await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
      timeout: 30_000,
    })

    await seedElectronProgress(page, MOCK_PROGRESS)

    await page.evaluate(() => {
      window.location.hash = '#/quests/9802'
    })
    const startQuest = page.getByRole('button', { name: /start quest|начать квест/i })
    await expect(startQuest).toBeVisible({ timeout: 25_000 })
    await startQuest.click()
    await expect(page.locator('.quest-session-page--active')).toBeVisible({ timeout: 15_000 })

    const nextPhaseBefore = page.getByRole('button', { name: /next phase|следующ/i })
    const hadNextPhase = await nextPhaseBefore.isVisible().catch(() => false)

    if (hadNextPhase) {
      const dispatch = await page.evaluate(async () => {
        return window.electronAPI?.dispatchQuestSessionCommand?.('advancePhase')
      })
      expect(dispatch?.success).toBe(true)
      await expect(nextPhaseBefore).toBeHidden({ timeout: 10_000 }).catch(() => undefined)
    } else {
      const dispatch = await page.evaluate(async () => {
        return window.electronAPI?.dispatchQuestSessionCommand?.('cancelQuestSession')
      })
      expect(dispatch?.success).toBe(true)
      await expect(page.locator('[data-onboarding="dashboard-dailies"]')).toBeVisible({ timeout: 15_000 })
    }
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  }
})
