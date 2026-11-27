import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { config } from './config/index.js'
import { apiRouter } from './routes/api.js'

export const app = express()

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin === config.CLIENT_ORIGIN)
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
}))
app.use(express.json({ limit: '96kb' }))
app.use('/api', apiRouter)

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' })
})

export function getSafeErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request.'
    case 401:
      return 'Authentication required.'
    case 403:
      return 'Access denied.'
    case 404:
      return 'Resource not found.'
    case 413:
      return 'Request is too large.'
    case 429:
      return 'Too many requests.'
    default:
      return status >= 500 ? 'Internal server error.' : 'Request could not be completed.'
  }
}

function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  const status = typeof error === 'object'
    && error !== null
    && 'status' in error
    && typeof error.status === 'number'
    && error.status >= 400
    && error.status < 600
    ? error.status
    : 500
  const errorType = error instanceof Error ? error.name : 'UnknownError'

  console.error('[api] request failed', {
    method: request.method,
    status,
    errorType,
  })
  response.status(status).json({ error: getSafeErrorMessage(status) })
}

app.use(errorHandler)
