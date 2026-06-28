import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuestSubmit } from '../useQuestSubmit'

const mockCompleteQuest = vi.fn()
const mockUploadWork = vi.fn()
const mockCancelSession = vi.fn()

const questStoreState = {
  completeQuest: mockCompleteQuest,
  completeWarmupQuest: vi.fn(),
  completeFundamentalsExercise: vi.fn(),
  uploadWork: mockUploadWork,
  quests: [{ id: 1, xp: 50, category: 'drawing', estimatedTime: 30, is_repeatable: false }],
  completedQuests: [] as number[],
}

vi.mock('@/store/useQuestStore', () => ({
  useQuestStore: (selector: (s: typeof questStoreState) => unknown) => selector(questStoreState),
}))

vi.mock('@/store/useQuestSessionStore', () => ({
  useQuestSessionStore: {
    getState: () => ({ session: null, cancelSession: mockCancelSession }),
  },
  getSessionPracticeMinutes: () => 10,
}))

vi.mock('@/utils/feedbackOrchestrator', () => ({
  dispatchFeedbackMoment: vi.fn(),
}))

vi.mock('@/utils/fileHelpers', () => ({
  readFileAsDataURL: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
}))

describe('useQuestSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    questStoreState.completedQuests = []
    window.electronAPI = undefined
  })

  it('returns quest_not_found when quest id is unknown', async () => {
    const { result } = renderHook(() => useQuestSubmit())
    const onError = vi.fn()
    const file = new File(['x'], 'work.png', { type: 'image/png' })

    await act(async () => {
      await result.current.submitQuest(
        999,
        ['blob:1'],
        [file],
        vi.fn(),
        undefined,
        undefined,
        undefined,
        onError,
      )
    })

    expect(onError).toHaveBeenCalledWith('quest_not_found')
    expect(mockCompleteQuest).not.toHaveBeenCalled()
  })

  it('returns already_completed for non-repeatable quest', async () => {
    questStoreState.completedQuests = [1]
    const { result } = renderHook(() => useQuestSubmit())
    const onError = vi.fn()
    const file = new File(['x'], 'work.png', { type: 'image/png' })

    await act(async () => {
      await result.current.submitQuest(1, ['blob:1'], [file], vi.fn(), undefined, undefined, undefined, onError)
    })

    expect(onError).toHaveBeenCalledWith('already_completed')
    expect(mockCompleteQuest).not.toHaveBeenCalled()
  })

  it('completes quest when browser fallback stores work', async () => {
    questStoreState.completedQuests = []
    const { result } = renderHook(() => useQuestSubmit())
    const onSuccess = vi.fn()
    const file = new File(['x'], 'work.png', { type: 'image/png' })

    await act(async () => {
      await result.current.submitQuest(1, ['blob:1'], [file], vi.fn(), undefined, onSuccess)
    })

    expect(mockUploadWork).toHaveBeenCalled()
    expect(mockCompleteQuest).toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
  })
})
