/**
 * Bulk-fix quest copy for ru / zh / ja / ko.
 *
 * Usage: npx tsx scripts/fix-quest-l10n.ts [--write] [--locale=ru|zh|ja|ko]
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LEX,
  QUEST_FILES,
  type QuestLocale,
  type QuestRow,
  trLex,
  hasLatinLeak,
  unexpectedLatin,
} from './quest-l10n-shared.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')
const WRITE = process.argv.includes('--write')
const localeArg = process.argv.find((a) => a.startsWith('--locale='))?.split('=')[1]
const LOCALES: QuestLocale[] = localeArg
  ? [localeArg as QuestLocale]
  : ['ru', 'zh', 'ja', 'ko']

const RU_IMPERATIVE: Record<string, string> = {
  'Нарисовать': 'Нарисуй',
  'Изучить': 'Изучи',
  'Сделать': 'Сделай',
  'Подобрать': 'Подбери',
  'Добавить': 'Добавь',
  'Создать': 'Создай',
  'Анимировать': 'Анимируй',
  'Спроектировать': 'Спроектируй',
  'Адаптировать': 'Адаптируй',
  'Завершить': 'Заверши',
  'Расписать': 'Распиши',
  'Копировать': 'Скопируй',
  'Копия': 'Скопируй',
}

const PHRASES: Record<QuestLocale, [RegExp, string][]> = {
  ru: [
    [/Value distillation — (\d+) тона/g, 'Нарисуй сведение тонов — $1 тона'],
    [/shape language/gi, 'язык форм'],
    [/rule of thirds/gi, 'правило третей'],
    [/squash and stretch/gi, 'сжатие и растяжение'],
    [/squash & stretch/gi, 'сжатие и растяжение'],
    [/Slow-in\/slow-out/gi, 'Замедление на входе/выходе'],
    [/slow in\/out/gi, 'замедление на входе и выходе'],
    [/Lip sync-лист/gi, 'Лист синхронизации губ'],
    [/Lip sync/gi, 'Синхронизация губ'],
    [/Smear-полоса/gi, 'Полоса смаза'],
    [/\bSmear\b/g, 'Смаз'],
    [/Idle \/ дыхание/gi, 'Пассивный цикл / дыхание'],
    [/FX миниатюры/gi, 'Миниатюры эффекта'],
    [/FX-луп/gi, 'Цикл эффекта'],
    [/FX-шот/gi, 'Кадр с эффектом'],
    [/Follow-through/gi, 'Дотягивание'],
    [/Overlapping action/gi, 'Перекрывающее действие'],
    [/Secondary action/gi, 'Вторичное действие'],
    [/Solid drawing/gi, 'Чёткий объём'],
    [/\bspacing\b/gi, 'интервалы'],
    [/in-between/gi, 'промежуточные кадры'],
    [/foreshortening/gi, 'ракурс с укорочением'],
    [/fg\/mg\/bg/gi, 'передний / средний / задний план'],
    [/highlight\/mid\/shadow/gi, 'свет / полутон / тень'],
    [/timing chart/gi, 'диаграмма тайминга'],
    [/\bslow-out\b/gi, 'замедление на выходе'],
    [/\bslow-in\b/gi, 'замедление на входе'],
    [/входе\/out/gi, 'входе и выходе'],
    [/\banticipation\b/gi, 'предварительное движение'],
    [/\bidle\b/gi, 'пассивный цикл'],
    [/\bsquash\b/gi, 'сжатие'],
    [/\bstretch\b/gi, 'растяжение'],
    [/\bsmear\b/gi, 'смаз'],
    [/\bimpact\b/gi, 'удар'],
    [/\bpassing\b/gi, 'проходная'],
    [/\bcontact\b/gi, 'опорная'],
    [/\bbreakdown\b/gi, 'промежуточная проработка'],
    [/onion skin/gi, 'луковичная кожа'],
    [/model sheet/gi, 'лист модели'],
    [/playblast/gi, 'пробный рендер'],
    [/\bindustrial\b/gi, 'промышленный'],
    [/atmospheresphere/gi, 'атмосфера'],
    [/running with flight/gi, 'бега с полётом'],
    [/Magical Energy/gi, 'магическая энергия'],
    [/(\d+-\d+)\s*hours/gi, '$1 ч'],
  ],
  zh: [
    [/价值蒸馏[^—]*—?\s*(\d+)\s*个?价值?/g, '概括明暗 — $1 阶'],
    [/Value distillation[^—]*—?\s*(\d+)/gi, '概括明暗 — $1 阶'],
    [/shape language/gi, '形状语言'],
    [/rule of thirds/gi, '三分法'],
    [/squash and stretch/gi, '挤压与拉伸'],
    [/fg\/mg\/bg/gi, '前景 / 中景 / 背景'],
    [/\btriumph\b/gi, '凯旋'],
    [/\bClimax\b/g, '高潮'],
    [/Emotional Arc/gi, '情感弧线'],
    [/Showreel/gi, '作品集镜头'],
    [/Flipbook/gi, '翻页动画'],
    [/Genga/gi, '原画'],
    [/Mocap/gi, '动捕'],
    [/Primitives：/g, '基本几何体：'],
    [/Primitives:/g, '基本几何体：'],
    [/精通window/gi, '大师临摹：窗景'],
    [/\bwindow\b/gi, '窗景'],
    [/\bCreature\b/g, '生物'],
    [/Extreme Angles/gi, '极端角度'],
    [/ecorche/gi, '肌肉解剖模型'],
    [/\bLOD\b/g, 'LOD'],
    [/highlight\/mid\/shadow/gi, '高光 / 中间调 / 阴影'],
    [/timing chart/gi, '时间轴图表'],
    [/\bsquash\b/gi, '挤压'],
    [/\bstretch\b/gi, '拉伸'],
    [/\banticipation\b/gi, '预备动作'],
    [/\bovershoot\b/gi, '过冲'],
    [/\bpassing\b/gi, '过渡'],
    [/\bcontact\b/gi, '接触'],
    [/\bsmear\b/gi, '动态模糊'],
    [/\bbreakdown\b/gi, '中间帧分解'],
    [/onion skin/gi, '洋葱皮'],
    [/model sheet/gi, '设定图'],
    [/playblast/gi, '预演'],
    [/Atmospheric Effects/gi, '大气效果'],
    [/Water Splashes/gi, '水花'],
    [/\bLiquid\b/g, '液体'],
    [/Speed FX/gi, '快速特效'],
    [/Stylized FX/gi, '风格化特效'],
    [/Multi FX/gi, '多重特效'],
    [/FX animation integration/gi, '特效动画整合'],
    [/FX storytelling/gi, '特效叙事'],
    [/running with flight/gi, '奔跑与飞行'],
    [/Magical Energy/gi, '魔法能量'],
    [/atmospheresphere/gi, '大气'],
    [/\bindustrial\b/gi, '工业'],
    [/(\d+-\d+)\s*hours/gi, '$1 小时'],
    [/\bFX\b/g, '特效'],
    [/スタイライズドFX/g, '风格化特效'],
    [/マルチFX/g, '多重特效'],
    [/スピードFX/g, '快速特效'],
    [/\bEase-in\b/gi, '缓入'],
    [/ vs /g, ' 对比 '],
    [/Silent Story/gi, '无声叙事'],
    [/Emotion Swap/gi, '情绪互换'],
    [/dark sphere/gi, '暗球'],
  ],
  ja: [
    [/価値蒸留[^—]*—?\s*(\d+)/g, 'トーンを$1段階に簡略化して描く'],
    [/Value distillation[^—]*—?\s*(\d+)/gi, 'トーンを$1段階に簡略化して描く'],
    [/shape language/gi, '形状言語'],
    [/rule of thirds/gi, '三分割法'],
    [/squash and stretch/gi, 'スカッシュとストレッチ'],
    [/fg\/mg\/bg/gi, '前景 / 中景 / 背景'],
    [/Bouncing Ball \(Subtext\)/gi, 'バウンスボール（サブテキスト）'],
    [/Dialogue でスカッシュ/gi, '会話シーンのスカッシュ'],
    [/\bCreature\b/g, 'クリーチャー'],
    [/Extreme Angles/gi, '極端なアングル'],
    [/Sword Slash Arc/gi, '剣の斬撃アーク'],
    [/\bLOD\b/g, 'LOD'],
    [/highlight\/mid\/shadow/gi, 'ハイライト / ミドル / シャドウ'],
    [/timing chart/gi, 'タイミングチャート'],
    [/\banticipation\b/gi, 'アンティシペーション'],
    [/\bovershoot\b/gi, 'オーバーシュート'],
    [/\bpassing\b/gi, 'パッシング'],
    [/\bcontact\b/gi, 'コンタクト'],
    [/\bsmear\b/gi, 'スミア'],
    [/\bsquash\b/gi, 'スカッシュ'],
    [/\bstretch\b/gi, 'ストレッチ'],
    [/\bbreakdown\b/gi, 'ブレイクダウン'],
    [/onion skin/gi, 'オニオンスキン'],
    [/model sheet/gi, 'モデルシート'],
    [/playblast/gi, 'プレイブラスト'],
    [/Atmospheric Effects/gi, '大気効果'],
    [/Water Splashes/gi, '水しぶき'],
    [/\bLiquid\b/g, '液体'],
    [/Speed FX/gi, 'スピードFX'],
    [/Stylized FX/gi, 'スタイライズドFX'],
    [/Multi FX/gi, 'マルチFX'],
    [/FX animation integration/gi, 'エフェクトアニメーション統合'],
    [/FX storytelling/gi, 'エフェクト・ストーリーテリング'],
    [/running with flight/gi, '飛行を伴う走り'],
    [/Magical Energy/gi, '魔法エネルギー'],
    [/atmospheresphere/gi, '大気'],
    [/\bindustrial\b/gi, '工業'],
    [/(\d+-\d+)\s*hours/gi, '$1時間'],
    [/\bFX\b/g, 'エフェクト'],
    [/スタイライズドFX/g, 'スタイライズドエフェクト'],
    [/マルチFX/g, 'マルチエフェクト'],
    [/スピードFX/g, 'スピードエフェクト'],
    [/\bEase-in\b/gi, 'イーズイン'],
    [/ vs /g, ' 対 '],
    [/Silent Story/gi, 'サイレントストーリー'],
    [/Emotion Swap/gi, '感情スワップ'],
    [/dark sphere/gi, '暗い球体'],
  ],
  ko: [
    [/가치 증류[^—]*—?\s*(\d+)/g, '톤 $1단계로 단순화하여 그리기'],
    [/Value distillation[^—]*—?\s*(\d+)/gi, '톤 $1단계로 단순화하여 그리기'],
    [/shape language/gi, '형태 언어'],
    [/rule of thirds/gi, '삼분할 법칙'],
    [/squash and stretch/gi, '스쿼시 앤 스트레치'],
    [/fg\/mg\/bg/gi, '전경 / 중경 / 후경'],
    [/\bClimax\b/g, '클라이맥스'],
    [/\bTriumph\b/g, '승리'],
    [/Emotional Arc/gi, '감정선'],
    [/Simple Cycle/gi, '단순한 사이클'],
    [/Pro 레벨/g, '프로 수준'],
    [/Pro level/gi, '프로 수준'],
    [/Mocap/gi, '모션 캡처'],
    [/Extreme Angles/gi, '극단적 각도'],
    [/Sword Slash Arc/gi, '검 슬래시 아크'],
    [/Cat Paw Structure/gi, '고양이 발 구조'],
    [/Ease-In\/Ease-In\/Out/gi, '이즈-인 / 이즈-인·아웃'],
    [/\bLOD\b/g, 'LOD'],
    [/highlight\/mid\/shadow/gi, '하이라이트 / 미드톤 / 섀도'],
    [/timing chart/gi, '타이밍 차트'],
    [/\banticipation\b/gi, '예비 동작'],
    [/\bovershoot\b/gi, '오버슈트'],
    [/\bpassing\b/gi, '패싱'],
    [/\bcontact\b/gi, '컨택'],
    [/\bsmear\b/gi, '스미어'],
    [/\bsquash\b/gi, '스쿼시'],
    [/\bstretch\b/gi, '스트레치'],
    [/\bbreakdown\b/gi, '브레이크다운'],
    [/onion skin/gi, '어니언 스킨'],
    [/model sheet/gi, '모델 시트'],
    [/playblast/gi, '플레이블라스트'],
    [/Atmospheric Effects/gi, '대기 효과'],
    [/Water Splashes/gi, '물 튀김'],
    [/\bLiquid\b/g, '액체'],
    [/Speed FX/gi, '스피드 FX'],
    [/Stylized FX/gi, '양식화 FX'],
    [/Multi FX/gi, '멀티 FX'],
    [/FX animation integration/gi, 'FX 애니메이션 통합'],
    [/FX storytelling/gi, 'FX 스토리텔링'],
    [/Dialogue에서/g, '대화에서'],
    [/running with flight/gi, '비행이 있는 달리기'],
    [/Magical Energy/gi, '마법 에너지'],
    [/atmospheresphere/gi, '대기'],
    [/\bindustrial\b/gi, '산업'],
    [/(\d+-\d+)\s*hours/gi, '$1시간'],
    [/\bFX\b/g, '이펙트'],
    [/양식화 FX/g, '양식화 이펙트'],
    [/멀티 FX/g, '멀티 이펙트'],
    [/스피드 FX/g, '스피드 이펙트'],
    [/\bEase-in\b/gi, '이즈-인'],
    [/ vs /g, ' 대비 '],
    [/Magic Hit/gi, '마법 타격'],
    [/Silent Story/gi, '무성 스토리'],
    [/Emotion Swap/gi, '감정 교환'],
    [/dark sphere/gi, '어두운 구체'],
    [/Healing Sparkles/gi, '치유 반짝임'],
  ],
}

const BAD_REBUILD: Record<QuestLocale, RegExp> = {
  ru: /Value distillation|[A-Za-z]{3,}/,
  zh: /价值蒸馏|Value distillation|FX |Stylized|Speed FX|Atmospheric Effects|Water Splashes|精通window|Primitives|Design a readable|Frame \w+ \(|fg\/mg\/bg|triumph|Climax|Showreel|Flipbook|Genga|Mocap|Creature|Extreme Angles|ecorche|Sword Slash|Cat Paw|Ease-In|Liquid/i,
  ja: /価値蒸留|Value distillation|FX |Stylized|Speed FX|Atmospheric Effects|Bouncing Ball|Dialogue で|Creature の|Extreme Angles|Sword Slash|triadic/i,
  ko: /가치 증류|Value distillation|FX |Stylized|Speed FX|Atmospheric Effects|Climax|Triumph|Simple Cycle|Pro level|Mocap|Extreme Angles|Sword Slash|Cat Paw|Ease-In|Liquid/i,
}

function shouldRebuild(locale: QuestLocale, text: string): boolean {
  return hasLatinLeak(text) || BAD_REBUILD[locale].test(text)
}

function applyPhrases(locale: QuestLocale, text: string): string {
  let s = text
  for (const [re, rep] of PHRASES[locale]) s = s.replace(re, rep)
  return s
}

function toRuImperative(title: string): string {
  for (const [inf, imp] of Object.entries(RU_IMPERATIVE)) {
    if (title.startsWith(`${inf} `)) return imp + title.slice(inf.length)
  }
  return title
}

function pick(locale: QuestLocale, templates: Record<QuestLocale, string>): string {
  return templates[locale]
}

function rebuildTitle(locale: QuestLocale, en: string): string | null {
  const e = en.trim()
  const tr = (s: string) => trLex(locale, s)

  let m = e.match(/^Value distillation — (\d+) values$/i)
  if (m) {
    const n = m[1]
    switch (locale) {
      case 'ru':
        return `Нарисуй сведение тонов — ${n} тона`
      case 'zh':
        return `概括明暗 — ${n} 阶`
      case 'ja':
        return `トーンを${n}段階に簡略化して描く`
      case 'ko':
        return `톤 ${n}단계로 단순화하여 그리기`
    }
  }

  m = e.match(/^Design a readable (.+?) silhouette$/i)
  if (m) {
    const inner = m[1].trim()
    const paren = inner.match(/^(.+?) \((.+)\)$/)
    if (paren) {
      switch (locale) {
        case 'ru':
          return `Сделай читаемый силуэт: ${tr(paren[1])} (${tr(paren[2])})`
        case 'zh':
          return `设计清晰剪影：${tr(paren[1])}（${tr(paren[2])}）`
        case 'ja':
          return `読みやすい${tr(paren[1])}（${tr(paren[2])}）のシルエットを描く`
        case 'ko':
          return `읽기 쉬운 ${tr(paren[1])}(${tr(paren[2])}) 실루엣 만들기`
      }
    }
    switch (locale) {
      case 'ru':
        return `Сделай читаемый силуэт: ${tr(inner)}`
      case 'zh':
        return `设计清晰剪影：${tr(inner)}`
      case 'ja':
        return `読みやすい${tr(inner)}のシルエットを描く`
      case 'ko':
        return `읽기 쉬운 ${tr(inner)} 실루엣 만들기`
    }
  }

  m = e.match(/^Frame (.+?) \((.+?)\) with strong composition$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Подбери кадрирование: ${tr(m[1])} (${tr(m[2])}, правило третей)`
      case 'zh':
        return `调整构图：${tr(m[1])}（${tr(m[2])}，三分法）`
      case 'ja':
        return `${tr(m[1])}をフレーミング（${tr(m[2])}、三分割法）`
      case 'ko':
        return `구도 잡기: ${tr(m[1])} (${tr(m[2])}, 삼분할 법칙)`
    }
  }

  m = e.match(/^Draw (.+?) in perspective$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Нарисуй в перспективе: ${tr(m[1])}`
      case 'zh':
        return `绘制透视：${tr(m[1])}`
      case 'ja':
        return `${tr(m[1])}をパースで描く`
      case 'ko':
        return `${tr(m[1])} 원근법으로 그리기`
    }
  }

  m = e.match(/^Lay out a simple sequence: (.+?)(?: \((.+?)\))?$/i)
  if (m) {
    const extra = m[2] ? (locale === 'zh' ? `（${tr(m[2])}）` : ` (${tr(m[2])})`) : ''
    switch (locale) {
      case 'ru':
        return `Сделай простой макет сцены: ${tr(m[1])}${extra} (2–3 панели)`
      case 'zh':
        return `绘制简单分镜：${tr(m[1])}${extra}（2–3 格）`
      case 'ja':
        return `シンプルなシーケンスをレイアウト：${tr(m[1])}${extra}（2–3コマ）`
      case 'ko':
        return `간단한 시퀀스 레이아웃: ${tr(m[1])}${extra} (2–3 패널)`
    }
  }

  m = e.match(/^Animate squash and stretch: (.+)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Анимируй сжатие и растяжение: ${tr(m[1])}`
      case 'zh':
        return `动画挤压与拉伸：${tr(m[1])}`
      case 'ja':
        return `スカッシュとストレッチをアニメーション：${tr(m[1])}`
      case 'ko':
        return `스쿼시 앤 스트레치 애니메이션: ${tr(m[1])}`
    }
  }

  m = e.match(/^Add anticipation: (.+?) \(before action\)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Добавь предварительное движение: ${tr(m[1])} (перед действием)`
      case 'zh':
        return `添加预备动作：${tr(m[1])}（动作前）`
      case 'ja':
        return `アンティシペーションを追加：${tr(m[1])}（動作前）`
      case 'ko':
        return `예비 동작 추가: ${tr(m[1])} (동작 전)`
    }
  }

  m = e.match(/^Make a master study of (.+?) \(technique analysis\)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Сделай этюд по работе мастера: ${tr(m[1])} (анализ техники)`
      case 'zh':
        return `大师临摹：${tr(m[1])}（技法分析）`
      case 'ja':
        return `${tr(m[1])}のマスタースタディ（技法分析）`
      case 'ko':
        return `${tr(m[1])} 마스터 스터디 (기법 분석)`
    }
  }

  m = e.match(/^Primitives: (.+?) from basic shapes$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Нарисуй примитивы: ${tr(m[1])} из базовых форм`
      case 'zh':
        return `基本几何体：用基本形状绘制${tr(m[1])}`
      case 'ja':
        return `基本形状から${tr(m[1])}を描く（プリミティブ）`
      case 'ko':
        return `기본 형태로 ${tr(m[1])} 그리기 (프리미티브)`
    }
  }

  m = e.match(/^Final VFX shot pipeline: (.+)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Финальный VFX-кадр: ${tr(m[1])}`
      case 'zh':
        return `最终 VFX 镜头：${tr(m[1])}`
      case 'ja':
        return `最終VFXショット：${tr(m[1])}`
      case 'ko':
        return `최종 VFX 샷: ${tr(m[1])}`
    }
  }

  m = e.match(/^Studio Style Analysis: (.+?) \(Ufotable\/Pixar\)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Анализ студийного стиля: ${tr(m[1])} (Ufotable / Pixar)`
      case 'zh':
        return `工作室风格分析：${tr(m[1])}（Ufotable / Pixar）`
      case 'ja':
        return `スタジオスタイル分析：${tr(m[1])}（Ufotable / Pixar）`
      case 'ko':
        return `스튜디오 스타일 분석: ${tr(m[1])} (Ufotable / Pixar)`
    }
  }

  m = e.match(/^Studio Effect Study: (.+?) \(Ufotable\/Pixar\)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Скопируй студийный эффект: ${tr(m[1])} (Ufotable / Pixar)`
      case 'zh':
        return `临摹工作室特效：${tr(m[1])}（Ufotable / Pixar）`
      case 'ja':
        return `スタジオエフェクト研究：${tr(m[1])}（Ufotable / Pixar）`
      case 'ko':
        return `스튜디오 이펙트 연구: ${tr(m[1])} (Ufotable / Pixar)`
    }
  }

  m = e.match(/^15 NPC Face Generator$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return '15 лиц NPC'
      case 'zh':
        return '15 张 NPC 面部'
      case 'ja':
        return 'NPCの顔15パターン'
      case 'ko':
        return 'NPC 얼굴 15종'
    }
  }

  m = e.match(/^Depth layers: (.+?) \((.+?)\) \(fg\/mg\/bg\)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return `Глубинные слои: ${tr(m[1])} (${tr(m[2])}) (передний / средний / задний план)`
      case 'zh':
        return `景深层次：${tr(m[1])}（${tr(m[2])}）（前景 / 中景 / 背景）`
      case 'ja':
        return `深度レイヤー：${tr(m[1])}（${tr(m[2])}）（前景 / 中景 / 背景）`
      case 'ko':
        return `깊이 레이어: ${tr(m[1])} (${tr(m[2])}) (전경 / 중경 / 후경)`
    }
  }

  m = e.match(/^Animate a dialogue scene: Bouncing Ball \(Subtext\)$/i)
  if (m) {
    switch (locale) {
      case 'ru':
        return 'Анимируй диалоговую сцену: мячик (подтекст)'
      case 'zh':
        return '动画对话场景：弹跳球（潜台词）'
      case 'ja':
        return '会話シーンをアニメーション：バウンスボール（サブテキスト）'
      case 'ko':
        return '대화 장면 애니메이션: 바운스볼 (서브텍스트)'
    }
  }

  m = e.match(/^Reel-ready scene: Simple Cycle \(Pro level\)$/i)
  if (m) {
    return pick(locale, {
      ru: 'Сцена для рилса: простой цикл (профессиональный уровень)',
      zh: '作品集场景：简单循环（专业级）',
      ja: 'リール用シーン：シンプルサイクル（プロレベル）',
      ko: '릴 준비 장면: 단순한 사이클 (프로 수준)',
    })
  }

  m = e.match(/^FX animation integration: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Интеграция FX-анимации: ${tr(m[1])}`,
      zh: `特效动画整合：${tr(m[1])}`,
      ja: `エフェクトアニメーション統合：${tr(m[1])}`,
      ko: `이펙트 애니메이션 통합: ${tr(m[1])}`,
    })
  }

  m = e.match(/^FX storytelling: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `FX-нарратив: ${tr(m[1])}`,
      zh: `特效叙事：${tr(m[1])}`,
      ja: `エフェクト・ストーリーテリング：${tr(m[1])}`,
      ko: `이펙트 스토리텔링: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Stylized FX: (.+?) \((.+?)\)$/i)
  if (m) {
    return pick(locale, {
      ru: `Стилизованный FX: ${tr(m[1])} (${tr(m[2])})`,
      zh: `风格化特效：${tr(m[1])}（${tr(m[2])}）`,
      ja: `スタイライズドFX：${tr(m[1])}（${tr(m[2])}）`,
      ko: `양식화 이펙트: ${tr(m[1])} (${tr(m[2])})`,
    })
  }

  m = e.match(/^Multi-FX scene composition: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Композиция сцены с несколькими FX: ${tr(m[1])}`,
      zh: `多重特效场景合成：${tr(m[1])}`,
      ja: `マルチFXシーン構成：${tr(m[1])}`,
      ko: `멀티 FX 장면 구성: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Speed FX challenge: (.+?) \((.+?)\)$/i)
  if (m) {
    const time = m[2].replace(/(\d+-\d+)\s*hours/i, (_, range: string) => {
      switch (locale) {
        case 'ru':
          return `${range} ч`
        case 'zh':
          return `${range} 小时`
        case 'ja':
          return `${range}時間`
        case 'ko':
          return `${range}시간`
      }
      return range
    })
    return pick(locale, {
      ru: `Speed FX: ${tr(m[1])} (${time})`,
      zh: `快速特效挑战：${tr(m[1])}（${time}）`,
      ja: `スピードエフェクトチャレンジ：${tr(m[1])}（${time}）`,
      ko: `스피드 이펙트 챌린지: ${tr(m[1])} (${time})`,
    })
  }

  m = e.match(/^FX direction & focus control: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Направление и фокус FX: ${tr(m[1])}`,
      zh: `特效方向与焦点控制：${tr(m[1])}`,
      ja: `FXの方向と焦点制御：${tr(m[1])}`,
      ko: `FX 방향 및 포커스 제어: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Paint an atmospheric (.+?) \((.+?)\) scene$/i)
  if (m) {
    return pick(locale, {
      ru: `Нарисуй атмосферную сцену: ${tr(m[1])} (${tr(m[2])})`,
      zh: `绘制大气场景：${tr(m[1])}（${tr(m[2])}）`,
      ja: `大気的な${tr(m[1])}のシーンを描く（${tr(m[2])}）`,
      ko: `대기 장면 그리기: ${tr(m[1])} (${tr(m[2])})`,
    })
  }

  m = e.match(/^Seamless loop: (.+?) \((?:seamless loop|Seamless Loop)\)$/i)
  if (m) {
    return pick(locale, {
      ru: `Бесшовный цикл: ${tr(m[1])} (бесшовный цикл)`,
      zh: `无缝循环：${tr(m[1])}（无缝循环）`,
      ja: `シームレスループ：${tr(m[1])}（シームレスループ）`,
      ko: `원활한 루프: ${tr(m[1])}(원활한 루프)`,
    })
  }

  m = e.match(/^Brief-based FX: (.+?) \((.+?)\) \((.+?)\)$/i)
  if (m) {
    return pick(locale, {
      ru: `FX по брифу: ${tr(m[1])} (${tr(m[2])}, ${tr(m[3])})`,
      zh: `基于简介的特效：${tr(m[1])}（${tr(m[2])}，${tr(m[3])}）`,
      ja: `ブリーフベースFX：${tr(m[1])}（${tr(m[2])}、${tr(m[3])}）`,
      ko: `브리프 기반 FX: ${tr(m[1])} (${tr(m[2])}, ${tr(m[3])})`,
    })
  }

  m = e.match(/^Physics-based simulation: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Физическая симуляция: ${tr(m[1])}`,
      zh: `物理模拟：${tr(m[1])}`,
      ja: `物理ベースのシミュレーション：${tr(m[1])}`,
      ko: `물리 기반 시뮬레이션: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Break down (.+?) into multiple layers$/i)
  if (m) {
    return pick(locale, {
      ru: `Разбей на слои: ${tr(m[1])}`,
      zh: `分层拆解：${tr(m[1])}`,
      ja: `${tr(m[1])}を複数レイヤーに分解`,
      ko: `${tr(m[1])}을 여러 레이어로 분해`,
    })
  }

  m = e.match(/^Optimization for performance: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Оптимизация производительности: ${tr(m[1])}`,
      zh: `性能优化：${tr(m[1])}`,
      ja: `パフォーマンス最適化：${tr(m[1])}`,
      ko: `성능 최적화: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Cinematic scale & drama: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Кинематографический масштаб: ${tr(m[1])}`,
      zh: `电影级规模与戏剧感：${tr(m[1])}`,
      ja: `シネマティックなスケール：${tr(m[1])}`,
      ko: `시네마틱 스케일: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Procedural generation rules: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Процедурная генерация: ${tr(m[1])}`,
      zh: `程序化生成规则：${tr(m[1])}`,
      ja: `プロシージャル生成ルール：${tr(m[1])}`,
      ko: `절차적 생성 규칙: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Show how (.+?) interacts with a surface$/i)
  if (m) {
    return pick(locale, {
      ru: `Покажи взаимодействие с поверхностью: ${tr(m[1])}`,
      zh: `展示与表面的交互：${tr(m[1])}`,
      ja: `表面との相互作用を示す：${tr(m[1])}`,
      ko: `표면과의 상호작용 표현: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Secondary particles: (.+?) \((.+?)\)$/i)
  if (m) {
    return pick(locale, {
      ru: `Вторичные частицы: ${tr(m[1])} (${tr(m[2])})`,
      zh: `次级粒子：${tr(m[1])}（${tr(m[2])}）`,
      ja: `セカンダリパーティクル：${tr(m[1])}（${tr(m[2])}）`,
      ko: `보조 파티클: ${tr(m[1])} (${tr(m[2])})`,
    })
  }

  m = e.match(/^FX animation: (.+?) \((.+?)\) \((.+?)\)$/i)
  if (m) {
    return pick(locale, {
      ru: `FX-анимация: ${tr(m[1])} (${tr(m[2])}, ${tr(m[3])})`,
      zh: `特效动画：${tr(m[1])}（${tr(m[2])}，${tr(m[3])}）`,
      ja: `エフェクトアニメーション：${tr(m[1])}（${tr(m[2])}、${tr(m[3])}）`,
      ko: `이펙트 애니메이션: ${tr(m[1])}(${tr(m[2])})(${tr(m[3])})`,
    })
  }

  m = e.match(/^Reel-ready scene: (.+?) \((.+?)\)$/i)
  if (m) {
    return pick(locale, {
      ru: `Сцена для рилса: ${tr(m[1])} (${tr(m[2])})`,
      zh: `作品集场景：${tr(m[1])}（${tr(m[2])}）`,
      ja: `リール用シーン：${tr(m[1])}（${tr(m[2])}）`,
      ko: `릴 준비 장면: ${tr(m[1])} (${tr(m[2])})`,
    })
  }

  m = e.match(/^Circle (\d+) favorites for tomorrow$/i)
  if (m) {
    return pick(locale, {
      ru: `Обведи ${m[1]} лучших для повтора`,
      zh: `圈出 ${m[1]} 个明日要练习的优选`,
      ja: `明日のお気に入りを ${m[1]} つ丸で囲む`,
      ko: `내일 연습할 ${m[1]}개를 동그라미 치기`,
    })
  }

  m = e.match(/^Create a two-layer «dark sphere» effect with a base layer and a detail layer$/i)
  if (m) {
    return pick(locale, {
      ru: 'Создай двухслойный эффект «тёмная сфера»: основной и детальный слои',
      zh: '用基础层和细节层创建两层「暗球」效果',
      ja: 'ベースレイヤーとディテールレイヤーで2層の「暗い球体」エフェクトを作る',
      ko: '기본 레이어와 디테일 레이어로 2레이어 「어두운 구체」 이펙트 만들기',
    })
  }

  m = e.match(/^Magic hit spritesheet: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `Лист спрайтов магического удара: ${tr(m[1])}`,
      zh: `魔法打击精灵表：${tr(m[1])}`,
      ja: `魔法ヒットスプライトシート：${tr(m[1])}`,
      ko: `마법 타격 스프라이트 시트: ${tr(m[1])}`,
    })
  }

  m = e.match(/^Square vs round personality$/i)
  if (m) {
    return pick(locale, {
      ru: 'Квадратная и круглая форма характера',
      zh: '方与圆的性格对比',
      ja: '四角と丸の性格対比',
      ko: '정사각형과 둥근 성격의 대비',
    })
  }

  m = e.match(/^Object falls with acceleration — timing chart \+ 6 frames\. Note ease-in to ground\.$/i)
  if (m) {
    return pick(locale, {
      ru: 'Падение с ускорением — график + 6 кадров. Замедление на входе к земле.',
      zh: '物体加速下落 — 时序图 + 6 帧。注意着地前的缓入。',
      ja: '加速度を伴う落下 — タイミングチャート + 6 フレーム。地面へのイーズインに注意。',
      ko: '물체는 가속도에 따라 떨어집니다. 타이밍 차트 + 6프레임. 지면 착지 전 이즈-인을 참고하세요.',
    })
  }

  m = e.match(/^3 quick exploratory sketches for: (.+)$/i)
  if (m) {
    return pick(locale, {
      ru: `3 быстрых разведывательных наброска: ${tr(m[1])}`,
      zh: `3 个快速探索草图：${tr(m[1])}`,
      ja: `3 つの簡単な探索スケッチ: ${tr(m[1])}`,
      ko: `${tr(m[1])}에 대한 3가지 빠른 탐색 스케치`,
    })
  }

  return null
}

function fixText(locale: QuestLocale, text: string, en: string | undefined, kind: 'title' | 'body'): string {
  let s = applyPhrases(locale, text)
  if (en) {
    const rebuilt = rebuildTitle(locale, en)
    const rebuildOk = kind === 'title' ? shouldRebuild(locale, s) : hasLatinLeak(s)
    if (rebuilt && rebuildOk) s = rebuilt
  }
  if (kind === 'title' && locale === 'ru') s = toRuImperative(s)
  s = applyPhrases(locale, s)
  if (unexpectedLatin(s).length > 0) s = trLex(locale, s)
  s = applyPhrases(locale, s)
  return s.replace(/\s{2,}/g, ' ').trim()
}

async function main(): Promise<void> {
  let changed = 0
  const remaining: Record<QuestLocale, number> = { ru: 0, zh: 0, ja: 0, ko: 0 }

  for (const file of QUEST_FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as QuestRow[]
    let fileChanged = 0

    for (const q of quests) {
      for (const locale of LOCALES) {
        const patchField = (field: 'title' | 'description') => {
          const before = q[field][locale]
          const after = fixText(locale, before, q[field].en, field === 'title' ? 'title' : 'body')
          if (after !== before) {
            q[field][locale] = after
            fileChanged++
            changed++
          }
          if (unexpectedLatin(q[field][locale]).length > 0) remaining[locale]++
        }
        patchField('title')
        patchField('description')

        for (const mc of q.microChallenges ?? []) {
          const before = mc.instruction[locale]
          const after = fixText(locale, before, mc.instruction.en, 'body')
          if (after !== before) {
            mc.instruction[locale] = after
            fileChanged++
            changed++
          }
          if (unexpectedLatin(mc.instruction[locale]).length > 0) remaining[locale]++
        }
      }
    }

    if (WRITE && fileChanged > 0) {
      await fs.writeFile(filePath, `${JSON.stringify(quests, null, 2)}\n`, 'utf8')
    }
    console.log(`${file}: ${fileChanged} field updates`)
  }

  console.log(`\nTotal updated: ${changed}`)
  for (const locale of LOCALES) {
    console.log(`Remaining unexpected Latin (${locale}): ${remaining[locale]}`)
  }
  if (!WRITE) console.log('\nDry run — pass --write to apply.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
