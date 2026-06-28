/**
 * Apply production-quality zh/ja/ko to achievements.json and skillTree.ts.
 * Descriptions are generated from Russian source text (human-reviewed in-game copy).
 *
 * Usage: npx tsx scripts/polish-art-data-locales.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src/renderer/data')

type L10n = { zh: string; ja: string; ko: string }

const CATEGORY: Record<string, L10n> = {
  Drawing: { zh: '绘画', ja: 'ドローイング', ko: '드로잉' },
  Anatomy: { zh: '解剖学', ja: 'アナトミー', ko: '해부학' },
  Animation: { zh: '动画', ja: 'アニメーション', ko: '애니메이션' },
  Effects: { zh: '特效', ja: 'エフェクト', ko: '이펙트' },
  Storytelling: { zh: '叙事', ja: 'ストーリーテリング', ko: '스토리텔링' },
  'Character Design': { zh: '角色设计', ja: 'キャラクターデザイン', ko: '캐릭터 디자인' },
  Environment: { zh: '环境', ja: '環境', ko: '환경' },
}

function questCount(n: string, cat?: L10n): L10n {
  if (cat) {
    return {
      zh: `完成 ${n} 个${cat.zh}任务`,
      ja: `${cat.ja}のクエストを${n}個完了する`,
      ko: `${cat.ko} 퀘스트 ${n}개를 완료하세요`,
    }
  }
  return {
    zh: `完成 ${n} 个任务`,
    ja: `クエストを${n}個完了する`,
    ko: `퀘스트 ${n}개를 완료하세요`,
  }
}

function streakDays(n: string): L10n {
  return {
    zh: `连续 ${n} 天完成任务`,
    ja: `${n}日間連続でクエストを完了する`,
    ko: `${n}일 연속으로 퀘스트를 완료하세요`,
  }
}

function levelInAny(n: string): L10n {
  return {
    zh: `在任意类别中达到 ${n} 级`,
    ja: `いずれかのカテゴリでレベル${n}に到達する`,
    ko: `아무 카테고리에서나 레벨 ${n}에 도달하세요`,
  }
}

function earnXp(n: string): L10n {
  return {
    zh: `获得 ${n} 点经验值`,
    ja: `${n}の経験値を獲得する`,
    ko: `경험치 ${n}을 획득하세요`,
  }
}

function translateAchievementDescription(ru: string): L10n | null {
  let m: RegExpMatchArray | null

  if (ru === 'Выполните свой первый квест') {
    return { zh: '完成你的第一个任务', ja: '最初のクエストを完了する', ko: '첫 번째 퀘스트를 완료하세요' }
  }
  if ((m = ru.match(/^Выполните (\d+) квест(?:ов|а)?$/))) return questCount(m[1]!)
  if ((m = ru.match(/^Выполните (\d+) квестов категории (.+)$/))) {
    const cat = CATEGORY[m[2]!]
    if (!cat) return null
    return questCount(m[1]!, cat)
  }
  if (ru === 'Выполните хотя бы один квест в каждой категории') {
    return {
      zh: '在每个类别中至少完成一个任务',
      ja: '各カテゴリで少なくとも1つのクエストを完了する',
      ko: '각 카테고리에서 퀘스트를 하나 이상 완료하세요',
    }
  }
  if ((m = ru.match(/^Выполните по (\d+) квестов в каждой категории$/))) {
    return {
      zh: `在每个类别中完成 ${m[1]} 个任务`,
      ja: `各カテゴリでクエストを${m[1]}個完了する`,
      ko: `각 카테고리에서 퀘스트 ${m[1]}개를 완료하세요`,
    }
  }
  if ((m = ru.match(/^Выполняйте квесты (\d+) дн(?:ей|я) подряд$/))) return streakDays(m[1]!)
  if (ru === 'Выполните все ежедневные квесты за день') {
    return {
      zh: '在一天内完成所有每日任务',
      ja: '1日ですべてのデイリークエストを完了する',
      ko: '하루에 모든 일일 퀘스트를 완료하세요',
    }
  }
  if (ru === 'Проведите первую практику с таймером') {
    return {
      zh: '完成第一次计时练习',
      ja: '初めてタイマー付きの練習を行う',
      ko: '첫 번째 타이머 연습을 완료하세요',
    }
  }
  if ((m = ru.match(/^Проведите (\d+) практик с таймером$/))) {
    return {
      zh: `完成 ${m[1]} 次计时练习`,
      ja: `タイマー付きの練習を${m[1]}回行う`,
      ko: `타이머 연습을 ${m[1]}회 완료하세요`,
    }
  }
  if ((m = ru.match(/^Разблокируйте (\d+) узлов дерева навыков$/))) {
    return {
      zh: `解锁 ${m[1]} 个技能树节点`,
      ja: `スキルツリーのノードを${m[1]}個解放する`,
      ko: `스킬 트리 노드 ${m[1]}개를 잠금 해제하세요`,
    }
  }
  if (ru === 'Разблокируйте все 102 узла дерева навыков') {
    return {
      zh: '解锁全部 102 个技能树节点',
      ja: 'スキルツリーのノード102個をすべて解放する',
      ko: '스킬 트리 노드 102개를 모두 잠금 해제하세요',
    }
  }
  if ((m = ru.match(/^Достигните (\d+) уровня в любой категории$/))) return levelInAny(m[1]!)
  if ((m = ru.match(/^Достигните (\d+) уровня в двух категориях$/))) {
    return {
      zh: `在两个类别中达到 ${m[1]} 级`,
      ja: `2つのカテゴリでレベル${m[1]}に到達する`,
      ko: `두 카테고리에서 레벨 ${m[1]}에 도달하세요`,
    }
  }
  if ((m = ru.match(/^Достигните (\d+) уровня во всех категориях$/))) {
    return {
      zh: `在所有类别中达到 ${m[1]} 级`,
      ja: `すべてのカテゴリでレベル${m[1]}に到達する`,
      ko: `모든 카테고리에서 레벨 ${m[1]}에 도달하세요`,
    }
  }
  if (ru === 'Достигните престижа на любом узле навыков') {
    return {
      zh: '在任意技能节点上获得声望',
      ja: 'いずれかのスキルノードでプレステージに到達する',
      ko: '아무 스킬 노드에서 프레스티지에 도달하세요',
    }
  }
  if ((m = ru.match(/^Достигните престижа (\d+) на любом узле навыков$/))) {
    return {
      zh: `在任意技能节点上获得声望 ${m[1]}`,
      ja: `いずれかのスキルノードでプレステージ${m[1]}に到達する`,
      ko: `아무 스킬 노드에서 프레스티지 ${m[1]}에 도달하세요`,
    }
  }
  if ((m = ru.match(/^Заработайте ([\d,]+) XP$/))) return earnXp(m[1]!)
  if ((m = ru.match(/^Загрузите (\d+) работ в галерею$/))) {
    return {
      zh: `在画廊中上传 ${m[1]} 件作品`,
      ja: `ギャラリーに作品を${m[1]}点アップロードする`,
      ko: `갤러리에 작품 ${m[1]}점을 업로드하세요`,
    }
  }
  if ((m = ru.match(/^Выполните (\d+) разных квестов$/))) {
    return {
      zh: `完成 ${m[1]} 个不同的任务`,
      ja: `異なるクエストを${m[1]}個完了する`,
      ko: `서로 다른 퀘스트 ${m[1]}개를 완료하세요`,
    }
  }
  if (ru === 'Выполните все 1540 квестов каталога') {
    return {
      zh: '完成目录中的全部 1540 个任务',
      ja: 'カタログのクエスト1540個をすべて完了する',
      ko: '카탈로그의 퀘스트 1540개를 모두 완료하세요',
    }
  }
  if (ru === 'Выполните 20 цифровых квестов') {
    return { zh: '完成 20 个数字绘画任务', ja: 'デジタルのクエストを20個完了する', ko: '디지털 퀘스트 20개를 완료하세요' }
  }
  if (ru === 'Выполните 20 традиционных квестов') {
    return {
      zh: '完成 20 个传统媒介任务',
      ja: 'トラディショナルなクエストを20個完了する',
      ko: '전통 매체 퀘스트 20개를 완료하세요',
    }
  }
  if (ru === 'Выполняйте квесты 7 дней подряд в одной категории') {
    return {
      zh: '在同一类别中连续 7 天完成任务',
      ja: '同じカテゴリで7日間連続してクエストを完了する',
      ko: '같은 카테고리에서 7일 연속으로 퀘스트를 완료하세요',
    }
  }
  if (ru === 'Выполните квест 5 дней подряд в одной категории') {
    return {
      zh: '在同一类别中连续 5 天完成任务',
      ja: '同じカテゴリで5日間連続してクエストを完了する',
      ko: '같은 카테고리에서 5일 연속으로 퀘스트를 완료하세요',
    }
  }
  if (ru === 'Выполните квест до 8 утра') {
    return { zh: '在上午 8 点前完成任务', ja: '午前8時までにクエストを完了する', ko: '오전 8시 이전에 퀘스트를 완료하세요' }
  }
  if (ru === 'Выполните квест после 10 вечера') {
    return { zh: '在晚上 10 点后完成任务', ja: '午後10時以降にクエストを完了する', ko: '오후 10시 이후에 퀘스트를 완료하세요' }
  }
  if (ru === 'Выполните 10 квестов до 7 утра') {
    return {
      zh: '在上午 7 点前完成 10 个任务',
      ja: '午前7時までにクエストを10個完了する',
      ko: '오전 7시 이전에 퀘스트 10개를 완료하세요',
    }
  }
  if (ru === 'Выполните 10 квестов после полуночи') {
    return {
      zh: '在午夜后完成 10 个任务',
      ja: '深夜以降にクエストを10個完了する',
      ko: '자정 이후에 퀘스트 10개를 완료하세요',
    }
  }
  if (ru === 'Выполните квест быстрее чем за половину времени') {
    return {
      zh: '用不到预计时间一半的速度完成任务',
      ja: '予想時間の半分より短い時間でクエストを完了する',
      ko: '예상 시간의 절반보다 빠르게 퀘스트를 완료하세요',
    }
  }
  if ((m = ru.match(/^Выполните (\d+) квестов быстрее половины времени$/))) {
    return {
      zh: `用不到预计时间一半的速度完成 ${m[1]} 个任务`,
      ja: `予想時間の半分より短い時間でクエストを${m[1]}個完了する`,
      ko: `예상 시간의 절반보다 빠르게 퀘스트 ${m[1]}개를 완료하세요`,
    }
  }
  if (ru === 'Выполните квесты всех уровней сложности') {
    return {
      zh: '完成所有难度等级的任务',
      ja: 'すべての難易度のクエストを完了する',
      ko: '모든 난이도의 퀘스트를 완료하세요',
    }
  }
  if (ru === 'Выполните квесты всех уровней сложности 5 раз каждый') {
    return {
      zh: '每个难度等级各完成 5 个任务',
      ja: '各難易度のクエストを5回ずつ完了する',
      ko: '각 난이도의 퀘스트를 5개씩 완료하세요',
    }
  }
  if ((m = ru.match(/^Выполните (\d+) квестов за один день$/))) {
    return {
      zh: `在一天内完成 ${m[1]} 个任务`,
      ja: `1日でクエストを${m[1]}個完了する`,
      ko: `하루에 퀘스트 ${m[1]}개를 완료하세요`,
    }
  }
  if (ru === 'Вернитесь после перерыва в 2 недели') {
    return {
      zh: '休息两周后重返练习',
      ja: '2週間の休みの後に戻る',
      ko: '2주간의 휴식 후 다시 돌아오세요',
    }
  }
  if (ru === 'Вернитесь после перерыва в 30 дней') {
    return {
      zh: '休息 30 天后重返练习',
      ja: '30日間の休みの後に戻る',
      ko: '30일간의 휴식 후 다시 돌아오세요',
    }
  }
  return null
}

async function polishAchievements(): Promise<void> {
  const titles = JSON.parse(
    await fs.readFile(path.join(__dirname, 'achievement-titles-l10n.json'), 'utf8'),
  ) as Record<string, L10n>
  const filePath = path.join(DATA_DIR, 'achievements.json')
  const items = JSON.parse(await fs.readFile(filePath, 'utf8')) as Array<{
    id: string
    title: Record<string, string>
    description: Record<string, string>
  }>

  let missingDesc = 0
  for (const item of items) {
    const titleL10n = titles[item.id]
    if (titleL10n) {
      item.title.zh = titleL10n.zh
      item.title.ja = titleL10n.ja
      item.title.ko = titleL10n.ko
    }
    const desc = translateAchievementDescription(item.description.ru?.trim() ?? '')
    if (desc) {
      item.description.zh = desc.zh
      item.description.ja = desc.ja
      item.description.ko = desc.ko
    } else {
      missingDesc++
      console.warn(`No RU template for ${item.id}: ${item.description.ru}`)
    }
  }
  await fs.writeFile(filePath, JSON.stringify(items, null, 2) + '\n', 'utf8')
  console.log(`Polished achievements.json (${items.length} items, ${missingDesc} desc templates missing)`)
}

const MULTI_LANG_RECORD_RE =
  /\{\s*en:\s*'((?:\\'|[^'])*)'\s*,\s*ru:\s*'((?:\\'|[^'])*)'\s*,\s*zh:\s*'((?:\\'|[^'])*)'\s*,\s*ja:\s*'((?:\\'|[^'])*)'\s*,\s*ko:\s*'((?:\\'|[^'])*)'\s*\}/g

function unescapeTsString(s: string): string {
  return s.replace(/\\'/g, "'")
}

function escapeTsString(s: string): string {
  return s.replace(/'/g, "\\'")
}

function polishSkillText(lang: 'zh' | 'ja' | 'ko', text: string): string {
  const fixes: Record<'zh' | 'ja' | 'ko', Array<[RegExp, string]>> = {
    zh: [
      [/——/g, '，'],
      [/火灾/g, '火焰'],
      [/影响/g, '效果'],
      [/线路质量/g, '线条质量'],
      [/建造/g, '形体构建'],
      [/硕士研究/g, '大师研习'],
      [/窗帘/g, '衣褶'],
      [/内饰/g, '室内'],
      [/哑光绘画/g, '数字绘景'],
      [/价值与轻便/g, '明暗与光影'],
    ],
    ja: [
      [/バリューと光/g, '明暗と光'],
      [/基本ドリル/g, '基本練習'],
      [/モーションインパクト/g, '動きの勢い'],
      [/影響/g, '効果'],
      [/火災/g, '炎'],
      [/等高線/g, '輪郭線'],
      [/回線品質/g, '線の質'],
      [/工事/g, '構造'],
      [/修士課程/g, 'マスター写経'],
      [/カーテン/g, 'ドレープ'],
      [/マット塗装/g, 'マットペインティング'],
      [/期待/g, 'アンティシペーション'],
      [/フォロー/g, 'フォロースルー'],
    ],
    ko: [
      [/——/g, ', '],
      [/관행/g, '연습'],
      [/문체 선택/g, '스타일 선택'],
      [/화재/g, '불꽃'],
      [/등고선/g, '윤곽선'],
      [/석사 연구/g, '마스터 스터디'],
      [/휘장/g, '드레이프'],
      [/매트 페인팅/g, '매트 페인팅'],
      [/원소 같은/g, '원소'],
      [/내러티브를 위한/g, '스토리 전달을 위한'],
      [/장면에 대한/g, '장면용'],
    ],
  }
  let out = text
  for (const [re, rep] of fixes[lang]) out = out.replace(re, rep)
  return out
}

async function polishSkillTree(): Promise<void> {
  const glossary = JSON.parse(
    await fs.readFile(path.join(__dirname, 'art-data-glossary.json'), 'utf8'),
  ) as { entries: Record<string, Partial<L10n>> }
  const filePath = path.join(DATA_DIR, 'skillTree.ts')
  let source = await fs.readFile(filePath, 'utf8')

  source = source.replace(
    new RegExp(MULTI_LANG_RECORD_RE.source, 'g'),
    (_full, enRaw: string, ruRaw: string, zhRaw: string, jaRaw: string, koRaw: string) => {
      const en = unescapeTsString(enRaw)
      const override = glossary.entries[en]
      const current = {
        zh: unescapeTsString(zhRaw),
        ja: unescapeTsString(jaRaw),
        ko: unescapeTsString(koRaw),
      }
      const parts = [`en: '${enRaw}'`, `ru: '${ruRaw}'`]
      for (const lang of ['zh', 'ja', 'ko'] as const) {
        const base = override?.[lang] ?? current[lang]
        parts.push(`${lang}: '${escapeTsString(polishSkillText(lang, base))}'`)
      }
      return `{ ${parts.join(', ')} }`
    },
  )
  await fs.writeFile(filePath, source, 'utf8')
  console.log('Polished skillTree.ts')
}

async function main(): Promise<void> {
  await polishAchievements()
  await polishSkillTree()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
