import { useCallback, useEffect, useState } from 'react'

export function useCountdown(durationSeconds: number, isRunning: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!isRunning || elapsedSeconds >= durationSeconds) return

    let lastTick = Date.now()
    const intervalId = window.setInterval(() => {
      const now = Date.now()
      const secondsPassed = Math.floor((now - lastTick) / 1000)
      if (secondsPassed < 1) return

      lastTick += secondsPassed * 1000
      setElapsedSeconds((elapsed) => Math.min(elapsed + secondsPassed, durationSeconds))
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [durationSeconds, elapsedSeconds, isRunning])

  const reset = useCallback(() => {
    setElapsedSeconds(0)
  }, [])

  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
  const isExpired = remainingSeconds === 0
  const isLowTime = remainingSeconds < durationSeconds * 0.2

  return { elapsedSeconds, remainingSeconds, isExpired, isLowTime, reset }
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}
