import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSpeechRecognition } from './useSpeechRecognition'

describe('useSpeechRecognition', () => {
  it('sets the chosen locale on the recognition instance', () => {
    let recognitionLanguage = ''
    class FakeSpeechRecognition {
      continuous = false
      interimResults = false
      lang = ''
      onstart: (() => void) | null = null
      onresult: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      onend: (() => void) | null = null
      start() {
        recognitionLanguage = this.lang
      }
      stop() {}
      abort() {}
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    })
    const { result } = renderHook(() => useSpeechRecognition(undefined, 'en-GB'))

    act(() => result.current.start())

    expect(recognitionLanguage).toBe('en-GB')
  })
})
