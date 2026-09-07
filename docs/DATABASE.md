# Database Design

## 1. Scope and security model

Supabase Postgres is the persistence and authorization boundary for the MVP. The design must support one private reflection per user-local day, a deterministic 365-day question journey, owner-only AI analyses/reports, privacy-safe analytics, export and irreversible account deletion.

Rules:
- `auth.uid()` is the ownership source of truth.
- Client input is never authoritative for `user_id`, `local_date`, `journey_day` or report ownership.
- Every client-exposed table uses explicit grants **and** RLS.
- Raw reflections and derived AI content are private/sensitive.
- AI analyses, reports, report jobs, exports and deletion jobs are server-write only.
- `service_role` never ships to the mobile app.
- No vector database is required for the MVP.
- Database changes are migration-only after this document.

## 2. Data classification

| Class | Examples | Access |
|---|---|---|
| Authenticated product content | question metadata/text | authenticated read-only |
| Private configuration | timezone, locale, reminder, AI consent | owner only |
| Sensitive raw content | reflection body | owner only |
| Sensitive derived content | themes, values, quotes, reports | owner only; trusted server writes |
| Operational metadata | report/export job status | owner read; trusted server writes |
| Privacy-safe analytics | allowlisted event enum + bounded typed values | client insert own; no client read |

No analytics/logging field may accept arbitrary journal text, quotes, report prose or AI themes.

## 3. Stable enums / constrained values

```text
report_type       = monthly | six_month | annual
analysis_status   = pending | ready | insufficient_input | failed
job_status        = queued | running | succeeded | failed
export_status     = queued | running | ready | expired | failed
analytics_outcome = success | failure | denied | skipped
```

`analytics_event` is an allowlisted enum containing only approved product events such as onboarding completion, answer save, report open/feedback, reminder preference, AI-consent change, export request and account-delete request.

Question category is constrained text so editorial expansion does not require an enum migration. Initial values:
`daily_life`, `self`, `emotions`, `relationships`, `fears`, `values`, `past`, `future`, `meaning`, `choices`, `identity`, `desires`.

## 4. Tables

### 4.1 `profiles`

One row per Supabase Auth user.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | uuid | no | PK; FK `auth.users(id)` ON DELETE CASCADE |
| `locale` | text | no | default `tr`; bounded locale code |
| `timezone` | text | yes | valid IANA timezone; required after onboarding |
| `journey_started_on` | date | yes | set once by onboarding function |
| `onboarding_completed_at` | timestamptz | yes | null until complete |
| `ai_analysis_consent` | boolean | no | default false |
| `ai_consent_updated_at` | timestamptz | yes | maintained on consent change |
| `reminder_enabled` | boolean | no | default false |
| `reminder_local_time` | time | yes | required when reminder enabled |
| `timezone_updated_at` | timestamptz | yes | maintained on timezone change |
| `created_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

Checks:
- completed onboarding requires non-null `timezone` and `journey_started_on`;
- enabled reminder requires non-null reminder time;
- timezone is validated by `complete_onboarding` / preference update against `pg_timezone_names`, not by trusting the client.

Ownership: `id = auth.uid()`.

Soft delete: none. Account deletion is hard delete.

### 4.2 `questions`

Locale-independent prompt identity.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `day_index` | smallint | no | UNIQUE; CHECK 1..365 |
| `category` | text | no | approved category check |
| `depth` | smallint | no | CHECK 1..3 |
| `comparison_group_key` | text | yes | bounded stable key |
| `active` | boolean | no | default true |
| `created_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

Indexes: unique `day_index`; index `comparison_group_key` where non-null.

Questions referenced by real responses are deactivated/versioned rather than deleted.

### 4.3 `question_texts`

| Column | Type | Null | Rules |
|---|---|---:|---|
| `question_id` | uuid | no | FK `questions(id)` ON DELETE CASCADE |
| `locale` | text | no | bounded locale code |
| `prompt` | text | no | non-empty; <= 1,000 chars |
| `content_version` | integer | no | default 1; >0 |
| `updated_at` | timestamptz | no | default `now()` |

PK: (`question_id`, `locale`).

Edits after real responses exist require deliberate content migration/review; semantic question identity remains stable.

### 4.4 `responses`

One raw daily reflection.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK `profiles(id)` ON DELETE CASCADE |
| `question_id` | uuid | no | FK `questions(id)` ON DELETE RESTRICT |
| `local_date` | date | no | server-derived/validated |
| `journey_day` | smallint | no | CHECK 1..365; server-derived/validated |
| `body` | text | no | trimmed; 1..10,000 Unicode chars |
| `source_revision` | integer | no | default 1; >=1 |
| `created_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

Constraints/indexes:
- UNIQUE (`user_id`, `local_date`);
- UNIQUE (`user_id`, `journey_day`);
- UNIQUE (`id`, `user_id`) for composite ownership FKs;
- index (`user_id`, `local_date` DESC);
- index (`user_id`, `question_id`).

Insert invariant, enforced by a trigger/function:
1. caller is authenticated and `NEW.user_id = auth.uid()`;
2. onboarding is complete;
3. `effective_local_date = (now() AT TIME ZONE profile.timezone)::date`;
4. `effective_journey_day = effective_local_date - journey_started_on + 1`;
5. day is 1..365;
6. question is active and `questions.day_index = effective_journey_day`;
7. server derives/validates `local_date` and `journey_day`.

Update invariant:
- `id`, `user_id`, `question_id`, `local_date`, `journey_day`, `created_at` immutable;
- changing normalized body increments `source_revision` exactly once and updates `updated_at`.

Timezone changes are effective for future current-date calculations only. Historical response dates/days never rewrite.

No client per-entry DELETE in beta; account deletion cascades hard delete.

### 4.5 `response_analyses`

Current structured AI analysis for a particular response revision. Trusted-server write, owner read.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `response_id` | uuid | no | PK |
| `user_id` | uuid | no | owner discriminator |
| `source_revision` | integer | no | >=1 |
| `status` | `analysis_status` | no | default pending |
| `schema_version` | integer | no | >=1 |
| `model_id` | text | yes | bounded operational ID |
| `payload` | jsonb | yes | validated trusted output only |
| `source_hash` | text | yes | digest/fingerprint, not content |
| `error_code` | text | yes | bounded allowlisted code only |
| `analyzed_at` | timestamptz | yes | |
| `created_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

Critical ownership constraint:
- composite FK (`response_id`, `user_id`) → `responses(id, user_id)` ON DELETE CASCADE.

This prevents a privileged-service bug from pairing User A's response with User B's RLS-visible analysis row.

Indexes: (`user_id`, `status`), (`user_id`, `analyzed_at` DESC).

A ready analysis is current only when `source_revision = responses.source_revision`.

### 4.6 `reports`

Canonical user-visible period report. Trusted-server write, owner read.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK `profiles(id)` ON DELETE CASCADE |
| `type` | `report_type` | no | |
| `period_start` | date | no | |
| `period_end` | date | no | >= period_start |
| `source_response_count` | integer | no | >=0 |
| `source_fingerprint` | text | no | source/version digest |
| `schema_version` | integer | no | >=1 |
| `model_id` | text | yes | bounded operational ID |
| `payload` | jsonb | yes | validated trusted report only |
| `generated_at` | timestamptz | yes | |
| `created_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

Constraints:
- UNIQUE (`user_id`, `type`, `period_start`, `period_end`);
- UNIQUE (`id`, `user_id`) for report-source ownership FKs.

Index: (`user_id`, `type`, `period_end` DESC).

Regeneration updates the canonical row only after validation; the UI must not expose two conflicting current reports.

### 4.7 `report_sources`

Normalized evidence/source manifest for each report. This is the DB-level cross-user ownership guard for report synthesis.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `report_id` | uuid | no | report identity |
| `user_id` | uuid | no | owner discriminator |
| `response_id` | uuid | no | source reflection |
| `response_revision` | integer | no | revision used |
| `used_as_evidence` | boolean | no | default false |

PK: (`report_id`, `response_id`).

Composite FKs:
- (`report_id`, `user_id`) → `reports(id, user_id)` ON DELETE CASCADE;
- (`response_id`, `user_id`) → `responses(id, user_id)` ON DELETE CASCADE.

Indexes: (`user_id`, `report_id`), (`response_id`).

Every response ID quoted/referenced by report payload must be present in this table at the recorded revision. Trusted report validation enforces payload ⊆ source manifest.

### 4.8 `report_jobs`

Durable generation state. Trusted-server write, owner read.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK `profiles(id)` ON DELETE CASCADE |
| `type` | `report_type` | no | |
| `period_start` | date | no | |
| `period_end` | date | no | |
| `status` | `job_status` | no | default queued |
| `attempt_count` | smallint | no | default 0 |
| `source_fingerprint` | text | yes | |
| `error_code` | text | yes | bounded code, never raw provider text |
| `started_at` | timestamptz | yes | |
| `finished_at` | timestamptz | yes | |
| `created_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

Indexes:
- (`user_id`, `status`, `created_at` DESC);
- partial unique index preventing more than one queued/running job per user/type/period.

Operational rows may be pruned after ~30 days when no longer needed by UI/support.

### 4.9 `analytics_events`

No arbitrary metadata JSON/text.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | bigint identity | no | PK |
| `user_id` | uuid | no | FK `profiles(id)` ON DELETE CASCADE |
| `event` | `analytics_event` | no | allowlist only |
| `outcome` | `analytics_outcome` | yes | finite state |
| `question_id` | uuid | yes | FK `questions(id)` ON DELETE SET NULL |
| `report_type` | `report_type` | yes | |
| `metric_value` | integer | yes | bounded numeric only |
| `occurred_at` | timestamptz | no | default `now()` |

Indexes: (`user_id`, `occurred_at` DESC), (`event`, `occurred_at` DESC).

Authenticated clients may INSERT own valid rows but receive no SELECT/UPDATE/DELETE grant.

Initial retention target: <=180 days, subject to release privacy review.

### 4.10 `user_exports`

Trusted-server write, owner read.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | uuid | no | PK |
| `user_id` | uuid | no | FK `profiles(id)` ON DELETE CASCADE |
| `status` | `export_status` | no | default queued |
| `storage_path` | text | yes | owner-prefixed private path; never public URL |
| `expires_at` | timestamptz | yes | |
| `error_code` | text | yes | bounded operational code |
| `created_at` | timestamptz | no | default `now()` |
| `completed_at` | timestamptz | yes | |

Index: (`user_id`, `created_at` DESC).

Ready export object retention target: 24 hours.

### 4.11 `account_deletion_requests`

Durable state before deleting the Auth identity.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `user_id` | uuid | no | PK; FK `profiles(id)` ON DELETE CASCADE |
| `status` | `job_status` | no | queued/running/failed; success normally disappears with auth cascade |
| `attempt_count` | smallint | no | default 0 |
| `error_code` | text | yes | bounded operational code |
| `requested_at` | timestamptz | no | default `now()` |
| `updated_at` | timestamptz | no | default `now()` |

No direct mobile grants; Edge Function only.

## 5. Relationships

```text
auth.users
  1 ── 1 profiles
          ├── * responses ── 1 questions ── * question_texts
          │      └── 0..1 response_analyses
          ├── * reports ── * report_sources ── * responses
          ├── * report_jobs
          ├── * analytics_events
          ├── * user_exports
          └── 0..1 account_deletion_requests
```

Composite ownership FKs on `response_analyses` and `report_sources` prevent trusted-service mistakes from creating cross-user derived-data references.

## 6. RLS and grants

RLS enabled on every Data API-exposed table.

### `profiles`
Authenticated:
- SELECT own (`id = auth.uid()`).
- UPDATE own only and only approved preference columns via column grants: `locale`, `timezone`, `ai_analysis_consent`, `reminder_enabled`, `reminder_local_time`.
- no client INSERT/DELETE after the auth-user bootstrap trigger.
- client cannot set `journey_started_on` or `onboarding_completed_at`.

### `questions`, `question_texts`
Authenticated SELECT active product content. No client writes. No anon access required for beta.

### `responses`
Authenticated:
- SELECT own;
- INSERT own with RLS plus insert trigger invariants;
- UPDATE own with RLS plus immutable-identity trigger;
- no client DELETE.

### `response_analyses`, `reports`, `report_sources`, `report_jobs`, `user_exports`
Authenticated SELECT own only. No client writes.

### `analytics_events`
Authenticated INSERT with `user_id = auth.uid()` only. No client SELECT/UPDATE/DELETE.

### `account_deletion_requests`
No authenticated client table grants.

## 7. Functions and triggers

### `handle_new_user()`
Auth signup trigger creates minimal `profiles(id)`. It does not invent timezone or journey start.

### `complete_onboarding(...)`
`SECURITY DEFINER` function with explicit locked `search_path`:
- derives caller from `auth.uid()`; accepts no user ID;
- validates timezone against `pg_timezone_names`;
- verifies onboarding has not already completed;
- sets locale, timezone, reminder settings, AI consent and consent timestamp;
- computes `journey_started_on` from server `now()` in the supplied timezone;
- marks onboarding complete.

Grant EXECUTE only to authenticated role.

### `prepare_response_insert()`
BEFORE INSERT trigger:
- requires `NEW.user_id = auth.uid()`;
- fetches completed profile;
- derives local date and journey day from server time/profile timezone;
- verifies journey day 1..365;
- verifies question day matches;
- sets/validates immutable date/day identity;
- normalizes/checks body.

### `protect_response_update()`
BEFORE UPDATE trigger:
- rejects changes to identity/date/question fields;
- normalizes body;
- increments `source_revision` only when body changes;
- updates timestamp.

### `profile_preference_update_guard()`
Blocks ordinary updates to onboarding identity, validates changed timezone, maintains consent/timezone timestamps.

All security-definer functions must:
- set a safe `search_path`,
- schema-qualify sensitive objects,
- derive caller from `auth.uid()`,
- accept no arbitrary target user identifier,
- receive explicit allow/deny integration tests.

## 8. Report eligibility and source integrity

Server-enforced thresholds:
- monthly: completed local calendar month + >=8 eligible responses;
- six-month: six journey months elapsed + >=40 responses across >=3 distinct months;
- annual: 365 journey days elapsed + >=80 responses across >=6 distinct months.

A response is eligible only if owned by the user and current analysis is ready or can be safely backfilled while consent remains true.

Trusted generation flow creates `report_sources` first/transactionally with the report result. Every source row must match the same owner through composite FKs. Report payload evidence references must be a subset of those manifest rows and the recorded response revision.

Editing a reflection increments `source_revision`; stale analysis/report fingerprints no longer count as current until regenerated.

## 9. Storage

Private bucket: `user-exports` only.

Rules:
- never public;
- object path: `<user_id>/<export_id>/export.json` or zipped equivalent;
- mobile role receives no general list/upload/delete privilege;
- trusted server writes/deletes;
- download uses short-lived signed access after owner verification;
- cleanup target: 24 hours after ready.

No journal media bucket in MVP.

## 10. Cascade / deletion

Deleting `auth.users` cascades through `profiles` to responses, analyses, reports/sources/jobs, analytics, export metadata and deletion request rows.

Responses use `question_id ON DELETE RESTRICT`; used questions are not deleted.

Account-deletion server flow must delete the user's Storage export objects **before** Auth user deletion, because relational cascade does not remove Storage objects.

No soft delete for private journal content. Account deletion must not merely hide retained raw entries.

## 11. Retention targets

Subject to release privacy/legal review:
- responses: until account deletion;
- current analyses/reports: until deletion or replacement/regeneration;
- export object: ~24 hours;
- completed/failed operation metadata: ~30 days where no longer needed;
- privacy-safe analytics: <=180 days.

Third-party provider retention is governed separately by current production settings/policies and must not be inferred from DB retention.

## 12. Migration order

1. `0001_extensions_types.sql`
2. `0002_profiles_questions.sql`
3. `0003_responses.sql`
4. `0004_analysis_reports.sql`
5. `0005_privacy_analytics.sql`
6. `0006_rls_grants.sql`
7. `0007_storage_exports.sql`
8. `0008_question_seed_tr.sql`

The final beta seed must contain exactly one active day identity for each day 1..365 and at least one Turkish prompt text per question.

## 13. Authorization test matrix

| Case | Expected |
|---|---|
| A reads own profile/response/analysis/report | ALLOW |
| A reads B profile/response/analysis/report/export metadata | DENY/empty |
| A inserts response with `user_id=B` | DENY |
| A inserts response for wrong day/question | DENY |
| A creates second response same local date/day | DENY |
| A updates response owner/question/local date/journey day | DENY |
| A updates own body | ALLOW; revision increments |
| A inserts/updates analysis/report/source/job/export | DENY |
| Service attempts analysis `(response=A, user=B)` | DENY composite FK |
| Service attempts report source `(report=A, response=B)` | DENY composite ownership FK |
| A selects analytics events | DENY |
| A inserts valid allowlisted own analytics event | ALLOW |
| Anon reads questions or user data | DENY for MVP |
| Onboarding function targets another user | impossible; no user-ID parameter |
| Analyze function receives another user's response ID | DENY before provider call |
| Analyze function sees consent=false | no provider call |
| Export A contains B row | test failure / DENY |
| Delete request supplies arbitrary target user | impossible; target from verified JWT |

## 14. Soft-delete assessment

- Private user content: no soft delete.
- Questions: `active` flag instead of deletion after use.
- Operational jobs: status + retention cleanup.

## 15. Open decisions

No database-design choice blocks the implementation plan. Production Supabase project, region, credentials and provider secrets are external assets deferred to environment setup.

## Gate status

Design is ready for the Stage 06 ownership/authorization review. Preferred GPT-6 Astra reviewer is unavailable in this session; a GPT-5.6 Sol review must be labeled **FALLBACK**.
