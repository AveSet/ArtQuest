/** Work volume inferred from numbers and quantity words in a quest title. */

const QUANTITY_WORDS: { re: RegExp; value: number }[] = [
  { re: /\b(тысяч[аи]?|thousand)\b/gi, value: 1000 },
  { re: /\b(сотен|сотн[ия]|hundred)\b/gi, value: 100 },
  { re: /\b(десятк[аи]|dozen)\b/gi, value: 12 },
]

const COUNTABLE_HINT =
  /\b(куб|кубов|куба|cube|cubes|раз|раза|шт|штук|piece|pieces|объект|objects|вариант|variants|кадр|frames|frame|лист|листов|sheet|sheets|персонаж|characters|икон|icons|иконк|скетч|sketches|набросок|нарисовать|draw|рисун|рисовать)\b/i

export type TitleWorkScale = {
  /** Multiplier applied to XP and time after catalog calibration (0.5–5). */
  quantityMultiplier: number
  primaryNumber: number | null
}

function parseNumbers(text: string): number[] {
  const found: number[] = []
  for (const m of text.matchAll(/\d[\d\s]*/g)) {
    const n = parseInt(m[0].replace(/\s/g, ''), 10)
    if (Number.isFinite(n) && n > 0 && n <= 500_000) found.push(n)
  }
  return found
}

function impliedQuantityFromWords(text: string): number {
  let max = 1
  for (const { re, value } of QUANTITY_WORDS) {
    if (re.test(text)) max = Math.max(max, value)
  }
  return max
}

/** Repetitive fundamentals (cubes, perspective drills) — volume adds time, not tier. */
export function isFundamentalDrill(title: string): boolean {
  const t = title.trim().toLowerCase()
  if (!t) return false
  const hasDraw = /(нарисовать|нарисуй|draw|sketch|наброс|эскиз|упражнен|drill|practice)/i.test(t)
  const hasFundamental =
    /(куб|cube|сфер|sphere|цилиндр|cylinder|линии|lines|контур|contour|перспектив|perspective|эллипс|ellipse|примитив|primitive|форм|форма|form\b|от руки|freehand)/i.test(
      t,
    )
  return hasDraw && hasFundamental
}

function quantityToMultiplier(qty: number, hasCountableHint: boolean, isDrill: boolean): number {
  if (isDrill) {
    const ref = 10
    const logRatio = Math.log10(Math.max(qty, 1) / ref)
    return clamp(1 + logRatio * 0.32, 1, 2.2)
  }
  if (qty <= 1) return hasCountableHint ? 0.9 : 1
  const ref = 5
  const logRatio = Math.log10(Math.max(qty, 1) / ref)
  const mult = 1 + logRatio * 0.72
  if (!hasCountableHint && qty < 20) return clamp(mult, 0.85, 1.35)
  return clamp(mult, 0.5, 5)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Strip digits so «5 кубов» and «5000 кубов» match the same catalog neighbors. */
export function normalizeTitleForCatalogMatch(title: string): string {
  return title
    .replace(/\d[\d\s]*/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Scales XP and session time from title quantity (time scales more than XP for drills). */
export function applyQuantityToRewards(
  xp: number,
  estimatedTime: number,
  multiplier: number,
  opts?: { timeHeavy?: boolean },
): { xp: number; estimatedTime: number } {
  if (Math.abs(multiplier - 1) <= 0.08) return { xp, estimatedTime }
  const timeHeavy = opts?.timeHeavy ?? false
  const timeMult = timeHeavy ? 1 + (multiplier - 1) * 0.92 : 1 + (multiplier - 1) * 0.88
  const xpMult = timeHeavy ? 1 + (multiplier - 1) * 0.35 : 1 + (multiplier - 1) * 0.55
  return {
    xp: Math.round(xp * xpMult),
    estimatedTime: Math.round(estimatedTime * timeMult),
  }
}

export function extractTitleWorkScale(title: string): TitleWorkScale {
  const trimmed = title.trim()
  if (!trimmed) return { quantityMultiplier: 1, primaryNumber: null }

  const numbers = parseNumbers(trimmed)
  const wordQty = impliedQuantityFromWords(trimmed)
  const primaryNumber = numbers.length > 0 ? Math.max(...numbers) : wordQty > 1 ? wordQty : null
  const qty = primaryNumber ?? 1
  const hasHint = COUNTABLE_HINT.test(trimmed)
  const isDrill = isFundamentalDrill(trimmed)

  return {
    quantityMultiplier: quantityToMultiplier(qty, hasHint, isDrill),
    primaryNumber,
  }
}
