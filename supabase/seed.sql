-- Ajaia Docs Lite: repeatable demo data seed.
-- Safe to re-run: uses fixed UUIDs and upserts so re-seeding never duplicates rows.
-- IDs match src/lib/seed-users.ts (SEED_USER_IDS) so the app and database agree.

insert into users (id, name, email, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'Alex Morgan', 'alex@example.com', now()),
  ('22222222-2222-2222-2222-222222222222', 'Jordan Lee', 'jordan@example.com', now()),
  ('33333333-3333-3333-3333-333333333333', 'Sam Rivera', 'sam@example.com', now())
on conflict (id) do update set name = excluded.name, email = excluded.email;

-- A sample owned document for Alex so the dashboard isn't empty on first run.
insert into documents (id, title, content, owner_id, created_at, updated_at)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Welcome to Ajaia Docs Lite',
  '{
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Welcome to Ajaia Docs Lite" }] },
      { "type": "paragraph", "content": [
        { "type": "text", "text": "This is a " },
        { "type": "text", "text": "seeded", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": " sample document. Try " },
        { "type": "text", "text": "editing", "marks": [{ "type": "italic" }] },
        { "type": "text", "text": " it, sharing it with another demo user, or creating a new one." }
      ] },
      { "type": "bulletList", "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Bold, italic, and underline formatting" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Headings and lists" }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Autosave with a save-state indicator" }] }] }
      ] }
    ]
  }'::jsonb,
  '11111111-1111-1111-1111-111111111111',
  now(),
  now()
)
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  owner_id = excluded.owner_id;

-- Share the sample document with Jordan so "Shared With Me" has data out of the box.
insert into document_shares (document_id, user_id, permission)
values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'editor')
on conflict (document_id, user_id) do nothing;
