import type { Page } from '@playwright/test'

const STORAGE_KEY = 'artquest-progress'

export type SeedProgressOptions = {
  /** Mock saveImage IPC so quest submit records gallery work in browser E2E. */
  mockSaveImage?: boolean
}

export async function seedProgress(
  page: Page,
  progress: Record<string, unknown>,
  options: SeedProgressOptions = {},
) {
  await page.addInitScript(
    ({ payload, mockSaveImage, storageKey }) => {
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

      const electronAPI: Record<string, unknown> = {
        saveProgress: async (data: string) => {
          absorbSave(data)
          return { success: true }
        },
        saveProgressSync: (data: string) => {
          absorbSave(data)
          return { success: true }
        },
        loadProgress: async () => {
          const raw = localStorage.getItem(storageKey) ?? store.value
          if (!raw) return { status: 'empty' }
          const data = parseObject(raw)
          if (!data) return { status: 'corrupt', message: 'Invalid JSON in E2E progress store' }
          merged = data
          store.value = raw
          return { status: 'ok', data }
        },
        clearProgress: async () => {
          merged = {}
          store.value = '{}'
          localStorage.removeItem(storageKey)
          return { success: true }
        },
        getSavedImages: async () => [],
      }

      if (mockSaveImage) {
        electronAPI.saveImage = async (_base64: string, questId: string) => ({
          success: true,
          path: `e2e-mock/quest-${questId}.png`,
          galleryItemId: `e2e-${questId}`,
          storageMode: 'local',
        })
      }

      ;(window as unknown as { electronAPI: Record<string, unknown> }).electronAPI = electronAPI
      ;(window as unknown as { __E2E_TEST__?: boolean }).__E2E_TEST__ = true
      ;(window as unknown as { __e2eGetSavedProgress?: () => unknown }).__e2eGetSavedProgress =
        () => merged
    },
    { payload: progress, mockSaveImage: options.mockSaveImage ?? false, storageKey: STORAGE_KEY },
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
