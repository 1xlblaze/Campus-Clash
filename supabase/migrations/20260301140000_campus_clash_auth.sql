-- Auth: attach signed-in users to guest sessions and record creators on challenges.

create or replace function public.cc_start_session(p_game_id text, p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session_id uuid;
  v_questions jsonb;
  v_user_id uuid := auth.uid();
begin
  if p_game_id not in ('bollywood', 'trivia') then
    raise exception 'invalid game';
  end if;
  if p_guest_token is null or length(p_guest_token) < 16 then
    raise exception 'invalid guest token';
  end if;

  insert into public.game_sessions (game_id, guest_token_hash, question_count, user_id)
  values (p_game_id, public.cc_hash_guest_token(p_guest_token), 10, v_user_id)
  returning id into v_session_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'prompt', q.prompt,
    'options', q.options,
    'explanation', q.explanation
  ) order by q.sort_order), '[]'::jsonb)
  into v_questions
  from public.game_questions q
  where q.game_id = p_game_id and q.active = true;

  return jsonb_build_object(
    'sessionId', v_session_id,
    'gameId', p_game_id,
    'userId', v_user_id,
    'questions', v_questions
  );
end;
$$;

create or replace function public.cc_link_guest_sessions(p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_linked integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_guest_token is null or length(p_guest_token) < 16 then
    raise exception 'invalid guest token';
  end if;

  update public.game_sessions
  set user_id = v_user_id
  where guest_token_hash = public.cc_hash_guest_token(p_guest_token)
    and user_id is null;

  get diagnostics v_linked = row_count;

  update public.friend_challenges fc
  set creator_user_id = v_user_id
  from public.game_sessions s
  where fc.session_id = s.id
    and s.user_id = v_user_id
    and fc.creator_user_id is null;

  return jsonb_build_object('linkedSessions', v_linked, 'userId', v_user_id);
end;
$$;

create or replace function public.cc_create_challenge(p_session_id uuid, p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session public.game_sessions;
  v_token text;
  v_id uuid;
  v_user_id uuid := auth.uid();
begin
  select * into v_session from public.game_sessions where id = p_session_id;
  if not found then raise exception 'session not found'; end if;
  if v_session.guest_token_hash is distinct from public.cc_hash_guest_token(p_guest_token) then
    raise exception 'invalid session token';
  end if;
  if not v_session.verified then
    raise exception 'session not verified';
  end if;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.friend_challenges (game_id, session_id, token_hash, creator_user_id)
  values (v_session.game_id, p_session_id, public.cc_hash_guest_token(v_token), v_user_id)
  returning id into v_id;
  return jsonb_build_object('challengeId', v_id, 'token', v_token, 'gameId', v_session.game_id, 'score', v_session.score);
end;
$$;

revoke all on function public.cc_link_guest_sessions(text) from public;
grant execute on function public.cc_link_guest_sessions(text) to authenticated, service_role;
