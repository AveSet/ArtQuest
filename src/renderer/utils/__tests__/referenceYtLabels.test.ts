import { describe, it, expect } from 'vitest'
import { getReferenceYoutubeButtonLabels } from '../referenceYtLabels'

describe('getReferenceYoutubeButtonLabels', () => {
  it('returns localized compact labels', () => {
    expect(getReferenceYoutubeButtonLabels('en')).toEqual({ long: 'YT Long videos', short: 'YT Shorts' })
    expect(getReferenceYoutubeButtonLabels('ru')).toEqual({ long: 'YT Длинные', short: 'YT Короткие' })
  })
})
