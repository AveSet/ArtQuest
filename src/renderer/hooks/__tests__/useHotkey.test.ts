import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHotkey } from '../useHotkey'

describe('useHotkey', () => {
  it('calls handler when key matches', () => {
    const handler = vi.fn()
    renderHook(() => useHotkey('Escape', handler))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(handler).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when disabled', () => {
    const handler = vi.fn()
    renderHook(() => useHotkey('Escape', handler, { enabled: false }))

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(handler).not.toHaveBeenCalled()
  })
})
