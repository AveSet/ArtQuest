/** Local calendar date YYYY-MM-DD */
export function toLocalIsoDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type HeatmapCell = {
  date: string
  active: boolean
}

export type StreakHeatmapGrid = {
  weeks: number
  cells: HeatmapCell[]
}

/** GitHub-style grid: rows = weekdays (Mon–Sun), columns = weeks (oldest → newest). */
export function buildStreakHeatmap(
  activeDates: Iterable<string>,
  weeks = 12,
  today = new Date(),
): StreakHeatmapGrid {
  const active = new Set(activeDates)
  const end = new Date(today)
  end.setHours(12, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - weeks * 7 + 1)
  const startDow = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - startDow)

  const cells: HeatmapCell[] = []
  const cursor = new Date(start)
  const totalDays = weeks * 7
  for (let i = 0; i < totalDays; i++) {
    const date = toLocalIsoDate(cursor.toISOString())
    cells.push({ date, active: active.has(date) })
    cursor.setDate(cursor.getDate() + 1)
  }
  return { weeks, cells }
}

export function practiceDaysFromLogs(
  logs: { completedAt: string }[],
): string[] {
  return [...new Set(logs.map((l) => toLocalIsoDate(l.completedAt)))]
}
