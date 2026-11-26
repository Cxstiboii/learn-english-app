import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import { config } from './config/index.js'
import { apiRouter } from './routes/api.js'

const app = express()

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

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
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
    method: _request.method,
    status,
    errorType,
  })
  response.status(status).json({
    error: status < 500 ? 'Request is invalid or too large.' : 'Internal server error.',
  })
}

app.use(errorHandler)

app.listen(config.PORT, () => {
  console.log(`API server listening on port ${config.PORT}`)
})
