import { supabase } from '../lib/supabase'

const apiUrl = import.meta.env.VITE_API_URL

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiUrl) {
    throw new Error('VITE_API_URL is not configured.')
  }

  const headers = new Headers(init.headers)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    throw new Error(`Could not read the Supabase session: ${sessionError.message}`)
  }
  if (!session?.access_token) {
    throw new Error('You must be signed in to call the API.')
  }
  headers.set('Authorization', `Bearer ${session.access_token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, {
      ...init,
      headers,
    })
  } catch {
    throw new Error('Could not connect to the API. Check the server and try again.')
  }

  const body = await response.text()
  if (!response.ok) {
    throw new Error(getErrorMessage(body, response.status))
  }

  return JSON.parse(body) as T
}

function getErrorMessage(body: string, status: number): string {
  if (body) {
    try {
      const result: unknown = JSON.parse(body)
      if (
        typeof result === 'object' &&
        result !== null &&
        'error' in result &&
        typeof result.error === 'string'
      ) {
        return result.error
      }
    } catch {
      return body
    }
  }

  return `API request failed with status ${status}.`
}
