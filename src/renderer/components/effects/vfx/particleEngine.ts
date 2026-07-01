import type { VfxPresetConfig } from './presets'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export class ParticleEngine {
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private raf = 0
  private startMs = 0
  private running = false

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    this.ctx = ctx
  }

  burst(preset: VfxPresetConfig, width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.particles = Array.from({ length: preset.particleCount }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = preset.speed * (0.5 + Math.random())
      return {
        x: width * 0.5,
        y: height * 0.45,
        vx: Math.cos(angle) * speed * width * preset.spread,
        vy: Math.sin(angle) * speed * height * preset.spread - height * 0.05,
        life: 0,
        maxLife: preset.durationMs * (0.6 + Math.random() * 0.4),
        size: 2 + Math.random() * 4,
        color: preset.colors[Math.floor(Math.random() * preset.colors.length)] ?? '#fff',
      }
    })
    this.startMs = performance.now()
    this.running = true
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.tick)
  }

  stop(): void {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.particles = []
    this.clear()
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private tick = (now: number): void => {
    if (!this.running) return
    const elapsed = now - this.startMs
    this.clear()
    for (const p of this.particles) {
      p.life += 16
      p.x += p.vx * 0.016
      p.y += p.vy * 0.016
      p.vy += this.canvas.height * 0.0004
      const alpha = Math.max(0, 1 - p.life / p.maxLife)
      if (alpha <= 0) continue
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
    const alive = this.particles.some((p) => p.life < p.maxLife)
    if (alive && elapsed < 4000) {
      this.raf = requestAnimationFrame(this.tick)
    } else {
      this.stop()
    }
  }
}

export function isWebGL2Available(): boolean {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return !!canvas.getContext('webgl2')
}
