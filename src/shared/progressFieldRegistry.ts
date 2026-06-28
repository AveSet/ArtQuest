import { PROGRESS_FIELD_KEYS } from './progressSchema'
import { collectAllChunkFieldKeys } from './progressSnapshot'

/** Every persisted progress field must appear in exactly one chunk group. */
export function assertProgressFieldRegistryComplete(): string[] {
  const chunkFields = collectAllChunkFieldKeys()
  return PROGRESS_FIELD_KEYS.filter((key) => !chunkFields.has(key))
}
