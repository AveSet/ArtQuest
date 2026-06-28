import type { PortraitGender } from '@/store/models'

/** Static bust portraits served from public/portraits/ (512×512, 1:1). */
export const PORTRAIT_IMAGE_SOURCES: Record<PortraitGender, readonly string[]> = {
  male: ['./portraits/male.webp', './portraits/male.png'],
  female: ['./portraits/female.webp', './portraits/female.png'],
}

export function getPortraitImageSources(gender: PortraitGender): readonly string[] {
  return PORTRAIT_IMAGE_SOURCES[gender]
}
