-- Online multiplayer rooms (Realtime sync)

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  game_type text not null check (game_type in ('ludo', 'snakes', 'monopoly')),
  state jsonb not null default '{}'::jsonb,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  turn_seat text not null default 'p1' check (turn_seat in ('p1', 'p2')),
  host_token_hash text not null,
  guest_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_rooms_code_idx on public.game_rooms (room_code);

alter table public.game_rooms enable row level security;

drop policy if exists game_rooms_deny_direct on public.game_rooms;
create policy game_rooms_deny_direct on public.game_rooms
  for all to anon, authenticated using (false) with check (false);

create or replace function public.cc_hash_room_token(p_token text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.cc_create_game_room(
  p_game_type text,
  p_host_token text,
  p_initial_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
  v_id uuid;
  v_try integer := 0;
begin
  if p_game_type not in ('ludo', 'snakes', 'monopoly') then
    raise exception 'invalid game type';
  end if;
  if p_host_token is null or length(p_host_token) < 16 then
    raise exception 'invalid host token';
  end if;
  loop
    v_try := v_try + 1;
    v_code := upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    begin
      insert into public.game_rooms (room_code, game_type, state, host_token_hash, status)
      values (v_code, p_game_type, coalesce(p_initial_state, '{}'::jsonb), public.cc_hash_room_token(p_host_token), 'waiting')
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_try > 8 then raise exception 'could not allocate room code'; end if;
    end;
  end loop;
  return jsonb_build_object('roomId', v_id, 'roomCode', v_code, 'role', 'host');
end;
$$;

create or replace function public.cc_join_game_room(p_room_code text, p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.game_rooms;
begin
  if p_guest_token is null or length(p_guest_token) < 16 then
    raise exception 'invalid guest token';
  end if;
  select * into v_room from public.game_rooms where room_code = upper(trim(p_room_code));
  if not found then raise exception 'room not found'; end if;
  if v_room.guest_token_hash is not null and v_room.guest_token_hash <> public.cc_hash_room_token(p_guest_token) then
    raise exception 'room full';
  end if;
  update public.game_rooms
  set guest_token_hash = public.cc_hash_room_token(p_guest_token),
      status = 'playing',
      updated_at = now()
  where id = v_room.id;
  return jsonb_build_object('roomId', v_room.id, 'roomCode', v_room.room_code, 'role', 'guest', 'gameType', v_room.game_type);
end;
$$;

create or replace function public.cc_sync_game_room(
  p_room_code text,
  p_player_token text,
  p_state jsonb,
  p_turn_seat text,
  p_status text default 'playing'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.game_rooms;
  v_hash text := public.cc_hash_room_token(p_player_token);
begin
  select * into v_room from public.game_rooms where room_code = upper(trim(p_room_code));
  if not found then raise exception 'room not found'; end if;
  if v_hash <> v_room.host_token_hash and (v_room.guest_token_hash is null or v_hash <> v_room.guest_token_hash) then
    raise exception 'not a player in this room';
  end if;
  if p_turn_seat not in ('p1', 'p2') then raise exception 'invalid turn'; end if;
  update public.game_rooms
  set state = coalesce(p_state, v_room.state),
      turn_seat = p_turn_seat,
      status = coalesce(p_status, v_room.status),
      updated_at = now()
  where id = v_room.id;
  return jsonb_build_object('ok', true, 'updatedAt', now());
end;
$$;

create or replace function public.cc_get_game_room(p_room_code text, p_player_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_room public.game_rooms;
  v_hash text := public.cc_hash_room_token(p_player_token);
  v_role text;
begin
  select * into v_room from public.game_rooms where room_code = upper(trim(p_room_code));
  if not found then raise exception 'room not found'; end if;
  if v_hash = v_room.host_token_hash then v_role := 'host';
  elsif v_room.guest_token_hash is not null and v_hash = v_room.guest_token_hash then v_role := 'guest';
  else raise exception 'not a player in this room';
  end if;
  return jsonb_build_object(
    'roomId', v_room.id,
    'roomCode', v_room.room_code,
    'gameType', v_room.game_type,
    'state', v_room.state,
    'status', v_room.status,
    'turnSeat', v_room.turn_seat,
    'role', v_role
  );
end;
$$;

revoke all on function public.cc_create_game_room(text, text, jsonb) from public;
revoke all on function public.cc_join_game_room(text, text) from public;
revoke all on function public.cc_sync_game_room(text, text, jsonb, text, text) from public;
revoke all on function public.cc_get_game_room(text, text) from public;

grant execute on function public.cc_create_game_room(text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.cc_join_game_room(text, text) to anon, authenticated, service_role;
grant execute on function public.cc_sync_game_room(text, text, jsonb, text, text) to anon, authenticated, service_role;
grant execute on function public.cc_get_game_room(text, text) to anon, authenticated, service_role;

-- Realtime
alter table public.game_rooms replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.game_rooms;
exception
  when duplicate_object then null;
end $$;
