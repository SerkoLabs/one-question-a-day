begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'tr' check (char_length(locale) between 2 and 16),
  timezone text,
  journey_started_on date,
  onboarding_completed_at timestamptz,
  ai_analysis_consent boolean not null default false,
  ai_consent_updated_at timestamptz,
  reminder_enabled boolean not null default false,
  reminder_local_time time without time zone,
  timezone_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_completed_requires_journey check (
    onboarding_completed_at is null
    or (timezone is not null and journey_started_on is not null)
  ),
  constraint profiles_reminder_time_required check (
    reminder_enabled = false or reminder_local_time is not null
  )
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  day_index smallint not null unique check (day_index between 1 and 365),
  category text not null check (
    category in (
      'daily_life', 'self', 'emotions', 'relationships', 'fears', 'values',
      'past', 'future', 'meaning', 'choices', 'identity', 'desires'
    )
  ),
  depth smallint not null check (depth between 1 and 3),
  comparison_group_key text check (comparison_group_key is null or char_length(comparison_group_key) <= 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_comparison_group_idx
  on public.questions(comparison_group_key)
  where comparison_group_key is not null;

create table public.question_texts (
  question_id uuid not null references public.questions(id) on delete cascade,
  locale text not null check (char_length(locale) between 2 and 16),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  content_version integer not null default 1 check (content_version > 0),
  updated_at timestamptz not null default now(),
  primary key (question_id, locale)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles(id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.profile_preference_update_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id is immutable';
  end if;

  if old.onboarding_completed_at is not null then
    if new.journey_started_on is distinct from old.journey_started_on
      or new.onboarding_completed_at is distinct from old.onboarding_completed_at then
      raise exception 'journey identity is immutable after onboarding';
    end if;
  end if;

  if new.timezone is distinct from old.timezone then
    if new.timezone is null
      or not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
      raise exception 'invalid timezone';
    end if;
    new.timezone_updated_at = now();
  end if;

  if new.ai_analysis_consent is distinct from old.ai_analysis_consent then
    new.ai_consent_updated_at = now();
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.profile_preference_update_guard() from public, anon, authenticated;

create trigger profiles_preference_guard
  before update on public.profiles
  for each row execute function public.profile_preference_update_guard();

create trigger questions_touch_updated_at
  before update on public.questions
  for each row execute function public.touch_updated_at();

create trigger question_texts_touch_updated_at
  before update on public.question_texts
  for each row execute function public.touch_updated_at();

create or replace function public.complete_onboarding(
  p_timezone text,
  p_locale text default 'tr',
  p_reminder_enabled boolean default false,
  p_reminder_local_time time without time zone default null,
  p_ai_analysis_consent boolean default false
)
returns public.profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_timezone is null
    or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid timezone';
  end if;

  if char_length(p_locale) not between 2 and 16 then
    raise exception 'invalid locale';
  end if;

  if p_reminder_enabled and p_reminder_local_time is null then
    raise exception 'reminder time required';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_profile.onboarding_completed_at is not null then
    raise exception 'onboarding already completed';
  end if;

  update public.profiles
  set
    locale = p_locale,
    timezone = p_timezone,
    journey_started_on = (now() at time zone p_timezone)::date,
    onboarding_completed_at = now(),
    ai_analysis_consent = p_ai_analysis_consent,
    ai_consent_updated_at = now(),
    reminder_enabled = p_reminder_enabled,
    reminder_local_time = case when p_reminder_enabled then p_reminder_local_time else null end,
    timezone_updated_at = now()
  where id = v_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.complete_onboarding(text, text, boolean, time without time zone, boolean)
  from public, anon;
grant execute on function public.complete_onboarding(text, text, boolean, time without time zone, boolean)
  to authenticated;

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_texts enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.questions from anon, authenticated;
revoke all on table public.question_texts from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (locale, timezone, ai_analysis_consent, reminder_enabled, reminder_local_time)
  on table public.profiles to authenticated;
grant select on table public.questions to authenticated;
grant select on table public.question_texts to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy questions_read_active
on public.questions
for select
to authenticated
using (active = true);

create policy question_texts_read_active
on public.question_texts
for select
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_texts.question_id
      and q.active = true
  )
);

commit;
