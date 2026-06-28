import { useState, useRef, useCallback, useEffect } from 'react'

export function useTimer(initialMinutes: number, onExpire?: () => void, mode: 'countdown' | 'countup' = 'countdown') {
  const [totalSec, setTotalSec] = useState(mode === 'countup' ? 0 : initialMinutes * 60)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const expiredFiredRef = useRef(false)
  const currentMinutesRef = useRef(initialMinutes)
  const baseSecRef = useRef(totalSec)
  const modeRef = useRef(mode)
  modeRef.current = mode

  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const syncBaseSec = useCallback(() => {
    baseSecRef.current = modeRef.current === 'countup' ? 0 : currentMinutesRef.current * 60
  }, [])

  const start = useCallback(() => {
    syncBaseSec()
    setIsActive(true)
  }, [syncBaseSec])

  const pause = useCallback(() => { setIsActive(false); clearTimer() }, [clearTimer])
  const stop = useCallback(() => {
    setIsActive(false)
    clearTimer()
    const reset = mode === 'countup' ? 0 : currentMinutesRef.current * 60
    setTotalSec(reset)
    syncBaseSec()
  }, [clearTimer, mode, syncBaseSec])
  const togglePause = useCallback(() => setIsActive(prev => !prev), [])
  const setTime = useCallback((m: number) => {
    currentMinutesRef.current = m
    const val = mode === 'countup' ? 0 : m * 60
    setTotalSec(val)
    expiredFiredRef.current = false
    if (!isActive) syncBaseSec()
    else baseSecRef.current = val
  }, [mode, isActive, syncBaseSec])

  useEffect(() => {
    if (!isActive) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setTotalSec(prev => {
        if (mode === 'countup') return prev + 1
        return Math.max(0, prev - 1)
      })
    }, 1000)

    return clearTimer
  }, [isActive, clearTimer, mode])

  useEffect(() => {
    if (mode === 'countdown' && isActive && totalSec <= 0) {
      setIsActive(false)
      if (!expiredFiredRef.current) {
        expiredFiredRef.current = true
        onExpireRef.current?.()
      }
    }
    if (totalSec > 0) expiredFiredRef.current = false
  }, [totalSec, isActive, mode])

  const baseSec = baseSecRef.current ?? currentMinutesRef.current * 60
  const elapsedSec = mode === 'countup' ? totalSec : Math.max(0, baseSec - Math.min(totalSec, baseSec))

  const elapsedMin = Math.floor(elapsedSec / 60)

  return {
    minutes,
    seconds,
    isActive,
    elapsedMin,
    elapsedSec,
    start,
    pause,
    stop,
    togglePause,
    setTime,
    display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  }
}
