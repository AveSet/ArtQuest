import { describe, it, expect } from 'vitest'
import { getPortraitImageSources } from '../portraitAssets'

describe('portraitAssets', () => {
  it('returns webp then png fallback paths per gender', () => {
    expect(getPortraitImageSources('male')).toEqual(['./portraits/male.webp', './portraits/male.png'])
    expect(getPortraitImageSources('female')).toEqual(['./portraits/female.webp', './portraits/female.png'])
  })
})
