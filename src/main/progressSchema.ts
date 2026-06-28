export {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  type ProgressPayload,
  migrateProgressPayload,
  parseProgressPayload,
  normalizeProgressPayload,
  normalizeProgressPayloadResult,
  pickLoadedProgressFields,
  progressPayloadSchema,
  LOADED_PROGRESS_FIELDS,
  validateQuestCompletionLogsAppend,
} from '../shared/progressSchema'
