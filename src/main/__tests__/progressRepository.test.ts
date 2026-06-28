import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'userData') {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'artquest-db-test-'))
        tempDirs.push(dir)
        return dir
      }
      return os.tmpdir()
    },
  },
}))

describe('progressRepository', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true })
      } catch {
        // SQLite may still hold the WAL on Windows.
      }
    }
  })

  it('saveFullProgressAtomic writes chunks and snapshot without nested transaction errors', async () => {
    const { saveFullProgressAtomic, loadProgressSnapshot, loadProgressChunks } = await import(
      '../db/progressRepository'
    )

    const payload = {
      schemaVersion: 23,
      completedQuests: [1],
      completedToday: [],
      dailyQuestsIds: [],
      settings: { language: 'en' },
    } as Record<string, unknown>

    expect(() => saveFullProgressAtomic(payload, Date.now())).not.toThrow()

    const snapshot = loadProgressSnapshot()
    expect(snapshot?.completedQuests).toEqual([1])

    const chunks = loadProgressChunks()
    expect(Object.keys(chunks).length).toBeGreaterThan(0)
  })
})
