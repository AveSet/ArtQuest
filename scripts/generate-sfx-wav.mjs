/**
 * Generates short mono 44.1kHz WAV SFX into public/sounds/ (procedural, no deps).
 * Run: node scripts/generate-sfx-wav.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../public/sounds')

const SAMPLE_RATE = 44100

function writeWav(filePath, samples) {
  const numChannels = 1
  const bitsPerSample = 16
  const blockAlign = numChannels * (bitsPerSample / 8)
  const byteRate = SAMPLE_RATE * blockAlign
  const dataSize = samples.length * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(numChannels, 22)
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitsPerSample, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  fs.writeFileSync(filePath, buf)
}

function tone(freq, durationSec, volume = 0.35, type = 'sine') {
  const n = Math.floor(SAMPLE_RATE * durationSec)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.min(1, i / (SAMPLE_RATE * 0.008)) * Math.min(1, (n - i) / (SAMPLE_RATE * 0.06))
    let v = 0
    if (type === 'sine') v = Math.sin(2 * Math.PI * freq * t)
    else if (type === 'triangle') v = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1
    else v = Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.5
    out[i] = v * volume * env
  }
  return out
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.length))
  const out = new Float32Array(len)
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) out[i] += p[i]
  }
  return out
}

function seq(gaps, notes) {
  let offset = 0
  const chunks = []
  for (const note of notes) {
    offset += Math.floor(SAMPLE_RATE * (note.gap ?? 0))
    const t = tone(note.f, note.d, note.v ?? 0.3, note.w ?? 'sine')
    const padded = new Float32Array(offset + t.length)
    padded.set(t, offset)
    chunks.push(padded)
    offset += t.length
  }
  return mix(...chunks)
}

const PRESETS = {
  questStart: () => seq([], [
    { f: 440, d: 0.07, v: 0.25 },
    { f: 554, d: 0.08, gap: 0.05, v: 0.28 },
    { f: 659, d: 0.1, gap: 0.05, v: 0.3 },
  ]),
  complete: () => seq([], [
    { f: 523, d: 0.12, v: 0.32 },
    { f: 659, d: 0.14, gap: 0.1, v: 0.34 },
  ]),
  levelup: () => seq([], [
    { f: 392, d: 0.08, v: 0.28 },
    { f: 494, d: 0.08, gap: 0.06, v: 0.3 },
    { f: 587, d: 0.12, gap: 0.06, v: 0.34 },
    { f: 784, d: 0.16, gap: 0.08, v: 0.36 },
  ]),
  achievement: () => seq([], [
    { f: 523, d: 0.1, v: 0.3, w: 'triangle' },
    { f: 659, d: 0.1, gap: 0.04, v: 0.32, w: 'triangle' },
    { f: 784, d: 0.12, gap: 0.04, v: 0.34, w: 'triangle' },
    { f: 1047, d: 0.2, gap: 0.06, v: 0.36, w: 'sine' },
  ]),
  dailyComplete: () => seq([], [
    { f: 440, d: 0.1, v: 0.3 },
    { f: 554, d: 0.1, gap: 0.05, v: 0.32 },
    { f: 659, d: 0.15, gap: 0.05, v: 0.34 },
    { f: 880, d: 0.18, gap: 0.08, v: 0.28, w: 'triangle' },
  ]),
  weeklyComplete: () => seq([], [
    { f: 330, d: 0.12, v: 0.28 },
    { f: 415, d: 0.12, gap: 0.06, v: 0.3 },
    { f: 494, d: 0.12, gap: 0.06, v: 0.32 },
    { f: 587, d: 0.14, gap: 0.06, v: 0.34 },
    { f: 740, d: 0.22, gap: 0.08, v: 0.36 },
  ]),
  uiTap: () => seq([], [
    { f: 420, d: 0.04, v: 0.2, w: 'triangle' },
    { f: 520, d: 0.03, gap: 0.03, v: 0.14, w: 'sine' },
  ]),
  panelOpen: () => seq([], [
    { f: 330, d: 0.05, v: 0.16, w: 'sine' },
    { f: 440, d: 0.06, gap: 0.05, v: 0.18, w: 'triangle' },
    { f: 554, d: 0.08, gap: 0.05, v: 0.16, w: 'sine' },
  ]),
  microComplete: () => seq([], [
    { f: 587, d: 0.06, v: 0.28, w: 'triangle' },
    { f: 784, d: 0.1, gap: 0.05, v: 0.24, w: 'sine' },
  ]),
  pathUnlock: () => seq([], [
    { f: 392, d: 0.1, v: 0.3 },
    { f: 523, d: 0.12, gap: 0.08, v: 0.32, w: 'triangle' },
    { f: 659, d: 0.2, gap: 0.08, v: 0.34 },
  ]),
  itemSelect: () => seq([], [
    { f: 180, d: 0.05, v: 0.22, w: 'triangle' },
    { f: 260, d: 0.08, gap: 0.05, v: 0.18, w: 'sine' },
  ]),
  rewardReveal: () => seq([], [
    { f: 740, d: 0.05, v: 0.22, w: 'triangle' },
    { f: 988, d: 0.11, gap: 0.06, v: 0.26, w: 'sine' },
  ]),
  focusLow: () => seq([], [
    { f: 196, d: 0.14, v: 0.2, w: 'sine' },
    { f: 147, d: 0.16, gap: 0.08, v: 0.16, w: 'triangle' },
  ]),
  transitionSweep: () => seq([], [
    { f: 330, d: 0.08, v: 0.24, w: 'sine' },
    { f: 660, d: 0.16, gap: 0.07, v: 0.28, w: 'triangle' },
  ]),
  craft: () => seq([], [
    { f: 260, d: 0.05, v: 0.22, w: 'triangle' },
    { f: 520, d: 0.08, gap: 0.05, v: 0.24, w: 'triangle' },
  ]),
  questAbandon: () => seq([], [
    { f: 294, d: 0.07, v: 0.22, w: 'sine' },
    { f: 220, d: 0.1, gap: 0.05, v: 0.18, w: 'triangle' },
    { f: 165, d: 0.14, gap: 0.06, v: 0.14, w: 'sine' },
  ]),
}

fs.mkdirSync(OUT, { recursive: true })
for (const [name, fn] of Object.entries(PRESETS)) {
  const samples = fn()
  const file = path.join(OUT, `${name}.wav`)
  writeWav(file, samples)
  console.log('Wrote', file)
}
console.log('Done —', Object.keys(PRESETS).length, 'WAV files in public/sounds/')
