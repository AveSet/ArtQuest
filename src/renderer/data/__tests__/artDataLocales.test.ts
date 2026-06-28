import { describe, expect, it } from 'vitest'
import achievements from '../achievements.json'
import { SKILL_TREE_NODES } from '../skillTree'

const CJK_LANGS = ['zh', 'zh-tw', 'ja', 'ko'] as const

function assertLocalizedRecord(record: Record<string, string>, label: string): void {
  const en = record.en?.trim()
  expect(en, `${label}: missing en`).toBeTruthy()
  for (const lang of CJK_LANGS) {
    const value = record[lang]?.trim()
    expect(value, `${label}.${lang}`).toBeTruthy()
    expect(value, `${label}.${lang} must not equal English`).not.toBe(en)
    const asciiOnly = /^[\x00-\x7F]+$/.test(value ?? '')
    const hasCjk = /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(value ?? '')
    expect(asciiOnly && !hasCjk, `${label}.${lang} looks like untranslated English`).toBe(false)
  }
}

describe('art data CJK locales', () => {
  it('skillTree titles and descriptions are fully localized', () => {
    for (const node of SKILL_TREE_NODES) {
      assertLocalizedRecord(node.title, `skillTree.${node.id}.title`)
      assertLocalizedRecord(node.description, `skillTree.${node.id}.description`)
    }
  })

  it('achievements titles and descriptions are fully localized', () => {
    for (const item of achievements) {
      assertLocalizedRecord(item.title, `achievement.${item.id}.title`)
      assertLocalizedRecord(item.description, `achievement.${item.id}.description`)
    }
  })

  it('skillTree uses art-domain terms for common mistranslations', () => {
    const perspective = SKILL_TREE_NODES.find((n) => n.id === 'drawing_perspective')
    const composition = SKILL_TREE_NODES.find((n) => n.id === 'drawing_composition')
    const contour = SKILL_TREE_NODES.find((n) => n.id === 'drawing_contour')
    expect(perspective?.title.zh).toBe('透视')
    expect(composition?.title.zh).toBe('构图')
    expect(contour?.title.ja).toBe('輪郭線')
    expect(SKILL_TREE_NODES.find((n) => n.id === 'drawing_value')?.title.ja).toBe('明暗と光')
  })

  it('achievements avoid machine mistranslations and abbreviations in titles', () => {
    const fxWizard = achievements.find((a) => a.id === 'effects_master')
    const xp50k = achievements.find((a) => a.id === 'xp_fifty_thousand')
    const storyteller = achievements.find((a) => a.id === 'storytelling_master')
    expect(fxWizard?.title.zh).not.toMatch(/外汇/)
    expect(fxWizard?.title.zh).toBe('特效巫师')
    expect(xp50k?.title.zh).toBe('五万经验值')
    expect(xp50k?.title.ja).toBe('5万経験値')
    expect(storyteller?.title.zh).toBe('叙事者')
    expect(storyteller?.title.ko).toBe('스토리텔러')
  })

  it('achievement descriptions use clear full sentences', () => {
    const first = achievements.find((a) => a.id === 'first_quest')
    const level3 = achievements.find((a) => a.id === 'level_3')
    expect(first?.description.ko).toMatch(/퀘스트/)
    expect(level3?.description.ko).toMatch(/아무 카테고리/)
    expect(level3?.description.ko).not.toMatch(/모든 카테고리에서 레벨 3/)
  })
})
