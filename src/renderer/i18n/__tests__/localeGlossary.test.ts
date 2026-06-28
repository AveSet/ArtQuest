import { describe, expect, it } from 'vitest'
import { zh } from '../locales/zh'
import { zhTw } from '../locales/zh-tw'
import { ja } from '../locales/ja'
import { ko } from '../locales/ko'

describe('creative learning locale glossary', () => {
  it('zh avoids film/chemical-material mistranslations for core terms', () => {
    expect(zh.categories.animation).toBe('动画')
    expect(zh.categories.storytelling).toBe('叙事')
    expect(zh.quests.materials).toBe('学习资料')
    expect(zh.profile.chooseAnimation).toBe('动画')
    expect(zh.profile.drawingFocus).toBe('绘画为主')
    expect(zh.dashboard.title).toBe('练习')
  })

  it('ja uses learning-material wording for quests materials', () => {
    expect(ja.quests.materials).toBe('学習素材')
    expect(ja.categories.animation).toBe('アニメーション')
  })

  it('ko uses natural animation and materials labels', () => {
    expect(ko.categories.animation).toBe('애니메이션')
    expect(ko.quests.materials).toBe('학습 자료')
    expect(ko.dashboard.title).toBe('연습')
  })

  it('zh-tw uses traditional characters for core labels', () => {
    expect(zhTw.categories.animation).toMatch(/動畫|動画/)
    expect(zhTw.quests.materials).toMatch(/學習|学习/)
  })
})
