# Vertical Slice 01 — Persistence + RLS

## Goal

Prove the smallest meaningful product path with real identity, real Postgres persistence and real authorization:

`sign up → onboarding → Today → save answer → reload → see persisted answer → open Journey → open/edit same answer → unauthorized second user cannot read/write it`.

No AI provider call is required for this first slice.

## Repository implementation included

- Supabase email/password auth screens and session bootstrap.
- Native auth/password-reset deep-link bridge.
- Atomic `complete_onboarding(...)` function deriving the authenticated user and server-local journey start.
- Profiles/questions/question-text tables with explicit grants + RLS.
- Responses table with owner/date/day/question invariants and immutable identity.
- `get_today_state(...)` authenticated RPC deriving current day server-side.
- Today UI with real query, save/edit mutation and explicit loading/error states.
- Journey UI that fetches response summaries without loading every body.
- Historical entry detail with real owner-scoped body fetch/edit.
- Protected query cache clearing on user identity changes.
- Same-day unique-race reconciliation: a `23505` is followed by canonical refetch rather than a false “winner” assumption.
- Integration harness: `tests/integration/vertical-slice.integration.test.ts`.

## Automated integration environment

Use a disposable/local Supabase project whose migrations and `supabase/seed.sql` are applied. Never point this harness at production.

Required environment variables are documented in `.env.test.example`:

```text
TEST_SUPABASE_URL
TEST_SUPABASE_PUBLISHABLE_KEY
TEST_SUPABASE_SERVICE_ROLE_KEY
```

The service-role credential is used only by the test harness to create/delete disposable test users. It is never bundled into the mobile app.

Run:

```text
npm run test:integration
```

The harness must verify:
1. disposable User A and User B can authenticate;
2. both can complete onboarding for themselves;
3. User A receives journey day 1 from `get_today_state`;
4. User A inserts one answer through normal authenticated client privileges;
5. a subsequent Today fetch returns the same persisted answer ID;
6. User B's select of User A's answer returns no row;
7. User B cannot insert a response whose `user_id` is User A;
8. User A cannot create a second answer for the same daily identity;
9. editing User A's body increments `source_revision`.

## Manual device/simulator smoke

After the automated DB/RLS harness is green:

1. Launch with no session → welcome/auth route only.
2. Create/sign into a disposable account.
3. Complete onboarding; decline AI consent to prove AI is not required for journaling.
4. Today shows exactly one real question.
5. Enter synthetic text and save.
6. Force-close/relaunch the app.
7. Today shows the same saved text.
8. Journey count increases and the dated entry appears.
9. Open the entry, edit it, save, return to Today and confirm canonical text is updated.
10. Sign out and sign in as a second disposable user; verify no prior protected text flashes or appears.
11. Disable network before a save attempt; verify the UI does not claim success and the in-memory draft remains while the screen stays mounted.

## Current verification status — PARTIAL / NOT EXECUTED

Repository code and the integration harness are present, but the gate is **not PASS** yet.

As of 2026-09-07:
- GitHub Actions jobs are created but fail before a runner is assigned (`runner_id=0`, no steps).
- The available local container cannot resolve GitHub/npm hosts, so dependencies cannot be installed there.
- No disposable Supabase test project/local CLI runtime is currently available through the execution environment.

Therefore the following remain **NOT RUN**:
- dependency install/lock resolution,
- TypeScript typecheck,
- lint,
- unit test execution,
- Expo doctor/export smoke,
- Supabase migration reset,
- RLS integration harness,
- device/simulator smoke.

Do not call Stage 10 PASS until these checks execute successfully. No core AI/report phase should be treated as gated-in solely because the source files exist.
