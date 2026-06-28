import { describe, it, expect } from 'vitest'
import { CONTEXTUAL_HINTS } from '../contextualHints'

describe('contextualHints', () => {
  it('uses valid app routes for hint actions', () => {
    const streakHint = CONTEXTUAL_HINTS.find((h) => h.id === 'streak_recovery_available')
    expect(streakHint?.action?.route).toBe('/quests')
    expect(streakHint?.action?.route).not.toContain('/daily')
  })
})
