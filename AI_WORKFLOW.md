# AI-Native Workflow Note

## Which AI tools were used

Claude Code (Anthropic) was used for the full implementation: planning the
architecture, scaffolding the Next.js/TypeScript project, writing route
handlers and Zod schemas, generating the Tiptap editor integration and
Markdown-to-ProseMirror converter, writing the Vitest suite, debugging a
Windows-specific npm/Vitest dependency issue, and drafting this
documentation.

## Where AI materially sped up the work

- **Authorization module shape.** Landing quickly on pure functions over a
  minimal `{ ownerId, shares }` input (rather than threading a Supabase
  client through every permission check) made the rules directly unit
  testable and easy to reason about — this shape came out of iterating with
  the model rather than a first draft.
- **Boilerplate that has to be consistent everywhere.** Zod schemas, route
  handler error mapping, and TypeScript types for the same few entities
  (`DocumentRecord`, `DocumentShareRecord`, etc.) needed to stay in sync
  across ~10 API routes. Generating them together, from one shared `types/`
  module, avoided drift that's easy to introduce by hand under time
  pressure.
- **The Markdown → Tiptap JSON converter and its test cases.** Writing a
  small, correct subset-Markdown parser (headings, bold/italic, both list
  types) and enumerating its edge cases (empty file, whitespace-only file,
  mixed list types) went faster with AI generating both the implementation
  and the corresponding test table at once.
- **Debugging a real environment issue.** A stale Windows npm install left
  a broken `@rolldown` native binding and an ESM-only `std-env` conflicting
  with Vitest's CJS config loader. Diagnosing the actual root cause (rather
  than reflexively reinstalling) and landing on a targeted `package.json`
  `overrides` fix was faster with AI iterating through the stack traces.

## What AI-generated output was changed or rejected

- An early instinct to hide the **Share** button client-side for non-owners
  *only* was rejected — a server-side `assertCanShare` check was added to
  the route handler itself, since hiding a button is not access control.
- An initial idea to enable Postgres **Row Level Security** was dropped in
  favor of a single server-only service-role client plus application-level
  checks. RLS policies would have re-expressed the same rules in a second
  place (SQL) that's harder to unit test than the TypeScript module, with no
  real security benefit here since the browser never talks to Supabase
  directly.
- A draft that exposed a Supabase key to client code (thinking ahead to a
  hypothetical client-side realtime feature that was never built) was
  rejected outright — this project makes zero Supabase calls from the
  browser; every database access goes through server-only code
  (`src/lib/supabase-server.ts` imports `server-only` specifically to make
  this a build-time guarantee, not just a convention).
- Generated test assertions that only checked "does not throw" were
  tightened to also assert on the specific error type/code (e.g.
  `NotFoundError` vs `ForbiddenError`), since the distinction between 404
  and 403 is part of the actual requirement, not incidental.

## How correctness was verified

- `tsc --noEmit` in strict mode (no `any` used anywhere in the codebase).
- ESLint, including Next.js's React Compiler rules, which caught several
  real hook-ordering bugs in the editor's autosave logic (a ref mutated
  during render, a function referenced before its `useCallback` declaration)
  that would otherwise have shipped as subtle autosave bugs.
- The Vitest suite (29 tests) covering authorization, file import/parsing,
  and validation — runs without any database connection.
- A successful `next build` production build.
- Manual verification against a **live, seeded Supabase project**: created
  via the dashboard, migrated and seeded with `npm run db:migrate` /
  `npm run db:seed`, then exercised directly:
  - Confirmed all three seeded users load from real Postgres via `/api/users`.
  - Confirmed switching to a user and fetching `/api/documents` returns that
    user's actual owned document with intact Tiptap JSON formatting.
  - Confirmed an unrelated seeded user (Sam) sees zero documents and gets a
    real **403** from the API when attempting to open another user's
    document directly by ID — i.e., the authorization boundary was checked
    against live data, not just asserted in unit tests.
- The dashboard's "database not configured" error state was also verified
  by running the app *before* Supabase credentials were set, confirming it
  fails gracefully rather than crashing.
