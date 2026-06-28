/**
 * Polish zh/ja/ko UI locale files via targeted string fixes (preserves all keys).
 * Usage: npx tsx scripts/polish-ui-locales.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = path.join(__dirname, '..', 'src/renderer/i18n/locales')

type Lang = 'zh' | 'ja' | 'ko'

/** Scoped replacements (safe context, first match). */
const VALUE_FIXES: Record<Lang, Array<[string, string]>> = {
  zh: [
    ['"totalLevel": "总水平"', '"totalLevel": "总等级"'],
    ['"activeQuest": "主动任务"', '"activeQuest": "进行中的任务"'],
    ['"viewRecommended": "受到推崇的"', '"viewRecommended": "推荐"'],
    ['"viewAll": "浏览全部"', '"viewAll": "查看全部"'],
    ['"quickDifficulty": "有多难？"', '"quickDifficulty": "难度如何？"'],
    ['"mediumDigital": "数字的"', '"mediumDigital": "数字"'],
    ['"completed": "完全的"', '"completed": "已完成"'],
    ['"complete": "完全的"', '"complete": "完成"'],
    [
      '"xpEconomyHint": "Quest XP 是著名的； ~25% 变成技能 XP 加时间奖励。"',
      '"xpEconomyHint": "任务经验值计入技能树；练习时长与加成倍率也会生效。"',
    ],
    ['"reviewTitle": "需要审查的技能"', '"reviewTitle": "待复习技能"'],
    ['"reviewDueBadge": "审查到期"', '"reviewDueBadge": "待复习"'],
    [
      '"practiceInProgress": "首先完成主动练习"',
      '"practiceInProgress": "请先完成当前进行中的练习"',
    ],
    ['"effects": "效果"', '"effects": "特效"'],
    ['"animation": "动画片"', '"animation": "动画"'],
    ['"storytelling": "评书"', '"storytelling": "叙事"'],
    ['"materials": "材料"', '"materials": "学习资料"'],
    ['"drawingFocus": "绘图焦点"', '"drawingFocus": "绘画为主"'],
    ['"dashboard": {\n    "title": "特点"', '"dashboard": {\n    "title": "角色"'],
    ['"chooseAnimation": "动画片"', '"chooseAnimation": "动画"'],
    [
      '"practiceRefsConfirmMessage": "开放材料将启动练习课程和计时器。继续？"',
      '"practiceRefsConfirmMessage": "打开学习资料将启动练习计时。继续？"',
    ],
    ['"reviewCta": "开放技能"', '"reviewCta": "打开技能"'],
    ['"nextActionOpenMaterials": "开放材料"', '"nextActionOpenMaterials": "打开学习资料"'],
    ['"refWindowTitle": "材料"', '"refWindowTitle": "学习资料"'],
  ],
  ja: [
    [
      '"xpEconomyHint": "Quest XP は有名です。 ~25% がスキル XP と時間ボーナスになります。"',
      '"xpEconomyHint": "クエストの経験値はスキルツリーに加算されます。練習時間とボーナス倍率も適用されます。"',
    ],
    ['"materials": "材料"', '"materials": "学習素材"'],
    ['"drawingFocus": "描画フォーカス"', '"drawingFocus": "ドローイング中心"'],
    [
      '"practiceRefsConfirmMessage": "素材を開くと練習セッションとタイマーが開始されます。続く？"',
      '"practiceRefsConfirmMessage": "学習素材を開くと練習タイマーが始まります。続けますか？"',
    ],
    ['"reviewCta": "オープンスキル"', '"reviewCta": "スキルを開く"'],
    ['"nextActionOpenMaterials": "オープンマテリアル"', '"nextActionOpenMaterials": "学習素材を開く"'],
    ['"refWindowTitle": "材料"', '"refWindowTitle": "学習素材"'],
  ],
  ko: [
    [
      '"xpEconomyHint": "퀘스트 XP는 유명합니다. ~25%는 스킬 XP와 시간 보너스가 됩니다."',
      '"xpEconomyHint": "퀘스트 경험치는 스킬 트리에 반영됩니다. 연습 시간과 보너스 배율도 적용됩니다."',
    ],
    ['"completed": "완전한"', '"completed": "완료"'],
    ['"viewAll": "모두 찾아보기"', '"viewAll": "전체 보기"'],
    [
      '"practiceInProgress": "활성 연습 세션을 먼저 완료하세요."',
      '"practiceInProgress": "진행 중인 연습을 먼저 완료하세요"',
    ],
    ['"animation": "생기"', '"animation": "애니메이션"'],
    ['"materials": "재료"', '"materials": "학습 자료"'],
    ['"dashboard": {\n    "title": "성격"', '"dashboard": {\n    "title": "캐릭터"'],
    ['"chooseAnimation": "생기"', '"chooseAnimation": "애니메이션"'],
    [
      '"practiceRefsConfirmMessage": "자료를 열면 연습 세션과 타이머가 시작됩니다. 계속하다?"',
      '"practiceRefsConfirmMessage": "학습 자료를 열면 연습 타이머가 시작됩니다. 계속할까요?"',
    ],
    ['"reviewCta": "오픈 스킬"', '"reviewCta": "스킬 열기"'],
    ['"nextActionOpenMaterials": "공개 자료"', '"nextActionOpenMaterials": "학습 자료 열기"'],
    ['"refWindowTitle": "재료"', '"refWindowTitle": "학습 자료"'],
  ],
}

async function polishLang(lang: Lang): Promise<void> {
  const filePath = path.join(LOCALES_DIR, `${lang}.ts`)
  let content = await fs.readFile(filePath, 'utf8')

  for (const [from, to] of VALUE_FIXES[lang]) {
    if (content.includes(from)) content = content.split(from).join(to)
  }

  await fs.writeFile(filePath, content, 'utf8')
  console.log(`Polished locales/${lang}.ts`)
}

async function main(): Promise<void> {
  for (const lang of ['zh', 'ja', 'ko'] as const) {
    await polishLang(lang)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
