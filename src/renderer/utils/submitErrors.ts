export type SubmitErrorCode =
  | 'quest_not_found'
  | 'save_failed'
  | 'submit_failed'
  | 'already_completed'
  | 'partial_upload_failed'
  | 'storage_full'

export function resolveSubmitErrorMessage(
  code: SubmitErrorCode | null,
  t: {
    submitFailed: string
    submitFailedSave: string
    submitAlreadyCompleted?: string
    submitPartialUpload?: string
    submitStorageFull?: string
    questNotFound?: string
  },
): string | null {
  if (!code) return null
  if (code === 'save_failed') return t.submitFailedSave
  if (code === 'already_completed') return t.submitAlreadyCompleted ?? t.submitFailed
  if (code === 'partial_upload_failed') return t.submitPartialUpload ?? t.submitFailedSave
  if (code === 'storage_full') return t.submitStorageFull ?? t.submitFailedSave
  if (code === 'quest_not_found') return t.questNotFound ?? t.submitFailed
  return t.submitFailed
}
