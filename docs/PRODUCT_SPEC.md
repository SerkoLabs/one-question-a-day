# Product Specification

## 1. Product summary

**One Question a Day** is a private mobile reflection journal built around one deliberate action: answer one curated question per local calendar day. The product converts repeated low-effort reflection into a longitudinal record and, with explicit user consent, produces non-clinical AI summaries that show recurring themes and changes over time.

The product must behave as a **thinking mirror**, not as a therapist, mental-health evaluator or personality test.

## 2. Primary user

Adults who want to understand how their priorities, relationships, fears, values and view of life change over time but do not sustain open-ended daily journaling.

Primary job to be done:
> “I want a small daily reflection habit that eventually shows me patterns and changes I would not reliably notice from memory alone.”

## 3. Product principles

1. **One question means one question.** No feed of prompts and no pressure to answer more.
2. **Low effort daily, high value over time.** The long-term comparison is the reward.
3. **Evidence before interpretation.** Reports should trace claims back to the user’s own entries.
4. **No clinical authority.** Never diagnose, score mental health, prescribe treatment or assert deterministic personality traits.
5. **Privacy by default.** Entries and derived analysis are private to the owner.
6. **No punishment for absence.** Missed days remain missed; the app does not shame the user or destroy a streak.
7. **Uncertainty is visible.** Sparse data produces cautious language or an insufficient-data state.
8. **The user owns the record.** Export and account deletion are first-class product behaviors.

## 4. MVP scope

- Email/password authentication and session recovery.
- First-run profile setup: timezone, optional reminder, AI-analysis consent.
- A curated 365-day question journey.
- One active question per user-local calendar day.
- Text answer create/edit/view.
- History and calendar/completion view.
- Non-punitive progress count.
- AI-derived neutral per-entry signals used only for longitudinal reporting.
- Monthly report.
- Six-month report.
- Annual report / personal portrait.
- Pre-authored comparison question groups that enable “Past You” side-by-side comparison.
- Optional local notification reminder.
- Data export and account deletion.

## 5. Non-goals

- Therapy or diagnosis.
- Free-form AI chat.
- Crisis triage or clinical risk scoring.
- Social features or public sharing.
- Voice/video/photo journaling.
- Payment/subscription.
- Public web journal.
- Admin dashboard in beta.
- Dynamic AI-generated daily questions in beta.
- More than one active prompt per local day.
- Automatic recovery/backfill of missed daily prompts.
- Product behavior beyond the first 365-day journey; a second-year content strategy is post-beta.

---

## 6. Feature specifications

### F-001 — Account creation, sign-in and first-run setup

- **User goal:** create a private account and configure the daily reflection experience.
- **Trigger:** first app launch or signed-out state.
- **Preconditions:** network connection for account operations.
- **Happy path:**
  1. User signs up with email and password.
  2. Email is validated according to configured Supabase Auth policy.
  3. App creates/loads the profile.
  4. User confirms detected IANA timezone or selects another.
  5. User chooses whether to enable a local daily reminder and time.
  6. User is shown a concise explanation of AI analysis and third-party processing and explicitly accepts or declines it.
  7. `journey_started_on` is set to the user's local date only after onboarding completes.
  8. User enters the Today screen.
- **Alternate paths:** existing user signs in; user declines notifications; user declines AI analysis and can still journal, but AI reports are unavailable.
- **Validation:** normalized email; password rules delegated to configured Auth policy; timezone must be a supported IANA identifier; reminder time must be valid local time.
- **Permissions:** unauthenticated user may use only auth flows; authenticated user may access only own profile/data.
- **Loading:** auth actions show blocking progress and prevent duplicate submission.
- **Empty:** not applicable.
- **Error/retry:** invalid credentials, duplicate email, network failure and expired session receive actionable messages without exposing internal errors.
- **Offline/degraded:** sign-up/sign-in/onboarding completion require network.
- **Analytics:** `signup_started`, `signup_completed`, `onboarding_completed`, `ai_consent_changed`, `reminder_preference_changed`; never include journal text.
- **Acceptance criteria:**
  - [ ] A new user can reach Today after completing onboarding.
  - [ ] An existing user can sign in and resume the same journey/profile.
  - [ ] Declining AI consent does not block journaling.
  - [ ] No other user’s profile or journal data can be read or modified.
  - [ ] The app handles expired sessions without exposing protected content.
- **Out of scope:** social login, anonymous accounts, family accounts.

### F-002 — Daily question assignment

- **User goal:** see exactly one relevant question for today.
- **Trigger:** opening Today while authenticated and onboarded.
- **Preconditions:** `journey_started_on` and timezone exist; question bank contains the required `day_index`.
- **Happy path:**
  1. App determines user-local date.
  2. `day_index = local_date - journey_started_on + 1`.
  3. For days 1–365, the matching active question is loaded.
  4. If today already has an answer, the saved answer is shown in editable/read state.
- **Alternate paths:** day before journey start is impossible after valid onboarding; after day 365, the journey-complete state is shown rather than silently wrapping.
- **Validation:** one active question per `day_index`; question content is immutable for entries already answered except through explicit content migration/versioning.
- **Permissions:** authenticated users can read active question content; question management is not exposed to clients.
- **Loading:** skeleton/card placeholder.
- **Empty:** if question data is unavailable for a valid day, show recoverable content error and log it; do not invent a prompt.
- **Error/retry:** retry fetch; cached non-sensitive question text may be displayed if available.
- **Offline/degraded:** previously cached question may be read; answer submission requires network in MVP.
- **Analytics:** `today_opened`, `question_viewed` with question ID/category/day index only.
- **Acceptance criteria:**
  - [ ] A user sees at most one active question for a local calendar date.
  - [ ] Timezone changes do not create duplicate answers for the same existing local date.
  - [ ] Missing question data fails visibly rather than selecting a random replacement.
  - [ ] Day 366+ has a defined journey-complete state.
- **Out of scope:** AI-generated prompts, user-selected alternate prompts, prompt backfill.

### F-003 — Write, save and edit a daily answer

- **User goal:** record today’s reflection privately.
- **Trigger:** user focuses the answer field on Today.
- **Preconditions:** authenticated, valid current daily question.
- **Happy path:**
  1. User writes plain text.
  2. Client validates length and non-whitespace content.
  3. Save creates the unique answer for `(user_id, local_date)`.
  4. UI confirms saved state.
  5. User can edit later; `updated_at` changes while the original `created_at` remains.
- **Alternate paths:** user abandons text before save; an existing answer is edited.
- **Validation:** trim surrounding whitespace; minimum 1 non-whitespace character; maximum 10,000 Unicode characters for beta.
- **Permissions:** only answer owner can select/insert/update/delete.
- **Loading:** save button enters pending state and duplicate writes are prevented.
- **Empty:** blank answer is not persisted.
- **Error/retry:** failed save keeps the in-memory draft while the screen remains mounted and offers retry.
- **Offline/degraded:** no persistent offline journal draft in beta; if network is absent, show that save requires connection. Do not write raw reflection text into unencrypted AsyncStorage.
- **Analytics:** `answer_save_started`, `answer_saved`, `answer_save_failed`, `answer_edited`; event payload excludes answer text and derived themes.
- **Acceptance criteria:**
  - [ ] One answer maximum exists per user/local date.
  - [ ] Saved answer survives app restart/re-authentication.
  - [ ] Another authenticated user cannot read or change it.
  - [ ] Network failure does not falsely display “saved”.
  - [ ] 10,000-character limit is enforced client- and server/database-side.
- **Out of scope:** rich text, attachments, voice, offline sync queue.

### F-004 — History, calendar and progress

- **User goal:** revisit prior reflections and see consistency without streak pressure.
- **Trigger:** user opens Journey/History.
- **Preconditions:** authenticated.
- **Happy path:** calendar marks answered dates; summary shows `answered_days / elapsed_journey_days`; selecting an answered date opens its question and answer.
- **Alternate paths:** selecting a missed day shows “Bu gün cevap vermedin” and does not allow retroactive answer creation in beta.
- **Validation:** counts derive from persisted answers, not client counters.
- **Permissions:** owner-only answer access.
- **Loading:** paginated history skeleton.
- **Empty:** new user sees a helpful first-answer state.
- **Error/retry:** history fetch can retry without blocking Today.
- **Offline/degraded:** no guarantee for uncached history.
- **Analytics:** `history_opened`, `history_entry_opened`; no content.
- **Acceptance criteria:**
  - [ ] Answered and missed days are visually distinguishable.
  - [ ] No “broken streak” punishment language appears.
  - [ ] History cannot reveal another user’s data.
- **Out of scope:** search across journal text, tagging, favorites.

### F-005 — AI analysis consent and structured per-entry analysis

- **User goal:** allow the product to transform entries into useful longitudinal signals without clinical claims.
- **Trigger:** after a saved answer when AI consent is active; reprocessing may occur after an answer edit.
- **Preconditions:** explicit AI consent, authenticated request, saved answer.
- **Happy path:** trusted backend sends the minimum needed question + answer text to OpenAI; receives strict structured output; validates schema; stores owner-scoped derived analysis.
- **Required structured concepts:** broad themes, values/priority signals, life domains, neutral affect words only when explicit or strongly evidenced, short evidence fragments/response references, confidence per signal.
- **Forbidden output concepts:** diagnosis, disorder labels, clinical risk scores, attachment-style diagnosis, treatment advice, deterministic personality judgments, claims about other people’s intent.
- **Alternate paths:** consent disabled → no new AI processing; answer edited → previous derived record becomes stale and is regenerated.
- **Validation:** schema validation server-side; allowlisted taxonomy where feasible; evidence references must map to source entry.
- **Permissions:** raw answer and derived analysis owner-only; OpenAI secret server-side only.
- **Loading:** analysis is asynchronous from the user’s save confirmation; journaling never waits on AI.
- **Empty:** no AI analysis when answer is too short to support meaningful signals; mark `insufficient_input`.
- **Error/retry:** bounded retries with idempotency; failure does not alter raw answer.
- **Offline/degraded:** processing waits until backend invocation is possible.
- **Analytics:** job state/timing and model metadata only; never journal text.
- **Acceptance criteria:**
  - [ ] No AI call occurs when consent is false.
  - [ ] OpenAI API key never appears in the mobile bundle or client-visible database data.
  - [ ] Output is rejected if it fails the expected JSON schema.
  - [ ] Analysis records can be deleted with the owning account.
  - [ ] Reprocessing an edited answer is idempotent and does not create duplicate active analyses.
- **Out of scope:** chatbot response, therapeutic advice, hidden psychological profiling.

### F-006 — Monthly “Bu ay nasıldın?” report

- **User goal:** understand recurring topics and meaningful movement during a completed month.
- **Trigger:** user opens Reports after a calendar month closes, or generation job marks a report ready.
- **Preconditions:** AI consent active; at least 8 eligible answers in the completed user-local month.
- **Happy path:** report shows response count, recurring themes, notable domains/values, cautious month-internal change observations, selected short quotes from the user’s own entries, and links back to cited entries.
- **Alternate paths:** fewer than 8 answers → “yeterli veri yok” state with count, no speculative AI report.
- **Validation:** every material qualitative claim must reference one or more source response IDs; quotes must exactly match source text and remain short.
- **Permissions:** owner-only.
- **Loading:** report generation status with non-blocking progress.
- **Empty:** insufficient-data state is a valid terminal result.
- **Error/retry:** failed generation can be retried idempotently.
- **Offline/degraded:** previously loaded report may be viewed from safe cache only if implementation provides encrypted storage; otherwise network required.
- **Analytics:** `monthly_report_eligible`, `monthly_report_opened`, `monthly_report_feedback` (helpful/not helpful), generation latency/failure.
- **Acceptance criteria:**
  - [ ] No report is generated for a month below the minimum data threshold.
  - [ ] Report language avoids diagnosis and certainty beyond evidence.
  - [ ] Claims can be traced to source entries.
  - [ ] A report cannot include another user’s data.
- **Out of scope:** clinician-facing report, PDF export in beta.

### F-007 — Six-month and annual longitudinal reports

- **User goal:** see how priorities and recurring themes changed over a longer period.
- **Trigger:** user becomes eligible and opens the corresponding report.
- **Preconditions:** AI consent active.
- **Eligibility:**
  - Six-month: first six journey months elapsed, at least 40 eligible answers spanning at least 3 distinct months.
  - Annual: 365 journey days elapsed, at least 80 eligible answers spanning at least 6 distinct months.
- **Happy path:** hierarchical synthesis uses validated per-entry analysis and completed monthly aggregates, with selected raw-entry evidence for verification. Report compares early vs late periods, highlights repeated/strengthening/declining themes and stable values, and provides source-linked examples.
- **Alternate paths:** insufficient data → explicit insufficient-data state; no fabricated “year portrait”.
- **Validation:** no unsupported causal claims; no clinical inference; source references required.
- **Permissions:** owner-only.
- **Loading:** asynchronous job with durable state.
- **Empty/error/retry/offline:** same principles as monthly reports.
- **Analytics:** eligibility/open/helpfulness and generation health only.
- **Acceptance criteria:**
  - [ ] Six-month and annual thresholds are enforced server-side.
  - [ ] Annual comparison distinguishes observation (“X appeared more often”) from inference (“may suggest…”).
  - [ ] Long reports remain traceable to user entries/period summaries.
  - [ ] Regeneration after source edits does not create conflicting active versions.
- **Out of scope:** cross-user benchmarking, normative mental-health scores.

### F-008 — “Geçmişteki Sen” comparison

- **User goal:** directly compare how they answer the same underlying question at different times.
- **Trigger:** user answers a later question whose `comparison_group_key` matches an earlier answered question.
- **Preconditions:** at least two answered questions in the same comparison group.
- **Happy path:** after saving the later answer, app offers a comparison card showing both dates, both questions (normally identical/semantically paired), both user answers and an optional neutral AI difference summary if consent is active.
- **Alternate paths:** earlier question was missed → no comparison card.
- **Validation:** comparison only uses entries owned by current user and same comparison group.
- **Permissions:** owner-only.
- **Loading/error:** raw side-by-side comparison remains available even if optional AI difference summary fails.
- **Offline/degraded:** requires previously fetched entries; otherwise network.
- **Analytics:** `past_you_available`, `past_you_opened`; no content.
- **Acceptance criteria:**
  - [ ] Comparison never pairs unrelated users or unrelated question groups.
  - [ ] Raw prior/current answers are primary; AI summary is secondary and optional.
- **Out of scope:** arbitrary semantic search for “similar” entries in beta.

### F-009 — Optional daily reminder

- **User goal:** remember the daily reflection without feeling punished.
- **Trigger:** user opts in during onboarding or Settings.
- **Preconditions:** OS notification permission and valid local reminder time.
- **Happy path:** one local notification is scheduled for the chosen local time; opening it routes to Today.
- **Alternate paths:** permission denied → explain how to enable later; user disables reminder → pending app-owned reminders are canceled.
- **Validation:** at most one routine daily reminder schedule.
- **Permissions:** request OS notification permission only after user expresses intent.
- **Loading/error:** scheduling failure is visible in Settings but does not affect journaling.
- **Offline/degraded:** local scheduling works without backend once configured.
- **Analytics:** preference/permission state changes only.
- **Acceptance criteria:**
  - [ ] App does not request notification permission before the user opts into reminders.
  - [ ] Disabling reminders cancels app-created reminder schedule.
  - [ ] Notification copy avoids streak-loss/scare language.
- **Out of scope:** server push campaigns, re-engagement marketing.

### F-010 — Export and account deletion

- **User goal:** retain control over personal journal data.
- **Trigger:** Settings → Data & Privacy.
- **Preconditions:** authenticated; recent re-authentication may be required for deletion.
- **Happy path export:** backend produces a user-owned export containing profile settings, questions referenced by entries, raw entries and user-visible reports in a documented machine-readable format; user receives a time-limited authenticated download path or equivalent secure delivery.
- **Happy path deletion:** user sees consequences, confirms, server-side deletion removes/cascades owned rows and revokes account/session according to implementation; completion is irreversible.
- **Alternate paths:** generation/deletion failure displays safe retry/support path.
- **Validation:** export may contain only current user data; deletion is idempotent.
- **Permissions:** privileged server operation; never client-controlled service-role access.
- **Loading:** destructive action shows durable progress and prevents duplicate taps.
- **Empty:** export with no entries is valid.
- **Error/retry:** failed deletion must not claim success; retry is safe.
- **Offline/degraded:** network required.
- **Analytics:** export/deletion lifecycle events without content.
- **Acceptance criteria:**
  - [ ] Export cannot include another user’s records.
  - [ ] Deletion removes raw entries and derived analyses/reports owned by the user.
  - [ ] User cannot continue using a deleted account/session as if deletion succeeded partially.
- **Out of scope:** selective deletion by AI theme, shared account transfer.

---

## 7. Cross-cutting behavior

### Onboarding
Keep onboarding to essential configuration only. Do not collect demographic information merely because it may be interesting for analysis.

### Account lifecycle
Signed-out → sign-up/sign-in → onboarding → active journey → optional export → deletion. Session expiration routes to auth without leaking previously visible protected content to a new user.

### Accessibility
- Dynamic text scaling supported for core reading/writing screens.
- Screen-reader labels for controls and report visual indicators.
- Color is not the only indicator for answered/missed/report state.
- Minimum touch target guidelines respected.

### Localization
Turkish-first beta, but all UI strings and question content use locale-aware structures. Dates display in user locale while server ownership/time boundaries use explicit timezone/date values.

### Notifications
Local reminder only in MVP; optional and non-punitive.

### Privacy
Raw reflections, per-entry AI analysis and reports are classified as private sensitive content. Analytics must never contain reflection text, quotes, derived themes, email or free-text payloads.

### Moderation / safety
There is no user-to-user content. The AI system must not transform the app into a diagnostic/therapeutic product. Safety and privacy copy must state that generated reports can be incomplete or wrong and should be treated as reflection aids.

### Payments
N/A for MVP.

### Account deletion/export
Required before beta release; implemented server-side with owner-scoped authorization and audit-safe operational logging that excludes journal content.

### Admin/support
No admin UI. Operational troubleshooting should rely on non-content metadata such as job IDs, timestamps, status codes and user-provided support references.

## 8. Product risks

1. **Sparse-data overclaiming:** reports can sound authoritative despite low evidence. Mitigation: eligibility thresholds, confidence/evidence links and insufficient-data states.
2. **Privacy:** journals may contain highly sensitive personal information. Mitigation: RLS, minimal analytics, server-side secrets, explicit AI consent, deletion/export.
3. **AI hallucination:** model may invent motives or unsupported changes. Mitigation: structured schemas, forbidden claims, source IDs, conservative prompts and post-validation.
4. **Habit fatigue:** questions may feel repetitive/heavy. Mitigation: curated category/depth pacing in the 365 sequence.
5. **Timezone edge cases:** travel/timezone changes can create ambiguity. Mitigation: persisted local date per answer and server-enforced uniqueness; journey calculations use stored profile timezone.
6. **Third-party processing:** OpenAI/Supabase policies and data retention must be accurately disclosed at release time.

## 9. Open decisions

No decision currently blocks planning. The following are deliberately deferred to their later gates:
- Final product/brand name.
- Exact visual design system.
- Final 365-question editorial content and ordering (must be complete before beta).
- Production Supabase project identity/region and OpenAI project/key, which require user-owned external assets.
- Second-year journey behavior after day 365.
- Monetization after beta validation.
