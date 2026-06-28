/** YYYY-MM for monthly streak-shield allowance */
export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** Shield is available when earned (5-day chest) or unused this calendar month (legacy saves). */
export function isStreakShieldAvailable(usedMonth: string, today: string): boolean {
  if (usedMonth === 'earned') return true
  if (!usedMonth) return false
  return usedMonth !== monthKeyFromDate(today)
}
