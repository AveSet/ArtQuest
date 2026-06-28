/**
 * Generates loopable ambient WAV loops into public/sounds/ambient/
 * Run: node scripts/generate-ambient-wav.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../public/sounds/ambient')
const SAMPLE_RATE = 44100
const LOOP_SEC = 24

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

function pinkNoise(n, volume) {
  const out = new Float32Array(n)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11 * volume
    b6 = white * 0.115926
  }
  return out
}

function lowPass(samples, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz)
  const dt = 1 / SAMPLE_RATE
  const alpha = dt / (rc + dt)
  const out = new Float32Array(samples.length)
  let prev = 0
  for (let i = 0; i < samples.length; i++) {
    prev = prev + alpha * (samples[i] - prev)
    out[i] = prev
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

function fadeLoop(samples) {
  const fade = Math.floor(SAMPLE_RATE * 0.35)
  const out = new Float32Array(samples)
  for (let i = 0; i < fade; i++) {
    const g = i / fade
    out[i] *= g
    out[out.length - 1 - i] *= g
  }
  return out
}

function rain() {
  const n = Math.floor(SAMPLE_RATE * LOOP_SEC)
  const base = lowPass(pinkNoise(n, 0.55), 900)
  const drops = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.0018) {
      const hit = Math.min(n - 1, i + Math.floor(Math.random() * 40))
      drops[hit] += 0.08 + Math.random() * 0.06
    }
  }
  return fadeLoop(mix(base, lowPass(drops, 2400)))
}

function cafe() {
  const n = Math.floor(SAMPLE_RATE * LOOP_SEC)
  const murmur = lowPass(pinkNoise(n, 0.42), 420)
  const chatter = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    if (Math.random() < 0.0009) {
      const f = 180 + Math.random() * 220
      const len = Math.floor(SAMPLE_RATE * (0.08 + Math.random() * 0.14))
      for (let j = 0; j < len && i + j < n; j++) {
        const env = Math.sin((Math.PI * j) / len)
        chatter[i + j] += Math.sin(2 * Math.PI * f * (t + j / SAMPLE_RATE)) * env * 0.04
      }
    }
  }
  const clink = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.00025) {
      clink[i] += 0.05
      if (i + 1 < n) clink[i + 1] -= 0.03
    }
  }
  return fadeLoop(mix(murmur, lowPass(chatter, 1800), lowPass(clink, 5000)))
}

function fireplace() {
  const n = Math.floor(SAMPLE_RATE * LOOP_SEC)
  const rumble = lowPass(pinkNoise(n, 0.38), 180)
  const crackle = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.0012) {
      crackle[i] += 0.06 + Math.random() * 0.05
      if (i + 2 < n) crackle[i + 2] += 0.02
    }
  }
  return fadeLoop(mix(rumble, lowPass(crackle, 3200)))
}

const PRESETS = { rain, cafe, fireplace }

fs.mkdirSync(OUT, { recursive: true })
for (const [name, fn] of Object.entries(PRESETS)) {
  const file = path.join(OUT, `${name}.wav`)
  writeWav(file, fn())
  console.log('Wrote', file)
}
console.log('Done —', Object.keys(PRESETS).length, 'ambient loops in public/sounds/ambient/')
