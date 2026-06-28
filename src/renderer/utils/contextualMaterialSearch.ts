import type { QuestCategory } from '@/data/skillTree'
import type { Language } from '@/i18n/translations'
import { expandTitleTokens } from '@/utils/questTitleSynonyms'
import type { NodeYoutubeSearchInput } from '@/utils/nodeYoutubeSearchQueries'

export type ContextualSearchTitle = { en: string; ru?: string; zh?: string; ja?: string; ko?: string }

export type ContextualMaterialInput = {
  questTitle?: ContextualSearchTitle | null
  node: NodeYoutubeSearchInput | null
  preferredTags: string[]
  tag: string | null
  search: string
  category: QuestCategory | 'all'
  lang?: Language
}

const MAX_SUBJECT_TERMS = 4
const MAX_QUERY_WORDS = 6

/** Meta / pedagogy tags — not useful as external search keywords. */
const META_TAGS = new Set([
  'reference',
  'accuracy',
  'novice',
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'both',
  'digital',
  'traditional',
  'tablet',
  'pencil',
  'timed',
  'warmup',
  'polish',
  'core',
  'fundamentals',
  'basics',
  'practice',
  'study',
  'exercise',
  'drill',
  'repeatable',
  'review',
  'portfolio',
  'without',
  'allowed',
  'restriction',
  'quality',
  'speed',
  'layered',
  'frame',
  'chart',
  'pipeline',
  'optimization',
  'performance',
  'compositing',
  'direction',
  'focus',
  'control',
  'cinematic',
  'scale',
  'drama',
  'procedural',
  'real-time',
  'atmospheric',
  'secondary',
  'particles',
  'deformation',
  'volume',
  'preservation',
  'readability',
  'timing',
  'impact',
  'climax',
  'maximum',
  'observed',
  'simplification',
])

const TITLE_STOP = new Set([
  'draw',
  'drawing',
  'sketch',
  'paint',
  'painting',
  'make',
  'create',
  'complete',
  'design',
  'build',
  'show',
  'keep',
  'capture',
  'reproduce',
  'accurately',
  'without',
  'simplification',
  'allowed',
  'pencil',
  'tablet',
  'reference',
  'references',
  'from',
  'with',
  'the',
  'and',
  'for',
  'your',
  'this',
  'that',
  'shape',
  'form',
  'main',
  'step',
  'exercise',
  'quest',
  'described',
  'observed',
  'effect',
  'effects',
  'scene',
  'shot',
  'frame',
  'frames',
  'minute',
  'minutes',
  'hour',
  'hours',
  'total',
  'pace',
  'yourself',
  'target',
  'studies',
  'нарисуй',
  'нарисовать',
  'сделай',
  'выполни',
  'воспроизведи',
  'точно',
  'форма',
  'форму',
  'формы',
  'описания',
  'упражнения',
  'референсу',
  'референс',
  'референса',
  'можно',
  'планшет',
  'карандаш',
  'без',
  'для',
  'этого',
  'главную',
  'часть',
  'описание',
  'наблюдаемый',
  'упрощений',
])

const CATEGORY_ANCHOR: Record<QuestCategory, string> = {
  drawing: 'drawing',
  anatomy: 'anatomy',
  animation: 'animation',
  effects: 'effects',
  storytelling: 'storyboard',
  character_design: 'character',
  environment: 'environment',
}

export type ContextualMaterialSite = 'pinterest' | 'sketchfab' | 'clipTips' | 'youtube'

const SITE_SUFFIX: Record<ContextualMaterialSite, string> = {
  pinterest: 'art reference',
  sketchfab: '3d model',
  clipTips: 'tutorial',
  youtube: 'tutorial',
}

const ENGLISH_TOKEN = /^[a-z][a-z0-9-]*$/i

function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9-]/gi, '')
    .trim()
}

function extractQuotedPhrases(title: string): string[] {
  const out: string[] = []
  const patterns = [
    /[«“"]([^»”"]+)[»”"]/gu,
    /'([^']+)'/g,
  ]
  for (const re of patterns) {
    for (const m of title.matchAll(re)) {
      const phrase = m[1]?.trim()
      if (phrase) out.push(phrase)
    }
  }
  return out
}

function tokenizeTitle(title: string): string[] {
  const quoted = extractQuotedPhrases(title)
  const stripped = quoted.reduce((t, q) => t.replace(q, ' '), title)
  const raw = `${quoted.join(' ')} ${stripped}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-zа-яё0-9]+/iu)
    .map(normalizeToken)
    .filter((w) => w.length >= 3 && !TITLE_STOP.has(w))
  return [...new Set(raw)]
}

function pickEnglishSubjectTokens(title: ContextualSearchTitle | null | undefined): string[] {
  if (!title) return []
  const en = title.en?.trim()
  if (en) return tokenizeTitle(en)
  const ru = title.ru?.trim()
  if (!ru) return []
  const ruTokens = tokenizeTitle(ru)
  const expanded = expandTitleTokens(ruTokens)
  const englishLike = [...expanded].filter((t) => ENGLISH_TOKEN.test(t) && !TITLE_STOP.has(t))
  return englishLike.length > 0 ? englishLike : ruTokens
}

function isSemanticTag(tag: string): boolean {
  const t = normalizeToken(tag)
  if (!t || t.length < 3) return false
  if (META_TAGS.has(t)) return false
  return true
}

function categoryAnchor(category: QuestCategory | 'all'): string | null {
  if (category === 'all') return null
  return CATEGORY_ANCHOR[category] ?? category.replace(/_/g, ' ')
}

function maybeAddMagicBoost(terms: string[]): string[] {
  const lower = terms.map((t) => t.toLowerCase())
  const magical = ['energy', 'shield', 'spell', 'magic', 'glow', 'aura', 'lightning', 'fire', 'flame']
  if (magical.some((m) => lower.some((t) => t.includes(m))) && !lower.includes('magic')) {
    return [...terms, 'magic']
  }
  return terms
}

/** Core subject keywords derived from quest title, skill node, and semantic tags. */
export function extractContextualSubjectTerms(input: ContextualMaterialInput): string[] {
  const manual = (input.search ?? '').trim()
  if (manual) {
    return manual.split(/\s+/).slice(0, MAX_SUBJECT_TERMS)
  }

  const terms: string[] = []
  const seen = new Set<string>()
  const add = (raw: string | undefined | null) => {
    const t = normalizeToken(String(raw ?? ''))
    if (!t || t.length < 3 || TITLE_STOP.has(t) || seen.has(t)) return
    seen.add(t)
    terms.push(t)
  }

  for (const t of pickEnglishSubjectTokens(input.questTitle)) add(t)

  if (input.tag && isSemanticTag(input.tag)) add(input.tag)

  for (const t of input.preferredTags ?? []) {
    if (isSemanticTag(t)) add(t)
  }

  if (input.node) {
    for (const t of input.node.tags.slice(0, 3)) {
      if (isSemanticTag(t)) add(t)
    }
    const nodeTitle = input.node.title.en?.trim()
    if (terms.length < 2 && nodeTitle) {
      for (const t of tokenizeTitle(nodeTitle).slice(0, 2)) add(t)
    }
  }

  const anchor = categoryAnchor(input.category)
  const boosted = maybeAddMagicBoost(terms)
  const withoutAnchorDup = anchor
    ? boosted.filter((t) => t !== anchor)
    : boosted

  const subject = withoutAnchorDup.slice(0, MAX_SUBJECT_TERMS)
  if (anchor && !subject.includes(anchor)) {
    return [anchor, ...subject].slice(0, MAX_SUBJECT_TERMS + 1)
  }
  return subject.slice(0, MAX_SUBJECT_TERMS + 1)
}

function trimQueryWords(parts: string[], site?: ContextualMaterialSite): string {
  const suffix = site ? SITE_SUFFIX[site] : ''
  const suffixTokens = suffix ? suffix.split(/\s+/) : []
  const maxParts = site ? Math.max(2, MAX_QUERY_WORDS - suffixTokens.length) : MAX_QUERY_WORDS
  const core = parts.slice(0, maxParts)
  if (!suffix) return core.join(' ')
  const lower = core.join(' ').toLowerCase()
  if (suffixTokens.every((t) => lower.includes(t))) return core.join(' ')
  return `${core.join(' ')} ${suffix}`.replace(/\s+/g, ' ').trim()
}

/** One keyword for Sketchfab (3D models) — prefer the subject after ":" in the quest title. */
export function extractSketchfabSearchWord(input: ContextualMaterialInput): string {
  const manual = (input.search ?? '').trim().split(/\s+/).filter(Boolean)[0]
  if (manual) return manual

  const afterColonEn = input.questTitle?.en?.split(':').pop()?.trim()
  if (afterColonEn) {
    const skip = new Set(['the', 'non', 'destructive', 'curves', 'levels'])
    const tokens = tokenizeTitle(afterColonEn)
    const hit = tokens.find((t) => !skip.has(t))
    if (hit) return hit
  }

  const afterColonRu = input.questTitle?.ru?.split(':').pop()?.trim()
  if (afterColonRu) {
    const raw = afterColonRu
      .replace(/[«»"()]/g, '')
      .split(/\s+/)[0]
      ?.trim()
    if (raw) {
      let normalized = raw.toLowerCase()
      if (/[а-яё]$/iu.test(normalized) && normalized.length > 4 && normalized.endsWith('а')) {
        normalized = normalized.slice(0, -1)
      }
      const expanded = expandTitleTokens([normalized, raw.toLowerCase()])
      const en = [...expanded].find((t) => ENGLISH_TOKEN.test(t) && t.length >= 4 && !TITLE_STOP.has(t))
      if (en) return en
      if (normalized.length >= 3) return normalized
    }
  }

  const terms = extractContextualSubjectTerms(input)
  const last = terms[terms.length - 1] ?? terms[0]
  return last || 'model'
}

/** Single best query string for an external site or YouTube. */
export function buildContextualMaterialSearchQuery(
  input: ContextualMaterialInput,
  site?: ContextualMaterialSite,
): string {
  if (site === 'sketchfab') {
    return extractSketchfabSearchWord(input)
  }

  const subject = extractContextualSubjectTerms(input)
  if (subject.length === 0) {
    if (site === 'clipTips') return trimQueryWords(['drawing'], site)
    return site === 'pinterest' ? 'drawing art reference' : 'drawing tutorial'
  }
  return trimQueryWords(subject, site)
}

/** A few alternate queries for catalog cards (short, no duplicates). */
export function buildContextualMaterialSearchQueries(
  input: ContextualMaterialInput,
  site?: ContextualMaterialSite,
): string[] {
  if (site === 'sketchfab') {
    const word = extractSketchfabSearchWord(input)
    return word ? [word] : ['model']
  }

  const primary = buildContextualMaterialSearchQuery(input, site)
  const subject = extractContextualSubjectTerms(input)
  const out: string[] = []
  const add = (q: string) => {
    const trimmed = q.replace(/\s+/g, ' ').trim()
    if (trimmed && !out.includes(trimmed)) out.push(trimmed)
  }

  add(primary)
  if (subject.length > 0) add(subject.join(' '))
  if (site) {
    const withoutSuffix = trimQueryWords(subject, undefined)
    if (withoutSuffix) add(withoutSuffix)
  }

  return out.slice(0, 3)
}
