/** Discriminated union returned by load-progress IPC and browser load helpers. */
export type LoadProgressOk = {
  status: 'ok'
  data: Record<string, unknown>
  source?: string
  degraded?: boolean
  warnings?: string[]
}

export type LoadProgressEmpty = {
  status: 'empty'
}

export type LoadProgressCorrupt = {
  status: 'corrupt'
  backupPath?: string
  message: string
}

export type LoadProgressFailed = {
  status: 'failed'
  message: string
}

export type LoadProgressResponse =
  | LoadProgressOk
  | LoadProgressEmpty
  | LoadProgressCorrupt
  | LoadProgressFailed

export function isLoadProgressOk(
  response: LoadProgressResponse,
): response is LoadProgressOk {
  return response.status === 'ok'
}
