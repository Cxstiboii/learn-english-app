---
name: backend-review
description: Review checklist for the Express + Supabase + AI backend in /server. Use when reviewing or writing routes, middleware, database access, validation or AI calls, or when asked to audit backend security.
---

# Backend review checklist

Use together with the `code-review` skill (same priorities and report format). Apply every section below to the changed code.

## Authentication and authorization

- Every `/api` route except `/api/health` goes through `requireAuth`.
- Always filter data by `req.user.id`. Never trust a `user_id` from the body, params or query.
- On routes with `:id`, verify the resource belongs to the user (prevent access to other users' data).
- The Supabase service role key bypasses RLS: every query made with it MUST filter by the user explicitly.

## Supabase and data

- The service role key lives only in server environment variables and is never logged or returned.
- Check the `error` of every Supabase call and handle it.
- Multi-step writes (for example chat message + error patterns + daily activity) must be consistent: use a transaction or an RPC, or make partial failures safe.
- Store dates in UTC; compute day boundaries (streaks) in America/Bogota.
- Avoid N+1 queries, select only the needed columns, and make sure frequent filters have an index.
- Schema changes go in `/supabase/migrations`, and every user table keeps RLS enabled with policies.

## Validation and errors

- Validate body, params and query with zod. Set maximum lengths. Return 400 with a safe message.
- Async handlers must forward errors to the central error handler (Express 4 needs a wrapper).
- Never send stack traces, SQL errors or raw provider errors to the client. Use a consistent error shape and correct status codes (400, 401, 403, 404, 429, 502).

## AI calls

- The AI API key is server-only.
- User text is delimited (for example `<student_text>`) and the system prompt says it is data, never instructions.
- Validate the model output with zod. Retry at most once, with a timeout and a `maxTokens` limit.
- Rate limit per user and cap input size to control cost.
- Do not log full user text, tokens or personal data.
- Scores and levels are estimates; keep the disclaimer in evaluation responses.

## Security basics

- `helmet`, CORS allow-list from an environment variable, JSON body size limit, rate limiting.
- No secrets in git; `.env.example` is up to date with every variable.
- Flag outdated or unnecessary dependencies.

## Structure

- Routes stay thin: route, then controller, then service. No business logic in routes.
- Logic like SRS and streaks are pure functions with tests.
- Config lives in `/config`, prompts in `/prompts`.

## Validate

- `cd server && npm run lint && npm run typecheck && npm run test:run`
- Report the real output; never claim success without running the commands.
