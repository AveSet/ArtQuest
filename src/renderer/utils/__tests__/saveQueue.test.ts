import { describe, expect, it, vi, beforeEach } from 'vitest'
import { enqueueSave, resetSaveQueueForTests } from '@/utils/saveQueue'

describe('saveQueue', () => {
  beforeEach(() => {
    resetSaveQueueForTests()
  })

  it('serializes overlapping save tasks in order', async () => {
    const order: number[] = []
    const first = enqueueSave(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      order.push(1)
      return true
    })
    const second = enqueueSave(async () => {
      order.push(2)
      return true
    })
    await Promise.all([first, second])
    expect(order).toEqual([1, 2])
  })

  it('continues the chain after a failed task', async () => {
    const spy = vi.fn()
    await enqueueSave(async () => {
      spy('first')
      return false
    })
    await enqueueSave(async () => {
      spy('second')
      return true
    })
    expect(spy.mock.calls).toEqual([['first'], ['second']])
  })
})
