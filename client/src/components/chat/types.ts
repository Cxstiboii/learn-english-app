import type { ChatCorrection } from '../../services/chat'

export interface SessionNote {
  id: string
  category: 'grammar' | 'phrase' | 'vocabulary'
  title: string
  content: string
}

export type { ChatCorrection }
