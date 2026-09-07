# Database / Authorization Gate Review

- Date: 2026-09-07
- Required reviewer: GPT-6 Astra
- Actual reviewer: GPT-5.6 Sol
- Gate mode: **FALLBACK**
- Artifact: `docs/DATABASE.md`

## Result

**FALLBACK PASS — no unresolved P0/P1 ownership or authorization finding.**

The design now has explicit RLS/grants, server-derived user identity/date invariants, server-only writes for sensitive derived data, and composite ownership constraints that prevent cross-user analysis/report-source rows even if trusted code makes an ownership-mapping mistake.

## Review checks

### Ownership
- `profiles.id = auth.uid()`: PASS.
- responses owner-scoped and daily identity server-derived: PASS.
- analysis ownership tied to response ownership with composite FK: PASS.
- report evidence tied to report and response owner with composite FKs: PASS.
- export/deletion target derived from verified identity, not arbitrary `user_id`: PASS.

### Client privilege
- global questions are authenticated read-only: PASS.
- raw responses owner read/write only within immutable invariants: PASS.
- analyses/reports/jobs/exports are client read-only to owner: PASS.
- analytics is insert-only and has no arbitrary text/JSON payload: PASS.
- service-role/OpenAI secrets remain trusted-server only: PASS.

### Deletion
- Auth-user cascade removes relational private data: PASS.
- Storage export objects require explicit trusted cleanup before Auth deletion: PASS.
- private journal data does not use indefinite soft delete: PASS.

### AI privacy boundary
- consent is required and re-checked before provider calls: PASS at design level.
- stale source revisions invalidate analysis/report currency: PASS.
- report evidence is normalized into an owner-safe manifest: PASS.

## P2 implementation requirements

### P2-DB-001 — Explicit default-privilege cleanup
Migrations must begin from least privilege: revoke broad table/function grants that may exist by default and then grant only the documented operations. RLS alone is not the complete permission model.

### P2-DB-002 — `SECURITY DEFINER` hardening must be tested
Every security-definer function must set a safe search path, derive caller from `auth.uid()`, and have tests proving a different authenticated user cannot target another profile/row.

### P2-DB-003 — Response trigger concurrency
Two devices saving the same day may race; the unique constraints must be treated as canonical and client mutation code must convert unique-violation behavior into refetch/reconciliation rather than a generic destructive error.

### P2-DB-004 — Storage cleanup is not transactional with Auth deletion
`delete-account` must be an idempotent state machine: delete export objects, delete application/Auth data only after successful prerequisites, and never claim success on partial failure.

## Gate decision

Stage 06 may advance to `docs/IMPLEMENTATION_PLAN.md`. P2 items above must be explicit implementation acceptance criteria/tests.
