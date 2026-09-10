begin;

create extension if not exists pgcrypto with schema extensions;

create type public.report_type as enum ('monthly', 'six_month', 'annual');
create type public.analysis_status as enum ('pending', 'ready', 'insufficient_input', 'failed');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed');
create type public.export_status as enum ('queued', 'running', 'ready', 'expired', 'failed');
create type public.analytics_outcome as enum ('success', 'failure', 'denied', 'skipped');
create type public.analytics_event as enum (
  'onboarding_completed',
  'answer_saved',
  'answer_save_failed',
  'history_opened',
  'monthly_report_opened',
  'six_month_report_opened',
  'annual_report_opened',
  'report_feedback',
  'ai_consent_changed',
  'reminder_preference_changed',
  'export_requested',
  'account_delete_requested'
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;

commit;
