import { useCallback, useRef, useState } from 'react'
import { useQuestStore } from '@/store/useQuestStore'
import { useQuestSessionStore, getSessionPracticeMinutes } from '@/store/useQuestSessionStore'
import { getFundamentalsQuestById, isFundamentalsQuestId } from '@/data/fundamentalsExercises'
import { getWarmupQuestById, isWarmupQuestId } from '@/data/warmupQuests'
import { dispatchFeedbackMoment } from '@/utils/feedbackOrchestrator'
import { usesCloudStorage, type StorageMode } from '../../shared/storageMode'
import { readFileAsDataURL } from '@/utils/fileHelpers'
import { readImageCached } from '@/utils/readImageCache'
import { mediaKindFromPath } from '@/utils/mediaKind'
import type { SubmitErrorCode } from '@/utils/submitErrors'

export type { SubmitErrorCode } from '@/utils/submitErrors'

export function useQuestSubmit() {
  const completeQuest = useQuestStore(s => s.completeQuest)
  const completeWarmupQuest = useQuestStore(s => s.completeWarmupQuest)
  const completeFundamentalsExercise = useQuestStore(s => s.completeFundamentalsExercise)
  const uploadWork = useQuestStore(s => s.uploadWork)
  const quests = useQuestStore(s => s.quests)
  const completedQuests = useQuestStore(s => s.completedQuests)
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null)
  const clearSubmitError = useCallback(() => setSubmitError(null), [])

  const submitQuest = useCallback(async (
    questId: number,
    _uploadedFiles: string[],
    uploadedFileData: File[],
    onCleanup: () => void,
    practiceMinutesOverride?: number,
    onSuccess?: () => void,
    notes?: string,
    onError?: (message: SubmitErrorCode) => void,
    feedback?: import('@/store/models').QuestFeedback,
  ) => {
    if (isSubmittingRef.current) return
    const uploadOptional = isFundamentalsQuestId(questId)
    if (uploadedFileData.length === 0 && !uploadOptional) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const quest =
        quests.find(q => q.id === questId) ??
        getFundamentalsQuestById(questId) ??
        getWarmupQuestById(questId)
      if (!quest) {
        const msg: SubmitErrorCode = 'quest_not_found'
        setSubmitError(msg)
        onError?.(msg)
        return
      }
      if (
        !quest.is_repeatable &&
        completedQuests.includes(questId) &&
        !isWarmupQuestId(questId) &&
        !isFundamentalsQuestId(questId)
      ) {
        const msg: SubmitErrorCode = 'already_completed'
        setSubmitError(msg)
        onError?.(msg)
        return
      }
      let workRecorded = uploadOptional && uploadedFileData.length === 0
      let uploadFailures = 0
      const workTags = feedback?.mistakeTags?.filter(Boolean) ?? []
      for (const file of uploadedFileData) {
        try {
          const base64 = await readFileAsDataURL(file)
          const mediaType = mediaKindFromPath(file.name || base64)
          const api = window.electronAPI
          if (api?.gallery?.saveImage) {
            const result = await api.gallery.saveImage(base64, String(questId))
            if (result.success && result.path) {
              const storageMode = (result.storageMode ?? 'local') as StorageMode
              const meta = {
                id: result.galleryItemId,
                storageMode,
                cloudProvider: usesCloudStorage(storageMode) ? ('google' as const) : undefined,
                syncStatus: result.syncStatus,
                tags: workTags,
              }
              if (mediaType === 'video') {
                uploadWork(questId, '', result.path, notes, 'video', meta)
                workRecorded = true
                continue
              }
              const savedUrl = await readImageCached(result.path)
              if (savedUrl) {
                uploadWork(questId, savedUrl, result.path, notes, 'image', meta)
                workRecorded = true
                continue
              }
            }
          }
          uploadWork(questId, base64, undefined, notes, mediaType, { tags: workTags })
          workRecorded = true
        } catch (err) {
          uploadFailures += 1
          console.error('Failed to save image:', err)
        }
      }

      if (!workRecorded) {
        const msg: SubmitErrorCode = 'save_failed'
        setSubmitError(msg)
        onError?.(msg)
        return
      }

      const hadPartialUploadFailure = uploadFailures > 0

      const session = useQuestSessionStore.getState().session
      const sessionMin =
        session?.questId === questId ? getSessionPracticeMinutes(session) : null
      const elapsedMin = practiceMinutesOverride ?? sessionMin ?? 0
      const isOvertime = session?.questId === questId && session.isExpired
      const completionOpts = {
        practiceMinutes: Math.max(0, Math.min(elapsedMin, quest.estimatedTime * 3)),
        isOvertime,
        notes: notes?.trim() || undefined,
        feedback,
      }
      if (isWarmupQuestId(questId)) {
        completeWarmupQuest(questId, completionOpts)
      } else if (isFundamentalsQuestId(questId)) {
        completeFundamentalsExercise(questId, completionOpts)
      } else {
        completeQuest(questId, quest.xp || 0, quest.category, completionOpts)
        dispatchFeedbackMoment({ kind: 'quest_complete', category: quest.category })
      }
      useQuestSessionStore.getState().cancelSession()
      onSuccess?.()
      onCleanup()
      if (hadPartialUploadFailure) {
        onError?.('partial_upload_failed')
      }
    } catch (err) {
      console.error('Failed to submit quest:', err)
      const msg: SubmitErrorCode = 'submit_failed'
      setSubmitError(msg)
      onError?.(msg)
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [quests, completedQuests, completeQuest, completeWarmupQuest, completeFundamentalsExercise, uploadWork])

  return { submitQuest, isSubmitting, submitError, clearSubmitError }
}
