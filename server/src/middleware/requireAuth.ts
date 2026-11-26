import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.header('Authorization')
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1]

  if (!token) {
    response.status(401).json({ error: 'A valid bearer token is required.' })
    return
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      response.status(401).json({ error: 'The access token is invalid or expired.' })
      return
    }

    request.user = data.user
    next()
  } catch (error) {
    next(error)
  }
}
