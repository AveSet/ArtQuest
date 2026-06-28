import { describe, expect, it } from 'vitest'
import { parseProgressPayload } from '../../../shared/progressSchema'
import { buildProgressData } from '../progressService'

describe('progressService', () => {
  it('builds a progress payload accepted by the shared schema', () => {
    const payload = buildProgressData()
    const parsed = parseProgressPayload(payload)

    expect(parsed.success).toBe(true)
  })
})
