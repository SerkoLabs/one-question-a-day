# AI Development Playbook

This project follows `serkandnc/ai-app-development-playbook` v1.0.0.

## Operating mode

Development is continuous and autonomous after user authorization. Passing a gate advances the project; it is not a reason to stop. Stop only for a genuine external/human blocker defined in `AGENTS.md`.

## Fixed lifecycle

1. IDEA
2. README.md
3. docs/PRODUCT_SPEC.md
4. docs/USER_FLOWS.md
5. docs/ARCHITECTURE.md
6. docs/DATABASE.md
7. docs/IMPLEMENTATION_PLAN.md
8. Foundation
9. App shell/navigation
10. First real end-to-end vertical slice
11. Audit #1
12. Core MVP implementation
13. Audit #2
14. Store/release readiness
15. Beta readiness

## Gate rules

### Planning gates
A planning stage passes only when the next stage can proceed without inventing product behavior or architecture. Architecture and database authorization require independent critical review; when GPT-6 Astra is unavailable, the strongest permitted fallback is used and recorded as `FALLBACK`.

### Coding gates
Where applicable, all of the following must pass before advancing:
- dependency/install verification,
- typecheck,
- lint,
- tests,
- build/bundle/config checks,
- acceptance criteria,
- no unresolved P0/P1 defect,
- synchronized docs/status.

If a command cannot run because of an external environment blocker, mark the gate `PARTIAL`, state the blocker precisely, and continue only with work that remains independently safe.

### Vertical-slice gate
Before broad feature implementation, prove one real path with real UI, persistence/backend, auth/authorization, success/failure handling and reproducible verification. A disconnected mock is not a valid vertical slice.

### Audit severity
- P0: security/data-loss/app-unusable/release-blocking.
- P1: major core-flow correctness or authorization failure.
- P2: meaningful quality/UX/performance/maintainability risk.
- P3: polish/low risk.

Fix available P0/P1 findings and rerun the gate automatically.

### Release gate
Repository-local release work may proceed autonomously. Production deployment, public store submission, paid activation, signing/certificates or other user-owned external actions require explicit authorization/assets.

## Definition of done

A task is done only when its acceptance criteria are met, relevant verification ran, severe findings are resolved, no production-critical placeholder remains, and `docs/PROJECT_STATUS.md` reflects reality. Writing code alone is not completion.
