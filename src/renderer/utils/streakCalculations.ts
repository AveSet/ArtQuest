function mergePracticeDays(completionDates: string[], extraActiveDays: string[] = []): string[] {
  return [...new Set([
    ...completionDates.map((d) => d.slice(0, 10)),
    ...extraActiveDays.map((d) => d.slice(0, 10)),
  ])]
}

/** Days that count toward practice streak without a log (shield bridge, recovery). */
export function buildPracticeStreakGraceDays(opts: {
  lastShieldUsedOnDate?: string
  streakRecoveryDueDate?: string
}): string[] {
  const days: string[] = []
  if (opts.lastShieldUsedOnDate) days.push(opts.lastShieldUsedOnDate.slice(0, 10))
  if (opts.streakRecoveryDueDate) {
    const recovery = opts.streakRecoveryDueDate.slice(0, 10)
    const d = new Date(recovery + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${day}`)
  }
  return days
}

export function calculateCurrentStreak(
  completionDates: string[],
  extraActiveDays: string[] = [],
): number {
  const uniqueDays = mergePracticeDays(completionDates, extraActiveDays)
  if (uniqueDays.length === 0) return 0

  const sorted = uniqueDays.sort().reverse()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  const checkDate = new Date(today)

  for (const dayStr of sorted) {
    const parts = dayStr.split('-')
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((checkDate.getTime() - d.getTime()) / 86400000)
    if (diff === streak) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function calculateBestStreak(
  completionDates: string[],
  extraActiveDays: string[] = [],
): number {
  const uniqueDays = mergePracticeDays(completionDates, extraActiveDays)
  if (uniqueDays.length === 0) return 0

  const sorted = uniqueDays.sort()
  const dates = sorted.map(s => {
    const parts = s.split('-')
    return new Date(+parts[0], +parts[1] - 1, +parts[2])
  })

  dates.sort((a, b) => a.getTime() - b.getTime())
  dates.forEach(d => d.setHours(0, 0, 0, 0))

  let best = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i].getTime() - dates[i - 1].getTime()) / 86400000)
    if (diff === 1) {
      current++
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }

  return best
}

export function calculateAveragePerWeek(completionDates: string[]): number {
  if (completionDates.length === 0) return 0

  const dates = [...new Set(completionDates.map(d => d.slice(0, 10)))].sort()

  if (dates.length === 0) return 0

  const first = new Date(dates[0])
  const last = new Date(dates[dates.length - 1])
  const ms = last.getTime() - first.getTime()
  const weeks = Math.max(1, Math.ceil(ms / (7 * 86400000)))

  return Math.round((dates.length / weeks) * 10) / 10
}
