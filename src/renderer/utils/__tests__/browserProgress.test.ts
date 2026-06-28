import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveProgressToBrowser,
  loadProgressFromBrowser,
  clearProgressFromBrowser,
} from '../browserProgress'

beforeEach(() => {
  localStorage.clear()
})

describe('browserProgress', () => {
  it('saves and loads progress round-trip', () => {
    const data = { completedToday: [1, 2], lastDailyQuestDate: '2026-05-17' }
    expect(saveProgressToBrowser(data)).toBe(true)
    expect(loadProgressFromBrowser()).toEqual(data)
  })

  it('returns null when empty', () => {
    expect(loadProgressFromBrowser()).toBeNull()
  })

  it('clears stored progress', () => {
    saveProgressToBrowser({ completedQuests: [] })
    expect(clearProgressFromBrowser()).toBe(true)
    expect(loadProgressFromBrowser()).toBeNull()
  })

  it('rejects payloads over 4MB', () => {
    const huge = { blob: 'x'.repeat(4 * 1024 * 1024 + 1) }
    expect(saveProgressToBrowser(huge)).toBe(false)
  })
})
