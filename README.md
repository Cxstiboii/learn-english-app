# Fluent Path

A React learning app and API for a Spanish-speaking learner progressing from B1 to B2.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- A Supabase project

## Setup

1. Run `npm install` from the repository root.
2. Copy `client/.env.example` to `client/.env` and add your Supabase project URL and anon key.
3. Copy `server/.env.example` to `server/.env` and add your Supabase project URL and service role key. Keep the service role key only in `server/.env`; never put it in the client. Set `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` to enable AI features.
4. Start the frontend with `npm run dev`.
5. In another terminal, start the API with `npm run dev:server`.

The client runs at `http://localhost:5173` and the API at `http://localhost:3001`.

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Client | API base URL, e.g. `http://localhost:3001` |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Public anon/publishable key; safe to expose in the browser when RLS is enabled |
| `PORT` | Server | HTTP port; defaults to `3001` locally and is supplied by Render in production |
| `CLIENT_ORIGIN` | Server | The single allowed frontend origin for CORS |
| `SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Private Supabase admin key; never add a `VITE_` prefix or configure it in Vercel |
| `AI_PROVIDER` | Server only | `openai`, `anthropic`, `google`, `deepseek`, `groq`, `mistral`, or `openrouter` |
| `AI_API_KEY` | Server only | Private API key for the selected AI provider |
| `AI_MODEL` | Server only | Model identifier for the selected provider |
| `DAILY_STREAK_GOAL_FRACTION` | Server | Fraction of the daily goal required to extend a streak; defaults to `0.5` |

Environment files are ignored by Git. Keep only placeholders in `.env.example` files; never commit real keys.

For local Supabase Auth, enable the GitHub and Google providers and allow `http://localhost:5173/path` and `http://localhost:5173/login` as redirect URLs.

## Production deployment

### API on Render

The root `render.yaml` defines the production API service, build/start commands, and `/api/health` check. In Render, create a Blueprint from this repository and set the prompted environment variables:

- `CLIENT_ORIGIN`: exact HTTPS origin of the Vercel frontend, without a path or trailing slash.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: from the Supabase project API settings. Keep the service role key in Render's server environment only.
- `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL`: credentials and model for the chosen AI provider.

Render supplies `PORT`. After deployment, verify `https://<render-service>.onrender.com/api/health` returns `{"status":"ok"}`. Use that service URL as the client's `VITE_API_URL`.

### Client on Vercel

Import the repository into Vercel and set the project **Root Directory** to `client`. Configure these production environment variables in Vercel (Production, and Preview only if needed):

- `VITE_API_URL=https://<render-service>.onrender.com`
- `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<Supabase anon/publishable key>`

The `client/vercel.json` rewrite sends client-side routes to `index.html`, so refreshing a React Router URL works. Vite embeds `VITE_` values into the browser bundle: only the public Supabase anon/publishable key belongs there. Never configure `SUPABASE_SERVICE_ROLE_KEY` or `AI_API_KEY` in Vercel.

### Supabase Auth redirects and OAuth

After the Vercel domain is assigned, open **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to the frontend origin, e.g. `https://<your-app>.vercel.app`.
2. Add these exact production **Redirect URLs**: `https://<your-app>.vercel.app/path` and `https://<your-app>.vercel.app/login`. Retain the localhost URLs for development if needed.
3. Under **Authentication → Providers**, enable Google and GitHub. In each provider's OAuth app settings, set its callback/redirect URI to the Supabase callback URL displayed in the dashboard (normally `https://<project-ref>.supabase.co/auth/v1/callback`); add the OAuth client ID and secret to the corresponding Supabase provider settings, not to the client or this repository.
4. For Google, add the Vercel frontend origin to the Google OAuth client's **Authorized JavaScript origins**. GitHub OAuth Apps use the callback URL and do not have a JavaScript-origins setting.

Supabase dashboard/provider settings require access to your project and OAuth applications; they are not provisioned by this repository.

## Workspaces

- `client/`: Vite, React, TypeScript, Tailwind, Supabase Auth client, and typed API services.
- `server/`: Express API, Supabase access-token validation, and server-only LLM integration.

All API endpoints except `GET /api/health` require a Supabase access token in the `Authorization: Bearer <token>` header. `GET /api/me` returns the authenticated user's profile. Provider credentials belong only in `server/.env`.

The client uses TanStack Query for live data. Screen endpoint mapping: Tutor Chat uses `GET /api/conversations`, `GET /api/conversations/:id/messages`, and `POST /api/chat`; Vocabulary uses `GET /api/vocab/due`, `GET /api/vocab/stats`, `POST /api/vocab/:id/review`, `POST /api/vocab`, and `POST /api/vocab/generate`; Exercises uses `/api/exercises/weak-spots`, `/api/exercises/generate`, and `/api/exercises/:id/answer`; Speaking, Writing, and Interview use `/api/speaking/evaluate`, `/api/writing/grade`, and `/api/interview/evaluate`; Progress uses `GET /api/progress/summary` and `POST /api/activity/log`; Study Path uses `GET /api/path` and `POST /api/path/activities/:id/complete`.

Speaking, Writing, and Interview evaluations require an `Idempotency-Key` UUID header. Replaying a request with the same key returns the saved evaluation without duplicating its error patterns or the one minute added to daily activity.

The AI service supports `openai`, `anthropic`, `google`, `deepseek`, `groq`, `mistral`, and `openrouter`. AI-backed routes limit text input to 2,000 characters and allow 20 requests per user every 15 minutes.

The tutor chat uses `POST /api/chat` with `{ "message": "...", "conversationId": "..." }`; `conversationId` is optional for a new conversation. Use `GET /api/conversations` to list the signed-in user's conversations and `GET /api/conversations/:id/messages` to load one. Each successful chat exchange adds one minute to today's activity.

Vocabulary endpoints are `GET /api/vocab/due`, `POST /api/vocab`, `POST /api/vocab/:id/review`, `POST /api/vocab/generate`, and `GET /api/vocab/stats`. Generated cards use recent error patterns; `/generate` accepts `{ "topic": "code reviews", "count": 5 }`. Retention is the all-time share of review ratings other than `again`; a card is mastered after at least five successful repetitions and a 21-day interval.

Exercise endpoints are `GET /api/exercises/weak-spots`, `POST /api/exercises/generate` with `{ "count": 5 }`, and `POST /api/exercises/:id/answer` with `{ "selectedOption": "..." }`. Generated exercises focus on the user's top five error patterns, or B1+ technical-English grammar if none exist. Correct answers and explanations are returned after an attempt, not in the generated set.

Evaluation endpoints are `POST /api/speaking/evaluate` (`prompt`, `transcript`, `durationSeconds`), `POST /api/writing/grade` (`examMode`, `prompt`, `response`), and `POST /api/interview/evaluate` (`track`, 1–5 `answers` with `question` and `transcript`). They return estimated scores with the disclaimer `Estimated score, not an official result.`, persist each evaluation, and record identified language errors in the user's error patterns. Request fields have per-endpoint character limits.

Progress endpoints are `GET /api/progress/summary` and `POST /api/activity/log` with `{ "minutes": 10 }`. The streak threshold is configurable with `DAILY_STREAK_GOAL_FRACTION` (default `0.5`) and daily activity dates use `America/Bogota`. The summary's percentage toward B2 is completed study-path activities divided by all activities; its recent estimated score averages up to five latest numeric speaking and writing evaluations.

The study path endpoints are `GET /api/path` and `POST /api/path/activities/:id/complete`. Path units include per-activity completion, unit progress, and one of `Completado`, `En curso`, `Disponible`, `Próximo`, or `Meta`. Earlier units must be completed before activities in later units can be marked complete.

## Supabase database

In the Supabase Dashboard, open **SQL Editor** for your project and run `supabase/migrations/001_init.sql` through `supabase/migrations/007_atomic_evaluation_persistence.sql` in order. If migrations `001`–`006` are already applied, run only `007_atomic_evaluation_persistence.sql`; do not rerun the previous migrations. Finally, run `supabase/seed.sql` to load the five study-path units and their activities. The seed can be run again safely to update the study-path content.

## Checks

- `npm run typecheck`
- `npm run build`
