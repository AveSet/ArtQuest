import { _electron as electron, expect, test } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BUILD_DIR =
  process.env.ARTQUEST_PACKAGED_DIR ??
  path.join('dist-build-2026-07-01-regression-fixes-v4', 'win-unpacked')
const EXECUTABLE = path.join(BUILD_DIR, 'ArtQuest.exe')

function packagedExeExists(): boolean {
  return fs.existsSync(EXECUTABLE)
}

async function launchPackagedApp() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artquest-packaged-'))
  const app = await electron.launch({
    executablePath: EXECUTABLE,
    env: {
      ...process.env,
      ARTQUEST_E2E_USER_DATA: userDataDir,
    },
  })
  const page = await app.firstWindow()
  return { app, userDataDir, page }
}

async function dismissOverlays(page: Awaited<ReturnType<typeof launchPackagedApp>>['page']) {
  const gotIt = page.getByRole('button', { name: /got it|понятно/i })
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click()
  }
}

test.describe('packaged regression', () => {
  test.beforeEach(({ }, testInfo) => {
    if (!packagedExeExists()) {
      testInfo.skip(true, `Packaged exe not found: ${EXECUTABLE}`)
    }
  })

  test('exposes flat and namespaced electronAPI in win-unpacked', async () => {
    const { app, userDataDir, page } = await launchPackagedApp()
    try {
      await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
        timeout: 45_000,
      })
      await dismissOverlays(page)

      const apiShape = await page.evaluate(() => {
        const api = window.electronAPI as Record<string, unknown> | undefined
        return {
          hasApi: Boolean(api),
          isDesktop: api?.isDesktop === true,
          flat: {
            loadProgress: typeof api?.loadProgress === 'function',
            showItemInFolder: typeof api?.showItemInFolder === 'function',
            getStorageMode: typeof api?.getStorageMode === 'function',
            openReferenceWindow: typeof api?.openReferenceWindow === 'function',
            openSessionOverlay: typeof api?.openSessionOverlay === 'function',
            onWindowBoundsReport: typeof api?.onWindowBoundsReport === 'function',
          },
          namespaced: {
            progressLoad: typeof (api?.progress as { load?: unknown } | undefined)?.load === 'function',
            cloudGetMode: typeof (api?.cloud as { getMode?: unknown } | undefined)?.getMode === 'function',
            galleryListImages:
              typeof (api?.gallery as { listImages?: unknown } | undefined)?.listImages === 'function',
            desktopOnBounds:
              typeof (api?.desktop as { onWindowBoundsReport?: unknown } | undefined)
                ?.onWindowBoundsReport === 'function',
            referenceOpen: typeof (api?.reference as { open?: unknown } | undefined)?.open === 'function',
          },
        }
      })

      expect(apiShape.hasApi).toBe(true)
      expect(apiShape.isDesktop).toBe(true)
      expect(apiShape.flat.loadProgress).toBe(true)
      expect(apiShape.flat.showItemInFolder).toBe(true)
      expect(apiShape.flat.getStorageMode).toBe(true)
      expect(apiShape.flat.openReferenceWindow).toBe(true)
      expect(apiShape.namespaced.progressLoad).toBe(true)
      expect(apiShape.namespaced.cloudGetMode).toBe(true)
      expect(apiShape.namespaced.galleryListImages).toBe(true)
      expect(apiShape.namespaced.desktopOnBounds).toBe(true)
      expect(apiShape.namespaced.referenceOpen).toBe(true)
    } finally {
      await app.close()
      fs.rmSync(userDataDir, { recursive: true, force: true })
    }
  })

  test('settings shows storage section on desktop runtime', async () => {
    const { app, userDataDir, page } = await launchPackagedApp()
    try {
      await expect(page.locator('#main-content, .container-fantasy').first()).toBeVisible({
        timeout: 45_000,
      })
      await dismissOverlays(page)
      await page.evaluate(() => {
        window.location.hash = '#/settings'
      })
      await expect(page.getByTestId('settings-storage')).toBeVisible({ timeout: 20_000 })
    } finally {
      await app.close()
      fs.rmSync(userDataDir, { recursive: true, force: true })
    }
  })
})
