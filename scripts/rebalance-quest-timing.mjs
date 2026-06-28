/**
 * Re-estimate estimatedTime, difficulty, min_level, and xp for all quests
 * based on title/description scope (views, turnarounds, animation cycles, etc.).
 *
 * Usage: node scripts/rebalance-quest-timing.mjs [--write] [--report]
 */
import fs from 'fs'
import path from 'path'

const DATA_DIR = 'src/renderer/data'
const WRITE = process.argv.includes('--write')
const REPORT = process.argv.includes('--report') || !WRITE

const DIFFICULTIES = ['novice', 'intermediate', 'advanced', 'expert', 'master']
const DIFF_RANK = Object.fromEntries(DIFFICULTIES.map((d, i) => [d, i + 1]))

const XP_PER_MIN = {
  novice: 2.0,
  intermediate: 2.2,
  advanced: 2.7,
  expert: 3.1,
  master: 3.3,
}

const MIN_LEVEL_FOR = {
  novice: 1,
  intermediate: 5,
  advanced: 10,
  expert: 15,
  master: 20,
}

const CATEGORY_BASE = {
  drawing: 28,
  anatomy: 30,
  animation: 38,
  effects: 32,
  storytelling: 30,
  character_design: 32,
  environment: 34,
}

function combineText(q) {
  return [
    q.title?.ru,
    q.title?.en,
    q.description?.ru,
    q.description?.en,
    ...(q.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function parseViewCount(text) {
  let max = 0
  const numRe = /(\d+)\s*(?:views?|вида|видов|ракурс|ракурса|ракурсов|poses?|поз(?:ы|иций)?)/gi
  for (const m of text.matchAll(numRe)) {
    const n = parseInt(m[1], 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  const hasFront = /\bfront\b|спереди/i.test(text)
  const hasSide = /\bside\b|сбоку|профиль/i.test(text)
  const hasBack = /\bback\b|сзади/i.test(text)
  const angleHints = [hasFront, hasSide, hasBack, /3\/4|three[- ]quarter/i.test(text)].filter(Boolean).length
  if (angleHints >= 3) max = Math.max(max, 4)
  else if (angleHints === 2) max = Math.max(max, 2)

  if (/turnaround|разворот|model sheet|лист модел|лист модели|со всех сторон|all angles/i.test(text)) {
    max = Math.max(max, 4)
  }
  if (/3\/4|three[- ]view|3 view|3 вида|3 ракурс/i.test(text)) max = Math.max(max, 3)
  if (/two[- ]view|2 view|2 вида|2 ракурс/i.test(text)) max = Math.max(max, 2)
  return max
}

function parseGestureCount(text) {
  const m = text.match(/(\d+)\s*(?:poses?|поз|gestures?|жестов|sketches?|эскиз)/i)
  return m ? parseInt(m[1], 10) : 0
}

/** Explicit duration mentioned in copy (hours/minutes). */
function parseExplicitMinutes(text) {
  const rangeHours = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:hours?|час(?:а|ов)?)/i)
  if (rangeHours) {
    const a = parseInt(rangeHours[1], 10)
    const b = parseInt(rangeHours[2], 10)
    return Math.round(((a + b) / 2) * 60)
  }
  const singleHour = text.match(/(\d+)\s*(?:hours?|час(?:а|ов)?)/i)
  if (singleHour) return parseInt(singleHour[1], 10) * 60
  if (/24\s*h|24[- ]?hour|24\s*час/i.test(text)) return 240
  const singleMin = text.match(/(\d+)\s*(?:minutes?|мин(?:ут)?)/i)
  if (singleMin) return parseInt(singleMin[1], 10)
  return null
}

/** Estimated practice minutes from task scope. */
function estimateScopeMinutes(q) {
  const text = combineText(q)
  const explicit = parseExplicitMinutes(text)
  const base = CATEGORY_BASE[q.category] ?? 30
  let minutes = explicit ?? base
  if (explicit) return Math.max(12, minutes)
  const views = parseViewCount(text)
  const gestures = parseGestureCount(text)

  if (gestures >= 10) minutes += gestures * 1.2
  else if (gestures >= 5) minutes += gestures * 2

  if (views >= 5) minutes += 70
  else if (views === 4) minutes += 55
  else if (views === 3) minutes += 38
  else if (views === 2) minutes += 18

  const rules = [
    [/turnaround|разворот/i, 50],
    [/model sheet|лист модел|лист модели|character sheet/i, 45],
    [/production pipeline|производственн|конвейер/i, 35],
    [/walk cycle|цикл ходьбы|run cycle/i, 48],
    [/pose[- ]to[- ]pose|поза-к-позе|поза к позе/i, 28],
    [/keyframe|ключевых кадр|keyframes/i, 22],
    [/lip sync|липсинк|lip-sync/i, 35],
    [/storyboard|раскадров/i, 30],
    [/full render|финальный рендер|finished render|полированн/i, 40],
    [/illustration|иллюстрац/i, 35],
    [/portfolio|портфолио/i, 45],
    [/perspective|перспектив/i, 22],
    [/composition|композици/i, 18],
    [/extreme foreshort|экстремальн\w* ракурс/i, 22],
    [/clean lineart|чистый лайнарт|lineart/i, 15],
    [/color render|полноцвет|full color|render pass/i, 25],
    [/rigging|риггинг|skinning/i, 40],
    [/particle|частиц|vfx|simulation|симуляц/i, 30],
    [/matte paint|мэтт/i, 35],
    [/group of|группа|several characters|несколько персонаж/i, 30],
    [/scene|сцен|environment|окруж/i, 12],
  ]

  for (const [re, add] of rules) {
    if (re.test(text)) minutes += add
  }

  const quick = [
    /5\s*min|5\s*мин|60\s*sec|60\s*сек|quick sketch|быстр\w+ этюд|warm[- ]?up|разминк|thumbnail|миниатюр|one minute|1\s*мин/i,
    /gesture(?:s)?\s*(?:only|study)|жестов(?:ый|ая)\s*(?:зарисовк|набросок)/i,
  ]
  if (quick.some((re) => re.test(text))) minutes -= 12

  if (/single|один объект|one object|одна поза|one pose/i.test(text)) minutes -= 5

  return Math.max(12, minutes)
}

function difficultyFromMinutes(minutes) {
  if (minutes < 34) return 'novice'
  if (minutes < 58) return 'intermediate'
  if (minutes < 88) return 'advanced'
  if (minutes < 125) return 'expert'
  return 'master'
}

function clampMinutesForDifficulty(minutes, difficulty) {
  const bands = {
    novice: [15, 42],
    intermediate: [32, 72],
    advanced: [55, 105],
    expert: [85, 150],
    master: [110, 210],
  }
  const [lo, hi] = bands[difficulty]
  return Math.min(hi, Math.max(lo, minutes))
}

function floorDifficulty(current, minimum) {
  return DIFF_RANK[current] >= DIFF_RANK[minimum] ? current : minimum
}

function ceilingDifficulty(current, maximum) {
  return DIFF_RANK[current] <= DIFF_RANK[maximum] ? current : maximum
}

function applyScopeFloors(q, minutes, difficulty) {
  const text = combineText(q)
  let d = difficulty
  let m = minutes

  if (
    /turnaround|разворот/i.test(text) &&
    /front|side|back|спереди|сбоку|сзади|3\/4|all angles|со всех сторон/i.test(text)
  ) {
    d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
    m = Math.min(Math.max(m, 80), 105)
  } else if (/turnaround|разворот/i.test(text)) {
    d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
    m = Math.min(Math.max(m, 65), 95)
  }

  if (/model sheet|лист модел/i.test(text)) {
    if (/group|групп|several|family|семь|королевск|наёмник/i.test(text)) {
      d = ceilingDifficulty(floorDifficulty(d, 'advanced'), 'expert')
      m = Math.min(Math.max(m, 95), 125)
    } else {
      d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
      m = Math.min(Math.max(m, 65), 95)
    }
  }

  if (/production pipeline|производственн/i.test(text)) {
    d = ceilingDifficulty(floorDifficulty(d, 'advanced'), 'expert')
    m = Math.min(Math.max(m, 90), 120)
  }

  if (/walk cycle|цикл ходьбы/i.test(text)) {
    d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
    m = Math.min(Math.max(m, 70), 100)
  }

  if (/pose[- ]to[- ]pose|поза-к-позе|поза к позе/i.test(text)) {
    d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
    m = Math.min(Math.max(m, 50), 80)
  }

  if (parseViewCount(text) >= 3 && /чистый лайнарт|clean lineart|отдельн\w+ сло/i.test(text)) {
    d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
    m = Math.min(Math.max(m, 55), 90)
  }

  if (parseGestureCount(text) >= 15) {
    d = ceilingDifficulty(floorDifficulty(d, 'intermediate'), 'advanced')
    m = Math.min(Math.max(m, parseGestureCount(text) * 1.5), 100)
  }

  return { minutes: m, difficulty: d }
}

function minLevelFromDifficulty(difficulty, prevMin) {
  return Math.max(prevMin ?? 1, MIN_LEVEL_FOR[difficulty])
}

function xpFromQuest(difficulty, minutes) {
  const rate = XP_PER_MIN[difficulty]
  return Math.max(20, Math.round(minutes * rate))
}

function updateTags(tags, oldDiff, newDiff) {
  if (!tags?.length) return tags
  const out = tags.map((t) => (t === oldDiff ? newDiff : t))
  if (!out.includes(newDiff) && out.some((t) => DIFFICULTIES.includes(t))) {
    return out.map((t) => (DIFFICULTIES.includes(t) ? newDiff : t))
  }
  if (!out.some((t) => DIFFICULTIES.includes(t))) out.push(newDiff)
  return out
}

function maxDifficulty(a, b) {
  return DIFF_RANK[a] >= DIFF_RANK[b] ? a : b
}

function rebalanceQuest(q) {
  let scopeMin = estimateScopeMinutes(q)
  let scopeDiff = difficultyFromMinutes(scopeMin)
  ;({ minutes: scopeMin, difficulty: scopeDiff } = applyScopeFloors(q, scopeMin, scopeDiff))

  const currentRank = DIFF_RANK[q.difficulty]
  const scopeRank = DIFF_RANK[scopeDiff]
  const underestimated = scopeMin > q.estimatedTime + 12 || scopeRank > currentRank
  const overestimated =
    q.estimatedTime > scopeMin + 30 && currentRank <= 2 && scopeRank <= currentRank

  let difficulty = q.difficulty
  let estimatedTime = q.estimatedTime

  if (underestimated) {
    difficulty = maxDifficulty(q.difficulty, scopeDiff)
    estimatedTime = clampMinutesForDifficulty(Math.round(scopeMin), difficulty)
  } else if (overestimated) {
    estimatedTime = clampMinutesForDifficulty(
      Math.round(q.estimatedTime * 0.55 + scopeMin * 0.45),
      q.difficulty,
    )
  } else if (currentRank >= 4 && q.estimatedTime > scopeMin + 25) {
    // Keep long expert/master sessions unless scope clearly says otherwise
    difficulty = q.difficulty
    estimatedTime = Math.max(
      clampMinutesForDifficulty(Math.round(scopeMin), q.difficulty),
      Math.round(q.estimatedTime * 0.88),
    )
  } else {
    estimatedTime = clampMinutesForDifficulty(
      Math.round(q.estimatedTime * 0.65 + scopeMin * 0.35),
      q.difficulty,
    )
  }

  // Re-apply scope caps after blend (only when we raised time / difficulty)
  if (underestimated) {
    ;({ minutes: estimatedTime, difficulty } = applyScopeFloors(q, estimatedTime, difficulty))
    estimatedTime = clampMinutesForDifficulty(Math.round(estimatedTime), difficulty)
  }

  if (q.min_level >= 20) difficulty = maxDifficulty(difficulty, 'master')
  else if (q.min_level >= 15) difficulty = maxDifficulty(difficulty, 'expert')
  else if (q.min_level >= 10) difficulty = maxDifficulty(difficulty, 'advanced')
  else if (q.min_level >= 5) difficulty = maxDifficulty(difficulty, 'intermediate')

  estimatedTime = clampMinutesForDifficulty(estimatedTime, difficulty)
  const min_level = minLevelFromDifficulty(difficulty, q.min_level)
  const xp = xpFromQuest(difficulty, estimatedTime)
  const tags = q.difficulty !== difficulty ? updateTags(q.tags, q.difficulty, difficulty) : q.tags

  return { ...q, difficulty, estimatedTime, min_level, xp, tags }
}

if (process.argv.includes('--probe')) {
  const code = process.argv[process.argv.indexOf('--probe') + 1] || 'CDN-01008'
  for (const file of fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('quests_') && f.endsWith('.json'))) {
    const quests = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
    const q = quests.find((x) => x.code === code)
    if (q) {
      console.log('before', { diff: q.difficulty, time: q.estimatedTime, xp: q.xp, min_level: q.min_level })
      console.log('after', rebalanceQuest(q))
      process.exit(0)
    }
  }
  console.error('Quest not found:', code)
  process.exit(1)
}

const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith('quests_') && f.endsWith('.json'))
const changes = []
let total = 0

for (const file of files) {
  const filePath = path.join(DATA_DIR, file)
  const quests = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const updated = quests.map((q) => {
    total++
    const next = rebalanceQuest(q)
    const timeDelta = next.estimatedTime - q.estimatedTime
    const diffChanged = next.difficulty !== q.difficulty
    if (Math.abs(timeDelta) >= 8 || diffChanged || Math.abs(next.xp - q.xp) >= 15) {
      changes.push({
        file,
        id: q.id,
        code: q.code,
        title: q.title?.ru || q.title?.en,
        old: { time: q.estimatedTime, diff: q.difficulty, xp: q.xp },
        new: { time: next.estimatedTime, diff: next.difficulty, xp: next.xp },
        timeDelta,
        diffChanged,
      })
    }
    return next
  })

  if (WRITE) {
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8')
  }
}

changes.sort((a, b) => Math.abs(b.timeDelta) - Math.abs(a.timeDelta))

console.log(`Processed ${total} quests. ${changes.length} materially updated.`)

if (REPORT) {
  console.log('\nTop 40 time adjustments:')
  for (const c of changes.slice(0, 40)) {
    console.log(
      `${c.code} ${c.old.diff}→${c.new.diff} ${c.old.time}→${c.new.time}m (${c.timeDelta >= 0 ? '+' : ''}${c.timeDelta}) | ${c.title?.slice(0, 55)}`,
    )
  }
  const diffChanges = changes.filter((c) => c.diffChanged)
  console.log(`\nDifficulty changes: ${diffChanges.length}`)
  for (const c of diffChanges.slice(0, 30)) {
    console.log(`${c.code} ${c.old.diff}→${c.new.diff} ${c.old.time}→${c.new.time}m | ${c.title?.slice(0, 60)}`)
  }
}

if (WRITE) {
  console.log('\nWrote updated quest JSON files.')
} else {
  console.log('\nDry run — pass --write to apply.')
}
