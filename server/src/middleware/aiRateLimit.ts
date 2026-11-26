import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) =>
    request.user?.id ?? ipKeyGenerator(request.ip ?? '127.0.0.1'),
  handler: (_request, response) => {
    response.status(429).json({
      error: 'AI request limit reached. Please try again later.',
      code: 'AI_RATE_LIMITED',
    })
  },
})
