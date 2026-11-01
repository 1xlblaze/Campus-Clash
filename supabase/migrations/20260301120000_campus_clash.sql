-- Campus Clash: schema, RLS, seed data, and leaderboard helpers.

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
  game_id text not null references public.games(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  answer_key text not null,
  explanation text,
  sort_order integer not null default 0,
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
  unique (session_id, question_id)
);

create table if not exists public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid references auth.users(id) on delete set null,
  game_id text not null references public.games(id),
  session_id uuid references public.game_sessions(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '14 days'),
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
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  primary key (user_id, campus_id)
);

create index if not exists game_questions_game_id_idx on public.game_questions (game_id, sort_order);
create index if not exists game_sessions_game_verified_idx on public.game_sessions (game_id, verified, score desc);
create index if not exists game_sessions_user_id_idx on public.game_sessions (user_id);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_answers enable row level security;
alter table public.friend_challenges enable row level security;
alter table public.campuses enable row level security;
alter table public.campus_memberships enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- games: read-only catalogue
drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games
  for select to anon, authenticated using (active = true);

-- game_questions: no client access (API uses service role)
drop policy if exists game_questions_deny_all on public.game_questions;
create policy game_questions_deny_all on public.game_questions
  for all to anon, authenticated using (false) with check (false);

-- sessions: owners can read their rows
drop policy if exists game_sessions_select_own on public.game_sessions;
create policy game_sessions_select_own on public.game_sessions
  for select to authenticated using (user_id = auth.uid());

-- answers: readable when session belongs to user
drop policy if exists game_answers_select_own on public.game_answers;
create policy game_answers_select_own on public.game_answers
  for select to authenticated using (
    exists (
      select 1 from public.game_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- campuses directory
drop policy if exists campuses_public_read on public.campuses;
create policy campuses_public_read on public.campuses
  for select to anon, authenticated using (true);

drop policy if exists campus_memberships_select_own on public.campus_memberships;
create policy campus_memberships_select_own on public.campus_memberships
  for select to authenticated using (user_id = auth.uid());

drop policy if exists campus_memberships_insert_own on public.campus_memberships;
create policy campus_memberships_insert_own on public.campus_memberships
  for insert to authenticated with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1),
      'Player'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verified leaderboard view (no PII beyond display name)
create or replace view public.leaderboard_entries
with (security_invoker = true)
as
select
  s.game_id,
  s.score,
  s.completed_at,
  coalesce(p.display_name, 'Guest') as display_name
from public.game_sessions s
left join public.profiles p on p.id = s.user_id
where s.verified = true
  and s.score is not null
  and s.completed_at is not null;

grant select on public.leaderboard_entries to anon, authenticated;

-- Seed games and questions (idempotent)
insert into public.games (id, title, active) values
  ('bollywood', 'Bollywood Emoji Guess', true),
  ('trivia', 'Rapid-Fire Trivia', true)
on conflict (id) do update set title = excluded.title, active = excluded.active;

delete from public.game_questions where game_id in ('bollywood', 'trivia');

insert into public.game_questions (game_id, prompt, options, answer_key, explanation, sort_order) values
('bollywood', '👨‍🎓 ❤️ 👩‍🎓 🚂', '["DDLJ","3 Idiots","Kuch Kuch Hota Hai","Mohabbatein"]'::jsonb, 'DDLJ', 'A classic cross-country love story.', 1),
('bollywood', '🏏 👨‍👦 🇮🇳', '["Lagaan","Kai Po Che!","MS Dhoni","Jersey"]'::jsonb, 'Lagaan', null, 2),
('bollywood', '👨‍🚀 🌌 📻 ❤️', '["PK","Swades","Rocket Singh","Mission Mangal"]'::jsonb, 'Swades', null, 3),
('bollywood', '👬 🏍️ 🏜️ 🤝', '["Sholay","Zindagi Na Milegi Dobara","Dhoom","Dil Chahta Hai"]'::jsonb, 'Sholay', null, 4),
('bollywood', '👨‍🍳 🍝 🇮🇹 ❤️', '["Queen","English Vinglish","The Lunchbox","Chef"]'::jsonb, 'The Lunchbox', null, 5),
('bollywood', '🎤 🎸 👨‍🎤 🌟', '["Rockstar","Aashiqui 2","Gully Boy","Secret Superstar"]'::jsonb, 'Rockstar', null, 6),
('bollywood', '👰 🚗 🗺️ 👭', '["Veere Di Wedding","Queen","Jab We Met","Piku"]'::jsonb, 'Queen', null, 7),
('bollywood', '🧑‍🤝‍🧑 🎓 🧠 📚', '["Chhichhore","3 Idiots","Student of the Year","F.A.L.T.U."]'::jsonb, '3 Idiots', null, 8),
('bollywood', '🚕 🌃 💬 ❤️', '["Wake Up Sid","Tamasha","Taxi No. 9211","Raat Akeli Hai"]'::jsonb, 'Wake Up Sid', null, 9),
('bollywood', '🕵️‍♂️ 🎭 🇮🇳 🔫', '["Baby","War","Pathaan","Raazi"]'::jsonb, 'Raazi', null, 10),
('trivia', 'Which planet is known as the Red Planet?', '["Venus","Mars","Jupiter","Mercury"]'::jsonb, 'Mars', null, 1),
('trivia', 'What is the capital of Australia?', '["Sydney","Melbourne","Canberra","Perth"]'::jsonb, 'Canberra', null, 2),
('trivia', 'How many players are on a football team on the field?', '["9","10","11","12"]'::jsonb, '11', null, 3),
('trivia', 'Which is the largest ocean on Earth?', '["Atlantic","Indian","Arctic","Pacific"]'::jsonb, 'Pacific', null, 4),
('trivia', 'Who wrote Romeo and Juliet?', '["Charles Dickens","William Shakespeare","Jane Austen","Oscar Wilde"]'::jsonb, 'William Shakespeare', null, 5),
('trivia', 'What does CPU stand for?', '["Central Processing Unit","Computer Personal Unit","Core Power Utility","Central Program Utility"]'::jsonb, 'Central Processing Unit', null, 6),
('trivia', 'Which element has the chemical symbol O?', '["Gold","Oxygen","Osmium","Iron"]'::jsonb, 'Oxygen', null, 7),
('trivia', 'How many sides does a hexagon have?', '["5","6","7","8"]'::jsonb, '6', null, 8),
('trivia', 'Which Indian city is nicknamed the Pink City?', '["Udaipur","Jodhpur","Jaipur","Bikaner"]'::jsonb, 'Jaipur', null, 9),
('trivia', 'Which language runs natively in the browser?', '["Go","Java","C","JavaScript"]'::jsonb, 'JavaScript', null, 10);

insert into public.campuses (name, city, slug) values
  ('Delhi University', 'Delhi', 'delhi-university'),
  ('IIT Bombay', 'Mumbai', 'iit-bombay'),
  ('Christ University', 'Bengaluru', 'christ-university')
on conflict (slug) do nothing;
