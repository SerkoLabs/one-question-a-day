# AGENTS.md — One Question a Day

This repository follows **AI App Development Playbook v1.0.0** from `serkandnc/ai-app-development-playbook`. The upstream `AGENTS.md` is the canonical behavioral contract. This local file records the project-specific operating contract needed to continue safely if the template repository is not already in context.

## Instruction priority
1. Explicit user instructions in the current task.
2. This repository's `AGENTS.md` plus the upstream playbook contract.
3. `docs/AI_DEVELOPMENT_PLAYBOOK.md`.
4. `docs/MODEL_ROUTING.md`.
5. Approved project documents in `docs/`.
6. Existing implementation conventions.

Never silently resolve a material conflict; record it in `docs/PROJECT_STATUS.md`.

## Continuous autonomy
Once the user asks to build/continue/complete the product, continue through eligible lifecycle stages without requiring a separate “continue” message. Finish the current task, run its gate, fix in-scope failures, update `docs/PROJECT_STATUS.md`, then advance automatically.

Stop only for a genuine human/external blocker, including:
- irreversible destructive data loss,
- meaningful unapproved spend,
- a change to the product promise/MVP/business model,
- credentials, certificates, domains, store/payment accounts or other user-owned assets,
- a major new vendor/platform dependency not already approved,
- consequential legal/privacy/payment-policy choices that cannot be derived safely,
- production deployment, public release/store submission/payment activation requiring explicit external authorization,
- an unresolved material contradiction in authoritative docs,
- a blocker unavailable tools cannot resolve safely.

Ask only for the smallest missing decision or asset.

## Mandatory lifecycle
Do not reorder:
1. IDEA
2. README.md
3. docs/PRODUCT_SPEC.md
4. docs/USER_FLOWS.md
5. docs/ARCHITECTURE.md
6. docs/DATABASE.md
7. docs/IMPLEMENTATION_PLAN.md
8. Phase 0 — repository/tooling foundation
9. Phase 1 — app shell/navigation
10. first real end-to-end vertical slice
11. Audit #1
12. remaining core MVP features
13. Audit #2
14. store/release readiness
15. beta readiness

Each stage must pass its documented gate before dependent work proceeds. A passed gate is a transition point, not a reason to stop.

## Source of truth
- `README.md`: promise, target user, MVP, non-goals.
- `docs/PRODUCT_SPEC.md`: detailed behavior and acceptance criteria.
- `docs/USER_FLOWS.md`: navigation and journeys.
- `docs/ARCHITECTURE.md`: technical boundaries and system design.
- `docs/DATABASE.md`: schema, ownership, RLS, storage and deletion.
- `docs/IMPLEMENTATION_PLAN.md`: dependency-ordered tasks.
- `docs/DECISIONS.md`: material decisions and rationale.
- `docs/PROJECT_STATUS.md`: current stage, gate state, blockers and next action.
- Code/tests/migrations: implementation truth after coding begins.

Repository evidence wins over stale status text. Synchronize docs and code when drift is found.

## Research-before-decision
Use current primary/official sources for framework versions, SDK/API behavior, security, auth, privacy, payments, deployment and store rules. Record material findings and links in the relevant project document. Prefer official vendor docs and first-party repositories/changelogs.

## Engineering rules
Always:
- inspect before modifying,
- preserve valid working behavior,
- prefer the smallest complete change,
- use strict typing where supported,
- validate external input,
- handle loading/empty/error/retry states,
- keep secrets out of client code and git,
- add/update tests for changed behavior,
- run relevant lint/typecheck/tests/build before declaring completion,
- report verification truthfully,
- keep docs synchronized,
- use migrations for database changes after `docs/DATABASE.md` is approved,
- add observability for important failures and core product events,
- fix in-scope verification failures before advancing.

Never:
- claim commands/tests passed when they were not run,
- invent credentials or production data,
- expose Supabase service-role or OpenAI secrets to the mobile bundle,
- weaken auth/RLS/security to make tests pass,
- ship hidden production-critical mocks,
- perform unrelated refactors,
- add dependencies without concrete need,
- use destructive DB changes without rollback strategy,
- silently expand product scope.

## Vertical-slice rule
Before broad feature work, prove one real path with real UI, real persistence/backend, real auth/authorization where applicable, success/failure handling and reproducible verification. A disconnected mock/demo is not a valid vertical slice.

## Mobile / Supabase defaults for this project
- Expo / React Native / TypeScript.
- Supabase Auth/Postgres; RLS on every client-exposed table unless explicitly justified.
- Publishable client key may be bundled; privileged secrets stay server-side.
- AI provider calls occur only from trusted server/Edge Function code.
- Auth bootstrap/refresh and secure token storage must be explicit.
- Minimal native permissions; reminder notifications are opt-in.
- Database changes happen through reviewed migrations.
- Test allow and deny paths for RLS.

## Product-specific safety boundary
This product is a reflection journal, not a clinical system.
- Do not implement diagnosis, mental-health scoring, clinical labels, treatment advice or deterministic personality judgments.
- AI outputs must be grounded in user-provided text, use uncertainty-aware language and distinguish observation from inference.
- User reflections and derived reports are private, sensitive data.

## Quality gates
For coding phases, minimum evidence where applicable:
- typecheck passes,
- lint passes,
- tests pass,
- build/compile passes,
- acceptance criteria verified,
- no known P0/P1 defect in changed scope,
- docs/status updated.

If a command cannot run, mark the gate `PARTIAL` with the exact blocker and continue only with work that remains safe independently.

## Review severity
- P0: security/data-loss/app-unusable/release-blocking.
- P1: major core-flow correctness or authorization failure.
- P2: meaningful UX/performance/maintainability issue.
- P3: polish/low risk.

Fix available P0/P1 issues and rerun the gate before advancing.

## Session-end behavior
If a session ends before beta readiness, leave `docs/PROJECT_STATUS.md` accurate enough that the next agent can resume from the earliest incomplete eligible task without guessing.
