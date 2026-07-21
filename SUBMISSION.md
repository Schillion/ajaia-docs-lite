# Submission

## What's included in this folder/repo

- **Source code** — full Next.js/TypeScript application (`src/`), Supabase
  migrations and seed script (`supabase/`), a small script for applying SQL
  files locally (`scripts/run-sql.mjs`).
- **`README.md`** — project overview, demo-user instructions, feature list,
  tech stack, database model, authorization model, local setup, Supabase
  setup, environment variables, migration/seed instructions, dev commands,
  testing instructions, deployment instructions, prioritization, non-goals,
  known limitations, AI workflow summary, and a manual acceptance checklist.
- **`ARCHITECTURE.md`** — standalone architecture note (what was
  prioritized and why, what was cut and why).
- **`AI_WORKFLOW.md`** — standalone AI-native workflow note (tools used,
  where AI helped, what was changed/rejected, how correctness was verified).
- **`SUBMISSION.md`** — this file.
- **`.env.example`** — required environment variables, documented inline.
- **Automated tests** — 29 Vitest tests across authorization, file import,
  and validation (`src/tests/`), runnable with `npm test` with no database
  required.

## Live product URL

> **Not yet deployed.** This build was completed and verified against a
> real, seeded Supabase project (see "What's working" below), but has not
> been deployed to Vercel as part of this session. To deploy:
>
> 1. Push this repo to GitHub.
> 2. Import it into Vercel.
> 3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Vercel environment
>    variables (same project already migrated and seeded — see below).
> 4. Deploy, then paste the resulting URL here and into the README's
>    placeholder.

## Seeded demo accounts (for reviewing sharing flows)

No passwords — authentication is intentionally simulated via a demo-user
selector in the UI (see README section 3). Select any of:

| Name        | Email               |
| ----------- | ------------------- |
| Alex Morgan | alex@example.com    |
| Jordan Lee  | jordan@example.com  |
| Sam Rivera  | sam@example.com     |

The seed script pre-shares one sample document from Alex to Jordan, so
"Shared With Me" isn't empty on first login as Jordan.

## Local run instructions

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run db:migrate
npm run db:seed
npm run dev
```

Full detail (including a connection-pooler fallback if the direct Postgres
hostname doesn't resolve on your network) is in `README.md`, sections 10–13.

## Walkthrough video

> **Not yet recorded.** See `WALKTHROUGH_VIDEO.txt` — a placeholder file to
> paste the video URL into once recorded.

## What's working

- Document creation, renaming, rich-text editing (bold/italic/underline/
  H1/H2/paragraph/bulleted+numbered lists/undo/redo), debounced autosave
  with a visible save-state indicator and manual retry.
- `.txt` and `.md` file import, including a real Markdown-subset-to-Tiptap
  converter (headings, bold/italic, both list types) with validation for
  missing/unsupported/oversized/empty files.
- Sharing: owner-only share dialog, editor-level access grant, Owned/Shared
  badges throughout, duplicate-share prevention.
- Server-side authorization verified **against a live Supabase project**:
  confirmed an unrelated user gets a real 403 attempting to open another
  user's document by ID directly (not just asserted in unit tests).
- Full verification suite passes: `npm run lint`, `npm run typecheck`,
  `npm test` (29/29), `npm run build`.

## What's incomplete

- No live deployment yet (see above — requires a Vercel account action).
- No walkthrough video recorded yet.
- Share removal exists in the API and UI but was only spot-checked, not
  exhaustively tested.
- No automated browser/E2E tests — UI flows were verified manually against
  the live database (see `AI_WORKFLOW.md` for exactly what was checked).

## What I'd build next with another 2-4 hours

1. Deploy to Vercel and do a full pass of the manual acceptance checklist
   (README section 21) against the live URL, including on a phone-width
   viewport.
2. Add a lightweight E2E test (Playwright) covering the single highest-value
   path: create → format → refresh → share → switch user → edit → switch
   back and confirm the edit is visible.
3. A "viewer" (read-only) share tier alongside the current single `editor`
   permission, since that's the most natural next increment to the sharing
   model without expanding scope much.
4. Export the current document to Markdown or PDF (listed as an optional
   stretch goal) — the Tiptap JSON is already structured enough that a
   Markdown exporter is a fairly small addition.
