-- Server-validated gameplay via security definer RPC (anon-safe when called from Next.js API).

create or replace function public.cc_hash_guest_token(p_token text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.cc_start_session(p_game_id text, p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_questions jsonb;
begin
  if p_game_id not in ('bollywood', 'trivia') then
    raise exception 'invalid game';
  end if;
  if p_guest_token is null or length(p_guest_token) < 16 then
    raise exception 'invalid guest token';
  end if;

  insert into public.game_sessions (game_id, guest_token_hash, question_count)
  values (p_game_id, public.cc_hash_guest_token(p_guest_token), 10)
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

  return jsonb_build_object('sessionId', v_session_id, 'gameId', p_game_id, 'questions', v_questions);
end;
$$;

create or replace function public.cc_assert_session(p_session_id uuid, p_guest_token text)
returns public.game_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
begin
  select * into v_session from public.game_sessions where id = p_session_id;
  if not found then raise exception 'session not found'; end if;
  if v_session.completed_at is not null then raise exception 'session already completed'; end if;
  if v_session.guest_token_hash is distinct from public.cc_hash_guest_token(p_guest_token) then
    raise exception 'invalid session token';
  end if;
  return v_session;
end;
$$;

create or replace function public.cc_submit_answer(
  p_session_id uuid,
  p_guest_token text,
  p_question_id uuid,
  p_selected_key text,
  p_response_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
  v_question public.game_questions;
  v_is_correct boolean;
begin
  v_session := public.cc_assert_session(p_session_id, p_guest_token);
  select * into v_question from public.game_questions where id = p_question_id and game_id = v_session.game_id;
  if not found then raise exception 'invalid question'; end if;
  if p_response_ms is not null and (p_response_ms < 0 or p_response_ms > 120000) then
    raise exception 'invalid response time';
  end if;

  v_is_correct := coalesce(p_selected_key, '') = v_question.answer_key;

  insert into public.game_answers (session_id, question_id, selected_key, is_correct, response_ms)
  values (p_session_id, p_question_id, p_selected_key, v_is_correct, p_response_ms)
  on conflict (session_id, question_id) do update
    set selected_key = excluded.selected_key,
        is_correct = excluded.is_correct,
        response_ms = excluded.response_ms;

  return jsonb_build_object(
    'isCorrect', v_is_correct,
    'correctKey', v_question.answer_key,
    'explanation', v_question.explanation
  );
end;
$$;

create or replace function public.cc_complete_session(p_session_id uuid, p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
  v_answer_count integer;
  v_score integer;
begin
  v_session := public.cc_assert_session(p_session_id, p_guest_token);

  select count(*) into v_answer_count from public.game_answers where session_id = p_session_id;
  if v_answer_count <> v_session.question_count then
    raise exception 'incomplete session';
  end if;

  select coalesce(sum(case when is_correct then 100 else 0 end), 0)
  into v_score
  from public.game_answers
  where session_id = p_session_id;

  update public.game_sessions
  set score = v_score,
      verified = true,
      completed_at = now()
  where id = p_session_id;

  return jsonb_build_object('score', v_score, 'total', v_session.question_count, 'verified', true, 'gameId', v_session.game_id);
end;
$$;

create or replace function public.cc_leaderboard(p_game_id text, p_limit integer default 10)
returns setof jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'displayName', coalesce(p.display_name, 'Guest'),
    'score', s.score,
    'completedAt', s.completed_at
  )
  from public.game_sessions s
  left join public.profiles p on p.id = s.user_id
  where s.game_id = p_game_id
    and s.verified = true
    and s.score is not null
  order by s.score desc, s.completed_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

create or replace function public.cc_create_challenge(p_session_id uuid, p_guest_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
  v_token text;
  v_id uuid;
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
  insert into public.friend_challenges (game_id, session_id, token_hash)
  values (v_session.game_id, p_session_id, public.cc_hash_guest_token(v_token))
  returning id into v_id;
  return jsonb_build_object('challengeId', v_id, 'token', v_token, 'gameId', v_session.game_id, 'score', v_session.score);
end;
$$;

revoke all on function public.cc_start_session(text, text) from public;
revoke all on function public.cc_submit_answer(uuid, text, uuid, text, integer) from public;
revoke all on function public.cc_complete_session(uuid, text) from public;
revoke all on function public.cc_leaderboard(text, integer) from public;
revoke all on function public.cc_create_challenge(uuid, text) from public;

grant execute on function public.cc_start_session(text, text) to anon, authenticated, service_role;
grant execute on function public.cc_submit_answer(uuid, text, uuid, text, integer) to anon, authenticated, service_role;
grant execute on function public.cc_complete_session(uuid, text) to anon, authenticated, service_role;
grant execute on function public.cc_leaderboard(text, integer) to anon, authenticated, service_role;
grant execute on function public.cc_create_challenge(uuid, text) to anon, authenticated, service_role;
