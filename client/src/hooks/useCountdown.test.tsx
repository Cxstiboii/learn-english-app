import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down to zero and reports expiration', () => {
    const { result } = renderHook(() => useCountdown(2, true))

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.elapsedSeconds).toBe(1)
    expect(result.current.remainingSeconds).toBe(1)

    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isExpired).toBe(true)
  })

  it('does not count while paused and resumes from the remaining time', () => {
    const { result, rerender } = renderHook(
      ({ isRunning }) => useCountdown(4, isRunning),
      { initialProps: { isRunning: true } },
    )

    act(() => vi.advanceTimersByTime(1000))
    rerender({ isRunning: false })
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.elapsedSeconds).toBe(1)
    expect(result.current.remainingSeconds).toBe(3)

    rerender({ isRunning: true })
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.elapsedSeconds).toBe(2)
    expect(result.current.remainingSeconds).toBe(2)
  })
})
