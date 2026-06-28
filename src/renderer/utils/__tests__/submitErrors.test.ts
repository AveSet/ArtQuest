import { describe, it, expect } from 'vitest'
import { resolveSubmitErrorMessage } from '../submitErrors'

describe('resolveSubmitErrorMessage', () => {
  const t = {
    submitFailed: 'Submit failed',
    submitFailedSave: 'Save failed',
    submitAlreadyCompleted: 'Already done',
    submitPartialUpload: 'Partial upload',
    submitStorageFull: 'Storage full',
    questNotFound: 'Not found',
  }

  it('returns null for no code', () => {
    expect(resolveSubmitErrorMessage(null, t)).toBeNull()
  })

  it('maps distinct error codes', () => {
    expect(resolveSubmitErrorMessage('save_failed', t)).toBe('Save failed')
    expect(resolveSubmitErrorMessage('already_completed', t)).toBe('Already done')
    expect(resolveSubmitErrorMessage('partial_upload_failed', t)).toBe('Partial upload')
    expect(resolveSubmitErrorMessage('storage_full', t)).toBe('Storage full')
    expect(resolveSubmitErrorMessage('quest_not_found', t)).toBe('Not found')
    expect(resolveSubmitErrorMessage('submit_failed', t)).toBe('Submit failed')
  })
})
