import { describe, it, expect } from 'vitest'
import {
  buildPracticeStreakGraceDays,
  calculateCurrentStreak,
  calculateBestStreak,
} from '../streakCalculations'

describe('streakCalculations', () => {
  it('counts consecutive practice days', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    expect(
      calculateCurrentStreak([
        `${todayStr}T12:00:00.000Z`,
        `${yStr}T12:00:00.000Z`,
      ]),
    ).toBe(2)
  })

  it('bridges a gap with shield grace day', () => {
    const grace = buildPracticeStreakGraceDays({ lastShieldUsedOnDate: '2026-05-09' })
    expect(
      calculateBestStreak(
        ['2026-05-08T12:00:00.000Z', '2026-05-10T12:00:00.000Z'],
        grace,
      ),
    ).toBe(3)
  })
})
