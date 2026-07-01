import { useUIStore } from '@/store/useUIStore'

export type TelemetryEvent = {
  name: string
  at: string
  props?: Record<string, unknown>
}

const RING_MAX = 100
const ring: TelemetryEvent[] = []

function telemetryEnabled(): boolean {
  return useUIStore.getState().settings.telemetryEnabled === true
}

export function getTelemetryRingBuffer(): TelemetryEvent[] {
  return [...ring]
}

export function trackTelemetry(event: string, props?: Record<string, unknown>): void {
  if (!telemetryEnabled()) return
  const entry: TelemetryEvent = {
    name: event,
    at: new Date().toISOString(),
    props,
  }
  ring.push(entry)
  if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX)
  void window.electronAPI?.desktop?.trackTelemetry?.(entry)
}

export function exportTelemetryBundle(): { events: TelemetryEvent[]; exportedAt: string } {
  return { events: getTelemetryRingBuffer(), exportedAt: new Date().toISOString() }
}
