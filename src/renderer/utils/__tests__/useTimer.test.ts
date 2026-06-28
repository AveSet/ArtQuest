import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with given minutes in countdown mode', () => {
    const { result } = renderHook(() => useTimer(5))
    expect(result.current.minutes).toBe(5)
    expect(result.current.seconds).toBe(0)
    expect(result.current.display).toBe('05:00')
    expect(result.current.isActive).toBe(false)
  })

  it('initializes with zero in countup mode', () => {
    const { result } = renderHook(() => useTimer(0, undefined, 'countup'))
    expect(result.current.minutes).toBe(0)
    expect(result.current.seconds).toBe(0)
    expect(result.current.display).toBe('00:00')
  })

  it('counts down when started', () => {
    const { result } = renderHook(() => useTimer(1))
    act(() => { result.current.start() })
    expect(result.current.isActive).toBe(true)

    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.seconds).toBe(59)
    expect(result.current.display).toBe('00:59')
  })

  it('counts up in countup mode', () => {
    const { result } = renderHook(() => useTimer(0, undefined, 'countup'))
    act(() => { result.current.start() })
    expect(result.current.isActive).toBe(true)

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.seconds).toBe(2)
  })

  it('stops and resets when stop() is called', () => {
    const { result } = renderHook(() => useTimer(5))
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(3000) })
    act(() => { result.current.stop() })
    expect(result.current.isActive).toBe(false)
    expect(result.current.display).toBe('05:00')
  })

  it('stop() respects setTime() changes', () => {
    const { result } = renderHook(() => useTimer(10))
    act(() => { result.current.setTime(3) })
    expect(result.current.display).toBe('03:00')

    act(() => { result.current.stop() })
    expect(result.current.display).toBe('03:00')
  })

  it('pause stops the timer', () => {
    const { result } = renderHook(() => useTimer(2))
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    act(() => { result.current.pause() })
    expect(result.current.isActive).toBe(false)

    const displayAfter = result.current.display
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.display).toBe(displayAfter)
  })

  it('setTime updates the timer and stop uses new value', () => {
    const { result } = renderHook(() => useTimer(10))
    act(() => { result.current.setTime(7) })
    expect(result.current.display).toBe('07:00')
    act(() => { result.current.stop() })
    expect(result.current.display).toBe('07:00')
  })

  it('calls onExpire when countdown reaches 0', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer(0.0167, onExpire)) // ~1 sec

    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(2000) })

    expect(result.current.isActive).toBe(false)
    expect(onExpire).toHaveBeenCalled()
  })
})
