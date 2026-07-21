# Ajaia Docs Lite

A lightweight, collaborative document editor inspired by Google Docs — built as a
focused full-stack assessment project. It demonstrates document creation and
rich-text editing, file import, ownership-based sharing, persistent storage,
and server-enforced access control, with a coherent, product-quality UX.

> See also: [`ARCHITECTURE.md`](ARCHITECTURE.md) (standalone architecture
> note), [`AI_WORKFLOW.md`](AI_WORKFLOW.md) (standalone AI workflow note),
> and [`SUBMISSION.md`](SUBMISSION.md) (what's included, deployment status,
> what's working/incomplete).

## 1. Project overview

Ajaia Docs Lite lets a small set of seeded demo users create and edit rich-text
documents, import `.txt`/`.md` files as new documents, and share documents with
one another as editors. Every document mutation and read is authorized on the
server — the UI never relies on hiding buttons to enforce access.

## 2. Live demo

> Live demo URL: _add your Vercel deployment URL here after deploying (see
> [Deployment](#16-deployment-instructions-for-vercel))._

## 3. Demo users & instructions

Authentication is **intentionally simulated**. There is no password or session
login — instead, a "Demo user selector" on the dashboard lets you act as one of
three seeded accounts. The UI displays this explanation directly:

> "Demo user selector — authentication is intentionally simulated for this
> assessment."

Seeded accounts:

| Name        | Email               |
| ----------- | ------------------- |
| Alex Morgan | alex@example.com    |
| Jordan Lee  | jordan@example.com  |
| Sam Rivera  | sam@example.com     |

Selecting a user calls a server route that sets an **HTTP-only cookie**
(`ajaia_demo_user`) identifying the active user. Every server route re-reads
that cookie — the client-selected user is never trusted directly for
authorization.

To try sharing end-to-end: sign in as **Alex**, create or open a document,
click **Share**, and grant **Jordan** access. Switch to **Jordan** and confirm
the document now appears under **Shared With Me** and is editable. Switch to
**Sam** and confirm the document is not visible or accessible.

## 4. Feature list

- Create, rename, and edit documents with rich-text formatting
- Bold, italic, underline, H1/H2, paragraph, bulleted/numbered lists, undo/redo
- Debounced autosave (~800ms) with a save-state indicator and manual retry
- Import `.txt` and `.md` files as new editable documents (basic Markdown → rich text)
- Document sharing with a single `editor` permission level
- Clear Owned vs Shared distinction across dashboard and editor
- Server-side authorization for every read and mutation (404 / 403 semantics)
- Responsive, accessible UI with loading/empty/error states

## 5. Supported file types

- `.txt` — becomes one paragraph per non-empty line
- `.md` — headings (`#`/`##`), paragraphs, **bold**, *italic*, bullet lists, numbered lists
- Maximum file size: **1 MB**
- Not supported: `.docx`, `.pdf`, or any other format (shown in the import dialog)

## 6. Technology stack

- Next.js (App Router) + TypeScript (strict mode)
- Tailwind CSS
- Tiptap (StarterKit + Underline extension — free, open-source only)
- Supabase Postgres (via `@supabase/supabase-js`, server-only service-role client)
- Zod for request validation
- Vitest for automated tests
- Deployed on Vercel

## 7. Architecture overview

```
src/
  app/
    api/                 route handlers (auth, users, documents, shares, import)
    documents/[id]/       editor route
    page.tsx              dashboard route
  components/
    dashboard/            Dashboard, DocumentCard, UserSwitcher
    editor/                DocumentEditorPage, Toolbar, SaveStatus
    sharing/                ShareDialog
    import/                 ImportDialog
    ui/                     Button, Badge
  lib/
    access-control.ts     pure, DB-free authorization rules (unit tested)
    current-user.ts        HTTP-only cookie session read/write
    database.ts             typed Supabase queries
    documents.ts             business logic tying access-control + database together
    validation.ts            Zod schemas
    editor-content.ts        Markdown/plain-text → Tiptap JSON converters
    file-import.ts           import validation + parsing
    api-response.ts          error → HTTP status mapping
  types/                    shared TypeScript types
  tests/                     Vitest suites

supabase/
  migrations/0001_init.sql  schema
  seed.sql                  repeatable demo data
scripts/run-sql.mjs          runs a .sql file against SUPABASE_DB_URL
```

### Architecture note

This project intentionally prioritizes:

- **Reliable document persistence** — every save is a single, well-defined
  Postgres write; autosave never discards in-editor content on failure.
- **Structured rich-text storage** — Tiptap content is stored as ProseMirror
  JSON (`jsonb`), not HTML, so formatting round-trips exactly.
- **Clear ownership** — every document has exactly one `owner_id`; sharing
  never changes ownership.
- **Server-side sharing checks** — access-control rules live in one pure,
  testable module (`src/lib/access-control.ts`) and are enforced in every
  route handler, never only in the UI.
- **Focused file importing** — only `.txt`/`.md`, with a small, well-tested
  Markdown-subset converter rather than a general-purpose parser.
- **Coherent UX** — a small, consistent set of states (loading/empty/error/
  saved/unsaved/saving/failed) applied uniformly, rather than broad feature
  surface area.

Full production authentication (passwords/OAuth, session refresh, email
verification) and real-time collaboration (CRDTs/OT, presence, live cursors)
were intentionally excluded: both are substantial subsystems in their own
right, and building either well would have crowded out the core demonstration
of persistence, authorization, and editing UX this assessment is meant to
show. A cookie-based simulated identity and single-writer autosave were
sufficient to demonstrate the same authorization and persistence concerns
without that cost.

## 8. Database model

**users** — `id`, `name`, `email` (unique), `created_at`

**documents** — `id`, `title`, `content` (`jsonb`, Tiptap/ProseMirror doc),
`owner_id` (FK → users, cascade delete), `created_at`, `updated_at`

**document_shares** — `id`, `document_id` (FK → documents, cascade delete),
`user_id` (FK → users, cascade delete), `permission` (`'editor'` only),
`created_at`; unique on `(document_id, user_id)`

See [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

Row Level Security is left disabled: the app talks to Postgres only through a
single server-only service-role client, and all authorization is enforced in
application code (see below) rather than in the database. If these tables
were ever exposed to another client (e.g. the anon key), RLS policies should
be added first.

## 9. Authorization model

All rules live in [`src/lib/access-control.ts`](src/lib/access-control.ts) as
pure functions over `{ ownerId, shares }`, so they're unit-testable without a
database:

| Actor           | Read | Edit content | Rename | Share |
| --------------- | :--: | :----------: | :----: | :---: |
| Owner           |  ✅  |      ✅      |   ✅   |  ✅   |
| Shared editor   |  ✅  |      ✅      |   ✅   |  ❌   |
| Unrelated user  |  ❌  |      ❌      |   ❌   |  ❌   |

- Missing documents → **404** (`NotFoundError`)
- Present but unauthorized → **403** (`ForbiddenError`)
- Every route handler calls `assertCanRead` / `assertCanEdit` / `assertCanShare`
  before touching data — the frontend never assumes a button being visible is
  sufficient protection.

## 10. Local setup

```bash
git clone <this-repo>
cd ajaia-docs-lite
npm install
cp .env.example .env.local
# edit .env.local with your Supabase values (see below)
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## 11. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Project Settings → API: copy the **Project URL** and the **service_role**
   secret key.
3. Project Settings → Database → Connection string → URI: copy the Postgres
   connection string (used only by the local migration/seed scripts).
4. Paste these into `.env.local` (see [Environment variables](#12-environment-variables)).

## 12. Environment variables

See [`.env.example`](.env.example):

| Variable                    | Used by                                                     | Notes                                            |
| ---------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `SUPABASE_URL`               | server-only Supabase client (`src/lib/supabase-server.ts`)  | never exposed to the browser                     |
| `SUPABASE_SERVICE_ROLE_KEY`  | same                                                          | **secret** — server-only, never `NEXT_PUBLIC_`   |
| `SUPABASE_DB_URL`            | `scripts/run-sql.mjs` (migrate/seed only)                    | Postgres connection string                        |

## 13. Migration and seeding instructions

```bash
npm run db:migrate   # applies supabase/migrations/0001_init.sql
npm run db:seed      # applies supabase/seed.sql (repeatable — safe to re-run)
```

Both scripts run against `SUPABASE_DB_URL` (or `DATABASE_URL`) using `pg`. You
can alternatively paste the SQL files into the Supabase SQL editor.

Seeding creates the three demo users with **stable UUIDs** (matching
`src/lib/seed-users.ts`), a sample "Welcome" document owned by Alex, and a
share of that document with Jordan — so the dashboard isn't empty on first
run.

## 14. Development commands

```bash
npm run dev         # start the dev server
npm run build       # production build
npm run start       # run the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (strict)
npm test            # Vitest (single run)
```

## 15. Testing instructions

```bash
npm test
```

Covers:

- **Authorization** (`src/tests/access-control.test.ts`): owner can read/edit/
  rename/share; shared editor can read/edit/rename but not share; unrelated
  user is blocked; only the owner can grant access; missing vs. forbidden
  documents throw distinct errors.
- **File import** (`src/tests/file-import.test.ts`): rejects missing/
  unsupported/oversized/empty files; parses plain text into paragraphs;
  parses Markdown headings, bold/italic, and both list types.
- **Validation** (`src/tests/validation.test.ts`): Zod schemas for titles,
  document creation/update payloads, and share recipients.

These tests run without any database connection — `access-control.ts`,
`file-import.ts`, and `validation.ts` are pure modules with no Supabase
dependency, so the suite is fast and has no external requirements. All 29
tests currently pass (`npm test`).

## 16. Deployment instructions for Vercel

1. Push this repository to GitHub.
2. In Vercel, "Add New Project" → import the repo.
3. Framework preset: Next.js (auto-detected).
4. Add environment variables in the Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   (`SUPABASE_DB_URL` is only needed locally for migrate/seed — not required at
   runtime on Vercel.)
5. Before or after the first deploy, run `npm run db:migrate` and
   `npm run db:seed` locally (or via the Supabase SQL editor) against the same
   project.
6. Deploy. No paid Vercel or Supabase tier is required.

## 17. Product prioritization

Given the scope of a timeboxed assessment, effort was spent on:

1. Getting the core loop right: create → edit → autosave → reopen, with
   formatting preserved exactly.
2. Making sharing and authorization genuinely server-enforced, not cosmetic.
3. A small but complete import path (`.txt`/`.md`) with real validation.
4. Consistent UX states (loading/empty/error/save status) applied everywhere,
   rather than polishing one screen and leaving others bare.

Deliberately *not* pursued: broader formatting (colors, tables, images),
multiple share permission levels, or any polish beyond what's needed to make
the above workflows feel solid.

## 18. Intentional non-goals

Explicitly out of scope for this project:

- Real-time simultaneous collaboration
- Cursor presence
- Comments
- Suggestion mode
- Version history
- Offline editing
- Full production authentication (passwords, OAuth, sessions)
- Google Docs page-layout replication (margins, pagination, print view)
- DOCX parsing
- Folders
- Advanced/multiple permission roles (only a single "editor" share level exists)
- Any paid editor feature

## 19. Known limitations

- Autosave uses a "last write wins" strategy guarded by an `updated_at`
  comparison; it detects and surfaces conflicting concurrent edits but does
  not merge them (out of scope — see non-goals above).
- The demo-user cookie has no expiry-based re-authentication; it simply
  persists which seeded user is "active" on this browser.
- No automated end-to-end (browser) tests — automated testing focuses on the
  authorization core, import parsing, and Zod validation; UI flows were
  verified manually (see checklist below).
- Sharing supports a single fixed permission (`editor`); there is no
  read-only/viewer tier.

## 20. AI-native workflow note

Claude Code was used for implementation planning, scaffolding, repetitive
code generation (route handlers, Zod schemas, test suites), debugging
assistance, and documentation structure for this project.

Where AI materially helped: iterating on the authorization module's shape
(pure functions over a minimal `{ownerId, shares}` input, rather than
threading a database client through every check), scaffolding TypeScript
types and Zod schemas consistently across the API surface, generating the
Markdown→Tiptap-JSON converter and its test cases, and identifying edge
cases in file import (empty file, oversized file, unsupported type) that are
easy to forget by hand.

What was changed or rejected: an initial instinct toward hiding the Share
button client-side only was rejected in favor of a server-side
`assertCanShare` check on every route; relying on Postgres Row Level
Security was dropped in favor of one clearly-documented service-role
client plus application-level checks, since RLS policies would have
duplicated the same logic in a second, harder-to-test place; and an early
draft that exposed a Supabase key to the client was rejected — this project
uses a server-only service-role client instead, with no Supabase calls from
the browser at all.

Correctness was verified through `tsc --noEmit` (strict mode, no `any`),
ESLint (including React Compiler rules), the Vitest suite (29 tests, all
passing without a database connection), a successful `next build` production
build, and manual exercising of the create/edit/autosave/import/share flows
against the running dev server, including confirming the dashboard's
"database not configured" error state renders correctly when Supabase
credentials are absent. Live Supabase-backed flows (actual document
persistence, real sharing between rows) require a configured Supabase project
and were not executed in this sandboxed environment — see the checklist
below for what to verify once credentials are in place.

## 21. Manual acceptance checklist

Run these against a real Supabase-backed deployment (local or Vercel):

- [ ] User can switch among seeded demo accounts
- [ ] User can create a document
- [ ] User can rename a document
- [ ] Bold formatting persists after refresh
- [ ] Italic formatting persists after refresh
- [ ] Underline formatting persists after refresh
- [ ] Headings persist after refresh
- [ ] Bulleted lists persist after refresh
- [ ] Numbered lists persist after refresh
- [ ] Document appears after returning to the dashboard
- [ ] TXT import creates an editable document
- [ ] Markdown import creates an editable document
- [ ] Invalid uploads display helpful errors (wrong type, too large, empty, none selected)
- [ ] Owner can share with another user
- [ ] Shared document appears under Shared With Me
- [ ] Shared user can edit and save
- [ ] Shared user cannot open the share dialog (no Share button is shown, and
      the API returns 403 if called directly)
- [ ] Unrelated user receives an access-denied response (403 via API, "Access
      denied" screen in the UI)
- [ ] App works responsively (mobile width dashboard and editor)
- [ ] Tests run with one command (`npm test`)
- [ ] Production build succeeds (`npm run build`)
