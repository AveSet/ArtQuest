/** Response shape for save/clear operations */
export interface IpcResultSuccess {
  success: true
}
export interface IpcResultFailure {
  success: false
  error: unknown
}
export type IpcResult = IpcResultSuccess | IpcResultFailure

import type { ProgressPayload } from '../shared/progressSchema'
import type { LoadProgressResponse } from '../shared/loadProgressResponse'

/** Returned by loadProgress */
export type LoadProgressResult = LoadProgressResponse

export type { ProgressPayload as ProgressData }
