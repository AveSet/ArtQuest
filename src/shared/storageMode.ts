export type StorageMode = 'local' | 'local_and_cloud' | 'cloud_only'

/** @deprecated Legacy value persisted before tri-state storage. */
export type LegacyStorageMode = StorageMode | 'google_drive'

export function normalizeStorageMode(raw: string | undefined | null): StorageMode {
  if (raw === 'local_and_cloud' || raw === 'google_drive') return 'local_and_cloud'
  if (raw === 'cloud_only') return 'cloud_only'
  return 'local'
}

export function usesCloudStorage(mode: StorageMode | LegacyStorageMode | undefined | null): boolean {
  const normalized = normalizeStorageMode(mode ?? 'local')
  return normalized === 'local_and_cloud' || normalized === 'cloud_only'
}

export function isCloudOnlyStorage(mode: StorageMode | LegacyStorageMode | undefined | null): boolean {
  return normalizeStorageMode(mode ?? 'local') === 'cloud_only'
}
