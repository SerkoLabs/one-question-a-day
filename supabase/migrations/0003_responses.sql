begin;

create table public.responses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  local_date date not null,
  journey_day smallint not null check (journey_day between 1 and 365),
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  source_revision integer not null default 1 check (source_revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint responses_user_local_date_unique unique (user_id, local_date),
  constraint responses_user_journey_day_unique unique (user_id, journey_day),
  constraint responses_id_user_unique unique (id, user_id)
);

create index responses_user_date_desc_idx
  on public.responses(user_id, local_date desc);
create index responses_user_question_idx
  on public.responses(user_id, question_id);

create or replace function public.prepare_response_insert()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_journey_started_on date;
  v_onboarding_completed_at timestamptz;
  v_local_date date;
  v_journey_day integer;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if new.user_id is distinct from v_user_id then
    raise exception 'response owner mismatch';
  end if;

  select timezone, journey_started_on, onboarding_completed_at
    into v_timezone, v_journey_started_on, v_onboarding_completed_at
  from public.profiles
  where id = v_user_id;

  if v_onboarding_completed_at is null or v_timezone is null or v_journey_started_on is null then
    raise exception 'onboarding incomplete';
  end if;

  v_local_date := (now() at time zone v_timezone)::date;
  v_journey_day := v_local_date - v_journey_started_on + 1;

  if v_journey_day < 1 or v_journey_day > 365 then
    raise exception 'journey day is outside active range';
  end if;

  if not exists (
    select 1
    from public.questions q
    where q.id = new.question_id
      and q.active = true
      and q.day_index = v_journey_day
  ) then
    raise exception 'question does not match current journey day';
  end if;

  if new.local_date is not null and new.local_date is distinct from v_local_date then
    raise exception 'local date mismatch';
  end if;

  if new.journey_day is not null and new.journey_day is distinct from v_journey_day then
    raise exception 'journey day mismatch';
  end if;

  new.local_date := v_local_date;
  new.journey_day := v_journey_day;
  new.body := btrim(new.body);
  new.source_revision := 1;
  new.created_at := now();
  new.updated_at := now();

  return new;
end;
$$;

revoke all on function public.prepare_response_insert() from public, anon, authenticated;

create trigger responses_prepare_insert
  before insert on public.responses
  for each row execute function public.prepare_response_insert();

create or replace function public.protect_response_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_body text := btrim(new.body);
begin
  if v_user_id is null or old.user_id is distinct from v_user_id then
    raise exception 'authentication required';
  end if;

  if new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.question_id is distinct from old.question_id
    or new.local_date is distinct from old.local_date
    or new.journey_day is distinct from old.journey_day
    or new.created_at is distinct from old.created_at then
    raise exception 'response identity is immutable';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 10000 then
    raise exception 'invalid response body length';
  end if;

  new.body := v_body;
  if new.body is distinct from old.body then
    new.source_revision := old.source_revision + 1;
  else
    new.source_revision := old.source_revision;
  end if;
  new.updated_at := now();

  return new;
end;
$$;

revoke all on function public.protect_response_update() from public, anon, authenticated;

create trigger responses_protect_update
  before update on public.responses
  for each row execute function public.protect_response_update();

alter table public.responses enable row level security;

revoke all on table public.responses from anon, authenticated;
grant select on table public.responses to authenticated;
grant insert (user_id, question_id, body) on table public.responses to authenticated;
grant update (body) on table public.responses to authenticated;

create policy responses_select_own
on public.responses
for select
to authenticated
using (user_id = auth.uid());

create policy responses_insert_own
on public.responses
for insert
to authenticated
with check (user_id = auth.uid());

create policy responses_update_own
on public.responses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.get_today_state(p_locale text default null)
returns table (
  local_date date,
  journey_day smallint,
  question_id uuid,
  prompt text,
  response_id uuid,
  body text,
  source_revision integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_journey_started_on date;
  v_profile_locale text;
  v_local_date date;
  v_journey_day integer;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select p.timezone, p.journey_started_on, p.locale
    into v_timezone, v_journey_started_on, v_profile_locale
  from public.profiles p
  where p.id = v_user_id
    and p.onboarding_completed_at is not null;

  if not found or v_timezone is null or v_journey_started_on is null then
    raise exception 'onboarding incomplete';
  end if;

  v_local_date := (now() at time zone v_timezone)::date;
  v_journey_day := v_local_date - v_journey_started_on + 1;

  if v_journey_day < 1 or v_journey_day > 365 then
    return;
  end if;

  return query
  select
    v_local_date,
    v_journey_day::smallint,
    q.id,
    qt.prompt,
    r.id,
    r.body,
    r.source_revision
  from public.questions q
  left join public.question_texts qt
    on qt.question_id = q.id
   and qt.locale = coalesce(p_locale, v_profile_locale, 'tr')
  left join public.responses r
    on r.user_id = v_user_id
   and r.local_date = v_local_date
  where q.day_index = v_journey_day
    and q.active = true
  limit 1;
end;
$$;

revoke all on function public.get_today_state(text) from public, anon;
grant execute on function public.get_today_state(text) to authenticated;

commit;
