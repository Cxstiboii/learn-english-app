export interface DailyActivityEntry {
  date: string
  minutes: number
}

export const streakTimeZone = 'America/Bogota'

export function dateKeyInTimeZone(
  date: Date,
  timeZone = streakTimeZone,
): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return `${values.year}-${values.month}-${values.day}`
}

function previousDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function calculateDailyStreak(
  entries: DailyActivityEntry[],
  dailyGoalMinutes: number,
  goalFraction: number,
  now = new Date(),
  timeZone = streakTimeZone,
): number {
  if (!Number.isFinite(dailyGoalMinutes) || dailyGoalMinutes <= 0) {
    throw new RangeError('dailyGoalMinutes must be a positive number.')
  }
  if (!Number.isFinite(goalFraction) || goalFraction <= 0 || goalFraction > 1) {
    throw new RangeError('goalFraction must be greater than 0 and at most 1.')
  }

  const thresholdMinutes = Math.ceil(dailyGoalMinutes * goalFraction)
  const qualifyingDates = new Set(
    entries
      .filter(({ minutes }) => minutes >= thresholdMinutes)
      .map(({ date }) => date),
  )
  const today = dateKeyInTimeZone(now, timeZone)
  let dateToCheck = qualifyingDates.has(today) ? today : previousDate(today)

  if (!qualifyingDates.has(dateToCheck)) return 0

  let streak = 0
  while (qualifyingDates.has(dateToCheck)) {
    streak += 1
    dateToCheck = previousDate(dateToCheck)
  }

  return streak
}
