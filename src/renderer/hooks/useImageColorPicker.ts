import { useCallback, useRef } from 'react'

interface RgbColor {
  r: number
  g: number
  b: number
}

interface HslColor {
  h: number
  s: number
  l: number
}

interface PickedColor {
  hex: string
  rgb: RgbColor
  hsl: HslColor
}

const MAX_CANVAS_EDGE = 1024

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r: number, g: number, b: number): HslColor {
  const r1 = r / 255
  const g1 = g / 255
  const b1 = b / 255
  const max = Math.max(r1, g1, b1)
  const min = Math.min(r1, g1, b1)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  switch (max) {
    case r1:
      h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6
      break
    case g1:
      h = ((b1 - r1) / d + 2) / 6
      break
    case b1:
      h = ((r1 - g1) / d + 4) / 6
      break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function scaleCanvasDimensions(width: number, height: number): { width: number; height: number; scale: number } {
  const maxEdge = Math.max(width, height)
  if (maxEdge <= MAX_CANVAS_EDGE) return { width, height, scale: 1 }
  const scale = MAX_CANVAS_EDGE / maxEdge
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}

export function useImageColorPicker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scaleRef = useRef(1)

  const loadImage = useCallback((img: HTMLImageElement) => {
    const { width, height, scale } = scaleCanvasDimensions(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height)
    }
    canvasRef.current = canvas
    scaleRef.current = scale
  }, [])

  const pickColor = useCallback((x: number, y: number): PickedColor | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    const sampleX = Math.round(x * scaleRef.current)
    const sampleY = Math.round(y * scaleRef.current)
    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data
    if (!pixel || pixel.length < 3) return null
    const [r, g, b] = pixel
    const hex = rgbToHex(r, g, b)
    const rgb: RgbColor = { r, g, b }
    const hsl = rgbToHsl(r, g, b)
    return { hex, rgb, hsl }
  }, [])

  return { loadImage, pickColor }
}
