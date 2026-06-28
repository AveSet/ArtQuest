import { describe, expect, it } from 'vitest'
import {
  PORTRAIT_CROP_VIEWPORT_SIZE,
  clampPortraitCropTransform,
  getPortraitCoverScale,
  getPortraitDrawRect,
} from '../portraitCrop'

describe('portraitCrop', () => {
  it('uses cover scale so image fills the square viewport', () => {
    expect(getPortraitCoverScale(800, 400, 320)).toBe(0.8)
    expect(getPortraitCoverScale(400, 800, 320)).toBe(0.8)
  })

  it('keeps panned image covering the crop square', () => {
    const clamped = clampPortraitCropTransform(800, 800, PORTRAIT_CROP_VIEWPORT_SIZE, {
      scale: 1,
      offsetX: 200,
      offsetY: -200,
    })
    const draw = getPortraitDrawRect(800, 800, PORTRAIT_CROP_VIEWPORT_SIZE, clamped)
    expect(draw.x).toBeLessThanOrEqual(0)
    expect(draw.y).toBeLessThanOrEqual(0)
    expect(draw.x + draw.width).toBeGreaterThanOrEqual(PORTRAIT_CROP_VIEWPORT_SIZE)
    expect(draw.y + draw.height).toBeGreaterThanOrEqual(PORTRAIT_CROP_VIEWPORT_SIZE)
  })
})
