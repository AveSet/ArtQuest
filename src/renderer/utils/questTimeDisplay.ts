import type { PersonalizedQuestMinutes } from '@/utils/questPersonalizedTime'

export function formatQuestMinutesLabel(
  personalized: PersonalizedQuestMinutes | null | undefined,
  minutesLabel: string,
): string {
  if (!personalized) return `— ${minutesLabel}`
  if (!personalized.isPersonalized) {
    return `${personalized.minutes} ${minutesLabel}`
  }
  return `${personalized.minutes} ${minutesLabel}`
}

export function formatQuestMinutesSubLabel(
  personalized: PersonalizedQuestMinutes | null | undefined,
  typicalLabel: string,
  minutesLabel: string,
): string | null {
  if (!personalized?.isPersonalized) return null
  return `${typicalLabel}: ${personalized.catalogMinutes} ${minutesLabel}`
}
