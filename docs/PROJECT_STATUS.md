# Project Status

Last updated: 2026-09-10

## Lifecycle

| Stage | State | Evidence |
|---|---|---|
| 01 IDEA | PASS | `README.md` |
| 02 README | PASS | approved promise/scope in `README.md` |
| 03 PRODUCT_SPEC | PASS | `docs/PRODUCT_SPEC.md` |
| 04 USER_FLOWS | PASS | `docs/USER_FLOWS.md`; local-first Stage 10 overlay documented |
| 05 ARCHITECTURE | FALLBACK PASS | `docs/ARCHITECTURE.md`, `docs/LOCAL_FIRST_ARCHITECTURE.md` |
| 06 DATABASE | FALLBACK PASS | future Supabase design preserved; secure local schema versioned |
| 07 IMPLEMENTATION_PLAN | PASS | dependency-ordered plan and run reconciliation |
| 08 Foundation | PASS | Expo SDK 57 dependency baseline, committed lockfile, strict TS, lint, Jest, Expo Doctor, CI |
| 09 App shell/navigation | PASS | Welcome, short onboarding, Today, History/detail, reflection preview, settings; web export passes |
| 10 First vertical slice | IMPLEMENTED / DEVICE PARTIAL | launch → onboarding → question → draft → save → reopen → history → next-day engine; device smoke pending |
| 11 Audit #1 | FALLBACK PASS | `docs/reviews/AUDIT_01.md`; three P1 findings fixed; no unresolved P0/P1 |
| 12 Core MVP | STOPPED BY RUN CAP | no broad expansion performed |

## Branch, PR and commits

- Branch: `codex/local-first-vertical-slice-audit`
- Pull request: https://github.com/SerkoLabs/one-question-a-day/pull/1
- `7ce51f0` — local-first Stage 10 implementation.
- `530308d`, `78bb7a3`, `147336c` — exact save and crash-safe persistence corrections.
- `4126844`, `acc1855`, `8741c7d` — Expo SDK 57 / Jest dependency alignment.
- `9a6b90f`, `d40b454` — strict typecheck, lint, tests and Expo Doctor fixes.
- `56bfe88` — generated dependency lockfile committed by CI.

## Working vertical slice

`launch → short introduction → Today → one deterministic local-day question → type → secure draft → manual completion → calm saved state → reopen → same answer → History/detail → next local date selects the next stable question`.

Persisted state includes onboarding, timezone, question-set version, explicit assignments, drafts, saved answers/timestamps, question snapshots, and schema version. Storage uses alternating envelopes with monotonic sequence numbers and a commit pointer; writes recover after a failed predecessor.

## Privacy

- No active journal path calls Supabase, OpenAI, analytics, or `console` with answer text.
- Future Supabase/Auth/RLS artifacts remain version controlled but are not required for this slice.
- GitHub Advanced Security secret scanning is not enabled; manual/source review found no new secret material.

## Verification truth

Passing GitHub Actions evidence on 2026-09-10:
- strict TypeScript: exit 0;
- Expo lint: exit 0;
- unit tests: 3 suites, 14 tests passed;
- Expo Doctor: 21/21 checks passed;
- production web export: passed, 19 static routes;
- dependency graph: installed from committed `package-lock.json` with the documented Expo SDK 57 Jest peer workaround.

Still not verified: Android APK compile/upload and emulator/device process-kill/reopen behavior. The repository now contains an Android preview workflow and installable-debug-APK artifact configuration; its run is the active build attempt.

## Gate and stop

Audit #1 has no unresolved P0/P1. Per the user's cap, broad Stage 12 work is stopped. Remaining evidence gaps are P2: Android artifact result and physical/emulated device persistence checks.

## Stage 14 — store/release readiness (update 2026-09-29)

### Shipped since Audit #1
- **Android APK launch bug fixed.** The `Android Preview APK` workflow built a debug
  APK, which does not embed `index.android.bundle`; on a device without Metro it
  showed the red "Unable to load script" screen. The workflow now builds
  `assembleRelease`, which embeds the JS bundle and assets, so the artifact runs
  standalone. Verified: workflow run 34638640418 produced `app-release.apk`
  (~38.7 MB) from a release build.
- **Gamified, themed UI redesign** (PR #2, merged into
  `codex/local-first-vertical-slice-audit` as merge commit `126d99f`):
  - light/dark design-token system with a `ThemeProvider` (system/light/dark,
    persisted in AsyncStorage);
  - reusable component library (Card, Chip/CategoryChip, StatTile, ProgressBar,
    StreakBadge, animated check/confetti, SectionTitle, Glyph) and reduced-motion
    aware entrance/press animations;
  - non-punitive progress stats (answered days, current/longest run, recent-day
    window, month calendar, category breakdown) with unit tests;
  - every screen restyled (welcome, onboarding, Today, tab bar, Geçmiş,
    Yansımalar reflection dashboard, Ayarlar with a theme switch, entry detail,
    404). Retired auth stubs left untouched.
  - The product's non-clinical, no-AI-analysis promise is preserved and made
    explicit on the reflections screen.

### Verification (local, on merge head `024ea9e` / `126d99f`)
- strict TypeScript `tsc --noEmit`: exit 0;
- Expo lint: exit 0;
- unit tests `test:ci`: 4 suites, 24 tests passed;
- web export smoke `build:smoke`: passed, 19 static routes;
- Android release APK: GitHub Actions `build-apk` success.
- `expo-doctor`: reports a pre-existing dependency patch-version drift in the
  committed lockfile (not introduced by this work); left untouched by explicit
  instruction. It does not gate this branch.

### EAS signed build — prepared, blocked on one owner-side step
`eas.json` now defines `development` / `preview` (signed APK) / `production`
(signed AAB) profiles with remote app-version management and a submit skeleton.
EAS auto-generates and manages the Android keystore, so builds are signed.

**Blocker (user-owned asset, cannot be done headlessly):** no Expo project is
linked to this app yet — `app.json` has no `extra.eas.projectId`/`owner`, and no
Expo MCP tool can create a project (every build/sandbox tool requires an existing
`appId`/`appFullName`). Creating the project needs an authenticated Expo login.

**Next action to produce the signed build (one-time):**
1. `npx eas-cli@latest login` (or `eas whoami` if already logged in).
2. `npx eas-cli@latest init` — creates the Expo project and writes
   `owner` + `extra.eas.projectId` into `app.json`; commit and push.
3. `npx eas-cli@latest build -p android --profile preview` for a signed APK
   (or `--profile production` for a Play Store AAB). EAS provisions the keystore
   automatically on the first build.

Once `app.json` carries the project id, the signed build can also be triggered
through the Expo integration without the CLI.
