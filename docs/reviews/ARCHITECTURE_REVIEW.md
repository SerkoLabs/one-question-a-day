# Architecture Gate Review

- Date: 2026-09-07
- Required reviewer: GPT-6 Astra
- Actual reviewer: GPT-5.6 Sol
- Gate mode: **FALLBACK** (preferred reviewer unavailable in this runtime)
- Artifacts reviewed: `README.md`, `docs/PRODUCT_SPEC.md`, `docs/USER_FLOWS.md`, `docs/ARCHITECTURE.md`

## Result

**FALLBACK PASS — no unresolved P0/P1 architecture finding.**

The architecture is coherent for the MVP: Expo mobile client, Supabase Auth/Postgres/RLS, bounded Edge Functions for privileged/AI operations, and stateless OpenAI processing. The first vertical slice can be implemented without inventing a new system boundary.

## Findings

### P2-ARCH-001 — Daily-date invariants must be server enforced
Client-provided `local_date`, `day_index`, `question_id` or `user_id` cannot be authoritative. `docs/DATABASE.md` must specify trigger/function constraints that derive or validate the daily identity from `auth.uid()`, profile timezone and journey start, and must make ownership/date/question identity immutable after insert.

**Disposition:** required in Stage 06; not a Stage 05 blocker because the architecture already assigns this responsibility to Postgres.

### P2-ARCH-002 — Analytics payload must not permit arbitrary free text
A generic client-writeable `jsonb` analytics payload could accidentally or intentionally contain journal text. Database design should use an allowlisted event type and bounded typed metadata, or a validating server/RPC boundary.

**Disposition:** required in Stage 06.

### P2-ARCH-003 — Auth persistence adapter must follow current supported Expo/Supabase behavior
The implementation should not assume SecureStore can safely hold arbitrarily large serialized sessions. Phase 0 must select/test the current supported React Native adapter from official Supabase/Expo documentation and document any size/encryption trade-off.

**Disposition:** Phase 0 verification item.

### P2-ARCH-004 — Timezone changes need deterministic semantics
The product allows profile timezone changes, so Stage 06 must define how a timezone change affects the current `local_date` without rewriting historical response dates. Historical `local_date` values must remain immutable.

**Disposition:** database/product invariant; not P0/P1.

### P2-ARCH-005 — Long-report execution must remain bounded
Supabase Edge Functions are appropriate for small AI orchestration, but annual synthesis must use hierarchical summaries and bounded provider calls. If measured runtime exceeds platform constraints, a worker architecture can be introduced only with evidence and approval.

**Disposition:** architecture already states this; verify in report implementation tests.

## Security/privacy review summary

- Privileged keys remain server-side: PASS.
- Client authorization relies on RLS + grants, not key secrecy: PASS.
- AI provider receives minimized content with explicit consent: PASS.
- `store:false` is not misrepresented as zero retention: PASS.
- Raw journal content excluded from analytics/logs: PASS subject to P2-ARCH-002 implementation.
- Export/delete are server-authorized and owner-derived: PASS.

## Gate decision

Stage 05 may advance to DATABASE design. All P2 items above must be reflected in `docs/DATABASE.md` / implementation tasks before coding the affected behavior.
