# Submission

This lists exactly what's included in the Google Drive submission folder,
matching the required deliverables in order.

## 1. Source code

Full project: `src/` (Next.js/TypeScript app), `supabase/` (migrations +
seed script), `scripts/run-sql.mjs` (local migration/seed runner),
`.env.example`.

## 2. README.md

Project overview, demo-user instructions, feature list, tech stack,
database model, authorization model, local setup, Supabase setup,
environment variables, migration/seed instructions, dev commands, testing
instructions, deployment instructions, prioritization, non-goals, known
limitations, AI workflow summary, and a manual acceptance checklist.

## 3. Architecture note

`ARCHITECTURE.md` — what was prioritized and why, what was cut and why.

## 4. AI workflow note

`AI_WORKFLOW.md` — which AI tools were used, where they materially helped,
what was changed or rejected, how correctness was verified.

## 5. SUBMISSION.md

This file.

## 6. Live product URL

https://ajaia-docs-lite-b1el.vercel.app/

Deployed on Vercel, backed by a real Supabase Postgres project that has
been migrated and seeded (see seeded accounts below).

## 7. Walkthrough video URL

https://youtu.be/LDhpmDtKi7s

## 8. Screenshots / demo GIF

Included in the Drive folder — the dashboard with both document sections,
the editor with the toolbar and save-state indicator, and the share
dialog.

---

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
- Deployed to Vercel, backed by the same live/seeded Supabase project.
- Full verification suite passes: `npm run lint`, `npm run typecheck`,
  `npm test` (29/29), `npm run build`.

## What's incomplete

- Share removal exists in the API and UI but was only spot-checked, not
  exhaustively tested.
- No automated browser/E2E tests — UI flows were verified manually against
  the live database (see `AI_WORKFLOW.md` for exactly what was checked).

## What I'd build next with another 2-4 hours

1. A full pass of the manual acceptance checklist (README section 21)
   against the live URL, including on a phone-width viewport.
2. Add a lightweight E2E test (Playwright) covering the single highest-value
   path: create → format → refresh → share → switch user → edit → switch
   back and confirm the edit is visible.
3. A "viewer" (read-only) share tier alongside the current single `editor`
   permission, since that's the most natural next increment to the sharing
   model without expanding scope much.
4. Export the current document to Markdown or PDF (listed as an optional
   stretch goal) — the Tiptap JSON is already structured enough that a
   Markdown exporter is a fairly small addition.
