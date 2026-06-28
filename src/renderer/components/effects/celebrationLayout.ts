import type { CSSProperties } from 'react'

/** Deterministic pseudo-random in [0, 1) from index (stable across renders). */
function unit(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type ScreenSparkSpec = {
  key: number
  style: CSSProperties
}

export function buildQuestScreenSparks(count: number): ScreenSparkSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const u = unit(i, 1)
    const v = unit(i, 2)
    const w = unit(i, 3)
    return {
      key: i,
      style: {
        '--spark-x': `${8 + u * 84}%`,
        '--spark-y': `${10 + v * 72}%`,
        '--spark-size': `${3 + Math.floor(w * 3)}px`,
        '--spark-delay': `${0.06 + u * 0.55}s`,
        '--spark-dx': `${(u - 0.5) * 28}px`,
        '--spark-dy': `${-8 - v * 22}px`,
      } as CSSProperties,
    }
  })
}

export function buildPortraitSparks(count: number): ScreenSparkSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const u = unit(i, 4)
    const v = unit(i, 5)
    return {
      key: i,
      style: {
        '--p-spark-x': `${18 + u * 64}%`,
        '--p-spark-y': `${22 + v * 56}%`,
        '--p-spark-size': `${2 + (i % 3)}px`,
        '--p-spark-delay': `${0.1 + u * 0.4}s`,
      } as CSSProperties,
    }
  })
}

export function buildLevelUpShards(count: number): ScreenSparkSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const u = unit(i, 6)
    const spread = 8 + u * 84
    return {
      key: i,
      style: {
        '--shard-x': `${spread}%`,
        '--shard-base': `${6 + unit(i, 7) * 6}%`,
        '--shard-w': `${2 + (i % 2)}px`,
        '--shard-h': `${8 + (i % 4) * 3}px`,
        '--shard-rot': `${-18 + u * 36}deg`,
        '--shard-rise': `${-3.2 - unit(i, 8) * 4.5}rem`,
        '--shard-delay': `${0.04 + u * 0.35}s`,
      } as CSSProperties,
    }
  })
}

export function buildLevelUpOrbits(count: number): ScreenSparkSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const u = unit(i, 9)
    return {
      key: i,
      style: {
        '--orbit-start': `${u * 360}deg`,
        '--orbit-r': `${4.5 + unit(i, 10) * 3}rem`,
        '--orbit-size': `${4 + (i % 3)}px`,
        '--orbit-delay': `${0.08 + u * 0.25}s`,
      } as CSSProperties,
    }
  })
}
