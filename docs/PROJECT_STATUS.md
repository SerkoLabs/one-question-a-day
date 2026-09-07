# Project Status

Last updated: 2026-09-07

## Lifecycle

| Stage | State | Evidence |
|---|---|---|
| 01 IDEA | PASS | approved concept captured in `README.md` |
| 02 README | PASS | `README.md` |
| 03 PRODUCT_SPEC | PASS | `docs/PRODUCT_SPEC.md` |
| 04 USER_FLOWS | PASS | `docs/USER_FLOWS.md`; onboarding route consolidation recorded in ADR-008 |
| 05 ARCHITECTURE | FALLBACK PASS | `docs/ARCHITECTURE.md`, `docs/reviews/ARCHITECTURE_REVIEW.md`; GPT-6 Astra unavailable, GPT-5.6 Sol fallback; no P0/P1 |
| 06 DATABASE | FALLBACK PASS | `docs/DATABASE.md`, `docs/reviews/DATABASE_AUTHORIZATION_REVIEW.md`; no P0/P1 |
| 07 IMPLEMENTATION_PLAN | PASS | `docs/IMPLEMENTATION_PLAN.md` |
| 08 Foundation | PARTIAL | scaffold/config/secure auth storage/query/CI are implemented, but dependency install/typecheck/lint/tests/export have not executed because no GitHub-hosted runner is assigned and the local container has no package-network access |
| 09 App shell/navigation | IMPLEMENTED / GATE PARTIAL | protected auth/onboarding/tab route groups, shared states and session bootstrap exist; runtime verification is blocked by Stage 08 execution environment |
| 10 First vertical slice | IMPLEMENTED IN SOURCE / NOT VERIFIED | real Auth → onboarding → Today → Postgres/RLS response → reload/history/edit path exists; integration harness and verification plan exist, but no executable Supabase/test environment has run them |
| 11 Audit #1 | NOT ELIGIBLE FOR PASS | requires verified VS-1; static review may proceed but cannot substitute for runtime/RLS evidence |
| 12 Core MVP | NOT GATED IN | AI/report implementation must not be treated as approved merely because earlier source files exist |
| 13 Audit #2 | NOT STARTED | after core MVP |
| 14 Store/release readiness | NOT STARTED | after Audit #2 |
| 15 Beta readiness | NOT STARTED | after release gate |

## Current branch

`codex/app-shell`

## Repository implementation now present

### Foundation
- Expo SDK 57 / React Native / TypeScript / Expo Router scaffold.
- Current first-party Expo 57 dependency baseline recorded in ADR-009; implementation uses React Native `0.87.1` / React `19.2.3`.
- Strict TypeScript, ESLint/Jest scripts, public-env validation and secret ignores.
- Central Supabase client with publishable-key only.
- Chunked Expo SecureStore adapter for Supabase auth session persistence; raw journal drafts are not persisted there.
- AppState-based Supabase token refresh.
- TanStack Query client and protected-cache clearing on **any authenticated user identity change**, not only sign-out.
- CI workflow covers `main` and `codex/**`; it safely bootstraps a lockfile only when one is absent.

### App shell / auth / onboarding
- Branded welcome screen matching the approved product promise.
- Email/password sign-up and sign-in.
- Email verification success is not incorrectly shown as an auth error.
- Password reset request + native deep-link session bridge + password update route.
- Session/profile bootstrap states: loading, signed-out, onboarding, ready, error.
- Onboarding captures IANA timezone, optional reminder preference and explicit optional AI consent; server function commits onboarding atomically.
- Protected four-tab shell: Today, Journey, Reports, Settings.
- Settings supports owner-scoped timezone/AI-consent updates and real sign-out; notification scheduling remains deliberately disabled until the notification phase.
- Recoverable not-found route and reusable loading/error/empty-state primitives.

### Database / authorization
- `0001_extensions_types.sql`: core enums/helpers.
- `0002_profiles_questions.sql`: profiles/questions/question texts, Auth bootstrap trigger, hardened `complete_onboarding`, explicit grants + RLS.
- `0003_responses.sql`: owner/date/day/question response invariants, immutable response identity, revisioning, explicit grants + RLS, owner-derived `get_today_state` RPC.
- Development/test seed for journey days 1–7 only; it is visibly marked non-production.
- Server, not client, derives canonical current local date and journey day.
- Client cannot insert another user's response, change response ownership/date/question/day, or create a second same-day identity without a database error.

### VS-1 client path
- Today loads one real current question/answer through authenticated RPC.
- Answer create/edit uses real Supabase persistence and handles same-day race (`23505`) by refetching canonical state.
- Failed save never reports success and keeps the current in-memory draft while the screen remains mounted.
- Journey list fetches only response summaries, not all private bodies.
- Historical detail fetches body only when opened and supports owner-scoped edit/revision update.
- `tests/integration/vertical-slice.integration.test.ts` creates disposable User A/User B and is designed to prove allow/deny paths.
- Exact verification checklist: `docs/testing/VERTICAL_SLICE_01.md`.

## Verification attempts and blocker evidence

GitHub Actions runs continue to finish in roughly 2–3 seconds with:
- `conclusion: failure`,
- `runner_id: 0`,
- empty `steps: []`.

This is evidence that the workflow job is not being assigned a runner; no checkout/install/test command executes. It is **not** evidence that project tests failed.

The available local container also cannot resolve `github.com`/npm hosts, so it cannot clone/install dependencies or create a trustworthy lockfile locally.

Therefore, as of this status:
- `package-lock.json`: pending verified resolution;
- `npm install` / `npm ci`: NOT RUN;
- TypeScript typecheck: NOT RUN against installed dependencies;
- lint: NOT RUN;
- Jest unit tests: NOT RUN;
- Expo Doctor: NOT RUN;
- Expo web export smoke: NOT RUN;
- Supabase migration reset: NOT RUN;
- RLS integration harness: NOT RUN;
- device/simulator vertical-slice smoke: NOT RUN.

## Current first-party version reconciliation

The earlier architecture draft says Expo SDK 57 / RN `0.86`. The current Expo SDK 57 default template checked on 2026-09-07 uses RN `0.87.1`, and repository code follows that current template value. ADR-009 is authoritative for the implementation baseline until the long architecture document is fully synchronized.

## Review requirements carried forward

- P2-ARCH-001 daily date/day/question must stay server-enforced — implemented in `0003_responses.sql`, verification pending.
- P2-ARCH-002 analytics must have no arbitrary free-text metadata — still required for later analytics migration.
- P2-ARCH-003 secure auth-storage behavior requires installed runtime/device verification.
- P2-ARCH-004 timezone changes must never rewrite historical response dates — schema/trigger design preserves history; integration test still needed.
- P2-ARCH-005 long report processing must remain bounded.
- P2-DB-001 explicit least-privilege revoke/grant — implemented for current tables, verification pending.
- P2-DB-002 SECURITY DEFINER allow/deny tests — integration harness prepared; not run.
- P2-DB-003 same-day multi-device race — unique constraint + canonical refetch implemented; not run.
- P2-DB-004 account deletion/storage cleanup remains a later privacy-phase requirement.

## Exact blocker / next gate action

To advance Stage 10 to PASS and make Audit #1 eligible, one executable environment must become available that can:
1. install dependencies and generate/commit the lockfile;
2. run typecheck/lint/unit tests/Expo checks;
3. apply/reset the Supabase migrations + seed in a disposable environment;
4. run `npm run test:integration`;
5. perform the documented app smoke on a simulator/device.

Until then, repository-local work that is independent of those runtime results may continue, but no dependent AI/report stage will be represented as gate-passed.

Production Supabase/OpenAI credentials and Apple/Google/Expo release assets are intentionally not required at this point.
