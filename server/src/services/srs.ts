export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface SRSResult {
  ease_factor: number
  interval_days: number
  repetitions: number
  due_at: string
}

const ratingQuality: Record<ReviewRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
}

export function calculateSM2(
  ease_factor: number,
  interval_days: number,
  repetitions: number,
  rating: ReviewRating,
  reviewedAt: Date,
): SRSResult {
  if (!Number.isFinite(ease_factor) || ease_factor <= 0) {
    throw new RangeError('ease_factor must be a positive finite number.')
  }
  if (!Number.isSafeInteger(interval_days) || interval_days < 0) {
    throw new RangeError('interval_days must be a non-negative integer.')
  }
  if (!Number.isSafeInteger(repetitions) || repetitions < 0) {
    throw new RangeError('repetitions must be a non-negative integer.')
  }
  if (!Object.hasOwn(ratingQuality, rating)) {
    throw new RangeError('rating must be again, hard, good, or easy.')
  }
  if (!Number.isFinite(reviewedAt.getTime())) {
    throw new RangeError('reviewedAt must be a valid date.')
  }

  const quality = ratingQuality[rating]
  const nextEaseFactor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  )
  const roundedEaseFactor = Math.round(nextEaseFactor * 100) / 100

  let nextRepetitions: number
  let nextInterval: number

  if (quality < 3) {
    nextRepetitions = 0
    nextInterval = 1
  } else {
    nextRepetitions = repetitions + 1
    if (nextRepetitions === 1) {
      nextInterval = 1
    } else if (nextRepetitions === 2) {
      nextInterval = 6
    } else {
      nextInterval = Math.round(interval_days * roundedEaseFactor)
    }
  }

  const dueAt = new Date(reviewedAt.getTime())
  dueAt.setUTCDate(dueAt.getUTCDate() + nextInterval)

  return {
    ease_factor: roundedEaseFactor,
    interval_days: nextInterval,
    repetitions: nextRepetitions,
    due_at: dueAt.toISOString(),
  }
}
