---
name: testing-vitest
description: How to write and run tests in this repo with Vitest (React Testing Library on the client, supertest on the server). Use when asked to add, fix or review tests, or when new logic needs test coverage.
---

# Testing with Vitest

## Tools

- Client: Vitest, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, jsdom.
- Server: Vitest and supertest.
- If something is missing, install it and add a `test` script. Do not add other test frameworks.

## What to test first (highest value)

1. Pure logic: spaced repetition (SM-2), streak calculation, word counting, STAR keyword detection, score calculations.
2. Custom hooks (`useCountdown`, `useAutosave`, `useSpeechRecognition`) with `renderHook`.
3. Component behavior: what the user sees and does, not internal state.
4. Server routes: auth required, input validation, success and error responses.
5. The AI layer: invalid JSON from the provider, schema validation failure, the single retry, timeouts.

## Rules

- File next to the source: `name.test.ts` or `name.test.tsx`.
- Arrange, act, assert. One behavior per test. Names read like sentences: `it("marks the card as due tomorrow when rated good")`.
- Query by role, label or visible text (`getByRole`, `getByLabelText`); avoid test IDs and CSS selectors. Use `user-event`, not `fireEvent`.
- Never test implementation details (internal state, private functions, exact class names). Avoid snapshots except for tiny stable output.
- Tests must be deterministic: no real network, no real AI, no real Supabase, no real clock.
  - Time: `vi.useFakeTimers()` and `vi.setSystemTime()`. Streak tests must cover the day change in the America/Bogota time zone.
  - Network and services: mock at the service boundary (`vi.mock`).
  - Browser APIs missing in jsdom (`SpeechRecognition`, `speechSynthesis`, `localStorage` state): provide small fakes in a shared test setup file and reset them between tests.
- Server tests mock the AI client and the Supabase client. Always include: no token returns 401, invalid body returns 400, and one user cannot read another user's data.
- Cover edge cases: empty input, boundaries (0 words, exactly the minimum), errors and timeouts.

## Workflow

1. For a bug: write a failing test that reproduces it, then fix it.
2. For new logic: write the tests together with the code.
3. Run the real commands and report the real output:
   - client: `cd client && npm run lint && npm run typecheck && npm run test:run`
   - server: `cd server && npm run lint && npm run typecheck && npm run test:run`
4. Never change or delete a test just to make it pass. If a test is wrong, explain why before changing it.
5. Coverage is a guide, not a goal. Prioritize critical logic over reaching a percentage.
