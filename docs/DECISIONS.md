# Decisions

## ADR-001 — Mobile stack
**Status:** accepted — 2026-09-07

Use Expo SDK 57 / React Native / TypeScript with Expo Router. Supabase provides Auth/Postgres/RLS/Edge Functions/Storage. OpenAI is called only from trusted server code.

Reason: matches approved product constraints, minimizes custom backend surface, and supports one secure vertical slice before broad feature work.

## ADR-002 — Deterministic 365-day prompt journey
**Status:** accepted

Daily prompts are curated product content indexed 1..365. The app does not generate a new prompt dynamically with AI and does not backfill missed days in beta.

Reason: consistent user experience, editorial control and deterministic comparison/report behavior.

## ADR-003 — AI is longitudinal analysis, not a therapist
**Status:** accepted

AI may extract evidence-grounded themes and synthesize period comparisons only after explicit consent. Diagnosis, clinical scoring, treatment advice and deterministic personality judgments are forbidden.

## ADR-004 — No vector database in MVP
**Status:** accepted

“Past You” comparisons use explicit `comparison_group_key` relationships. Long reports use structured per-entry/monthly summaries plus evidence manifests.

Reason: deterministic behavior is simpler, cheaper and easier to authorize/test; semantic retrieval is not required for the approved MVP.

## ADR-005 — Sensitive offline storage
**Status:** accepted

Raw unsaved journal drafts are memory-only in beta. The application must not persist raw reflections in generic unencrypted AsyncStorage.

Auth-session persistence may use a provider-supported secure mobile adapter; exact implementation is verified against current Expo/Supabase guidance during Phase 0.

## ADR-006 — Remote/client state
**Status:** accepted

TanStack Query owns server state/cache. Local React state / React Hook Form owns screen forms. Zustand is not introduced until a concrete cross-screen client-state need exists.

Reason: avoid an unused state layer while preserving a clear extension point.

## ADR-007 — Report data thresholds
**Status:** accepted for beta

- monthly: completed month + at least 8 eligible responses,
- six-month: six journey months + at least 40 responses across at least 3 months,
- annual: 365 days + at least 80 responses across at least 6 months.

Below threshold, show insufficient data rather than generate a speculative portrait.
