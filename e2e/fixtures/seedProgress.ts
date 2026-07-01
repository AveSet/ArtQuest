import type { Page } from '@playwright/test'

const STORAGE_KEY = 'artquest-progress'

export type SeedProgressOptions = {
  /** Mock saveImage IPC so quest submit records gallery work in browser E2E. */
  mockSaveImage?: boolean
  /** Override loadProgress response from mocked electronAPI. */
  loadStatus?: 'ok' | 'empty' | 'corrupt' | 'failed'
  /** When true, next saveProgress call fails once. */
  failNextSave?: boolean
  /** Artificial delay before mocked save resolves. */
  saveDelayMs?: number
}

export async function seedProgress(
  page: Page,
  progress: Record<string, unknown>,
  options: SeedProgressOptions = {},
) {
  await page.addInitScript(
    ({ payload, mockSaveImage, storageKey, loadStatus, failNextSave, saveDelayMs }) => {
      type ChunkRow = { _chunkKey?: string; data?: Record<string, unknown> }

      const parseObject = (raw: string): Record<string, unknown> | null => {
        try {
          const parsed = JSON.parse(raw) as unknown
          return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null
        } catch {
          return null
        }
      }

      const seeded = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
      const resetRequested = location.search.includes('e2eReset=1')

      if (resetRequested) {
        localStorage.removeItem(storageKey)
        const url = new URL(location.href)
        url.searchParams.delete('e2eReset')
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
      }

      const existingRaw = resetRequested ? null : localStorage.getItem(storageKey)
      let merged = existingRaw ? (parseObject(existingRaw) ?? seeded) : seeded
      if (!existingRaw) {
        localStorage.setItem(storageKey, JSON.stringify(merged))
      }

      const store: { value: string } = { value: localStorage.getItem(storageKey) ?? JSON.stringify(merged) }

      const faultState = {
        failNextSave: Boolean(failNextSave),
        lastSaveError: null as string | null,
        hydrationStartedAt: 0,
        hydrationFinishedAt: 0,
      }

      const persistMerged = () => {
        store.value = JSON.stringify(merged)
        localStorage.setItem(storageKey, store.value)
      }

      const absorbSave = (data: string) => {
        try {
          const parsed = JSON.parse(data) as Record<string, unknown>
          if (Array.isArray(parsed._chunkBatch)) {
            for (const row of parsed._chunkBatch as ChunkRow[]) {
              if (row._chunkKey && row.data) Object.assign(merged, row.data)
            }
            persistMerged()
            return
          }
          if (typeof parsed._chunkKey === 'string' && parsed.data && typeof parsed.data === 'object') {
            Object.assign(merged, parsed.data as Record<string, unknown>)
            persistMerged()
            return
          }
          if (!parsed._chunkKey) {
            merged = parsed
            persistMerged()
          }
        } catch {
          /* ignore malformed saves in E2E */
        }
      }

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

      const progress = {
        save: async (data: string) => {
          if (saveDelayMs > 0) await delay(saveDelayMs)
          if (faultState.failNextSave) {
            faultState.failNextSave = false
            faultState.lastSaveError = 'save_failed'
            return { success: false, error: 'E2E injected save failure' }
          }
          absorbSave(data)
          faultState.lastSaveError = null
          return { success: true }
        },
        saveSync: (data: string) => {
          if (faultState.failNextSave) {
            faultState.failNextSave = false
            faultState.lastSaveError = 'save_failed'
            return { success: false, error: 'E2E injected save failure' }
          }
          absorbSave(data)
          faultState.lastSaveError = null
          return { success: true }
        },
        load: async () => {
          faultState.hydrationStartedAt = performance.now()
          if (loadStatus === 'corrupt') {
            faultState.hydrationFinishedAt = performance.now()
            return { status: 'corrupt', message: 'E2E injected corrupt progress' }
          }
          if (loadStatus === 'failed') {
            faultState.hydrationFinishedAt = performance.now()
            return { status: 'failed', message: 'E2E injected load failure' }
          }
          if (loadStatus === 'empty') {
            faultState.hydrationFinishedAt = performance.now()
            return { status: 'empty' }
          }
          const raw = localStorage.getItem(storageKey) ?? store.value
          if (!raw) {
            faultState.hydrationFinishedAt = performance.now()
            return { status: 'empty' }
          }
          const data = parseObject(raw)
          if (!data) {
            faultState.hydrationFinishedAt = performance.now()
            return { status: 'corrupt', message: 'Invalid JSON in E2E progress store' }
          }
          merged = data
          store.value = raw
          faultState.hydrationFinishedAt = performance.now()
          return { status: 'ok', data }
        },
        readCorruptBackup: async () => ({ success: false as const, error: 'not found' }),
        clear: async () => {
          merged = {}
          store.value = '{}'
          localStorage.removeItem(storageKey)
          return { success: true }
        },
        exportFile: async () => ({ success: true }),
        importFile: async () => ({ success: false, error: 'not implemented in E2E mock' }),
        appendLog: async () => ({ success: true }),
        onBeforeQuit: () => () => {},
      }

      const gallery: Record<string, unknown> = {
        listImages: async () => [],
        readImage: async () => null,
        getLocalMediaUrl: async (filepath: string) => `file://${filepath}`,
        saveImage: async (_base64: string, questId: string) => ({
          success: true,
          path: `e2e-mock/quest-${questId}.png`,
          galleryItemId: `e2e-${questId}`,
          storageMode: 'local',
        }),
        saveQuestReference: async () => ({ success: true, path: '/mock/ref.png', id: 'ref-1' }),
        deleteQuestReference: async () => ({ success: true }),
        pickPortraitImage: async () => ({ success: true, dataUrl: 'data:image/png;base64,mock' }),
        saveCustomAvatar: async () => ({ success: true, path: '/mock/avatar.jpg' }),
        retryUpload: async () => ({ success: true }),
        retryAllUploads: async () => ({ success: true, uploaded: 0, failed: 0 }),
        sync: async () => ({ success: true, uploaded: 0, failed: 0 }),
        onSyncUpdated: () => () => {},
      }

      if (!mockSaveImage) {
        gallery.saveImage = async () => ({ success: false, error: 'saveImage mock disabled' })
      }

      const electronAPI = {
        progress,
        shell: {
          showItemInFolder: async () => {},
          openExternal: async () => ({ success: true }),
          saveShareCardPng: async () => ({ success: true }),
        },
        overlay: {},
        reference: {},
        cloud: {
          getMode: async () => ({ success: true, mode: 'local' }),
          setMode: async () => ({ success: true, mode: 'local' }),
          connectGoogleDrive: async () => ({ success: false, error: 'not configured' }),
          disconnectGoogleDrive: async () => ({ success: true }),
          setGoogleDrivePath: async () => ({ success: true }),
          getGoogleDriveStatus: async () => ({
            success: true,
            account: {
              provider: 'google',
              connected: false,
              accountEmail: null,
              remoteRootPath: '/ArtQuest/Gallery',
              connectedAt: null,
              updatedAt: new Date(0).toISOString(),
            },
          }),
        },
        gallery,
        session: {
          dispatchCommand: async () => ({ success: true }),
          onCommand: () => () => {},
          onActivityUpdate: () => () => {},
          onTick: () => () => {},
          setTickActive: async () => ({ success: true }),
        },
        desktop: {
          activityTrackingNative: true,
          syncSettings: async () => {},
          pickArtAppExecutable: async () => ({
            success: true,
            path: 'C:\\Apps\\Krita\\krita.exe',
          }),
          showTestNotification: async () => ({ success: true }),
          setTaskbarProgress: async () => ({ success: true }),
          applyWindowBounds: async () => ({ success: true }),
          onWindowBoundsReport: () => () => {},
          onNavigate: () => () => {},
          trackTelemetry: async () => ({ success: true }),
        },
      }

      ;(window as unknown as { electronAPI: Record<string, unknown> }).electronAPI = electronAPI
      ;(window as unknown as { __E2E_TEST__?: boolean }).__E2E_TEST__ = true
      ;(window as unknown as { __e2eGetSavedProgress?: () => unknown }).__e2eGetSavedProgress =
        () => merged
      ;(window as unknown as { __e2eInjectSaveFailure?: () => void }).__e2eInjectSaveFailure = () => {
        faultState.failNextSave = true
      }
      ;(window as unknown as { __e2eGetLastSaveError?: () => string | null }).__e2eGetLastSaveError =
        () => faultState.lastSaveError
      ;(window as unknown as { __e2eGetHydrationMs?: () => number | null }).__e2eGetHydrationMs =
        () =>
          faultState.hydrationFinishedAt > 0 && faultState.hydrationStartedAt > 0
            ? faultState.hydrationFinishedAt - faultState.hydrationStartedAt
            : null
    },
    {
      payload: progress,
      mockSaveImage: options.mockSaveImage ?? false,
      storageKey: STORAGE_KEY,
      loadStatus: options.loadStatus ?? 'ok',
      failNextSave: options.failNextSave ?? false,
      saveDelayMs: options.saveDelayMs ?? 0,
    },
  )
}

/** Seed mock progress; call before navigating to the app. Resets stored progress when using `/?e2eReset=1`. */
export async function primeProgressSeed(page: Page, progress: Record<string, unknown>, options?: SeedProgressOptions) {
  await seedProgress(page, progress, options)
  await page.goto('/?e2eReset=1')
}

/** Dismiss non-blocking hints that can intercept Playwright clicks. */
export async function dismissE2eOverlays(page: Page) {
  const gotIt = page.getByRole('button', { name: /got it/i })
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click()
  }
}
