export type DeckId = string

export interface VocabularyDeck {
  id: DeckId
  name: string
  due: number
}
