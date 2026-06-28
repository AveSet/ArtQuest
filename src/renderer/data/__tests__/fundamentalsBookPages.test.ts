import { describe, it, expect } from 'vitest'
import { FUNDAMENTALS_EXERCISES, getFundamentalsBookPageNumbers } from '../fundamentalsExercises'
import { FUNDAMENTALS_BOOK_PAGES } from '../fundamentalsBookPages'

describe('fundamentals book pages', () => {
  it('maps each exercise to its primary instruction page only', () => {
    expect(FUNDAMENTALS_BOOK_PAGES[1]).toEqual([7])
    expect(FUNDAMENTALS_BOOK_PAGES[2]).toEqual([8])
    expect(FUNDAMENTALS_BOOK_PAGES[25]).toEqual([75])
    expect(FUNDAMENTALS_BOOK_PAGES[4]).not.toContain(4) // FAQ page
  })

  it('exposes book pages on novice track phases', () => {
    const noviceTrack = FUNDAMENTALS_EXERCISES[0]!
    expect(noviceTrack.trackPhases?.[0]?.bookPages).toEqual([7])
    expect(getFundamentalsBookPageNumbers(noviceTrack, 0)).toEqual([7])
    expect(noviceTrack.title.ru).toContain('Новичок')
  })
})
