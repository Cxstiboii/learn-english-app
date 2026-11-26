export interface Option {
  id: string
  text: string
}

export interface Question {
  id: string
  focusCategory: string
  prompt: string
  options: string[]
}
