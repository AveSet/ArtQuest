import { useUIStore } from '@/store/useUIStore'
import type { QuestCategory } from '@/data/skillTree'

let sharedAudioContext: AudioContext | null = null

export type SoundType =
  | 'levelup'
  | 'complete'
  | 'questStart'
  | 'achievement'
  | 'dailyComplete'
  | 'weeklyComplete'
  | 'uiTap'
  | 'panelOpen'
  | 'microComplete'
  | 'pathUnlock'
  | 'itemSelect'
  | 'rewardReveal'
  | 'focusLow'
  | 'transitionSweep'
  | 'craft'
  | 'questAbandon'
  | 'sessionReady'

const SOUND_FILES: SoundType[] = [
  'levelup',
  'complete',
  'questStart',
  'achievement',
  'dailyComplete',
  'weeklyComplete',
  'uiTap',
  'panelOpen',
  'microComplete',
  'pathUnlock',
  'itemSelect',
  'rewardReveal',
  'focusLow',
  'transitionSweep',
  'craft',
  'questAbandon',
  'sessionReady',
]

const bufferCache = new Map<SoundType, AudioBuffer | 'missing'>()
const bufferLoadPromises = new Map<SoundType, Promise<AudioBuffer | null>>()

function soundAssetUrl(type: SoundType): string {
  const base = import.meta.env.BASE_URL ?? './'
  const normalized = base.endsWith('/') ? base : `${base}/`
  const rel = `${normalized}sounds/${type}.wav`.replace(/([^:]\/)\/+/g, '$1')
  if (typeof window !== 'undefined' && window.location?.href) {
    try {
      return new URL(rel, window.location.href).href
    } catch {
      return rel
    }
  }
  return rel
}

function getAudioContext(): AudioContext | null {
  if (sharedAudioContext) {
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {})
    }
    return sharedAudioContext
  }
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    sharedAudioContext = new AudioContextClass()
    return sharedAudioContext
  } catch {
    return null
  }
}

export function ensureAudioContext(): void {
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {})
  } else if (!sharedAudioContext) {
    getAudioContext()
  }
}

export function getSharedAudioContext(): AudioContext | null {
  return getAudioContext()
}

function motionScale(): number {
  const { reduceMotion } = useUIStore.getState().settings
  return reduceMotion ? 0.35 : 1
}

function isReduceMotion(): boolean {
  return useUIStore.getState().settings.reduceMotion
}

/** Shorter gaps and lower layered volume when reduce motion is on. */
function celebrationTimingScale(): number {
  return isReduceMotion() ? 0.4 : 1
}

function effectiveVolume(base: number): number {
  return base * motionScale()
}

function categoryPitchMul(category?: QuestCategory | string): number {
  switch (category) {
    case 'drawing':
      return 1
    case 'anatomy':
      return 0.92
    case 'animation':
      return 1.08
    case 'effects':
      return 1.14
    case 'storytelling':
      return 0.96
    case 'character_design':
      return 1.04
    case 'environment':
      return 1.02
    default:
      return 1
  }
}

async function loadSoundBuffer(ctx: AudioContext, type: SoundType): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(type)
  if (cached === 'missing') return null
  if (cached) return cached
  const pending = bufferLoadPromises.get(type)
  if (pending) return pending

  const url = soundAssetUrl(type)
  const load = (async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        bufferCache.set(type, 'missing')
        return null
      }
      const data = await res.arrayBuffer()
      const decoded = await ctx.decodeAudioData(data.slice(0))
      bufferCache.set(type, decoded)
      return decoded
    } catch {
      bufferCache.set(type, 'missing')
      return null
    } finally {
      bufferLoadPromises.delete(type)
    }
  })()
  bufferLoadPromises.set(type, load)
  return load
}

function playSample(
  ctx: AudioContext,
  buffer: AudioBuffer,
  volume: number,
  playbackRate: number,
): void {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = Math.max(0.5, Math.min(2, playbackRate))
  const gain = ctx.createGain()
  gain.gain.value = Math.min(1, Math.max(0, volume))
  src.connect(gain)
  gain.connect(ctx.destination)
  src.start()
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
): void {
  const scale = motionScale()
  const dur = Math.max(0.03, duration * scale)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = frequency
  osc.type = type
  const v = Math.min(1, Math.max(0, volume))
  gain.gain.setValueAtTime(v, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + dur)
}

function playHarmonicLayer(ctx: AudioContext, baseHz: number, duration: number, volume: number): void {
  playTone(ctx, baseHz * 2, duration, volume * 0.22, 'triangle')
}

function scheduleTone(
  ctx: AudioContext,
  delayMs: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
): void {
  if (typeof window === 'undefined') return
  window.setTimeout(() => playTone(ctx, frequency, duration, volume, type), delayMs)
}

function playAchievementFanfare(ctx: AudioContext, vol: number, m: number, scale: number): void {
  if (isReduceMotion()) {
    playTone(ctx, 659.25 * m, 0.09, vol * 0.85, 'triangle')
    return
  }
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((hz, i) => {
    scheduleTone(ctx, Math.round(i * 90 * scale), hz * m, i === notes.length - 1 ? 0.22 : 0.12, vol, 'triangle')
    if (i === notes.length - 1) {
      scheduleTone(ctx, Math.round(i * 90 * scale), hz * m, 0.18, vol * 0.35, 'sine')
    }
  })
}

function playDailyCompleteFanfare(ctx: AudioContext, vol: number, m: number, scale: number): void {
  if (isReduceMotion()) {
    playTone(ctx, 554.37 * m, 0.1, vol * 0.9, 'sine')
    return
  }
  playTone(ctx, 440 * m, 0.12, vol, 'sine')
  scheduleTone(ctx, Math.round(120 * scale), 554.37 * m, 0.12, vol * 0.9)
  scheduleTone(ctx, Math.round(240 * scale), 659.25 * m, 0.18, vol)
  playHarmonicLayer(ctx, 659.25 * m, 0.15, vol * 0.5)
}

function playWeeklyCompleteFanfare(ctx: AudioContext, vol: number, m: number, scale: number): void {
  if (isReduceMotion()) {
    playTone(ctx, 587.33 * m, 0.12, vol, 'triangle')
    scheduleTone(ctx, Math.round(80 * scale), 739.99 * m, 0.14, vol * 0.85, 'sine')
    return
  }
  const seq = [392, 493.88, 587.33, 739.99]
  seq.forEach((hz, i) => {
    scheduleTone(ctx, Math.round(i * 110 * scale), hz * m, 0.14, vol * (0.85 + i * 0.04), i % 2 === 0 ? 'triangle' : 'sine')
  })
  scheduleTone(ctx, Math.round(450 * scale), 987.77 * m, 0.35, vol * 1.1, 'sine')
}

function playProceduralSound(type: SoundType, category: QuestCategory | string | undefined, vol: number): void {
  const audioContext = getAudioContext()
  if (!audioContext) return

  const scale = celebrationTimingScale()
  const m = categoryPitchMul(category)
  const v = effectiveVolume(vol)
  const reduced = isReduceMotion()

  if (type === 'levelup') {
    playTone(audioContext, 523.25 * m, reduced ? 0.08 : 0.1, v)
    if (!reduced) {
      playHarmonicLayer(audioContext, 523.25 * m, 0.1, v)
      scheduleTone(audioContext, Math.round(100 * scale), 659.25 * m, 0.1, v)
      scheduleTone(audioContext, Math.round(200 * scale), 783.99 * m, 0.2, v)
    } else {
      scheduleTone(audioContext, Math.round(70 * scale), 783.99 * m, 0.12, v * 0.9)
    }
  } else if (type === 'complete') {
    playTone(audioContext, 523.25 * m, reduced ? 0.1 : 0.15, v)
    if (!reduced) {
      playHarmonicLayer(audioContext, 523.25 * m, 0.12, v)
      scheduleTone(audioContext, Math.round(150 * scale), 659.25 * m, 0.15, v)
      scheduleTone(audioContext, Math.round(300 * scale), 783.99 * m, 0.28, v)
    } else {
      scheduleTone(audioContext, Math.round(90 * scale), 659.25 * m, 0.1, v * 0.85)
    }
  } else if (type === 'questStart') {
    playTone(audioContext, 523.25 * m, 0.1, v * (reduced ? 0.75 : 1))
    if (!reduced) {
      scheduleTone(audioContext, Math.round(100 * scale), 659.25 * m, 0.1, v)
      scheduleTone(audioContext, Math.round(200 * scale), 783.99 * m, 0.15, v)
    }
  } else if (type === 'achievement') {
    playAchievementFanfare(audioContext, v * 1.05, m, scale)
  } else if (type === 'dailyComplete') {
    playDailyCompleteFanfare(audioContext, v, m, scale)
  } else if (type === 'weeklyComplete') {
    playWeeklyCompleteFanfare(audioContext, v, m, scale)
  } else if (type === 'uiTap') {
    const clickVol = v * (reduced ? 0.4 : 0.55)
    playTone(audioContext, 420 * m, 0.05, clickVol, 'triangle')
    if (!reduced) {
      scheduleTone(audioContext, Math.round(40 * scale), 520 * m, 0.04, v * 0.35, 'sine')
    }
  } else if (type === 'panelOpen') {
    playTone(audioContext, 330 * m, 0.06, v * 0.45, 'sine')
    if (!reduced) {
      scheduleTone(audioContext, Math.round(70 * scale), 440 * m, 0.08, v * 0.5, 'triangle')
      scheduleTone(audioContext, Math.round(140 * scale), 554.37 * m, 0.1, v * 0.4, 'sine')
    }
  } else if (type === 'microComplete') {
    playTone(audioContext, 587 * m, 0.06, v * 0.7, 'triangle')
    if (!reduced) {
      scheduleTone(audioContext, Math.round(55 * scale), 784 * m, 0.1, v * 0.55, 'sine')
    }
  } else if (type === 'pathUnlock') {
    playTone(audioContext, 392 * m, 0.1, v * 0.85, 'sine')
    if (reduced) {
      scheduleTone(audioContext, Math.round(60 * scale), 659 * m, 0.12, v, 'triangle')
    } else {
      scheduleTone(audioContext, Math.round(90 * scale), 523 * m, 0.12, v, 'triangle')
      scheduleTone(audioContext, Math.round(180 * scale), 659 * m, 0.2, v * 1.05, 'sine')
      playHarmonicLayer(audioContext, 659 * m, 0.18, v * 0.45)
    }
  } else if (type === 'itemSelect') {
    playTone(audioContext, 180 * m, 0.05, vol * 0.45, 'triangle')
    scheduleTone(audioContext, Math.round(55 * scale), 260 * m, 0.08, vol * 0.35, 'sine')
  } else if (type === 'rewardReveal') {
    playTone(audioContext, 740 * m, 0.05, vol * 0.45, 'triangle')
    scheduleTone(audioContext, Math.round(70 * scale), 988 * m, 0.11, vol * 0.55, 'sine')
  } else if (type === 'focusLow') {
    playTone(audioContext, 140 * m, 0.12, vol * 0.32, 'sine')
  } else if (type === 'transitionSweep') {
    playTone(audioContext, 330 * m, 0.08, vol * 0.55, 'sine')
    scheduleTone(audioContext, Math.round(85 * scale), 660 * m, 0.16, vol * 0.6, 'triangle')
  } else if (type === 'craft') {
    playTone(audioContext, 260 * m, 0.05, vol * 0.45, 'triangle')
    scheduleTone(audioContext, Math.round(50 * scale), 520 * m, 0.08, vol * 0.5, 'triangle')
  } else if (type === 'questAbandon') {
    playTone(audioContext, 294 * m, 0.07, vol * 0.5, 'sine')
    scheduleTone(audioContext, Math.round(55 * scale), 220 * m, 0.1, vol * 0.42, 'triangle')
    scheduleTone(audioContext, Math.round(120 * scale), 165 * m, 0.14, vol * 0.35, 'sine')
  } else if (type === 'sessionReady') {
    playTone(audioContext, 392 * m, 0.05, vol * 0.4, 'triangle')
    scheduleTone(audioContext, Math.round(65 * scale), 523.25 * m, 0.09, vol * 0.48, 'sine')
  }
}

export function preloadSounds(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  for (const type of SOUND_FILES) {
    void loadSoundBuffer(ctx, type)
  }
}

export const playSound = (type: SoundType, category?: QuestCategory | string) => {
  const { soundEnabled, soundVolume } = useUIStore.getState().settings
  if (!soundEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  const vol = effectiveVolume(soundVolume)
  const rate = categoryPitchMul(category) * (isReduceMotion() ? 1.08 : 1)

  void (async () => {
    const buffer = await loadSoundBuffer(ctx, type)
    if (buffer) {
      playSample(ctx, buffer, vol, rate)
    } else {
      playProceduralSound(type, category, soundVolume)
    }
  })()
}

/** Achievement unlock — respects reduceMotion via shorter fanfare. */
export const playAchievementUnlock = (category?: QuestCategory | string) => {
  playSound('achievement', category)
}

/** Short UI click for buttons, toggles, and navigation. */
export const playUiClick = () => {
  const { soundEnabled } = useUIStore.getState().settings
  if (!soundEnabled) return
  playSound('uiTap')
}

/** Maps ritual lifecycle events to sound types for consistent session audio. */
export const SESSION_SOUND_MAP = {
  sessionEnter: 'transitionSweep',
  phaseComplete: 'microComplete',
  debriefConfirm: 'panelOpen',
  dayClose: 'dailyComplete',
  chestReveal: 'rewardReveal',
  focusLow: 'focusLow',
} as const satisfies Record<string, SoundType>

export function playSessionSound(
  event: keyof typeof SESSION_SOUND_MAP,
  category?: QuestCategory | string,
): void {
  playSound(SESSION_SOUND_MAP[event], category)
}
