# Supabase — Campus Clash

Database and server-validated scoring for Campus Clash.

## What is deployed

Migrations in `supabase/migrations/` create:

- Core tables (`profiles`, `games`, `game_questions`, `game_sessions`, `game_answers`, `friend_challenges`, `campuses`, `campus_memberships`)
- Row Level Security on every table (questions are server-only)
- Seed data for both games (10 questions each) and sample campuses
- RPC functions for trusted guest play without exposing answer keys or service-role keys to the browser

## Apply to your Supabase project

### Option A — Supabase CLI

```bash
npx supabase link --project-ref kqolyvmwcsqilnakuewt
npx supabase db push
```

### Option B — SQL editor

Run the migration files in order:

1. `supabase/migrations/20260301120000_campus_clash.sql`
2. `supabase/migrations/20260301130000_campus_clash_rpc.sql`

`supabase/schema.sql` is a human-readable snapshot of the foundation tables (see migration for full RLS + seed).

## App configuration

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Gameplay uses Next.js API routes that call Supabase RPCs with the **anon** key on the server. `SUPABASE_SERVICE_ROLE_KEY` is optional for future admin tooling only.

## API flow

| Route | Purpose |
|-------|---------|
| `POST /api/sessions/start` | Start session, return question prompts/options (no answers) |
| `POST /api/sessions/:id/answer` | Validate and store one answer |
| `POST /api/sessions/:id/complete` | Compute score server-side, mark session verified |
| `GET /api/leaderboard?game=bollywood` | Top verified scores |
| `POST /api/challenges` | Create friend challenge token after verified round |

Guest ownership is enforced with a random token stored in `sessionStorage` and hashed in Postgres.

## Security notes

- Never put `SUPABASE_SERVICE_ROLE_KEY` in client code.
- `game_questions.answer_key` is not exposed to clients.
- Clients cannot set `game_sessions.score` or `verified` directly.
- Add stricter rate limits (Redis / Vercel Firewall) before high-traffic launch.
