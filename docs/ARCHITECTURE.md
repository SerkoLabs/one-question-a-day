# Architecture

## 1. Architecture goals

The architecture optimizes for:
- a small, reviewable mobile MVP,
- strong privacy boundaries around journal text and derived analysis,
- one complete real vertical slice before broad feature work,
- server-enforced ownership and daily-answer invariants,
- low operational complexity,
- AI provider calls that are replaceable/configurable and never client-secret dependent,
- deterministic 365-day prompt behavior,
- testable authorization and failure states.

Non-goal: introducing microservices, event buses, vector databases or a separate custom API server before evidence requires them.

## 2. Chosen stack and current-version verification

### Mobile
- **Expo SDK 57 / React Native 0.86 / React 19.2 / TypeScript**.
- **Expo Router** for file-based navigation.
- **TanStack Query** for remote/server state and cache lifecycle.
- React local state for simple screen-local state; add Zustand only if a concrete cross-screen client-state need emerges.
- Zod for runtime validation at app/server boundaries.
- React Hook Form for auth/onboarding/settings forms where it reduces boilerplate.
- Expo SecureStore for sensitive small device-resident values and Supabase auth persistence according to the supported mobile adapter pattern.
- Expo Notifications for opt-in **local** daily reminders.

### Backend
- **Supabase Auth** for email/password identity.
- **Supabase Postgres** for questions, profiles, responses, derived analysis, report jobs/reports and privacy-safe analytics.
- **Supabase Row Level Security (RLS)** and explicit grants as the primary data authorization boundary.
- **Supabase Edge Functions** for OpenAI calls, report generation, export and account deletion orchestration.
- **Supabase Storage** only for short-lived private export artifacts in MVP; no media journal bucket.

### AI
- **OpenAI API** from Edge Functions only.
- Responses API with strict JSON-schema/Structured Output behavior when the selected model supports it.
- Requests use `store: false`; no OpenAI conversation/thread state.
- Model IDs are server environment configuration, not mobile constants. Per-entry analysis and long-report synthesis may use different cost/quality tiers without changing client contracts.

### Verification — 2026-09-07

Primary sources checked before selecting version-sensitive components:
- Expo SDK reference: https://docs.expo.dev/versions/latest/
  - SDK 57 targets React Native 0.86 and React 19.2.3; minimum Node 22.13.x is listed.
- Expo SDK 57 release: https://expo.dev/changelog/sdk-57
- Expo Router reference: https://docs.expo.dev/versions/latest/sdk/router/
- Supabase Expo React Native quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Supabase React Native Auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- OpenAI API data controls: https://platform.openai.com/docs/models/default-usage-policies-by-endpoint

Material privacy fact to preserve in release disclosures: OpenAI states API data is not used for model training by default unless the customer opts in, but eligible API calls may still have abuse-monitoring/application-state retention depending on endpoint/account controls. `store:false` is not equivalent to a blanket zero-retention guarantee.

## 3. System context

```text
┌─────────────────────────────┐
│ Expo / React Native client  │
│                             │
│ Today / Journey / Reports   │
│ Settings / Auth             │
└──────────────┬──────────────┘
               │ Supabase publishable key + user JWT
               ▼
┌────────────────────────────────────────────────────┐
│ Supabase                                           │
│                                                    │
│ Auth ───────────────┐                              │
│ Postgres + RLS ◄────┼──── client-safe reads/writes│
│ Edge Functions ◄────┘                              │
│   ├─ analyze-response                              │
│   ├─ generate-report                               │
│   ├─ export-data                                   │
│   └─ delete-account                                │
│ Storage: private export artifacts                  │
└──────────────────────┬─────────────────────────────┘
                       │ server secret only
                       ▼
                 ┌───────────┐
                 │ OpenAI API│
                 └───────────┘
```

The mobile app may directly use Supabase Data API only for operations whose grants/RLS are deliberately client-safe. Privileged operations and all OpenAI traffic go through Edge Functions.

## 4. Module/directory boundaries

Target structure after foundation:

```text
app/
  _layout.tsx
  (auth)/
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  onboarding/
    timezone.tsx
    reminder.tsx
    ai-consent.tsx
  (tabs)/
    _layout.tsx
    index.tsx                 # Today
    journey.tsx
    reports.tsx
    settings.tsx
  entry/[responseId].tsx
  report/[reportId].tsx
  compare/[groupKey].tsx
  privacy/
    export.tsx
    delete-account.tsx
src/
  components/
  features/
    auth/
    onboarding/
    today/
    journey/
    reports/
    comparisons/
    reminders/
    privacy/
  lib/
    supabase/
    query/
    validation/
    dates/
    analytics/
  hooks/
  i18n/
  theme/
  types/
supabase/
  migrations/
  functions/
    _shared/
    analyze-response/
    generate-report/
    export-data/
    delete-account/
  seed.sql
tests/
docs/
```

Rules:
- Route files compose features; business logic lives under `src/features` or trusted backend code.
- Supabase client setup is centralized.
- Generated DB types live in one module and are not hand-edited after generation is available.
- Edge Functions share auth/validation/OpenAI helpers only through `_shared`.

## 5. Navigation/routing

Expo Router route groups:
- `(auth)`: unauthenticated identity flows.
- `onboarding`: authenticated but profile-incomplete flows.
- `(tabs)`: Today, Journey, Reports, Settings.
- stack/modal routes for entry detail, report detail, comparison and privacy operations.

Root route guard derives from a single session/profile bootstrap state:
1. bootstrap loading,
2. signed out,
3. signed in + onboarding incomplete,
4. signed in + onboarding complete.

Do not duplicate auth redirect logic across individual screens.

## 6. State management

- **Remote state:** TanStack Query keyed by authenticated user/session and resource ID/date.
- **Auth/session:** one provider wrapping Supabase auth events plus profile bootstrap.
- **Screen state:** React state / React Hook Form.
- **Sensitive journal draft:** in memory only in MVP; do not persist raw text to AsyncStorage.
- **Global UI preferences:** persisted only when genuinely local; user-owned durable settings live in profile rows.

Zustand is intentionally not required in Phase 0; adding it needs a concrete state-sharing requirement.

## 7. Data fetching/cache

- Query keys include resource semantics (`today`, local date; `responses`, page cursor; `reports`, period/type).
- Protected query cache is cleared on sign-out and user identity change.
- Mutations invalidate/refetch canonical resources rather than manually constructing authoritative server state.
- Question text may be cached because it is global/non-sensitive.
- Raw journal text must not be written to generic persistent caches unless an encrypted-storage design is explicitly approved later.
- Retry policies distinguish transient network/5xx from auth/validation/authorization failures.

## 8. Authentication/session

Supabase Auth handles identity. Mobile client uses the project URL + publishable key, not service role.

Session lifecycle:
1. initialize Supabase client using supported React Native storage adapter,
2. restore session,
3. subscribe to auth state changes,
4. refresh according to Supabase client behavior,
5. load owner profile,
6. clear protected query/local state on sign-out or account switch.

Password reset uses a deliberate app deep-link route when implemented; redirect URLs must be allowlisted in Supabase configuration.

## 9. Authorization boundary

Authorization is not a UI concern.

- `auth.uid()` ownership is enforced in Postgres RLS for all user-owned tables.
- Client-exposed tables have explicit grants in addition to RLS.
- Global question content is read-only to authenticated clients.
- Raw responses, derived analyses, reports, jobs and exports are private to their owner.
- Client cannot write derived AI analyses or reports.
- Edge Functions authenticate JWTs and re-check ownership server-side before reading raw text.
- `service_role` is permitted only inside trusted server operations and must never be returned to the client.
- Account deletion/export logic cannot accept an arbitrary `user_id` as authority; identity comes from the verified session/JWT.

## 10. Backend/API responsibilities

### Direct client-safe DB operations
- Read own profile.
- Update allowlisted profile preferences under RLS/check constraints.
- Read active question bank content.
- Read own responses/history.
- Insert/update own current response subject to DB invariants/triggers.
- Read own reports and report status.
- Insert privacy-safe analytics events with owner check and no client read grant.

### Edge Functions

#### `analyze-response`
- Verify JWT and current consent.
- Fetch response by `(response_id, auth.uid())`.
- Send minimum question + response text to OpenAI.
- Validate strict structured output.
- Upsert current analysis version idempotently.
- Re-check consent immediately before provider call where practical.

#### `generate-report`
- Verify JWT, consent and requested period ownership.
- Enforce eligibility thresholds server-side.
- Backfill missing per-entry analysis in bounded batches if needed.
- Claim/create idempotent report job.
- Synthesize from structured analyses/month summaries plus selected evidence.
- Validate report schema and evidence references.
- Persist one current report version for the source fingerprint.

#### `export-data`
- Verify JWT/recent auth policy.
- Serialize only current user rows.
- Write to private export bucket with expiry metadata.
- Return or create a short-lived signed delivery path.

#### `delete-account`
- Verify authenticated identity and confirmation token/recent-auth policy.
- Idempotently remove/cascade user-owned application data and export objects.
- Delete/revoke Auth user using server privilege only after application deletion succeeds.

## 11. Database/storage interface

`docs/DATABASE.md` is authoritative for schema/RLS/grants.

Important invariants:
- one profile per auth user,
- unique question `day_index` in 1..365,
- one response per `(user_id, local_date)`,
- response local date/day index derived/validated server-side using profile timezone and journey start,
- immutable response ownership/question/local-date identity after creation,
- one current per-entry analysis per response/source revision,
- reports keyed by user/type/period/source fingerprint,
- no client write access to analyses/reports.

## 12. Media/storage

No journal media in MVP.

One private bucket: `user-exports`.
- public access disabled,
- object path begins with authenticated user ID,
- normal clients do not list arbitrary bucket contents,
- downloads use short-lived signed access produced by trusted code,
- generated exports have a deletion/expiry policy.

## 13. Background jobs

MVP deliberately avoids a separate worker service.

- Per-entry analysis is triggered after answer save but is not part of the save success transaction.
- Missing analysis can be backfilled when a report is requested.
- Report generation uses a durable `report_jobs` row so client polling can survive navigation/app restarts.
- Edge Functions are designed for bounded, idempotent units. If production evidence shows long reports exceed Edge Function runtime/concurrency constraints, move only that workload to an approved worker architecture later.

No cron dependency is required for first beta value.

## 14. Notifications

Expo Notifications local scheduling only.
- Ask OS permission only after explicit user reminder intent.
- Store reminder preference/time in profile for portability, but schedule on device.
- At most one app-owned daily routine schedule.
- Opening notification deep-links to Today.
- No marketing push infrastructure in MVP.

## 15. Localization

- Turkish is the first beta locale.
- UI copy is centralized behind locale keys from the start.
- Question rows contain locale and stable conceptual identifiers so a future translation does not change response ownership semantics.
- Dates format in locale but persisted answer boundary uses `date` + IANA timezone.

Avoid adding complex translation-management infrastructure before a second locale is approved.

## 16. Analytics

MVP analytics are privacy-safe product events stored in a dedicated Supabase table or a later approved analytics vendor.

Hard rule: **never send or store journal text, quotes, AI-derived themes, report prose, email, or arbitrary free text as analytics payload.**

Allowlisted events include onboarding completion, answer save success/failure, report eligibility/open/feedback, reminder preference and privacy-operation status. Metadata schema is allowlisted by event name.

## 17. Error handling

- Root error boundary prevents white-screen failure.
- Feature screens define loading/empty/error/retry states per PRODUCT_SPEC.
- User-facing messages are stable product copy; raw database/provider errors stay in safe logs.
- Auth/403 errors do not retry indefinitely.
- AI/report failures never mutate or roll back the source journal response.
- Destructive operations never claim success before authoritative confirmation.

## 18. Logging/observability

Client:
- development logs contain no journal text,
- production logging uses event/error codes and correlation IDs only.

Edge Functions:
- structured logs: request/job ID, authenticated user hash/internal ID where operationally necessary, function version, latency, status, provider request status/token usage where available,
- never log raw prompt/answer/report content.

Crash/observability vendor is deferred; if EAS Observe or another service is enabled, privacy configuration must be reviewed before release.

## 19. Environment/secrets

Client-visible:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only Supabase secrets:
- `OPENAI_API_KEY`
- `OPENAI_ENTRY_MODEL`
- `OPENAI_REPORT_MODEL`
- service-role credentials when required by specific Edge Functions

Repository contains `.env.example` with names/placeholders only. CI/release secrets are configured out-of-band. No secret is committed.

## 20. Testing strategy

### Unit
- journey-day/date calculations including DST/timezone boundaries,
- validators and report eligibility,
- analytics payload allowlist,
- AI output schema validation/forbidden-field checks.

### Component
- Today loading/unanswered/answered/error states,
- offline save behavior,
- report insufficient-data vs ready states,
- consent/reminder settings.

### Database integration
- migrations apply cleanly,
- positive and negative RLS cases for every owner table,
- immutable/unique response invariants,
- client cannot insert analyses/reports,
- export bucket policies.

### Edge Function
- auth required,
- consent required before AI call,
- owner checks,
- provider error/retry/idempotency,
- structured output rejection,
- report thresholds/evidence validation.

### End-to-end vertical slice
`sign up → onboarding → Today → save answer → reload → observe same persisted answer/history` using a real Supabase test project/local stack and real RLS.

AI is intentionally not required for the first persistence vertical slice; the next vertical extension proves consent → analysis → monthly report when sufficient seeded test data exists.

## 21. CI/CD and environments

### Repository CI
GitHub Actions on pull requests/pushes:
- dependency install from lockfile,
- TypeScript typecheck,
- lint,
- unit/component tests,
- Expo config/doctor check where reproducible,
- bundle/export smoke test appropriate to SDK 57,
- migration/schema static checks; integration tests when Supabase CLI/Docker environment is available.

### Environments
- local/dev,
- beta/staging Supabase project,
- production Supabase project.

Do not point development builds at production data by default.

### Mobile release
Use EAS Build/Submit only after release gate and user-owned Expo/Apple/Google assets are available. Store submission/public release always remains an explicit external action.

## 22. Security/privacy

Baseline: OWASP MASVS categories relevant to a typical networked mobile app.

Controls:
- RLS + grants for every client-exposed object,
- least-privilege client access,
- server-only privileged keys,
- no raw journal content in analytics/logs,
- explicit AI consent and re-check before provider processing,
- minimal provider payload (question + answer, no email),
- OpenAI `store:false` and stateless request pattern,
- schema-validated AI output,
- export/delete ownership checks,
- protected cache cleared on logout/account switch,
- no persistent unencrypted offline draft,
- private export bucket and short-lived delivery,
- dependency/secret scanning in CI where available.

Privacy copy must not promise zero third-party retention unless the actual production OpenAI project is approved/configured for such controls and current provider docs support the claim.

## 23. Performance

- Today query should be a small indexed lookup by question day and own response date.
- History paginates responses; do not fetch 365 full bodies to render a calendar.
- Reports use structured summaries to avoid repeatedly sending all raw annual text to the AI provider.
- Per-entry AI analysis is decoupled from answer-save UX.
- Query invalidation is scoped; avoid global refetches after every save.

Initial beta scale assumption: single-region managed Supabase is sufficient. No premature caching layer/CDN for private journal data.

## 24. Deferred architecture / non-decisions

- Final analytics/crash vendor.
- Push-notification campaign service.
- Paid subscription architecture.
- Vector database/embeddings: deliberately not required for deterministic 365-day comparison and hierarchical reports.
- Separate worker/queue service: only if measured Edge Function limits require it.
- Web/desktop app.
- Multi-region/database residency configuration until production legal/privacy requirements are decided.
- Second-year prompt strategy.

## 25. Risks and mitigations

| Risk | Mitigation |
|---|---|
| User changes timezone to manipulate/duplicate daily prompts | Server-derived/validated local date and unique response key; define timezone-change behavior in DB design/tests |
| AI invents psychological meaning | strict schema, forbidden claims, evidence references, low-data thresholds, output validation |
| Provider logs sensitive text | explicit consent, minimum payload, `store:false`, accurate retention disclosure, evaluate eligible retention controls before production |
| Client compromise exposes privileged keys | no privileged/provider keys in mobile bundle; RLS/grants protect publishable-key access |
| Analytics leaks journal content | allowlisted typed payloads; no free-text analytics metadata |
| Long report exceeds function limits | hierarchical input; bounded work; durable job; approved worker only if measured necessary |
| Account deletion partially succeeds | idempotent server orchestration and status; do not delete Auth identity until app-data deletion step succeeds |
| Public repository accidentally receives secrets | `.gitignore`, `.env.example`, CI secret scanning and review discipline |

## Architecture gate status

First draft complete. Critical review required by `docs/MODEL_ROUTING.md` is recorded separately. Because GPT-6 Astra is not available in this session, the review must be labeled **FALLBACK** if performed by GPT-5.6 Sol.
