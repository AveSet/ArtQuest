/**
 * Bulk-fix Russian quest copy: remove English leakage, use imperatives, natural phrasing.
 *
 * Usage: npx tsx scripts/fix-quest-ru-l10n.ts [--write]
 * Default is dry-run (report only).
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')
const WRITE = process.argv.includes('--write')

const FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

const IMPERATIVE: Record<string, string> = {
  'Нарисовать': 'Нарисуй',
  'Изучить': 'Изучи',
  'Сделать': 'Сделай',
  'Подобрать': 'Подбери',
  'Добавить': 'Добавь',
  'Создать': 'Создай',
  'Анимировать': 'Анимируй',
  'Спроектировать': 'Спроектируй',
  'Потренировать': 'Потренируй',
  'Проанализировать': 'Проанализируй',
  'Адаптировать': 'Адаптируй',
  'Завершить': 'Заверши',
  'Расписать': 'Распиши',
  'Копировать': 'Скопируй',
  'Копия': 'Скопируй',
}

const PHRASES: [RegExp, string][] = [
  [/Value distillation — (\d+) тона/g, 'Нарисуй сведение тонов — $1 тона'],
  [/Value distillation — (\d+) values/gi, 'Нарисуй сведение тонов — $1 тона'],
  [/shape language/gi, 'язык форм'],
  [/rule of thirds/gi, 'правило третей'],
  [/squash and stretch/gi, 'сжатие и растяжение'],
  [/squash & stretch/gi, 'сжатие и растяжение'],
  [/Slow-in\/slow-out/gi, 'Замедление на входе/выходе'],
  [/slow in\/out/gi, 'замедление на входе/выходе'],
  [/Lip sync-лист/gi, 'Лист синхронизации губ'],
  [/Lip sync/gi, 'Синхронизация губ'],
  [/Smear-полоса/gi, 'Полоса смаза'],
  [/\bSmear\b/g, 'Смаз'],
  [/Idle \/ дыхание/gi, 'Пассивный цикл / дыхание'],
  [/FX миниатюры/gi, 'Миниатюры эффекта'],
  [/FX-луп/gi, 'Цикл эффекта'],
  [/FX-шот/gi, 'Кадр с эффектом'],
  [/\bFX\b/g, 'эффект'],
  [/Follow-through/gi, 'Дотягивание'],
  [/Overlapping action/gi, 'Перекрывающее действие'],
  [/Overlап/gi, 'Перекрытие'],
  [/\bOverlap\b/gi, 'Перекрытие'],
  [/Secondary action/gi, 'Вторичное действие'],
  [/Anticipation \+ overshoot/gi, 'Предварительное движение и перелёт'],
  [/\banticipation:/gi, 'предварительное движение:'],
  [/\bAnticipation\b/g, 'Предварительное движение'],
  [/Solid drawing/gi, 'Чёткий объём'],
  [/Spacing strip/gi, 'Полоса интервалов'],
  [/\bspacing\b/gi, 'интервалы'],
  [/in-between/gi, 'промежуточные кадры'],
  [/contact poses/gi, 'опорные позы'],
  [/\bhold\b/gi, 'удержание'],
  [/\bsnap\b/gi, 'резкий кадр'],
  [/Impact трио/gi, 'Трио ударных кадров'],
  [/\bImpact\b/g, 'Удар'],
  [/\bLayout\b/g, 'Раскладка'],
  [/\bGenga\b/g, 'Чистовой кадр'],
  [/turnaround/gi, 'поворотная схема'],
  [/real-time/gi, 'реального времени'],
  [/foreshortening/gi, 'ракурс с укорочением'],
  [/Dynamic camera movement/gi, 'Динамика камеры'],
  [/rhythm and pauses/gi, 'ритм и паузы'],
  [/visual persuasion/gi, 'визуальное убеждение'],
  [/Multi-scene continuity/gi, 'Непрерывность между сценами'],
  [/\barrangement\b/gi, 'компоновка'],
  [/\bsymbols\b/gi, 'символы'],
  [/\bsymbolism\b/gi, 'символизм'],
  [/show, don't tell/gi, 'показывай, а не рассказывай'],
  [/atmospheric perspective/gi, 'воздушная перспектива'],
  [/lost edges/gi, 'растворённые контуры'],
  [/focal peak/gi, 'главный пик'],
  [/color key/gi, 'цветовой ключ'],
  [/value blocking/gi, 'блокировка тонов'],
  [/block-in/gi, 'блокинг'],
  [/\bBlock-in\b/gi, 'Блокинг'],
  [/\btrinket\b/gi, 'безделушка'],
  [/\bprops\b/gi, 'реквизит'],
  [/\bScatter\b/g, 'Разложи'],
  [/\bclumps\b/gi, 'пучки'],
  [/\bcumulus\b/gi, 'кумуля'],
  [/\bstratus\b/gi, 'стратус'],
  [/\bcanyon\b/gi, 'каньон'],
  [/\bkit\b/gi, 'набор'],
  [/\blayout\b/gi, 'раскладка'],
  [/\bNPC\b/g, 'NPC'],
  [/Swatches/gi, 'образцы'],
  [/кадр by кадр/gi, 'кадр за кадром'],
  [/VFX/g, 'VFX'],
  [/snowfall/gi, 'снегопад'],
  [/tidal wave/gi, 'приливная волна'],
  [/\bpuff\b/gi, 'выброс'],
  [/ to /g, ' к '],
  [/\bbiceps\b/gi, 'бицепс'],
  [/impact frames/gi, 'ударных кадров'],
  [/^Overlapping —/gi, 'Перекрытие —'],
  [/\bDrag\b/g, 'перетаскивание'],
  [/Color script/gi, 'Цветовой сценарий'],
  [/Efficiency/gi, 'Эффективность'],
  [/\b1PP\b/g, '1 точка схода'],
  [/\b2PP\b/g, '2 точки схода'],
  [/fg\/mg\/bg/gi, 'передний / средний / задний план'],
  [/forgiveness/gi, 'прощение'],
  [/highlight\/mid\/shadow/gi, 'свет / полутон / тень'],
  [/timing chart/gi, 'диаграмма тайминга'],
  [/\bEase-in\b/gi, 'Замедление на входе'],
  [/\bEase\b/gi, 'Плавность'],
  [/\bslow-out\b/gi, 'замедление на выходе'],
  [/\bslow-in\b/gi, 'замедление на входе'],
  [/contact pose/gi, 'опорная поза'],
  [/walk cycle/gi, 'цикл ходьбы'],
  [/\bpassing\b/gi, 'проходная'],
  [/\bcontact\b/gi, 'опорная'],
  [/\bovershoot\b/gi, 'перелёт'],
  [/\bbounce\b/gi, 'отскок'],
  [/\bblur\b/gi, 'размытие'],
  [/\bstaging\b/gi, 'постановка'],
  [/\bhue\b/gi, 'оттенок'],
  [/\bvs\b/gi, 'и'],
  [/бiceps/gi, 'бицепс'],
  [/\bsquash\b/gi, 'сжатие'],
  [/\bstretch\b/gi, 'растяжение'],
  [/\bimpact\b/gi, 'удар'],
  [/\bsmear\b/gi, 'смаз'],
  [/\banticipation\b/gi, 'предварительное движение'],
  [/\bidle\b/gi, 'пассивный цикл'],
  [/hit-эффект/gi, 'ударный эффект'],
  [/\bwispy\b/gi, 'волнистые прядки'],
  [/heal-эффекта/gi, 'эффекта исцеления'],
  [/crown splash/gi, 'корона брызг'],
  [/рipple/gi, 'круги на воде'],
  [/\bripple\b/gi, 'круги на воде'],
  [/\bstakes\b/gi, 'напряжение'],
  [/\bmontage\b/gi, 'монтаж'],
  [/64px/gi, '64 px'],
  [/кanyon/gi, 'каньона'],
  [/фocal peak/gi, 'главный пик'],
  [/входе\/out/gi, 'входе и выходе'],
]

const LOCATIONS: Record<string, string> = {
  bridge: 'мост',
  'forest path': 'лесная тропа',
  'city street': 'городская улица',
  'market alley': 'рынок в переулке',
  spaceport: 'космопорт',
  'interior hallway': 'интерьер коридора',
  cave: 'пещера',
  'mountain road': 'горная дорога',
}

const ARCHETYPES: Record<string, string> = {
  hero: 'героя',
  mage: 'мага',
  dwarf: 'гнома',
  elf: 'эльфа',
  rogue: 'плута',
  monster: 'монстра',
  robot: 'робота',
  alien: 'пришельца',
}

const EMOTIONS: Record<string, string> = {
  pride: 'гордость',
  boredom: 'скука',
  anticipation: 'предвкушение',
  command: 'властность',
  victory: 'победа',
  defeat: 'поражение',
  exposure: 'разоблачение',
  journey: 'путешествие',
  rescue: 'спасение',
  rivalry: 'соперничество',
  competition: 'соревнование',
  encouragement: 'поддержка',
  apology: 'извинение',
  betrayal: 'предательство',
  grief: 'горе',
  hope: 'надежда',
  threat: 'угроза',
  triumph: 'триумф',
  epiphany: 'озарение',
  sacrifice: 'жертва',
  farewell: 'прощание',
  dialogue: 'диалог',
  climax: 'кульминация',
  'battle scene': 'боевая сцена',
  'simple scene': 'простая сцена',
  space: 'космос',
  'same pose': 'та же поза',
  'editing sequence': 'монтажная последовательность',
  '9 thumbnails': '9 миниатюр',
}

const SCENES: Record<string, string> = {
  'looking at own work': 'смотрит на своё произведение',
  'waiting in line': 'ожидание в очереди',
  'calm before storm': 'затишье перед бурей',
  'lie revealed': 'ложь раскрыта',
  'authoritative gesture': 'властный жест',
  resignation: 'смирение',
  'finish line': 'финишная черта',
  'eye to eye': 'глаза в глаза',
  'last moment': 'последний момент',
  'looming danger': 'нависающая опасность',
  'guilty look': 'виноватый взгляд',
  'self-sacrifice': 'самопожертвование',
  whisper: 'шёпот',
  'dawn after darkness': 'рассвет после тьмы',
  'farewell to home': 'прощание с домом',
  'loneliness in crowd': 'одиночество в толпе',
  'secret note passing': 'тайная передача записки',
  'overheard conversation': 'подслушанный разговор',
  'argument at table': 'ссора за столом',
  'decision moment': 'момент решения',
  'reunion after long separation': 'встреча после долгой разлуки',
  'secret conspiracy': 'тайный заговор',
  'farewell at station': 'прощание на вокзале',
  'meeting at doorstep': 'встреча на пороге',
  'studying map': 'изучение карты',
  'blushed/looked away': 'смущение / отведённый взгляд',
  'unsure how to react': 'не знает, как реагировать',
  'shoulder/hug': 'плечо / объятие',
  'peak emotion': 'пик эмоции',
  'emotional arc': 'эмоциональная дуга',
  'environment story': 'история через окружение',
  'cinematic quality': 'кинематографичность',
  'pipeline ready': 'готово к пайплайну',
  'pro level': 'профессиональный уровень',
  'no dialogue': 'без диалогов',
  'palette arc': 'дуга палитры',
  'shot alternation': 'чередование планов',
  'wide/medium/close': 'общий / средний / крупный',
  'fg/mg/bg': 'передний / средний / задний план',
  'light/mid/dark': 'свет / полутон / тень',
  'warm/cold': 'тёплый / холодный',
  'warm/cool': 'тёплый / холодный',
  gesture: 'жест',
  symbol: 'символ',
  destruction: 'разрушения',
  atmosphere: 'атмосфера',
  smoke: 'дым',
  fire: 'огонь',
  'water splashes': 'вода с брызгами',
  'atmospheric effects': 'атмосфера',
  'magical energy': 'магическая энергия',
  hail: 'град',
  sandstorm: 'песчаная буря',
  forgiveness: 'прощение',
  'tail drag': 'перетаскивание хвоста',
}

function trWord(key: string): string {
  const k = key.trim().toLowerCase()
  return EMOTIONS[k] ?? ARCHETYPES[k] ?? SCENES[k] ?? LOCATIONS[k] ?? key
}

function trPhrase(phrase: string): string {
  const lower = phrase.trim().toLowerCase()
  if (SCENES[lower]) return SCENES[lower]
  if (EMOTIONS[lower]) return EMOTIONS[lower]
  if (ARCHETYPES[lower]) return ARCHETYPES[lower]
  if (LOCATIONS[lower]) return LOCATIONS[lower]

  let out = phrase
  for (const [en, ru] of Object.entries({ ...SCENES, ...EMOTIONS, ...ARCHETYPES, ...LOCATIONS })) {
    out = out.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ru)
  }
  return out
}

function applyPhrases(text: string): string {
  let s = text
  for (const [re, rep] of PHRASES) s = s.replace(re, rep)
  return s
}

function toImperativeTitle(title: string): string {
  for (const [inf, imp] of Object.entries(IMPERATIVE)) {
    if (title.startsWith(`${inf} `)) return imp + title.slice(inf.length)
  }
  return title
}

function rebuildTitleFromEn(en: string): string | null {
  const e = en.trim()

  let m = e.match(/^Design a readable (.+?) silhouette$/i)
  if (m) {
    const inner = m[1].trim()
    const paren = inner.match(/^(.+?) \((.+)\)$/)
    if (paren) {
      return `Сделай читаемый силуэт: ${trPhrase(paren[1])} (${trPhrase(paren[2])})`
    }
    return `Сделай читаемый силуэт: ${trPhrase(inner)}`
  }

  m = e.match(/^Frame (.+?) \((.+?)\) with strong composition$/i)
  if (m) {
    return `Подбери кадрирование: ${trPhrase(m[1])} (${trPhrase(m[2])}, правило третей)`
  }

  m = e.match(/^Frame (.+?) \((.+?), rule of thirds\)$/i)
  if (m) {
    return `Подбери кадрирование: ${trPhrase(m[1])} (${trPhrase(m[2])}, правило третей)`
  }

  m = e.match(/^Draw (.+?) in perspective$/i)
  if (m) return `Нарисуй в перспективе: ${trPhrase(m[1])}`

  m = e.match(/^Lay out a simple sequence: (.+?)(?: \((.+?)\))?$/i)
  if (m) {
    const scene = trPhrase(m[1])
    const extra = m[2] ? ` (${trPhrase(m[2])})` : ''
    return `Сделай простой макет сцены: ${scene}${extra} (2–3 панели)`
  }

  m = e.match(/^Draw with strong foreshortening: (.+)$/i)
  if (m) return `Нарисуй с сильным ракурсом с укорочением: ${trPhrase(m[1])}`

  m = e.match(/^Animate squash and stretch: (.+)$/i)
  if (m) return `Анимируй сжатие и растяжение: ${trPhrase(m[1])}`

  m = e.match(/^Add anticipation: (.+?) \(before action\)$/i)
  if (m) return `Добавь предварительное движение: ${trPhrase(m[1])} (перед действием)`

  m = e.match(/^Value distillation — (\d+) values$/i)
  if (m) return `Нарисуй сведение тонов — ${m[1]} тона`

  m = e.match(/^Leading lines: (.+?) to focus$/i)
  if (m) return `Направляющие линии: ${trPhrase(m[1])} к фокусу`

  m = e.match(/^Silent storytelling: (.+?) \(no dialogue\)$/i)
  if (m) return `Немое повествование: ${trPhrase(m[1])} (без диалогов)`

  m = e.match(/^Visual metaphor: (.+?) \(symbolism\)$/i)
  if (m) return `Визуальная метафора: ${trPhrase(m[1])} (символизм)`

  m = e.match(/^Visual rhythm: (.+?) \(shot alternation\)$/i)
  if (m) return `Визуальный ритм: ${trPhrase(m[1])} (чередование планов)`

  m = e.match(/^Pendulum Slow In\/Out$/i)
  if (m) return 'Маятник — замедление на входе/выходе'

  m = e.match(/^Impact Frame Trio$/i)
  if (m) return 'Трио ударных кадров'

  m = e.match(/^Overlap drill — (.+)$/i)
  if (m) return `Дрилл перекрытия — ${trPhrase(m[1])}`

  m = e.match(/^Overlapping Scarf on Walk$/i)
  if (m) return 'Перекрытие — шарф в шаге'

  m = e.match(/^Final VFX shot pipeline: (.+)$/i)
  if (m) return `Финальный VFX-кадр: ${trPhrase(m[1])}`

  m = e.match(/^Studio Style Analysis: (.+?) \(Ufotable\/Pixar\)$/i)
  if (m) return `Анализ студийного стиля: ${trPhrase(m[1])} (Ufotable / Pixar)`

  m = e.match(/^Studio Effect Study: (.+?) \(Ufotable\/Pixar\)$/i)
  if (m) return `Скопируй студийный эффект: ${trPhrase(m[1])} (Ufotable / Pixar)`

  m = e.match(/^Studio Effect Study: (.+?) \((.+?)\) \(Ufotable\/Pixar\)$/i)
  if (m) return `Скопируй студийный эффект: ${trPhrase(m[1])} (${trPhrase(m[2])}) (Ufotable / Pixar)`

  m = e.match(/^One-point box row$/i)
  if (m) return 'Нарисуй ряд кубов: 1 точка схода'

  m = e.match(/^Two-point corner box$/i)
  if (m) return 'Угол куба: 2 точки схода'

  m = e.match(/^Efficiency Board — Static \+ 1 Move$/i)
  if (m) return 'Эффективность — статичный фон + 1 движение'

  m = e.match(/^Color Script — 6 Swatches$/i)
  if (m) return 'Цветовой сценарий — 6 образцов'

  m = e.match(/^15 NPC Face Generator$/i)
  if (m) return '15 лиц NPC'

  return null
}

function hasLatinLeak(text: string): boolean {
  return /[A-Za-z]{2,}/.test(text)
}

function fixRu(text: string, en: string | undefined, kind: 'title' | 'body'): string {
  let s = applyPhrases(text)
  if (kind === 'title' && en) {
    const rebuilt = rebuildTitleFromEn(en)
    if (rebuilt && hasLatinLeak(s)) s = rebuilt
    s = toImperativeTitle(s)
  }
  s = applyPhrases(s)
  return s.replace(/\s{2,}/g, ' ').trim()
}

type Quest = {
  id: number
  code: string
  title: { ru: string; en: string }
  description: { ru: string; en: string }
  microChallenges?: { instruction: { ru: string; en: string } }[]
}

async function main(): Promise<void> {
  let changed = 0
  let remaining = 0

  for (const file of FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Quest[]
    let fileChanged = 0

    for (const q of quests) {
      const patch = (field: 'title' | 'description') => {
        const before = q[field].ru
        const after = fixRu(before, q[field].en, field === 'title' ? 'title' : 'body')
        if (after !== before) {
          q[field].ru = after
          fileChanged++
          changed++
        }
        if (hasLatinLeak(q[field].ru)) remaining++
      }
      patch('title')
      patch('description')

      for (const mc of q.microChallenges ?? []) {
        const before = mc.instruction.ru
        const after = fixRu(before, mc.instruction.en, 'body')
        if (after !== before) {
          mc.instruction.ru = after
          fileChanged++
          changed++
        }
        if (hasLatinLeak(mc.instruction.ru)) remaining++
      }
    }

    if (WRITE && fileChanged > 0) {
      await fs.writeFile(filePath, `${JSON.stringify(quests, null, 2)}\n`, 'utf8')
    }
    console.log(`${file}: ${fileChanged} fields updated`)
  }

  console.log(`\nTotal updated: ${changed}`)
  console.log(`Remaining Latin leaks (ru fields): ${remaining}`)
  if (!WRITE) console.log('\nDry run — pass --write to apply.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
