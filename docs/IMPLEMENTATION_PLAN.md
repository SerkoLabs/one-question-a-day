# Implementation Plan

## 1. Execution rules

- Follow dependency order; do not start a task whose dependencies are incomplete.
- Keep changes small and reviewable.
- Do not expand MVP beyond `README.md` / `docs/PRODUCT_SPEC.md`.
- Every coding task must update/add tests for changed behavior where applicable.
- Before a phase gate: run relevant install/typecheck/lint/test/build/schema checks and fix in-scope failures.
- No production deployment, store submission, paid commitment or secret creation is implied by this plan.
- Database migrations must match `docs/DATABASE.md`; RLS/grants are tested with both allow and deny cases.
- Journal text and derived analysis must never enter logs/analytics fixtures except clearly synthetic test strings.

## 2. First real vertical slice

**VS-1:** `sign up → onboarding → Today → answer today's real DB question → persist response under RLS → restart/refetch → see the same answer in Today and Journey history`.

This is the required Stage 10 slice. It uses real Auth/Postgres/RLS and no hidden persistence mock. AI is intentionally not part of VS-1; the product's AI/report layer is added only after the persistence/security architecture is proven.

---

# Phase 0 — Repository / tooling foundation

## P0-001 — Scaffold Expo SDK 57 application
- **Purpose:** establish the supported mobile runtime without product feature code.
- **Work:** add Expo SDK 57 default TypeScript/Expo Router structure; app metadata uses working name; remove template demo content while preserving a minimal boot route.
- **Affected:** `package.json`, lockfile, `app.json`/`app.config.*`, `tsconfig.json`, `app/`, assets placeholders.
- **Dependencies:** Stage 07 plan PASS.
- **Acceptance criteria:**
  - [ ] Expo SDK 57 / RN 0.86 compatible dependency set.
  - [ ] TypeScript enabled with strict settings feasible for app code.
  - [ ] App boots to a deliberate placeholder/shell, not Expo demo screens.
  - [ ] No secret/value-specific environment config committed.
- **Verification:** clean install; `npx expo-doctor`; TypeScript; bundle/start smoke where environment allows.
- **Complexity:** M.
- **Risk:** version mismatch; use official Expo SDK 57 template references.

## P0-002 — Quality toolchain and scripts
- **Purpose:** make correctness checks deterministic before feature work.
- **Work:** configure lint, typecheck, unit/component test runner, formatting policy; add scripts `typecheck`, `lint`, `test`, `test:ci`, and a reproducible Expo bundle/config check.
- **Affected:** package scripts, ESLint config, test config/setup.
- **Dependencies:** P0-001.
- **Acceptance criteria:**
  - [ ] Each verification command exits non-zero on a real failure.
  - [ ] A small sanity test runs in CI mode.
  - [ ] No blanket lint/typecheck suppression.
- **Verification:** run every configured command locally/CI.
- **Complexity:** M.
- **Risk:** test-library/SDK 57 compatibility; verify current package docs.

## P0-003 — Environment validation and secrets hygiene
- **Purpose:** prevent accidental secret exposure and ambiguous config failures.
- **Work:** `.env.example`; gitignore secret patterns; typed runtime config module for client-visible Supabase URL/publishable key; clear missing-config error in dev; document server-only secret names without values.
- **Affected:** `.gitignore`, `.env.example`, `src/lib/config/*`, docs.
- **Dependencies:** P0-001.
- **Acceptance criteria:**
  - [ ] OpenAI/service-role secrets are never referenced through `EXPO_PUBLIC_*`.
  - [ ] App fails clearly on missing required client env instead of undefined runtime behavior.
  - [ ] Repository secret scan finds no credential.
- **Verification:** unit config tests; grep/secret scan; typecheck.
- **Complexity:** S.
- **Risk:** false sense of security from publishable key secrecy; docs explicitly rely on RLS.

## P0-004 — Supabase client/session-storage adapter baseline
- **Purpose:** implement one supported React Native client boundary before auth screens.
- **Work:** central Supabase client; current supported Expo/React Native auth persistence adapter; app-state token refresh behavior as required by Supabase docs; no service-role logic.
- **Affected:** `src/lib/supabase/*`.
- **Dependencies:** P0-003.
- **Acceptance criteria:**
  - [ ] Single Supabase client instance.
  - [ ] Auth persistence implementation follows current Supabase/Expo docs and documents storage-size/security trade-off.
  - [ ] Protected caches can be cleared on identity change.
  - [ ] No raw journal draft uses generic persistent storage.
- **Verification:** unit tests for adapter wrapper where possible; config/typecheck; integration deferred until test project exists.
- **Complexity:** M.
- **Risk:** SecureStore/session size behavior; must verify with current SDK, not assumption.

## P0-005 — GitHub Actions baseline
- **Purpose:** get independent repository verification on every change.
- **Work:** CI workflow using compatible Node (Expo SDK 57 docs list Node 22.13.x minimum); `npm ci`; typecheck; lint; tests; Expo doctor/config/bundle smoke as reproducible.
- **Affected:** `.github/workflows/ci.yml`.
- **Dependencies:** P0-002, P0-003.
- **Acceptance criteria:**
  - [ ] CI triggers on PR and main push.
  - [ ] No secrets required for pure foundation checks.
  - [ ] Failed check fails workflow.
- **Verification:** observe a real GitHub Actions run.
- **Complexity:** S.
- **Risk:** platform-specific Expo checks; do not pretend native build ran if it did not.

### Phase 0 gate
Install/typecheck/lint/tests/bundle/config checks PASS, or PARTIAL only for a documented external environment blocker. No feature work starts on a broken foundation.

---

# Phase 1 — App shell / navigation

## P1-001 — Root route groups and tab shell
- **Purpose:** establish navigation matching USER_FLOWS.
- **Work:** `(auth)`, `onboarding`, `(tabs)` groups; Today/Journey/Reports/Settings tab placeholders; modal/detail route boundaries.
- **Affected:** `app/**`.
- **Dependencies:** Phase 0 PASS.
- **Acceptance criteria:** route graph exists with no dead demo routes; incomplete features visibly state unavailable rather than fake success.
- **Verification:** router typecheck + navigation component tests/smoke.
- **Complexity:** M.

## P1-002 — Session/profile bootstrap state machine
- **Purpose:** centralize signed-out/onboarding/active routing.
- **Work:** auth provider; bootstrap loading; session restore/change listener; profile query boundary; route guard; clear protected query cache on logout/account switch.
- **Affected:** `src/features/auth/*`, root layout.
- **Dependencies:** P0-004, P1-001.
- **Acceptance criteria:** exactly four canonical states: loading, signed out, signed in incomplete, signed in complete; protected screens do not flash for signed-out user.
- **Verification:** state-machine/provider tests using synthetic auth events.
- **Complexity:** M.
- **Risk:** stale protected cache leak on account switch.

## P1-003 — Shared UI states and accessibility baseline
- **Purpose:** avoid ad hoc loading/error/empty behavior.
- **Work:** reusable screen container, loading, empty, error/retry, offline banner, destructive confirmation primitives; text scaling and accessibility labels.
- **Affected:** `src/components/*`, theme.
- **Dependencies:** P1-001.
- **Acceptance criteria:** core placeholders have accessible labels and do not rely on color alone.
- **Verification:** component tests + manual accessibility inspection where available.
- **Complexity:** S.

### Phase 1 gate
App starts, route shell works, startup/session failures do not crash, protected routes are guarded.

---

# Phase 2 — Authentication / user model / onboarding

## P2-001 — Supabase migrations: types, profiles, questions, onboarding function
- **Purpose:** establish user/question persistence before UI depends on it.
- **Work:** migrations `0001`/`0002`; `profiles`, `questions`, `question_texts`; new-user trigger; hardened `complete_onboarding`; base grants/RLS; small **development/test** seed in `supabase/seed.sql` only.
- **Affected:** `supabase/migrations/*`, `supabase/seed.sql`.
- **Dependencies:** Phase 1 shell, DATABASE design.
- **Acceptance criteria:** clean migration applies; onboarding function derives caller and validates timezone via DB; client cannot set another user or journey start.
- **Verification:** Supabase local/staging integration tests for allow/deny; migration reset.
- **Complexity:** L.
- **Risk:** SECURITY DEFINER/search-path errors.

## P2-002 — Email/password auth screens
- **Purpose:** make real identity usable.
- **Work:** sign up, sign in, password reset initiation/deep-link completion as supported; validation and actionable errors.
- **Affected:** `app/(auth)/*`, `src/features/auth/*`.
- **Dependencies:** P1-002, P2-001.
- **Acceptance criteria:** new/existing user flows work against real test Supabase; duplicate/invalid/network errors represented.
- **Verification:** component tests + real auth smoke.
- **Complexity:** M.

## P2-003 — Onboarding timezone / reminder intent / AI consent
- **Purpose:** establish day boundary and explicit AI authorization before journaling.
- **Work:** detect/select timezone; reminder preference/time without requesting permission until opt-in; AI-processing explanation/consent; call `complete_onboarding` atomically.
- **Affected:** `app/onboarding/*`, `src/features/onboarding/*`.
- **Dependencies:** P2-001, P2-002.
- **Acceptance criteria:** decline AI still completes onboarding; server controls journey start; invalid timezone rejected; interrupted onboarding resumes.
- **Verification:** component tests + DB integration.
- **Complexity:** M.

## P2-004 — Profile preference update guard and Settings baseline
- **Purpose:** allow legitimate later preference changes without rewriting journey identity.
- **Work:** DB guard/column grants; Settings reads/updates timezone/reminder/consent; history dates remain immutable.
- **Affected:** migration, `src/features/settings/*`, Settings route.
- **Dependencies:** P2-001, P2-003.
- **Acceptance criteria:** client cannot update protected profile columns; valid preference updates own row only.
- **Verification:** allow/deny DB tests + UI tests.
- **Complexity:** M.

## P2-005 — Auth/profile authorization test suite
- **Purpose:** close Phase 2 with evidence, not assumptions.
- **Work:** User A/User B/anon tests for profile/question grants, onboarding function and preference updates.
- **Dependencies:** P2-001..P2-004.
- **Acceptance criteria:** all DATABASE matrix cases for existing tables pass.
- **Verification:** automated Supabase integration suite.
- **Complexity:** M.

### Phase 2 gate
Real test user can authenticate, complete onboarding and resume correct route; RLS negative tests pass.

---

# Phase 3 — First end-to-end vertical slice

## P3-001 — Responses migration and daily invariants
- **Purpose:** implement the product's most important persistence/security invariant.
- **Work:** `responses` table; unique constraints/composite ownership key; insert/update triggers; RLS/grants; concurrency-safe behavior.
- **Affected:** `supabase/migrations/0003_responses.sql`.
- **Dependencies:** Phase 2 PASS.
- **Acceptance criteria:** DB derives/validates current local date/day/question; identity fields immutable; body edit increments revision; second same-day response rejected.
- **Verification:** allow/deny/concurrency integration tests including User A/B.
- **Complexity:** L.
- **Risk:** timezone and two-device race edge cases.

## P3-002 — Today question query and screen states
- **Purpose:** show exactly one server-consistent daily question.
- **Work:** query current profile/question/answer; loading/unanswered/answered/content-error/journey-complete states; safe question cache only.
- **Affected:** Today feature/route, query hooks.
- **Dependencies:** P3-001.
- **Acceptance criteria:** one question max; missing content never replaced randomly; day 366+ defined.
- **Verification:** component/query tests + real DB smoke.
- **Complexity:** M.

## P3-003 — Answer create/edit persistence
- **Purpose:** complete core daily action.
- **Work:** plain-text form; 1..10,000 chars; mutation; unique-race reconciliation; in-memory failed-save draft; saved/edit states.
- **Affected:** Today feature, response hooks/validators.
- **Dependencies:** P3-002.
- **Acceptance criteria:** save survives restart/refetch; false “saved” state impossible; no raw answer in analytics/logs/AsyncStorage; edit revision updates.
- **Verification:** component + integration + logout/cache-clearing checks.
- **Complexity:** M.

## P3-004 — Journey calendar/history minimum slice
- **Purpose:** prove persisted answer is consumable after Today.
- **Work:** response-presence query; answered/missed calendar/list; answered entry detail; missed-day state; existing-answer edit path may reuse P3-003 mutation.
- **Affected:** Journey feature/routes.
- **Dependencies:** P3-003.
- **Acceptance criteria:** persisted answer appears after restart; missed day cannot be backfilled; no punitive streak copy.
- **Verification:** query/component + real DB smoke.
- **Complexity:** M.

## P3-005 — VS-1 real E2E verification
- **Purpose:** prove architecture works end-to-end.
- **Work:** reproducible test/manual script for real Supabase environment: sign up → onboarding → Today → save → reload → history; include unauthorized User B attempt.
- **Dependencies:** P3-001..P3-004.
- **Acceptance criteria:** entire VS-1 completes without mocks; source answer persists; unauthorized read/write fails.
- **Verification:** E2E/integration evidence recorded in audit/status.
- **Complexity:** M.

## P3-006 — Audit #1
- **Purpose:** independent gate before broad feature work.
- **Work:** requirements/runtime/architecture/RLS/cache/privacy/accessibility/dependency review; preferred Astra, fallback labeled if unavailable; fix P0/P1 and rerun.
- **Dependencies:** P3-005.
- **Acceptance criteria:** no unresolved P0/P1.
- **Verification:** `docs/reviews/AUDIT_01.md` + all checks green.
- **Complexity:** M.

### Phase 3 gate
VS-1 passes with real auth/data/RLS and Audit #1 has no P0/P1.

---

# Phase 4 — Core product / longitudinal value

## P4-001 — Analysis/report schema migrations
- **Purpose:** add derived-data model only after raw persistence is proven.
- **Work:** `response_analyses`, `reports`, `report_sources`, `report_jobs`; composite ownership FKs; RLS/read grants; server-only writes.
- **Affected:** migration `0004_analysis_reports.sql` and integration tests.
- **Dependencies:** Phase 3 PASS.
- **Acceptance criteria:** cross-user composite FK cases fail; clients cannot write derived rows.
- **Verification:** clean migration + DATABASE authorization matrix.
- **Complexity:** L.

## P4-002 — Structured AI schemas and provider adapter
- **Purpose:** separate provider calls from product contracts.
- **Work:** Zod/JSON schemas for per-entry analysis and report; forbidden clinical concepts in prompt/output validator; OpenAI Responses adapter with `store:false`; model IDs from server env; no content logging.
- **Affected:** `supabase/functions/_shared/ai/*`.
- **Dependencies:** P4-001.
- **Acceptance criteria:** malformed/untraceable output rejected; provider key never client-visible; unit fixtures are synthetic.
- **Verification:** schema/provider adapter tests with mocked transport; optional real-provider staging smoke only when key supplied.
- **Complexity:** L.
- **Risk:** model output drift and sensitive third-party processing.

## P4-003 — `analyze-response` Edge Function
- **Purpose:** produce neutral owner-scoped signals after consent.
- **Work:** JWT validation; ownership fetch; consent re-check; source revision/hash; bounded provider call; idempotent upsert; safe error codes.
- **Affected:** Edge Function + tests.
- **Dependencies:** P4-002.
- **Acceptance criteria:** consent=false and foreign response cause zero provider calls; edit invalidates old revision; failure never changes raw response.
- **Verification:** function tests + DB integration; real provider smoke when external secret available.
- **Complexity:** L.

## P4-004 — Analysis trigger/recovery behavior
- **Purpose:** make analysis reliable without blocking answer save.
- **Work:** invoke analysis after save; visible non-blocking state where useful; report-generation backfill for missing analyses; race re-checks consent.
- **Dependencies:** P4-003.
- **Acceptance criteria:** answer save succeeds independently of AI; missing analysis can recover; opting out before call prevents processing.
- **Verification:** integration tests for failure/race/idempotency.
- **Complexity:** M.

## P4-005 — Monthly eligibility and report generation
- **Purpose:** deliver first longitudinal value moment.
- **Work:** period/threshold calculator; report job idempotency; source manifest; hierarchical prompt; evidence validator; canonical report persistence.
- **Affected:** `generate-report` Edge Function/shared report logic.
- **Dependencies:** P4-004.
- **Acceptance criteria:** <8 answers gives insufficient state without model call; >=8 produces validated report; source IDs/revisions owner-safe and traceable.
- **Verification:** unit/integration with seeded synthetic month; provider transport mock + optional real smoke.
- **Complexity:** L.

## P4-006 — Monthly Reports UI
- **Purpose:** present report as a reflection aid, not diagnosis.
- **Work:** reports index eligibility/generation/error; monthly report cards; evidence links; helpful/not-helpful control.
- **Dependencies:** P4-005.
- **Acceptance criteria:** sparse data copy is cautious; report claims link to sources; clinical certainty language absent from product templates.
- **Verification:** component tests + accessibility/manual review.
- **Complexity:** M.

## P4-007 — Six-month / annual generation and UI
- **Purpose:** implement core long-term promise.
- **Work:** 40/3-month and 80/6-month thresholds; hierarchical use of analyses/month reports; early-vs-late/stable/strengthening/declining structures; UI reuse.
- **Dependencies:** P4-006.
- **Acceptance criteria:** server thresholds enforced; bounded input; report evidence manifest valid; no unsupported causal claims.
- **Verification:** seeded synthetic 6m/365d datasets; runtime/token budget measurements.
- **Complexity:** L.

## P4-008 — “Past You” deterministic comparison
- **Purpose:** show direct raw change without semantic search infrastructure.
- **Work:** comparison-group query; side-by-side screen; optional AI difference summary through same safety boundary.
- **Dependencies:** P3-004, P4-003.
- **Acceptance criteria:** only same owner/group pairs; raw comparison works if AI fails/disabled.
- **Verification:** query/component/integration tests.
- **Complexity:** M.

## P4-009 — Complete 365-question Turkish editorial seed
- **Purpose:** make the full one-year journey real before beta.
- **Work:** create reviewed `0008_question_seed_tr.sql`; exactly days 1..365; balanced categories/depth; deliberate comparison-group repeats; lint script checks duplicates/missing days/prompt lengths.
- **Dependencies:** product spec stable; can run in parallel after P3 but must finish before beta.
- **Acceptance criteria:** 365/365 unique day indexes and Turkish texts; no missing prompt; no accidental duplicate except intended comparison concepts; content avoids clinical prompting that positions app as therapist.
- **Verification:** seed validation test/script + editorial review.
- **Complexity:** XL (content-heavy).

## P4-010 — Journey complete state
- **Purpose:** define day 366+ instead of wrapping unpredictably.
- **Work:** Today journey-complete state; annual report/history routes; no second-year prompt generation.
- **Dependencies:** P4-007, P4-009.
- **Acceptance criteria:** day >365 never maps back to day 1; user can still read history/eligible annual report.
- **Verification:** date-boundary tests.
- **Complexity:** S.

### Phase 4 gate
All core MVP acceptance criteria for daily journal + reports + comparisons are implemented; full content seed exists; tests/authorization checks pass.

---

# Phase 5 — Social/community

**N/A for MVP.** README explicitly excludes social/public features. Do not create social tables/routes merely to fill this phase.

---

# Phase 6 — Notifications / localization

## P6-001 — Local reminder permission and scheduling
- **Purpose:** support habit without server push or guilt mechanics.
- **Work:** Expo Notifications local schedule; ask permission only after opt-in; replace/cancel schedule; notification opens Today.
- **Dependencies:** P2-004.
- **Acceptance criteria:** no permission prompt before intent; at most one routine schedule; disabling cancels it; copy has no streak-threat language.
- **Verification:** unit logic + real-device/simulator permission test where supported.
- **Complexity:** M.

## P6-002 — Turkish string centralization / localization readiness
- **Purpose:** prevent UI text from becoming untranslatable while keeping beta scope Turkish-first.
- **Work:** central locale keys; date formatting; question locale query; no translation-management vendor.
- **Dependencies:** Phase 1+.
- **Acceptance criteria:** user-facing core strings do not require editing route logic to add another locale later.
- **Verification:** lint/test key coverage and Turkish smoke.
- **Complexity:** M.

---

# Phase 7 — Privacy / security / destructive operations

## P7-001 — Privacy-safe analytics schema and client API
- **Purpose:** measure beta value without collecting journal content.
- **Work:** migration `0005_privacy_analytics.sql` analytics table/event enum; insert-only RLS; typed event wrapper with no generic free-text metadata.
- **Dependencies:** DATABASE design; can begin after Phase 3 audit.
- **Acceptance criteria:** client cannot SELECT analytics; type/API makes reflection text impossible in normal event calls.
- **Verification:** DB allow/deny + compile-time/unit payload tests.
- **Complexity:** M.

## P7-002 — Export metadata/storage migration and Edge Function
- **Purpose:** give users portable access to their private record.
- **Work:** `user_exports`; private `user-exports` bucket; export function; owner-only data selection; signed time-limited delivery; cleanup metadata.
- **Dependencies:** core schema stable.
- **Acceptance criteria:** export fixture contains only requesting user; bucket cannot be publicly listed/read; no permanent public URL.
- **Verification:** User A/B storage + function integration tests.
- **Complexity:** L.

## P7-003 — Account deletion idempotent state machine
- **Purpose:** satisfy user control/privacy and store-readiness expectations.
- **Work:** deletion request table; Edge Function; delete storage objects, app data/Auth identity in safe order; partial-failure retry; clear client session/protected state only on confirmed success.
- **Dependencies:** P7-002.
- **Acceptance criteria:** cannot target arbitrary user; successful delete removes raw/derived/export data; partial failure never claims complete.
- **Verification:** staging/local destructive tests with disposable users.
- **Complexity:** L.

## P7-004 — Full security/RLS audit
- **Purpose:** independently test database/API/client assumptions.
- **Work:** all DATABASE matrix cases; SECURITY DEFINER review; secret scan; dependency audit; log/analytics content audit; account-switch cache audit; provider consent race.
- **Dependencies:** P7-001..P7-003, core features.
- **Acceptance criteria:** no unresolved P0/P1; preferred Astra or documented FALLBACK.
- **Verification:** `docs/reviews/SECURITY_REVIEW.md` + automated evidence.
- **Complexity:** L.

## P7-005 — Privacy / AI-boundary product copy
- **Purpose:** accurately explain reflection-vs-diagnosis and third-party processing.
- **Work:** onboarding/settings/report disclaimers; privacy data map; current provider-retention wording; no false “zero retention” promise.
- **Dependencies:** production-like provider/storage design known.
- **Acceptance criteria:** copy matches actual data flow and current official policies.
- **Verification:** product/security review; no unsupported legal claims.
- **Complexity:** M.

---

# Phase 8 — Analytics / performance / Audit #2

## P8-001 — Beta success metrics queries/dashboard definition
- **Purpose:** make product validation measurable.
- **Work:** SQL/views/internal queries for 7-day activation, 30-day answered days, monthly report open/helpfulness and retention using privacy-safe events/response presence counts only.
- **Dependencies:** P7-001.
- **Acceptance criteria:** metrics in README can be computed without reading journal body/analysis text.
- **Verification:** synthetic analytics dataset tests.
- **Complexity:** M.

## P8-002 — History/report performance pass
- **Purpose:** avoid loading all sensitive content for simple calendar/report index views.
- **Work:** paginated history; presence/count queries; scoped query invalidation; indexes verified with realistic synthetic data.
- **Dependencies:** core features complete.
- **Acceptance criteria:** calendar does not fetch all 365 full bodies; Today remains small lookup; no N+1 report source fetching.
- **Verification:** query counts/EXPLAIN where applicable + device profiling.
- **Complexity:** M.

## P8-003 — Error/observability baseline
- **Purpose:** make beta failures diagnosable without leaking content.
- **Work:** correlation IDs/error codes; Edge Function structured metadata logs; choose/enable crash vendor only if separately approved/configured; no journal content.
- **Dependencies:** core functions stable.
- **Acceptance criteria:** common failures traceable by code/job ID; content-leak review passes.
- **Verification:** failure injection tests + log inspection.
- **Complexity:** M.

## P8-004 — Audit #2
- **Purpose:** final broad product/engineering audit before release work.
- **Work:** scope coverage, placeholders/TODOs, cross-feature regressions, performance, privacy, localization, analytics integrity, offline behavior, accessibility, dependency health.
- **Dependencies:** P8-001..P8-003 and all beta MVP work.
- **Acceptance criteria:** no unresolved P0/P1; remaining P2 risks explicitly accepted/tracked.
- **Verification:** `docs/reviews/AUDIT_02.md` + green gates.
- **Complexity:** L.

---

# Phase 9 — Store / release / beta readiness

## P9-001 — EAS environment/build configuration
- **Purpose:** create reproducible dev/beta/production builds without mixing secrets/data.
- **Work:** EAS config; bundle IDs/application IDs placeholders/final values as available; environment separation; signing remains external user-owned action.
- **Dependencies:** Audit #2 PASS.
- **Acceptance criteria:** repository config does not embed production secrets; beta build command documented.
- **Verification:** EAS/local config validation; real cloud/native build only when account/assets authorized.
- **Complexity:** M.

## P9-002 — Current Apple/Google policy checklist
- **Purpose:** avoid relying on stale store-policy memory.
- **Work:** verify current official requirements for privacy disclosures, account deletion, notifications/permissions, AI-generated content claims, age/content rating, data safety/privacy labels and SDK targets; record links/date.
- **Dependencies:** near-final product behavior.
- **Acceptance criteria:** `docs/RELEASE_CHECKLIST.md` reflects current first-party policies and actual data flow.
- **Verification:** release review.
- **Complexity:** M.

## P9-003 — Release smoke and native-device matrix
- **Purpose:** prove the candidate outside unit tests.
- **Work:** iOS/Android realistic device/simulator checks: auth, onboarding, Today, answer edit/history, report states, notification permission, export/delete disposable account, network-loss behavior.
- **Dependencies:** P9-001, production-like staging environment.
- **Acceptance criteria:** no known release-blocking crash/security defect.
- **Verification:** recorded matrix/build IDs.
- **Complexity:** L.

## P9-004 — Final security/release gate
- **Purpose:** stop unsafe public release.
- **Work:** preferred Astra review (or documented strongest fallback) of secrets/RLS/privacy/store blockers/build evidence; fix P0/P1 and rerun.
- **Dependencies:** P9-002, P9-003.
- **Acceptance criteria:** no unresolved P0/P1/release blocker.
- **Verification:** `docs/reviews/RELEASE_REVIEW.md`.
- **Complexity:** M.

## P9-005 — Beta readiness plan
- **Purpose:** validate product value, not merely app execution.
- **Work:** define beta audience, onboarding instructions, feedback route, primary value action, thresholds, crash/error monitoring, rollback/hotfix path, content/operations ownership.
- **Dependencies:** P9-004.
- **Acceptance criteria:** beta can measure README primary/secondary metrics; support/rollback path exists.
- **Verification:** `docs/BETA_PLAN.md` review.
- **Complexity:** S.

## P9-006 — External release handoff
- **Purpose:** clearly separate repository-complete work from user-owned external actions.
- **Dependencies:** P9-005.
- **Potential blockers requiring user action:** production Supabase/OpenAI/Expo secrets or projects not already connected; Apple/Google developer credentials/certificates; final store listing assets/legal URLs; explicit public submission authorization.
- **Acceptance criteria:** repository documents exact missing external actions without claiming release occurred.
- **Verification:** PROJECT_STATUS accurate.
- **Complexity:** S.

---

## Stage 07 gate checklist

- [x] Tasks are dependency ordered.
- [x] Every task has purpose, work, affected areas/dependencies, acceptance criteria, verification and complexity/risk context.
- [x] First real vertical slice is explicit.
- [x] Security/testing/store work is integrated into feature phases.
- [x] Social phase is explicitly N/A rather than invented.
- [x] Beta must-have work is separated from deferred/post-beta architecture.
- [x] No task requires architectural invention beyond approved docs.

**Gate: PASS. Next eligible work: Phase 0 / P0-001.**
