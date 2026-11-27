import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  isFinal: boolean
  0: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined

  const speechWindow = window as SpeechRecognitionWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}

function getRecognitionErrorMessage(error: string) {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Allow microphone access in your browser settings and try again.'
    case 'audio-capture':
      return 'No microphone was found. Connect a microphone and try again.'
    case 'no-speech':
      return 'No speech was detected. Try speaking closer to your microphone.'
    case 'network':
      return 'Speech recognition could not connect. Check your internet connection and try again.'
    default:
      return 'Speech recognition stopped unexpectedly. Please try again.'
  }
}

export function useSpeechRecognition(
  onTranscript?: (transcript: string) => void,
  language: 'en-US' | 'en-GB' = 'en-US',
) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => Boolean(getSpeechRecognitionConstructor()))

  const stop = useCallback(() => {
    const interim = interimTranscriptRef.current
    if (interim) {
      const final = [finalTranscriptRef.current, interim].filter(Boolean).join(' ')
      finalTranscriptRef.current = final
      interimTranscriptRef.current = ''
      setFinalTranscript(final)
      setInterimTranscript('')
      onTranscript?.(final)
    }
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [onTranscript])

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
    setFinalTranscript('')
    setInterimTranscript('')
    setIsListening(false)
    setError(null)
  }, [])

  const start = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge to record your answer.')
      return
    }

    recognitionRef.current?.abort()
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    recognitionRef.current = recognition

    setFinalTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
    setError(null)

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        const addition = final.trim()
        const current = finalTranscriptRef.current
        if (!current.endsWith(addition)) {
          const updated = [current, addition].filter(Boolean).join(' ')
          finalTranscriptRef.current = updated
          setFinalTranscript(updated)
        }
      }
      interimTranscriptRef.current = interim.trim()
      setInterimTranscript(interimTranscriptRef.current)
      onTranscript?.(
        [finalTranscriptRef.current, interimTranscriptRef.current].filter(Boolean).join(' '),
      )
    }
    recognition.onerror = (event) => {
      const interim = interimTranscriptRef.current
      if (interim) {
        const final = [finalTranscriptRef.current, interim].filter(Boolean).join(' ')
        finalTranscriptRef.current = final
        interimTranscriptRef.current = ''
        setFinalTranscript(final)
        setInterimTranscript('')
        onTranscript?.(final)
      }
      setError(getRecognitionErrorMessage(event.error))
      setIsListening(false)
    }
    recognition.onend = () => {
      if (recognitionRef.current === recognition && interimTranscriptRef.current) {
        const final = [finalTranscriptRef.current, interimTranscriptRef.current]
          .filter(Boolean)
          .join(' ')
        finalTranscriptRef.current = final
        interimTranscriptRef.current = ''
        setFinalTranscript(final)
        onTranscript?.(final)
      }
      setIsListening(false)
      interimTranscriptRef.current = ''
      setInterimTranscript('')
      if (recognitionRef.current === recognition) recognitionRef.current = null
    }

    try {
      setIsListening(true)
      recognition.start()
    } catch (startError) {
      setIsListening(false)
      setError(
        startError instanceof DOMException && startError.name === 'NotAllowedError'
          ? getRecognitionErrorMessage('not-allowed')
          : 'Unable to start speech recognition. Please check microphone permissions and try again.',
      )
    }
  }, [language, onTranscript])

  useEffect(
    () => () => {
      recognitionRef.current?.abort()
    },
    [],
  )

  return {
    transcript: [finalTranscript, interimTranscript].filter(Boolean).join(' '),
    isListening,
    start,
    stop,
    reset,
    isSupported,
    error,
  }
}
