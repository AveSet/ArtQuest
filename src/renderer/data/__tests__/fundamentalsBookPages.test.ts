import { describe, it, expect } from 'vitest'
import {
  FUNDAMENTALS_EXERCISES,
  FUNDAMENTALS_TRACK_NOVICE_B_ID,
  getFundamentalsBookPageNumbers,
} from '../fundamentalsExercises'
import { FUNDAMENTALS_BOOK_PAGES } from '../fundamentalsBookPages'

describe('fundamentals book pages', () => {
  it('maps selected exercises to reference pages', () => {
    expect(FUNDAMENTALS_BOOK_PAGES[1]).toEqual([7])
    expect(FUNDAMENTALS_BOOK_PAGES[2]).toEqual([8])
    expect(FUNDAMENTALS_BOOK_PAGES[25]).toEqual([75])
    expect(FUNDAMENTALS_BOOK_PAGES[4]).not.toContain(4) // FAQ page
  })

  it('maps cube grid and cylinders to two reference pages each', () => {
    expect(FUNDAMENTALS_BOOK_PAGES[7]).toEqual([15, 16])
    expect(FUNDAMENTALS_BOOK_PAGES[8]).toEqual([18, 19])
  })

  it('exposes book pages on novice track phases', () => {
    const noviceTrack = FUNDAMENTALS_EXERCISES[0]!
    expect(noviceTrack.trackPhases?.[0]?.bookPages).toEqual([7])
    expect(getFundamentalsBookPageNumbers(noviceTrack, 0)).toEqual([7])
    expect(noviceTrack.title.ru).toContain('Новичок')
  })

  it('exposes reference pages on novice part 2 global phases', () => {
    const novicePart2 = FUNDAMENTALS_EXERCISES.find(
      (exercise) => exercise.id === FUNDAMENTALS_TRACK_NOVICE_B_ID,
    )!

    expect(novicePart2.trackPhases?.[0]?.phaseIndex).toBe(6)
    expect(getFundamentalsBookPageNumbers(novicePart2, 6)).toEqual([15, 16])
    expect(getFundamentalsBookPageNumbers(novicePart2, 7)).toEqual([18, 19])
  })
})
