import { z } from 'zod'
import { config } from '../../config/index.js'

export type AIMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type GenerateTextInput = {
  system: string
  messages: AIMessage[]
  maxTokens?: number
  jsonMode?: boolean
}

export type GenerateJSONInput<T> = GenerateTextInput & {
  schema: z.ZodType<T>
}

type TokenUsage = {
  inputTokens: number | null
  outputTokens: number | null
}

type ProviderResult = {
  text: string
  usage: TokenUsage
}

type ProviderRequest = {
  provider: string
  url: string
  headers: Record<string, string>
  body: unknown
  parse: (payload: unknown) => ProviderResult
}

const requestTimeoutMs = 30_000
const defaultMaxTokens = 800
const maxMaxTokens = 4096

export class AIServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function recordAt(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined
  const result = value[key]
  return isRecord(result) ? result : undefined
}

function stringAt(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined
  const result = value[key]
  return typeof result === 'string' ? result : undefined
}

function numberAt(value: unknown, key: string): number | null {
  if (!isRecord(value)) return null
  const result = value[key]
  return typeof result === 'number' && Number.isFinite(result) ? result : null
}

function usage(input: unknown, inputKey: string, outputKey: string): TokenUsage {
  return {
    inputTokens: numberAt(input, inputKey),
    outputTokens: numberAt(input, outputKey),
  }
}

function parseOpenAIResponse(payload: unknown): ProviderResult {
  const choices = isRecord(payload) ? payload.choices : undefined
  const firstChoice = Array.isArray(choices) ? choices[0] : undefined
  const message = recordAt(firstChoice, 'message')
  const text = stringAt(message, 'content')?.trim()
  if (!text) throw new Error('Empty provider response')

  return {
    text,
    usage: usage(recordAt(payload, 'usage'), 'prompt_tokens', 'completion_tokens'),
  }
}

function parseAnthropicResponse(payload: unknown): ProviderResult {
  const blocks = isRecord(payload) ? payload.content : undefined
  const text = Array.isArray(blocks)
    ? blocks
        .filter(isRecord)
        .map((block) => stringAt(block, 'text') ?? '')
        .join('')
        .trim()
    : ''
  if (!text) throw new Error('Empty provider response')

  return {
    text,
    usage: usage(recordAt(payload, 'usage'), 'input_tokens', 'output_tokens'),
  }
}

function parseGoogleResponse(payload: unknown): ProviderResult {
  const candidates = isRecord(payload) ? payload.candidates : undefined
  const firstCandidate = Array.isArray(candidates) ? candidates[0] : undefined
  const content = recordAt(firstCandidate, 'content')
  const parts = content?.parts
  const text = Array.isArray(parts)
    ? parts
        .filter(isRecord)
        .map((part) => stringAt(part, 'text') ?? '')
        .join('')
        .trim()
    : ''
  if (!text) throw new Error('Empty provider response')

  const metadata = recordAt(payload, 'usageMetadata')
  return {
    text,
    usage: usage(metadata, 'promptTokenCount', 'candidatesTokenCount'),
  }
}

const openAICompatibleEndpoints: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

function getProviderRequest(
  system: string,
  messages: AIMessage[],
  maxTokens: number,
  jsonMode: boolean,
): ProviderRequest {
  const provider = config.AI_PROVIDER?.trim().toLowerCase()
  const apiKey = config.AI_API_KEY
  const model = config.AI_MODEL

  if (!provider || !apiKey || !model) {
    throw new AIServiceError(
      503,
      'AI_NOT_CONFIGURED',
      'The AI service is not configured. Please try again later.',
    )
  }

  const headers = { 'Content-Type': 'application/json' }
  if (openAICompatibleEndpoints[provider]) {
    return {
      provider,
      url: openAICompatibleEndpoints[provider],
      headers: { ...headers, Authorization: `Bearer ${apiKey}` },
      body: {
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
      },
      parse: parseOpenAIResponse,
    }
  }

  if (provider === 'anthropic') {
    return {
      provider,
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        ...headers,
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model,
        system,
        messages,
        max_tokens: maxTokens,
      },
      parse: parseAnthropicResponse,
    }
  }

  if (provider === 'google') {
    return {
      provider,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      headers: { ...headers, 'x-goog-api-key': apiKey },
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(({ role, content }) => ({
          role: role === 'assistant' ? 'model' : 'user',
          parts: [{ text: content }],
        })),
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      },
      parse: parseGoogleResponse,
    }
  }

  throw new AIServiceError(
    503,
    'AI_PROVIDER_UNSUPPORTED',
    'The configured AI provider is not supported.',
  )
}

function delimitStudentText(content: string): string {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<student_text>\n${escaped}\n</student_text>`
}

export async function generateText({
  system,
  messages,
  maxTokens = defaultMaxTokens,
  jsonMode = false,
}: GenerateTextInput): Promise<string> {
  const tokenLimit = Math.min(Math.max(1, Math.floor(maxTokens)), maxMaxTokens)
  const providerRequest = getProviderRequest(
    system,
    messages.map((message) => ({
      ...message,
      content: message.role === 'user' ? delimitStudentText(message.content) : message.content,
    })),
    tokenLimit,
    jsonMode,
  )
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

  try {
    const response = await fetch(providerRequest.url, {
      method: 'POST',
      headers: providerRequest.headers,
      body: JSON.stringify(providerRequest.body),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new AIServiceError(
        502,
        'AI_PROVIDER_ERROR',
        'The AI provider is temporarily unavailable. Please try again.',
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new AIServiceError(
        502,
        'AI_INVALID_RESPONSE',
        'The AI provider returned an invalid response. Please try again.',
      )
    }

    let result: ProviderResult
    try {
      result = providerRequest.parse(payload)
    } catch {
      throw new AIServiceError(
        502,
        'AI_INVALID_RESPONSE',
        'The AI provider returned an empty or invalid response. Please try again.',
      )
    }

    console.info('[ai] token usage', {
      provider: providerRequest.provider,
      model: config.AI_MODEL,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    })

    return result.text
  } catch (error) {
    if (error instanceof AIServiceError) throw error
    if (controller.signal.aborted) {
      throw new AIServiceError(
        504,
        'AI_TIMEOUT',
        'The AI request timed out. Please try again.',
      )
    }

    console.error('[ai] provider request failed', {
      provider: providerRequest.provider,
      errorType: error instanceof Error ? error.name : 'UnknownError',
    })
    throw new AIServiceError(
      502,
      'AI_PROVIDER_ERROR',
      'The AI provider is temporarily unavailable. Please try again.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateJSON<T>({
  system,
  messages,
  schema,
  maxTokens,
}: GenerateJSONInput<T>): Promise<T> {
  const jsonSystem = `${system}\n\nReturn only valid JSON. Do not include markdown, code fences, or any text outside the JSON value.`
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const retrySystem = attempt === 0
      ? jsonSystem
      : `${jsonSystem}\nYour previous response did not match the required JSON format. Correct it and return only valid JSON.`
    const response = await generateText({
      system: retrySystem,
      messages,
      maxTokens,
      jsonMode: true,
    })

    try {
      const parsed: unknown = JSON.parse(response)
      const validation = schema.safeParse(parsed)
      if (validation.success) return validation.data
    } catch {
      continue
    }
  }

  throw new AIServiceError(
    502,
    'AI_INVALID_JSON',
    'The AI response could not be validated. Please try again.',
  )
}
