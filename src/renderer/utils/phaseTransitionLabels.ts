export type PhaseTransitionKey = 'warmup' | 'core' | 'polish'

export function inferPhaseTransitionKey(challengeId: string): PhaseTransitionKey | null {
  const id = challengeId.toLowerCase()
  if (id.includes('warmup')) return 'warmup'
  if (id.includes('core')) return 'core'
  if (id.includes('polish')) return 'polish'
  return null
}

export function phaseLabelForKey(
  key: PhaseTransitionKey,
  ritual: Record<string, string>,
): string {
  if (key === 'warmup') return ritual.phaseWarmupDone ?? ''
  if (key === 'core') return ritual.phaseCoreStart ?? ''
  return ritual.phasePolishStart ?? ''
}
