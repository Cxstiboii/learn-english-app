import assert from 'node:assert/strict'
import { test } from 'vitest'
import { calculateSM2 } from './srs.js'

const reviewedAt = new Date('2026-01-10T12:30:00.000Z')

test('first good review schedules one day later', () => {
  const result = calculateSM2(2.5, 0, 0, 'good', reviewedAt)

  assert.deepEqual(result, {
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 1,
    due_at: '2026-01-11T12:30:00.000Z',
  })
})

test('second successful review schedules six days later', () => {
  const result = calculateSM2(2.5, 1, 1, 'good', reviewedAt)

  assert.equal(result.interval_days, 6)
  assert.equal(result.repetitions, 2)
  assert.equal(result.due_at, '2026-01-16T12:30:00.000Z')
})

test('hard lowers ease factor and continues the SM-2 interval sequence', () => {
  const result = calculateSM2(2.5, 6, 2, 'hard', reviewedAt)

  assert.equal(result.ease_factor, 2.36)
  assert.equal(result.interval_days, 14)
  assert.equal(result.repetitions, 3)
})

test('easy increases ease factor', () => {
  const result = calculateSM2(2.5, 6, 2, 'easy', reviewedAt)

  assert.equal(result.ease_factor, 2.6)
  assert.equal(result.interval_days, 16)
  assert.equal(result.repetitions, 3)
})

test('again resets repetitions and schedules a one-day retry', () => {
  const result = calculateSM2(1.3, 21, 5, 'again', reviewedAt)

  assert.equal(result.ease_factor, 1.3)
  assert.equal(result.interval_days, 1)
  assert.equal(result.repetitions, 0)
  assert.equal(result.due_at, '2026-01-11T12:30:00.000Z')
})

test('rejects invalid review inputs', () => {
  assert.throws(() => calculateSM2(0, 0, 0, 'good', reviewedAt), RangeError)
  assert.throws(() => calculateSM2(2.5, -1, 0, 'good', reviewedAt), RangeError)
  assert.throws(() => calculateSM2(2.5, 0, 0, 'good', new Date('invalid')), RangeError)
})
