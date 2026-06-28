import { describe, expect, it } from 'vitest'
import { assertProgressFieldRegistryComplete } from '../progressFieldRegistry'

describe('progressFieldRegistry', () => {
  it('maps every PROGRESS_FIELD_KEYS entry into a progress chunk', () => {
    const missing = assertProgressFieldRegistryComplete()
    expect(missing).toEqual([])
  })
})
