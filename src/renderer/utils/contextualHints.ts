import { useQuestStore } from '@/store/useQuestStore'
import { useUIStore } from '@/store/useUIStore'
import { useSkillStore } from '@/store/useSkillStore'
import type { LocalizedString } from '@/i18n/translations'

export interface ContextualHint {
  id: string
  trigger: () => boolean
  content: LocalizedString
  dismissible: boolean
  shownOnce: boolean
  action?: { label: LocalizedString; route: string }
}

const shownHints = new Set<string>()

export function markHintShown(id: string): void {
  shownHints.add(id)
  try {
    localStorage.setItem(`hint_shown_${id}`, '1')
  } catch {}
}

export const CONTEXTUAL_HINTS: ContextualHint[] = [
    {
      id: 'first_gallery_upload',
      trigger: () => {
        const works = useQuestStore.getState().completedWorks
        return works.length === 0
      },
      content: {
        en: 'Drag your first artwork here — it stays on your device',
        ru: 'Перетащите сюда ваш первый арт — он сохранится локально',
        zh: '将第一幅作品拖到这里——会保存在本机',
        'zh-tw': '將第一幅作品拖到這裡——會保存在本機',
        ja: '最初の作品をここにドラッグ——端末に保存されます',
        ko: '첫 작품을 여기로 끌어다 놓으세요. 기기에 저장됩니다',
      },
      dismissible: true,
      shownOnce: true,
    },
    {
      id: 'streak_recovery_available',
      trigger: () => {
        const ss = useUIStore.getState().streakState
        return !!ss.streakRecoveryDueDate
      },
      content: {
        en: 'Missed a day? Complete 4 daily quests to restore your streak',
        ru: 'Пропустили день? Выполните 4 лёгких квеста, чтобы восстановить стрик',
        zh: '错过一天？完成 4 个简单任务即可恢复连续天数',
        'zh-tw': '錯過一天？完成 4 個簡單任務即可恢復連續天數',
        ja: '1日休みましたか？かんたんなクエストを4つクリアで連続記録を復活',
        ko: '하루를 놓쳤나요? 쉬운 퀘스트 4개를 완료하면 연속 기록을 복구할 수 있습니다',
      },
      dismissible: true,
      shownOnce: false,
      action: {
        label: { en: 'Show quests', ru: 'Показать квесты', zh: '查看任务', 'zh-tw': '查看任務', ja: 'クエストを見る', ko: '퀘스트 보기' },
        route: '/quests',
      },
    },
    {
      id: 'first_skill_unlock',
      trigger: () => {
        const nodes = useSkillStore.getState().skillNodes
        return nodes.some(n => n.isUnlocked)
      },
      content: {
        en: 'Click a skill node to start timed practice',
        ru: 'Нажмите на узел навыка, чтобы начать практику с таймером',
        zh: '点击技能节点开始计时练习',
        'zh-tw': '點擊技能節點開始計時練習',
        ja: 'スキルノードをクリックしてタイマー付き練習を開始',
        ko: '스킬 노드를 눌러 타이머 연습을 시작하세요',
      },
      dismissible: true,
      shownOnce: true,
    },
]

export function getPendingHints(): ContextualHint[] {
  return CONTEXTUAL_HINTS.filter((h) => {
    if (h.shownOnce) {
      try {
        if (localStorage.getItem(`hint_shown_${h.id}`)) return false
      } catch {}
    }
    return h.trigger()
  })
}
