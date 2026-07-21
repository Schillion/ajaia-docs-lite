# Architecture Note

## What this prioritizes, and why

Ajaia Docs Lite is scoped around five things, in priority order:

1. **Reliable document persistence.** Every save is a single, well-defined
   Postgres write (`UPDATE documents SET title = ?, content = ?, updated_at = now()`).
   Autosave never discards in-editor content on a failed save — the editor
   state is the source of truth, and a failed network call just leaves a
   "Save failed / Retry" indicator rather than losing anything.

2. **Structured rich-text storage.** Tiptap content is stored as ProseMirror
   JSON in a `jsonb` column, not as HTML or Markdown. This means formatting
   round-trips exactly (no lossy HTML parsing on reload) and the content is
   directly queryable/inspectable in Postgres if needed.

3. **Clear ownership.** Every document has exactly one `owner_id`. Sharing
   grants an `editor` row in `document_shares`; it never changes or
   duplicates ownership. The dashboard and editor both surface an explicit
   Owned/Shared badge so this is never ambiguous to the user.

4. **Server-side authorization, not UI hiding.** All access rules live in one
   pure module, `src/lib/access-control.ts`, expressed as plain functions
   over `{ ownerId, shares }` — no database dependency, so they're directly
   unit-testable. Every route handler calls `assertCanRead` /
   `assertCanEdit` / `assertCanShare` before touching data. Hiding the Share
   button for non-owners in the UI is a UX nicety, not the enforcement
   mechanism — the API independently returns 403 if a non-owner calls the
   share endpoint directly.

5. **A small, coherent set of UX states**, applied consistently: loading /
   empty / error on the dashboard; saved / unsaved / saving / failed on the
   editor. Depth here (real retry logic, real empty-state copy) was
   prioritized over adding more editing features.

## What was deliberately left out, and why

- **Full production authentication** (passwords, OAuth, session refresh,
  email verification) is a substantial subsystem on its own, and it doesn't
  exercise the things this assessment is meant to demonstrate (persistence,
  authorization, editing UX). A simulated demo-user selector backed by an
  HTTP-only cookie gives the same *authorization* surface (a real "who is
  calling" on the server) without that cost, and is clearly labeled in the
  UI as intentionally simulated.

- **Real-time collaboration** (CRDTs/OT, presence, live cursors) is a
  different engineering problem entirely — conflict resolution, transport,
  presence state — and building it shallowly would produce something that
  *looks* like Google Docs but doesn't actually work under concurrent edits.
  A single-writer autosave model with staleness detection (via
  `updated_at` comparison) was chosen instead: it's honest about what it is,
  and it correctly detects (though does not merge) conflicting concurrent
  edits.

- **DOCX import, folders, multiple permission tiers, version history,
  comments** were all cut to keep the surface area small enough to build
  each remaining piece to a reasonable depth, rather than having many
  half-finished features. See the README's "Intentional non-goals" section
  for the complete list.

## Data model in one paragraph

`users` (seeded, stable IDs) own zero or more `documents`; each document
holds its title and Tiptap JSON content directly. `document_shares` is a
join table (`document_id`, `user_id`, `permission`) with a unique constraint
on `(document_id, user_id)` to prevent duplicate shares, and cascades on
delete in both directions so deleting a document or a user cleans up shares
automatically.

## Where to look in the code

- Authorization rules: [`src/lib/access-control.ts`](src/lib/access-control.ts)
  (tested in [`src/tests/access-control.test.ts`](src/tests/access-control.test.ts))
- Business logic tying DB + access control together: [`src/lib/documents.ts`](src/lib/documents.ts)
- Schema: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
- Markdown/plain-text → Tiptap JSON conversion: [`src/lib/editor-content.ts`](src/lib/editor-content.ts)
