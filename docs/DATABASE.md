# Database Design

## 1. Goals

The persistence model must support one private answer per user-local day, deterministic 365-day questions, longitudinal AI analysis, owner-only reports, export/deletion, and privacy-safe product analytics.

Primary rules:
- `auth.uid()` is the ownership source of truth.
- Client input is never authoritative for `user_id`, `local_date`, `journey_day` or report ownership.
- All client-exposed user tables use explicit grants **and** RLS.
- Raw reflections and derived AI data are private/sensitive.
- AI/report tables are server-write only.
- No vector database is needed for the MVP.
- Database changes happen through reviewed migrations only after this document.

## 2. Data classification

| Class | Examples | Client visibility | Notes |
|---|---|---|---|
| Public-to-authenticated product content | question metadata/text | read-only | not user-specific |
| Private account configuration | profile timezone, reminder, consent | owner only | avoid demographic overcollection |
| Sensitive raw content | response body | owner only | never analytics/log payload |
| Sensitive derived content | response analysis, reports, evidence/quotes | owner only | may encode inferred themes/values |
| Operational metadata | report job status, export status | owner read / server write | no raw content/errors |
| Privacy-safe analytics | event enum, timestamp, bounded typed references | server/internal; client insert only if allowed | no free text |

## 3. PostgreSQL enums/domains

Use enums only for stable finite system states; editorial category values may use constrained text if likely to evolve.

```text
report_type       = monthly | six_month | annual
analysis_status   = pending | ready | insufficient_input | failed
job_status        = queued | running | succeeded | failed
export_status     = queued | running | ready | expired | failed
analytics_event   = onboarding_completed | answer_saved | answer_save_failed |
                    history_opened | monthly_report_opened | six_month_report_opened |
                    annual_report_opened | report_feedback | ai_consent_changed |
                    reminder_preference_changed | export_requested | account_delete_requested
analytics_outcome = success | failure | denied | skipped
```

Question category uses a checked text value in the first seed migration so editorial expansion does not require a Postgres enum migration. Initial allowed values:
`daily_life`, `self`, `emotions`, `relationships`, `fears`, `values`, `past`, `future`, `meaning`, `choices`, `identity`, `desires`.

## 4. Tables

### 4.1 `profiles`

One row per Supabase Auth user.

| Column | Type | Null | Default / constraint |
|---|---|---:|---|
| `id` | uuid | no | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `locale` | text | no | `'tr'`, bounded locale code |
| `timezone` | text | yes | valid supported IANA timezone checked by onboarding function/app allowlist |
| `journey_started_on` | date | yes | set once by onboarding function |
| `onboarding_completed_at` | timestamptz | yes | null until complete |
| `ai_analysis_consent` | boolean | no | false |
| `ai_consent_updated_at` | timestamptz | yes | maintained by trigger/function |
| `reminder_enabled` | boolean | no | false |
| `reminder_local_time` | time without time zone | yes | required when reminder enabled |
| `timezone_updated_at` | timestamptz | yes | maintained when timezone changes |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

Checks:
- `onboarding_completed_at IS NULL OR (timezone IS NOT NULL AND journey_started_on IS NOT NULL)`.
- `reminder_enabled = false OR reminder_local_time IS NOT NULL`.
- locale length bounded (for example <= 16).

Ownership: `id = auth.uid()`.

Soft delete: **no**. Account deletion is hard delete through Auth cascade/server orchestration.

Indexes: PK is sufficient for normal owner lookup.

### 4.2 `questions`

Locale-independent 365-day question identity.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK, generated UUID |
| `day_index` | smallint | no | UNIQUE, CHECK 1..365 |
| `category` | text | no | CHECK against approved category set |
| `depth` | smallint | no | CHECK 1..3 |
| `comparison_group_key` | text | yes | bounded stable key |
| `active` | boolean | no | true |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

A question referenced by a response must not be hard-deleted. Use `active=false` for future availability changes.

Indexes:
- unique `day_index`,
- optional non-unique `comparison_group_key` where not null.

### 4.3 `question_texts`

Localized prompt text.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `question_id` | uuid | no | FK → `questions(id)` ON DELETE CASCADE |
| `locale` | text | no | bounded locale code |
| `prompt` | text | no | non-empty, bounded (for example <= 1,000 chars) |
| `content_version` | integer | no | default 1, >0 |
| `updated_at` | timestamptz | no | `now()` |

PK: (`question_id`, `locale`).

Question text edits after real user answers exist require deliberate content migration/review; the response always retains `question_id`, and export/report evidence must use an appropriate current/or historical representation strategy before such edits occur.

Indexes: PK plus `(locale, question_id)` if query planner evidence requires it.

### 4.4 `responses`

One raw daily reflection.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK, generated UUID |
| `user_id` | uuid | no | FK → `profiles(id)` ON DELETE CASCADE |
| `question_id` | uuid | no | FK → `questions(id)` ON DELETE RESTRICT |
| `local_date` | date | no | server-derived/validated |
| `journey_day` | smallint | no | CHECK 1..365, server-derived/validated |
| `body` | text | no | trimmed non-empty, char length <= 10,000 |
| `source_revision` | integer | no | default 1, >=1 |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

Constraints:
- UNIQUE (`user_id`, `local_date`).
- UNIQUE (`user_id`, `journey_day`).

Indexes:
- (`user_id`, `local_date` DESC),
- (`user_id`, `journey_day`), unique constraint provides index,
- (`user_id`, `question_id`) for comparison/history checks.

Server invariant on INSERT:
1. caller must be authenticated and `NEW.user_id = auth.uid()`;
2. profile must have completed onboarding;
3. `effective_local_date = (now() AT TIME ZONE profile.timezone)::date`;
4. `effective_journey_day = effective_local_date - profile.journey_started_on + 1`;
5. day must be 1..365;
6. `NEW.question_id` must reference the active question with matching `day_index`;
7. server sets/validates `local_date` and `journey_day`; client-supplied conflicting values are rejected or overwritten by a documented trigger strategy.

Server invariant on UPDATE:
- `id`, `user_id`, `question_id`, `local_date`, `journey_day`, `created_at` are immutable.
- If normalized `body` changes, increment `source_revision` exactly once and update `updated_at`.

Timezone semantics:
- changing `profiles.timezone` is effective for future “current local date” calculations;
- historical response `local_date` and `journey_day` never rewrite;
- if the new timezone maps current instant to a different date, the canonical DB rules determine which day is currently answerable; uniqueness still prevents duplicate dates/journey days.

Soft delete: no client per-entry delete in MVP. Account delete cascades hard delete.

### 4.5 `response_analyses`

Current structured AI analysis for a response/revision. Server-write only.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `response_id` | uuid | no | PK, FK → `responses(id)` ON DELETE CASCADE |
| `user_id` | uuid | no | FK → `profiles(id)` ON DELETE CASCADE |
| `source_revision` | integer | no | >=1 |
| `status` | `analysis_status` | no | pending |
| `schema_version` | integer | no | >=1 |
| `model_id` | text | yes | bounded operational identifier |
| `payload` | jsonb | yes | only for ready/insufficient output; validated in trusted code |
| `source_hash` | text | yes | deterministic digest/fingerprint, not raw content |
| `error_code` | text | yes | bounded allowlisted operational code, never provider message/body |
| `analyzed_at` | timestamptz | yes | |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

Checks:
- ready state requires non-null payload/source_revision/model/analyzed_at.
- error code length bounded.

Indexes:
- (`user_id`, `status`),
- (`user_id`, `analyzed_at` DESC).

When a response revision changes, the old analysis is stale until server reprocessing updates this row. Report generation accepts only analysis whose `source_revision` matches the current response.

### 4.6 `reports`

User-visible period report. Server-write, owner-read.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK → `profiles(id)` ON DELETE CASCADE |
| `type` | `report_type` | no | |
| `period_start` | date | no | |
| `period_end` | date | no | >= start |
| `source_response_count` | integer | no | >=0 |
| `source_fingerprint` | text | no | hash/version summary |
| `schema_version` | integer | no | >=1 |
| `model_id` | text | yes | |
| `payload` | jsonb | yes | trusted validated report schema |
| `generated_at` | timestamptz | yes | |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

Unique: (`user_id`, `type`, `period_start`, `period_end`). A regeneration updates the canonical row after successful validation rather than exposing two conflicting “current” reports.

Indexes:
- (`user_id`, `type`, `period_end` DESC).

Payload evidence references must point only to current user response IDs included in the source period.

### 4.7 `report_jobs`

Durable generation status. Server-write, owner-read.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK → `profiles(id)` ON DELETE CASCADE |
| `type` | `report_type` | no | |
| `period_start` | date | no | |
| `period_end` | date | no | |
| `status` | `job_status` | no | queued |
| `attempt_count` | smallint | no | 0, >=0 |
| `source_fingerprint` | text | yes | |
| `error_code` | text | yes | bounded, no raw provider error |
| `started_at` | timestamptz | yes | |
| `finished_at` | timestamptz | yes | |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

Indexes:
- (`user_id`, `status`, `created_at` DESC),
- partial unique index preventing more than one `queued`/`running` job for the same user/type/period.

Retention: failed/succeeded operational rows may be pruned after a documented window (initial target 30 days) once no longer needed for user-visible status.

### 4.8 `analytics_events`

Privacy-safe event stream. No free-text metadata column.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `id` | bigint identity | no | PK |
| `user_id` | uuid | no | FK → `profiles(id)` ON DELETE CASCADE |
| `event` | `analytics_event` | no | allowlist enum |
| `outcome` | `analytics_outcome` | yes | optional finite state |
| `question_id` | uuid | yes | FK → `questions(id)` ON DELETE SET NULL |
| `report_type` | `report_type` | yes | |
| `metric_value` | integer | yes | bounded if event uses it |
| `occurred_at` | timestamptz | no | `now()` |

No `jsonb`, message, email, body, theme, quote, report prose or arbitrary string property is accepted from the mobile client.

Indexes:
- (`user_id`, `occurred_at` DESC),
- (`event`, `occurred_at` DESC) for aggregate beta metrics.

Client privilege: INSERT only under RLS; no SELECT/UPDATE/DELETE. Internal/admin analytics access is outside mobile role grants.

Retention target: 180 days for beta metrics unless legal/privacy policy chooses a shorter period.

### 4.9 `user_exports`

Private export operation metadata. Server-write, owner-read.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK → `profiles(id)` ON DELETE CASCADE |
| `status` | `export_status` | no | queued |
| `storage_path` | text | yes | must be owner-prefixed; not public URL |
| `expires_at` | timestamptz | yes | |
| `error_code` | text | yes | bounded operational code |
| `created_at` | timestamptz | no | `now()` |
| `completed_at` | timestamptz | yes | |

Indexes: (`user_id`, `created_at` DESC).

Export object retention target: 24 hours after ready; job metadata can be retained up to 30 days without content.

### 4.10 `account_deletion_requests`

Durable pre-auth-deletion state for idempotent retries.

| Column | Type | Null | Constraint |
|---|---|---:|---|
| `user_id` | uuid | no | PK, FK → `profiles(id)` ON DELETE CASCADE |
| `status` | `job_status` | no | queued/running/failed; success normally disappears with auth cascade |
| `attempt_count` | smallint | no | 0 |
| `error_code` | text | yes | bounded operational code |
| `requested_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |

Server-only write/read for operation. Client invokes authenticated Edge Function rather than table access.

## 5. Relationships

```text
auth.users
  1 ── 1 profiles
          ├── * responses ── 1 questions ── * question_texts
          │      └── 1 response_analyses
          ├── * reports
          ├── * report_jobs
          ├── * analytics_events
          ├── * user_exports
          └── 0..1 account_deletion_requests
```

Questions are global product content. Every user-owned branch cascades from profile/auth user deletion.

## 6. Grants and RLS

RLS is enabled on every table exposed through the Data API. `service_role` remains server-side only.

### `profiles`
Authenticated:
- SELECT own row: `id = auth.uid()`.
- UPDATE only approved preference columns and own row. Prefer column-level UPDATE grants for `locale`, `timezone`, `ai_analysis_consent`, `reminder_enabled`, `reminder_local_time`.
- No client DELETE.
- No client authority to set `journey_started_on` or `onboarding_completed_at`; use `complete_onboarding(...)` function.

### `questions` / `question_texts`
Authenticated:
- SELECT active product content.
- no INSERT/UPDATE/DELETE.

Anon: no access required for MVP because prompts are shown after sign-in/onboarding.

### `responses`
Authenticated:
- SELECT where `user_id = auth.uid()`.
- INSERT WITH CHECK `user_id = auth.uid()` plus server trigger invariants.
- UPDATE USING/WITH CHECK own row; immutable-identity trigger prevents ownership/question/date/day changes.
- no client DELETE in MVP.

### `response_analyses`
Authenticated:
- SELECT own row only.
- no INSERT/UPDATE/DELETE grants.

### `reports` / `report_jobs` / `user_exports`
Authenticated:
- SELECT own rows only.
- no client write grants.

### `analytics_events`
Authenticated:
- INSERT WITH CHECK `user_id = auth.uid()`.
- no SELECT/UPDATE/DELETE grant to mobile roles.
- event enum and typed columns prevent free-text payload leakage.

### `account_deletion_requests`
No direct authenticated client grants; Edge Function only.

## 7. Functions/triggers

### `handle_new_user()`
Auth signup trigger inserts a minimal `profiles(id)` row. It does not invent timezone, locale preferences or journey start beyond safe defaults.

### `complete_onboarding(p_timezone, p_locale, p_reminder_enabled, p_reminder_time, p_ai_consent)`
`SECURITY DEFINER` function with locked `search_path` and explicit `auth.uid()` ownership.
- validates parameters,
- verifies onboarding not already completed,
- computes `journey_started_on` from server `now()` in supplied validated timezone,
- records consent timestamp and preferences,
- marks onboarding complete.

Grant EXECUTE only to authenticated role. Do not accept a user ID parameter.

### `prepare_response_insert()`
BEFORE INSERT trigger implementing the current-local-date/journey-day/question invariants from §4.4. Rejects unauthenticated or mismatched owner.

### `protect_response_update()`
BEFORE UPDATE trigger:
- rejects changes to identity/date/question fields,
- normalizes/checks body,
- increments `source_revision` when body changes,
- updates timestamp.

### `touch_updated_at()`
Generic timestamp trigger only where it does not mask more specific revision semantics.

### `profile_preference_update_guard()`
Ensures `journey_started_on`/onboarding identity cannot be changed through normal client UPDATE; updates consent/timezone timestamps when their values change.

Security-definer rules:
- use only where required,
- `SET search_path` explicitly,
- schema-qualify sensitive references,
- derive caller from `auth.uid()`,
- do not expose arbitrary SQL identifiers/paths,
- add dedicated allow/deny tests.

## 8. Report eligibility rules

Server-side, never client-only:

- Monthly: completed local calendar month; >= 8 current eligible responses in period.
- Six-month: six journey months elapsed; >= 40 eligible responses across >= 3 distinct months.
- Annual: 365 journey days elapsed; >= 80 eligible responses across >= 6 distinct months.

“Eligible response” means current owned response, body present, and current analysis ready or capable of bounded backfill when consent remains true.

Period calculations use the profile timezone at generation time for current calendar boundaries; historical response dates remain immutable. The generated report persists explicit `period_start`/`period_end` so later timezone changes do not silently mutate an existing report period.

## 9. AI data integrity

Trusted code writes analysis/report JSON only after runtime schema validation.

Required report evidence validation:
- every referenced response ID belongs to `auth.uid()` user,
- response date is inside report source period,
- quoted evidence exactly matches or is a bounded exact substring of the source body,
- source revision matches fingerprint used for generation.

If any source answer is edited, its `source_revision` changes. The corresponding analysis is stale until regenerated; report source fingerprint changes and report must be regenerated before being presented as current.

## 10. Storage bucket

### `user-exports`
- private bucket, never public,
- object path convention: `<user_id>/<export_id>/export.json` (or zipped equivalent),
- mobile authenticated role receives no general bucket list/upload/delete grant,
- trusted Edge Function/service role writes/deletes,
- download delivered through short-lived signed access after owner verification,
- automatic/operational cleanup after expiry target (24 hours).

No other Storage bucket is required for MVP.

## 11. Cascade / deletion behavior

`auth.users` delete:
- CASCADE profile,
- CASCADE responses,
- CASCADE analyses,
- CASCADE reports/jobs,
- CASCADE analytics events,
- CASCADE export metadata/deletion request.

Question deletion:
- responses use `ON DELETE RESTRICT`; product questions should be deactivated/versioned, not deleted after use.
- question text can cascade only if question itself is legitimately removed before real usage.

Account deletion Edge Function must remove user export objects from Storage before deleting the Auth user because database cascade cannot remove Storage objects.

No user-content soft delete. A “delete account” must not merely set `deleted_at` while retaining raw journal text indefinitely.

## 12. Retention

Initial operational targets, subject to release privacy/legal review:
- raw responses: until user account deletion,
- analyses/reports: until account deletion or regeneration replacement,
- export files: 24 hours after ready,
- export/report job metadata: ~30 days where not needed for current UI,
- privacy-safe analytics: <=180 days for beta measurement.

Provider-side retention is external and must be described according to current production provider settings/policies; do not infer it from database retention.

## 13. Migration strategy

1. `0001_extensions_types.sql` — required extensions/enums/helpers.
2. `0002_profiles_questions.sql` — profiles, question identity/text, onboarding function.
3. `0003_responses.sql` — responses, invariants/triggers.
4. `0004_analysis_reports.sql` — analyses, reports, jobs.
5. `0005_privacy_analytics.sql` — analytics, exports, deletion requests.
6. `0006_rls_grants.sql` — enable RLS, explicit grants/policies.
7. `0007_storage_policies.sql` — private export bucket/policy setup if migration-managed.
8. `0008_question_seed_tr.sql` — reviewed Turkish question seed; must ultimately contain complete day indexes 1..365 before beta.

Every migration should be forward-only and reproducible on a clean database. Destructive changes require an explicit backup/rollback or data migration plan.

## 14. Authorization test matrix

At minimum integration tests must prove:

| Actor/action | Expected |
|---|---|
| User A reads own profile/response/report | ALLOW |
| User A reads User B profile/response/analysis/report/export metadata | DENY/empty |
| User A inserts response with `user_id=B` | DENY |
| User A inserts response for wrong question/day | DENY |
| User A creates second response same local date/day | DENY unique invariant |
| User A updates response ownership/question/local date/journey day | DENY |
| User A updates own response body | ALLOW, source revision increments |
| User A inserts/updates `response_analyses` | DENY |
| User A inserts/updates `reports` or `report_jobs` | DENY |
| User A selects analytics rows | DENY |
| User A inserts analytics event with valid enum/own ID | ALLOW |
| Anon reads questions/user data | DENY for MVP |
| Authenticated client calls onboarding function for another user ID | impossible: no user ID parameter; ownership derived |
| AI Edge Function receives response ID owned by another user | DENY before provider call |
| AI Edge Function sees consent=false | DENY/skip before provider call |
| Export for User A includes User B row/object | DENY/test failure |
| Delete-account request for arbitrary target user | impossible: target derived from verified JWT |

## 15. Soft-delete assessment

- User journal data: **no soft delete** required; hard deletion is preferable for privacy/account deletion.
- Questions: use `active` rather than soft-delete timestamps.
- Operational jobs: status/retention cleanup rather than soft delete.

## 16. Open database decisions

None blocks implementation planning. Production region, actual Supabase project ID and secret configuration are external assets deferred until environment setup.

## Database gate status

Design complete. Data-ownership/authorization review is recorded separately. Preferred GPT-6 Astra reviewer is unavailable in this session; any Sol review must be labeled FALLBACK.
