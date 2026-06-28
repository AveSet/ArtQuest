import type { Language } from '@/i18n/languages'
import artquestIconUrl from '@/assets/artquest-icon.png'
import { getStreakTier, getStreakTierColor } from '@/utils/streakRewardVisual'
import { DAILY_CHEST_STREAK_DAYS } from '@/utils/portraitChestProgress'

export type ShareCardInput = {
  questTitle: string
  streak: number
  rankLabel: string
  language: Language
  playerLevel?: number
  rankColor?: string
  chestProgress?: number
}

const W = 1080
const H = 608

function resolveCssColor(raw?: string, fallback = '#7c6cff'): string {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (!trimmed.startsWith('var(')) return trimmed

  const inner = trimmed.slice(4, -1).trim()
  const commaIdx = inner.indexOf(',')
  const varName = (commaIdx >= 0 ? inner.slice(0, commaIdx) : inner).trim()
  const varFallback = commaIdx >= 0 ? inner.slice(commaIdx + 1).trim() : undefined

  if (varName.startsWith('--')) {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (resolved) return resolveCssColor(resolved, fallback)
  }
  if (varFallback) return resolveCssColor(varFallback, fallback)
  return fallback
}

function resolveShareAccentColor(raw?: string): string {
  return resolveCssColor(raw, '#7c6cff')
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function drawStarRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  filled: number,
  total: number,
): void {
  const gap = 34
  for (let i = 0; i < total; i++) {
    const lit = i < filled
    ctx.save()
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillStyle = lit ? '#e8c040' : 'rgba(255,255,255,0.18)'
    if (lit) {
      ctx.shadowColor = 'rgba(232, 192, 64, 0.65)'
      ctx.shadowBlur = 12
    }
    ctx.fillText('✦', x + i * gap, y)
    ctx.restore()
  }
}

function labels(language: Language) {
  const ru = language === 'ru'
  return {
    level: ru ? 'Уровень' : 'Level',
    tagline: ru ? 'Практика рисунка каждый день' : 'Daily art practice',
    reward: ru ? 'Награда' : 'Reward',
    days: ru ? 'дней' : 'days',
  }
}

export async function generateShareCardPng(input: ShareCardInput): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  await document.fonts.ready

  const icon = await loadImage(artquestIconUrl)
  const tier = getStreakTier(input.streak)
  const tierColor = resolveCssColor(getStreakTierColor(tier), '#e8c040')
  const accent = resolveShareAccentColor(input.rankColor)
  const copy = labels(input.language)
  const chestFilled = Math.min(DAILY_CHEST_STREAK_DAYS, Math.max(0, input.chestProgress ?? 0))

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1020')
  bg.addColorStop(0.45, '#141c34')
  bg.addColorStop(1, '#10182c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W * 0.78, H * 0.22, 20, W * 0.78, H * 0.22, 280)
  glow.addColorStop(0, `${accent}55`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const glow2 = ctx.createRadialGradient(W * 0.18, H * 0.82, 10, W * 0.18, H * 0.82, 220)
  glow2.addColorStop(0, 'rgba(232, 192, 64, 0.16)')
  glow2.addColorStop(1, 'transparent')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  roundRect(ctx, 48, 40, W - 96, H - 80, 28)
  ctx.fillStyle = 'rgba(12, 18, 34, 0.82)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(232, 192, 64, 0.35)'
  ctx.lineWidth = 2
  ctx.stroke()

  roundRect(ctx, 56, 48, W - 112, H - 96, 22)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.stroke()

  if (icon) {
    ctx.save()
    roundRect(ctx, 84, 72, 56, 56, 14)
    ctx.clip()
    ctx.drawImage(icon, 84, 72, 56, 56)
    ctx.restore()
  }

  ctx.fillStyle = '#f4f0e8'
  ctx.font = '700 34px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText('ArtQuest', icon ? 156 : 84, 108)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 16px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText(copy.tagline, icon ? 156 : 84, 132)

  const badgeX = W - 120
  const badgeY = 118
  ctx.save()
  ctx.beginPath()
  ctx.arc(badgeX, badgeY, 62, 0, Math.PI * 2)
  const badgeGrad = ctx.createLinearGradient(badgeX - 62, badgeY - 62, badgeX + 62, badgeY + 62)
  badgeGrad.addColorStop(0, `${tierColor}33`)
  badgeGrad.addColorStop(1, `${tierColor}11`)
  ctx.fillStyle = badgeGrad
  ctx.fill()
  ctx.strokeStyle = `${tierColor}88`
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = tierColor
  ctx.font = '700 38px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText(String(input.streak), badgeX, badgeY + 8)
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.fillText(`🔥 ${copy.days}`, badgeX, badgeY + 30)
  ctx.textAlign = 'left'
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 42px "Plus Jakarta Sans", system-ui, sans-serif'
  const titleLines = wrapText(ctx, input.questTitle, W - 320)
  let titleY = 210
  for (const line of titleLines) {
    ctx.fillText(line, 84, titleY)
    titleY += 52
  }

  const pillY = Math.max(titleY + 18, 300)
  ctx.font = '700 18px "Plus Jakarta Sans", system-ui, sans-serif'
  const rankText = input.rankLabel
  const rankWidth = ctx.measureText(rankText).width + 36
  roundRect(ctx, 84, pillY, rankWidth, 40, 20)
  ctx.fillStyle = `${accent}33`
  ctx.fill()
  ctx.strokeStyle = `${accent}88`
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(rankText, 102, pillY + 27)

  if (input.playerLevel != null) {
    const levelText = `${copy.level} ${input.playerLevel}`
    const levelWidth = ctx.measureText(levelText).width + 36
    roundRect(ctx, 84 + rankWidth + 14, pillY, levelWidth, 40, 20)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.stroke()
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(levelText, 102 + rankWidth + 14, pillY + 27)
  }

  const rewardY = pillY + 78
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText(`${copy.reward} · ${chestFilled}/${DAILY_CHEST_STREAK_DAYS}`, 84, rewardY)
  drawStarRow(ctx, 84, rewardY + 34, chestFilled, DAILY_CHEST_STREAK_DAYS)

  const barY = rewardY + 56
  roundRect(ctx, 84, barY, 360, 10, 5)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  const fillW = (360 * chestFilled) / DAILY_CHEST_STREAK_DAYS
  if (fillW > 0) {
    roundRect(ctx, 84, barY, fillW, 10, 5)
    const barGrad = ctx.createLinearGradient(84, barY, 84 + fillW, barY)
    barGrad.addColorStop(0, '#8b7355')
    barGrad.addColorStop(1, tierColor)
    ctx.fillStyle = barGrad
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(232, 192, 64, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(84, H - 72)
  ctx.lineTo(W - 84, H - 72)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif'
  ctx.fillText('artquest.app', 84, H - 44)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== 'string') {
        reject(new Error('Failed to read share card'))
        return
      }
      const comma = dataUrl.indexOf(',')
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read share card'))
    reader.readAsDataURL(blob)
  })
}

export async function downloadShareCard(blob: Blob, filename = 'artquest-share.png'): Promise<boolean> {
  const api = window.electronAPI
  if (api?.saveShareCardPng) {
    try {
      const base64 = await blobToBase64(blob)
      const result = await api.saveShareCardPng(base64, filename)
      return result.success
    } catch {
      return false
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
