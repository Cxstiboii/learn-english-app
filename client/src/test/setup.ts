import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

const storage = new Map<string, string>()

const localStorageFake: Storage = {
  get length() {
    return storage.size
  },
  clear: () => storage.clear(),
  getItem: (key) => storage.get(key) ?? null,
  key: (index) => Array.from(storage.keys())[index] ?? null,
  removeItem: (key) => storage.delete(key),
  setItem: (key, value) => storage.set(key, String(value)),
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageFake,
})

const recognitionInstances: FakeSpeechRecognition[] = []

class FakeSpeechRecognition {
  continuous = false
  interimResults = false
  lang = ''
  onstart: (() => void) | null = null
  onresult: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()

  constructor() {
    recognitionInstances.push(this)
  }

  reset() {
    this.continuous = false
    this.interimResults = false
    this.lang = ''
    this.onstart = null
    this.onresult = null
    this.onerror = null
    this.onend = null
    this.start.mockReset()
    this.stop.mockReset()
    this.abort.mockReset()
  }
}

Object.defineProperty(window, 'SpeechRecognition', {
  configurable: true,
  value: FakeSpeechRecognition,
})
Object.defineProperty(window, 'webkitSpeechRecognition', {
  configurable: true,
  value: FakeSpeechRecognition,
})

const speechSynthesisFake = {
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
}

Object.defineProperty(window, 'speechSynthesis', {
  configurable: true,
  value: speechSynthesisFake,
})

afterEach(() => {
  cleanup()
  localStorageFake.clear()
  recognitionInstances.forEach((instance) => instance.reset())
  recognitionInstances.length = 0
  vi.clearAllMocks()
  vi.useRealTimers()
})
