export const PORTRAIT_CROP_VIEWPORT_SIZE = 256
export const PORTRAIT_CROP_OUTPUT_SIZE = 512
export const PORTRAIT_CROP_MIN_SCALE = 1
export const PORTRAIT_CROP_MAX_SCALE = 4

export type PortraitCropTransform = {
  scale: number
  offsetX: number
  offsetY: number
}

export function getPortraitCoverScale(imageWidth: number, imageHeight: number, viewportSize: number): number {
  if (imageWidth <= 0 || imageHeight <= 0) return 1
  return Math.max(viewportSize / imageWidth, viewportSize / imageHeight)
}

export function getPortraitDrawRect(
  imageWidth: number,
  imageHeight: number,
  viewportSize: number,
  transform: PortraitCropTransform,
): { x: number; y: number; width: number; height: number } {
  const baseScale = getPortraitCoverScale(imageWidth, imageHeight, viewportSize)
  const totalScale = baseScale * transform.scale
  const width = imageWidth * totalScale
  const height = imageHeight * totalScale
  const x = (viewportSize - width) / 2 + transform.offsetX
  const y = (viewportSize - height) / 2 + transform.offsetY
  return { x, y, width, height }
}

export function clampPortraitCropTransform(
  imageWidth: number,
  imageHeight: number,
  viewportSize: number,
  transform: PortraitCropTransform,
): PortraitCropTransform {
  const scale = Math.min(PORTRAIT_CROP_MAX_SCALE, Math.max(PORTRAIT_CROP_MIN_SCALE, transform.scale))
  const draw = getPortraitDrawRect(imageWidth, imageHeight, viewportSize, { ...transform, scale })

  let offsetX = transform.offsetX
  let offsetY = transform.offsetY

  if (draw.x > 0) offsetX -= draw.x
  if (draw.y > 0) offsetY -= draw.y
  if (draw.x + draw.width < viewportSize) offsetX += viewportSize - (draw.x + draw.width)
  if (draw.y + draw.height < viewportSize) offsetY += viewportSize - (draw.y + draw.height)

  return { scale, offsetX, offsetY }
}

export function cropPortraitImage(
  image: HTMLImageElement,
  transform: PortraitCropTransform,
  viewportSize = PORTRAIT_CROP_VIEWPORT_SIZE,
  outputSize = PORTRAIT_CROP_OUTPUT_SIZE,
): string {
  const clamped = clampPortraitCropTransform(
    image.naturalWidth,
    image.naturalHeight,
    viewportSize,
    transform,
  )
  const draw = getPortraitDrawRect(
    image.naturalWidth,
    image.naturalHeight,
    viewportSize,
    clamped,
  )

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const ratio = outputSize / viewportSize
  ctx.drawImage(image, draw.x * ratio, draw.y * ratio, draw.width * ratio, draw.height * ratio)
  return canvas.toDataURL('image/jpeg', 0.92)
}
