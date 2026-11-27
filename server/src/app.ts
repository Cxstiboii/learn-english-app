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
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}))
app.use(express.json({ limit: '96kb' }))
app.use('/api', apiRouter)

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' })
})

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
  const message = status < 500
    ? 'Request is invalid or too large.'
    : 'Internal server error.'

  response.status(status).json({ error: message })
}

app.use(errorHandler)
