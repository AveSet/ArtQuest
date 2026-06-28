/** Expand title tokens so catalog matching understands RU/EN equivalents. */
const SYNONYM_GROUPS: string[][] = [
  ['танец', 'танц', 'dance', 'choreograph', 'хореограф'],
  ['анимир', 'animate', 'animation', 'цикл', 'cycle'],
  ['двух', 'двое', 'two', 'couple', 'пара', 'people', 'люди', 'персонаж', 'characters'],
  ['ходьб', 'walk', 'ходьба'],
  ['бег', 'run'],
  ['силуэт', 'silhouette'],
  ['перспектив', 'perspective'],
  ['композици', 'composition'],
  ['матов', 'matte', 'живопись', 'painting'],
  ['эффект', 'effect', 'vfx', 'частиц', 'particle'],
  ['раскадров', 'storyboard'],
  ['диалог', 'dialogue', 'сцена', 'scene'],
  ['портфолио', 'portfolio'],
  ['разворот', 'turnaround'],
  ['архитектур', 'architecture'],
  ['освещени', 'lighting'],
  ['мимик', 'expression', 'лицо', 'face'],
  ['пропорци', 'proportions'],
  ['боев', 'fight', 'combat'],
  ['маг', 'magic', 'spell'],
  ['взрыв', 'explosion'],
  ['щит', 'shield'],
  ['механизм', 'mechanism', 'механизма'],
  ['энергетическ', 'energy', 'энергия'],
  ['свечен', 'glow'],
  ['огон', 'fire', 'flame'],
]

const TOKEN_TO_SYNONYMS = new Map<string, string[]>()

for (const group of SYNONYM_GROUPS) {
  const normalized = group.map((w) => w.toLowerCase())
  for (const word of normalized) {
    const rest = normalized.filter((w) => w !== word)
    const prev = TOKEN_TO_SYNONYMS.get(word) ?? []
    TOKEN_TO_SYNONYMS.set(word, [...new Set([...prev, ...rest])])
  }
}

export function expandTitleTokens(tokens: Iterable<string>): Set<string> {
  const out = new Set<string>()
  for (const raw of tokens) {
    const t = raw.toLowerCase()
    out.add(t)
    for (const syn of TOKEN_TO_SYNONYMS.get(t) ?? []) {
      out.add(syn)
    }
    for (const [key, syns] of TOKEN_TO_SYNONYMS) {
      if (t.includes(key) || key.includes(t)) {
        for (const syn of syns) out.add(syn)
      }
    }
  }
  return out
}
