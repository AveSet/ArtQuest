import type { Translations } from '@/i18n/translations'
import { translations } from '@/i18n/translations'

type SessionRitualCopy = NonNullable<Translations['sessionRitual']>

const EN_DEFAULTS = translations.en.sessionRitual!

export function getSessionRitual(t: Translations): Required<SessionRitualCopy> {
  return { ...EN_DEFAULTS, ...t.sessionRitual } as Required<SessionRitualCopy>
}
