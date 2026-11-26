import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateDailyStreak, dateKeyInTimeZone } from './streak.js'

test('counts consecutive qualifying days including today', () => {
  assert.equal(calculateDailyStreak([
    { date: '2026-11-24', minutes: 30 },
    { date: '2026-11-25', minutes: 60 },
    { date: '2026-11-26', minutes: 45 },
  ], 60, 0.5, new Date('2026-11-26T17:00:00.000Z')), 3)
})

test('keeps the previous streak when today has not reached the threshold', () => {
  assert.equal(calculateDailyStreak([
    { date: '2026-11-24', minutes: 35 },
    { date: '2026-11-25', minutes: 30 },
  ], 60, 0.5, new Date('2026-11-26T17:00:00.000Z')), 2)
})

test('resets after a day below the configured fraction', () => {
  assert.equal(calculateDailyStreak([
    { date: '2026-11-23', minutes: 30 },
    { date: '2026-11-24', minutes: 29 },
    { date: '2026-11-25', minutes: 60 },
  ], 60, 0.5, new Date('2026-11-25T17:00:00.000Z')), 1)
})

test('uses the Bogota calendar date across UTC midnight', () => {
  const entries = [
    { date: '2026-04-03', minutes: 30 },
    { date: '2026-04-04', minutes: 30 },
  ]

  assert.equal(dateKeyInTimeZone(new Date('2026-04-04T04:59:59.000Z')), '2026-04-03')
  assert.equal(calculateDailyStreak(
    entries,
    60,
    0.5,
    new Date('2026-04-04T04:59:59.000Z'),
  ), 1)
  assert.equal(dateKeyInTimeZone(new Date('2026-04-04T05:00:00.000Z')), '2026-04-04')
  assert.equal(calculateDailyStreak(
    entries,
    60,
    0.5,
    new Date('2026-04-04T05:00:00.000Z'),
  ), 2)
})

test('rounds the required minutes up and rejects invalid settings', () => {
  assert.equal(calculateDailyStreak([
    { date: '2026-11-26', minutes: 30 },
  ], 61, 0.5, new Date('2026-11-26T17:00:00.000Z')), 0)
  assert.throws(() => calculateDailyStreak([], 60, 0))
})
