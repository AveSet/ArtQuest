import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const QUEST_FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

const FORBIDDEN: Record<'zh' | 'ja' | 'ko', RegExp[]> = {
  zh: [
    /外汇/,
    /讲故事/,
    /运行周期/,
    /线路质量/,
    /跳闸/,
    /没有孵化/,
    /执行行业简报：火灾/,
    /执行行业简介/,
    /执行行业简报/,
    /充满情感的表格/,
    /表格研究/,
    /在阅读表格之前/,
    /手锉/,
    /（孵化）/,
  ],
  ja: [/実行サイクル/, /火災/, /等高線/, /業界概要の作成/, /ハンドファイリング/],
  ko: [/등고선/, /화재/, /업계 개요 실행/, /손으로 파일링/],
}

describe('quest locale quality', () => {
  it('quest strings avoid common machine-translation artifacts', () => {
    const dataDir = path.join(process.cwd(), 'src/renderer/data')
    const hits: string[] = []
    for (const file of QUEST_FILES) {
      const raw = fs.readFileSync(path.join(dataDir, file), 'utf8')
      for (const lang of ['zh', 'ja', 'ko'] as const) {
        for (const re of FORBIDDEN[lang]) {
          if (re.test(raw)) hits.push(`${file}:${lang}:${re}`)
        }
      }
    }
    expect(hits, hits.join('\n')).toEqual([])
  })
})
