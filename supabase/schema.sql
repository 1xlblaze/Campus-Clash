-- Campus Clash initial database foundation.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 40),
 avatar_url text,
 city text,
 created_at timestamptz not null default now()
);
create table if not exists public.games (
 id text primary key,
 title text not null,
 active boolean not null default true
);
create table if not exists public.game_questions (
 id uuid primary key default gen_random_uuid(),
 game_id text not null references public.games(id),
 prompt text not null,
 options jsonb not null,
 answer_key text not null,
 explanation text,
 active boolean not null default true
);
create table if not exists public.game_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 guest_token_hash text,
 game_id text not null references public.games(id),
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 score integer check (score is null or score >= 0),
 question_count integer not null default 10,
 verified boolean not null default false
);
create table if not exists public.game_answers (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.game_sessions(id) on delete cascade,
 question_id uuid not null references public.game_questions(id),
 selected_key text,
 is_correct boolean not null default false,
 response_ms integer check (response_ms is null or response_ms >= 0),
 created_at timestamptz not null default now(),
 unique(session_id,question_id)
);
create table if not exists public.friend_challenges (
 id uuid primary key default gen_random_uuid(),
 creator_user_id uuid references auth.users(id) on delete set null,
 game_id text not null references public.games(id),
 session_id uuid references public.game_sessions(id),
 token_hash text not null unique,
 expires_at timestamptz not null default (now()+interval '14 days'),
 created_at timestamptz not null default now()
);
create table if not exists public.campuses (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 city text not null,
 slug text not null unique,
 created_at timestamptz not null default now()
);
create table if not exists public.campus_memberships (
 user_id uuid not null references public.profiles(id) on delete cascade,
 campus_id uuid not null references public.campuses(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 created_at timestamptz not null default now(),
 primary key(user_id,campus_id)
);

-- RLS is enabled now; add narrow policies before exposing any writes from clients.
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_answers enable row level security;
alter table public.friend_challenges enable row level security;
alter table public.campuses enable row level security;
alter table public.campus_memberships enable row level security;

-- Never expose game_questions.answer_key to clients.
-- Never allow a client to set game_sessions.score or verified=true.
-- Full migration (RLS, seed, triggers): supabase/migrations/20260301120000_campus_clash.sql
