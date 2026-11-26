import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'saved' | 'saving' | 'error'

interface RestoredDraft {
  value: string
  error: string | null
}

function restoreDraft(storageKey: string): RestoredDraft {
  if (typeof window === 'undefined') return { value: '', error: null }

  try {
    return {
      value: window.localStorage.getItem(storageKey) ?? '',
      error: null,
    }
  } catch {
    return {
      value: '',
      error: 'Unable to restore the local draft. Check your browser storage settings.',
    }
  }
}

export function useAutosave(storageKey: string, debounceMs = 500) {
  const [initialDraft] = useState(() => restoreDraft(storageKey))
  const [value, setValue] = useState(initialDraft.value)
  const [status, setStatus] = useState<AutosaveStatus>(
    initialDraft.error ? 'error' : 'saved',
  )
  const [error, setError] = useState<string | null>(initialDraft.error)
  const valueRef = useRef(value)

  const saveNow = useCallback(() => {
    if (typeof window === 'undefined') {
      setStatus('error')
      setError('Local storage is unavailable in this environment.')
      return false
    }

    try {
      window.localStorage.setItem(storageKey, valueRef.current)
      setStatus('saved')
      setError(null)
      return true
    } catch {
      setStatus('error')
      setError('Unable to save the local draft. Check your browser storage settings.')
      return false
    }
  }, [storageKey])

  useEffect(() => {
    const timeoutId = window.setTimeout(saveNow, debounceMs)
    return () => window.clearTimeout(timeoutId)
  }, [debounceMs, saveNow, value])

  const updateValue = useCallback((nextValue: string) => {
    valueRef.current = nextValue
    setValue(nextValue)
    setStatus('saving')
    setError(null)
  }, [])

  return { value, updateValue, status, error, saveNow }
}
