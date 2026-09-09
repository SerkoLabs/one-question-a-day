# Local-first preview architecture

Status: accepted Stage 10 overlay. The future authenticated Supabase design in `ARCHITECTURE.md` and `DATABASE.md` remains the Core MVP target; this document is authoritative for the first installable vertical slice.

## Boundary

The preview intentionally needs no account or live backend. `LocalJournalProvider` owns app state and `localJournalRepository` persists it through chunked Expo SecureStore. No answer, draft, question text, or derived theme is sent to Supabase, analytics, logs, or AI.

## Persisted model

`LocalJournalState` contains:
- `schemaVersion` (currently 1),
- stable device-local `profileId`, locale and IANA timezone,
- onboarding completion,
- `questionSetVersion`,
- date-to-question assignments,
- date-keyed drafts,
- saved answers with immutable question-text/version snapshots,
- last observed local date.

The repository uses two secure-storage slots and a separate active pointer. A new snapshot is written completely to the inactive slot before the pointer flips. On malformed JSON, unknown schema, or incomplete active-slot write, load falls back to the previous slot. Writes are serialized to prevent older keystrokes from overwriting newer state.

## Daily-question contract

`localDateFor()` derives `YYYY-MM-DD` through `Intl.DateTimeFormat` with the stored IANA timezone; it does not rely on a background timer. The app refreshes on foreground.

Eligible active questions are put into a stable per-profile, per-question-set permutation using a deterministic FNV-1a hash. The absolute local-day ordinal selects a position. Therefore:
- the same profile + set version + local date always selects the same question;
- all questions appear once before a preview-cycle repeat;
- an explicit persisted assignment wins forever for that date;
- timezone travel cannot rewrite an existing date assignment;
- a next local day chooses the next position without changing history.

The preview library is deliberately small and curated. It uses structured fields for category, depth, eligibility, active state, content version, follow-up metadata, and safety flags.

## Draft and answer safety

Every text change creates a serialized secure snapshot. Manual completion writes the exact editor body supplied by the button action, then clears only that date's draft after the answer object exists. Answer history snapshots its question text and set version so later content changes cannot silently rewrite old entries.

SecureStore is a device security boundary, not cloud backup. Android uninstall normally removes app storage; iOS Keychain behavior may survive reinstall depending on platform policy. Reinstall/cross-device restoration requires the future explicit encrypted sync/export design and is not claimed by this preview.

## Migration and corruption behavior

Unknown schema versions fail closed to a clean state; malformed active snapshots fall back to the previous valid slot. Future schema upgrades must add explicit migrations and fixtures before incrementing `LOCAL_SCHEMA_VERSION`. Journal preservation takes priority over convenience.

## UI and accessibility

The launch path is `Welcome → one-screen introduction → Today`. Today presents one question, one multiline editor, and one completion action. History shows date, question, and answer; detail permits editing. Core controls have accessibility roles/labels, text scales by default, screens scroll, and the editor is keyboard-aware.

## Future sync contract

The local domain must remain independent of Supabase. A later sync adapter may map stable local answers to authenticated rows, but it must provide encryption/consent, conflict rules, export/deletion, RLS evidence, and idempotent migration. It must never silently send existing local journal text to a third party.
