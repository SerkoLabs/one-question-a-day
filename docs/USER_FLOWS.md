# User Flows

## Screen/state inventory

| ID | Screen/state | Purpose | Entry points | Exit points |
|---|---|---|---|---|
| S-001 | Launch / session bootstrap | Restore session and decide route | App launch | Auth, onboarding, Today |
| S-002 | Sign in | Existing account access | Launch, expired session | Onboarding or Today |
| S-003 | Sign up | New account creation | Auth entry | Onboarding |
| S-004 | Password recovery | Restore account access | Sign in | Sign in / authenticated app |
| S-005 | Onboarding — timezone | Establish local-day boundary | New account | Reminder setup |
| S-006 | Onboarding — reminder | Optional local reminder intent | Timezone | AI consent |
| S-007 | Onboarding — AI consent | Explicitly authorize/decline third-party AI analysis | Reminder setup | Today |
| S-008 | Today — loading | Load current prompt/answer | App shell, tab, notification | Today ready/error |
| S-009 | Today — unanswered | Show the single daily question and editor | Today loading | Saved/error |
| S-010 | Today — answered | Show/edit saved answer | Today loading/save | Edit, History |
| S-011 | Today — question error | Recover missing/fetch failure | Today loading | Retry |
| S-012 | Journey / calendar | Show answered/missed days and progress | Main navigation | Entry detail |
| S-013 | Historical entry detail | Read/edit eligible saved answer | Journey | Journey |
| S-014 | Missed-day detail | Explain no answer exists | Journey | Journey |
| S-015 | Reports index | Show eligibility/status for month/6m/year | Main navigation | Report detail |
| S-016 | Report generating | Durable progress/retry | Reports | Report ready/error |
| S-017 | Report insufficient data | Explain threshold without speculation | Reports | Reports/Today |
| S-018 | Monthly report | Present evidence-linked monthly reflection | Reports | Source entry, feedback |
| S-019 | 6-month report | Present longitudinal changes | Reports | Source entry, feedback |
| S-020 | Annual report | Present yearly personal portrait | Reports | Source entry, feedback |
| S-021 | Past You available card | Invite direct comparison | Today after eligible save | Comparison detail |
| S-022 | Past You comparison | Side-by-side old/current answers | Card / Journey | Source entries |
| S-023 | Settings | Account, reminder, AI, privacy controls | Main navigation | Sub-settings/sign out |
| S-024 | Data & Privacy | Explain data handling/export/delete | Settings | Export/delete |
| S-025 | Export status | Generate/download private export | Data & Privacy | Completed/error |
| S-026 | Delete confirmation | Confirm irreversible deletion | Data & Privacy | Deleting/cancel |
| S-027 | Account deleting | Durable destructive operation state | Confirmation | Signed out/error |
| S-028 | Offline/network unavailable | Explain degraded behavior | Any network action | Retry/cached safe state |
| S-029 | Journey complete | Day 366+ state and annual report path | Today | Annual report/history |

---

## UF-001 — First launch and new account

- **User intent:** start a private reflection journey.
- **Starting state:** app installed, no valid session.
- **Preconditions:** network available for account creation.

```text
Launch
  → Restore session
      ├─ Valid session + onboarding complete → Today
      ├─ Valid session + onboarding incomplete → Resume onboarding
      └─ No valid session → Auth entry
                            → Sign up
                            → Submit valid email/password
                                ├─ Auth error → Explain + retry
                                └─ Account created → Timezone
                                                      → Reminder intent
                                                          ├─ Opt in → request OS permission
                                                          │             ├─ granted → choose time
                                                          │             └─ denied → continue with reminder off
                                                          └─ Skip
                                                      → AI analysis explanation
                                                          ├─ Accept → consent=true
                                                          └─ Decline → consent=false
                                                      → Commit onboarding + journey_started_on
                                                      → Today
```

### Error/recovery branches
- Network loss before onboarding completion: preserve only non-sensitive setup state if safe; resume after reconnect.
- Duplicate email: route to sign-in guidance.
- Notification permission denied: onboarding continues; Settings later shows how to re-enable.
- AI consent declined: Today works normally; Reports explains that analysis is off.

### Analytics checkpoints
`app_opened`, `signup_started`, `signup_completed`, `onboarding_completed`, `ai_consent_changed`, `reminder_preference_changed`.

### Related acceptance criteria
F-001, F-009.

---

## UF-002 — Returning user / session bootstrap

- **User intent:** resume without repeated setup.
- **Starting state:** launch with cached auth session metadata.
- **Preconditions:** none.

```text
Launch
  → Secure session bootstrap
      ├─ session refresh succeeds → load profile
      │      ├─ onboarding complete → Today
      │      └─ incomplete → resume onboarding
      ├─ no session → Sign in
      └─ refresh/network failure
             ├─ known expired/invalid → Sign in
             └─ temporary network issue → protected offline/error state + retry
```

### Error/recovery branches
Protected data from a previous session must not become visible to a newly signed-in different user. Temporary network failure must not be reported as invalid credentials.

### Analytics checkpoints
`session_restored`, `session_refresh_failed` using non-sensitive error classification.

### Related acceptance criteria
F-001.

---

## UF-003 — Answer today’s question

- **User intent:** complete today’s reflection.
- **Starting state:** authenticated, onboarded user on Today.
- **Preconditions:** day 1–365 and matching question exists.

```text
Today loading
  → Determine user-local date and journey day
      ├─ day 1..365 → Fetch question + today's answer
      │      ├─ unanswered → Show one question + editor
      │      │                → Type answer
      │      │                → Save
      │      │                    ├─ validation fail → inline correction
      │      │                    ├─ network/server fail → keep in-memory text + retry
      │      │                    └─ success → answered state
      │      │                                  → optional AI analysis queued if consent=true
      │      │                                  → Past You card if comparison eligible
      │      └─ answered → Show saved answer → optional Edit → Save
      ├─ day >365 → Journey complete
      └─ question missing → Content error + retry/support log
```

### Error/recovery branches
- Offline before question fetch: show offline state unless non-sensitive prompt is cached.
- Offline while typing: keep draft in memory while screen remains mounted; no false save state.
- Concurrent save on two devices: database uniqueness/updated-at policy resolves to one row; client refetches canonical state.

### Analytics checkpoints
`today_opened`, `question_viewed`, `answer_save_started`, `answer_saved`, `answer_save_failed`, `answer_edited`.

### Related acceptance criteria
F-002, F-003, F-005, F-008.

---

## UF-004 — Review journey history

- **User intent:** revisit previous answers and see answered/missed days.
- **Starting state:** authenticated, main app shell.
- **Preconditions:** onboarding complete.

```text
Open Journey
  → Load elapsed dates + answer presence
      ├─ no answers → encouraging empty state → Today
      └─ calendar/list ready
             → Select date
                 ├─ answered → Historical entry detail
                 │               → read
                 │               → optional edit existing answer
                 └─ missed → Missed-day detail
                              → no retroactive answer action
```

### Error/recovery branches
History failure is isolated from Today; retry does not clear cached UI state.

### Analytics checkpoints
`history_opened`, `history_entry_opened`.

### Related acceptance criteria
F-003, F-004.

---

## UF-005 — Generate/open a monthly report

- **User intent:** understand the completed month.
- **Starting state:** Reports index.
- **Preconditions:** AI consent state known; target month ended.

```text
Open Reports
  → Evaluate month
      ├─ AI consent=false → Analysis-disabled explanation → Settings toggle path
      ├─ eligible answers < 8 → Insufficient-data state
      └─ eligible answers >= 8
             → Existing current report?
                 ├─ ready + sources unchanged → Open report
                 ├─ generating → Generation status
                 └─ missing/stale → Request idempotent generation
                                      → generating
                                          ├─ success → report ready
                                          └─ failure → retry
  → Monthly report
      → theme/change cards
      → select evidence/source → Historical entry detail
      → helpful/not-helpful feedback
```

### Error/recovery branches
AI provider failure never alters source answers. Stale report remains clearly marked or hidden until regenerated; two active contradictory report versions are not shown.

### Analytics checkpoints
`monthly_report_eligible`, `monthly_report_opened`, `monthly_report_feedback`, non-content generation health.

### Related acceptance criteria
F-005, F-006.

---

## UF-006 — Six-month and annual report

- **User intent:** view long-term change.
- **Starting state:** Reports index or Journey Complete.
- **Preconditions:** AI consent active; elapsed-period and response-span thresholds met.

```text
Open Reports / Journey Complete
  → Select 6-month or annual report
      → Check elapsed period + distinct-month + answer thresholds
          ├─ not met → Insufficient-data explanation
          └─ met → existing current report?
                    ├─ yes → open
                    └─ no/stale → generation job
                                   → validated hierarchical synthesis
                                       ├─ success → report
                                       └─ fail → retry
  → Report
      → early vs late observations
      → repeated / strengthening / declining / stable themes
      → evidence links
      → feedback
```

### Error/recovery branches
If monthly aggregates are missing, generation may create needed internal aggregates but must not bypass source ownership checks. Unsupported or untraceable generated claims cause validation failure, not silent display.

### Analytics checkpoints
`long_report_eligible`, `six_month_report_opened`, `annual_report_opened`, `report_feedback`.

### Related acceptance criteria
F-007.

---

## UF-007 — Past You comparison

- **User intent:** compare an old and current answer to the same underlying prompt.
- **Starting state:** current answer saved.
- **Preconditions:** current question has a `comparison_group_key` and at least one older answered question in the same group.

```text
Answer saved
  → Resolve comparison group
      ├─ no earlier answered member → no card
      └─ earlier answer exists → Show “Geçmişteki Sen” card
                                  → Open comparison
                                     → older date/question/answer
                                     → current date/question/answer
                                     → AI difference summary?
                                        ├─ consent=true + ready → show secondary summary
                                        └─ otherwise → raw comparison only
```

### Error/recovery branches
AI comparison failure does not block the raw side-by-side comparison.

### Analytics checkpoints
`past_you_available`, `past_you_opened`.

### Related acceptance criteria
F-008.

---

## UF-008 — Change reminder settings

- **User intent:** enable, change or disable the reminder.
- **Starting state:** Settings.
- **Preconditions:** authenticated.

```text
Settings → Reminder
  → Toggle on
      → permission already granted?
          ├─ yes → choose time → replace app-owned daily schedule
          └─ no → request permission
                   ├─ granted → choose time → schedule
                   └─ denied → reminder remains off + OS settings guidance
  → Change time → replace existing schedule
  → Toggle off → cancel app-owned schedule
```

### Error/recovery branches
Scheduling failure leaves preference/state consistent and shows retry; no duplicate schedules.

### Analytics checkpoints
`reminder_preference_changed`, permission state classification.

### Related acceptance criteria
F-009.

---

## UF-009 — Change AI consent

- **User intent:** control whether entries are processed by AI.
- **Starting state:** Settings → Data & Privacy / AI analysis.
- **Preconditions:** authenticated.

```text
Open AI analysis setting
  → Review explanation
  → Toggle off
      → confirm future AI processing stops
      → consent=false
      → existing reports remain private/user-visible unless user deletes them
  → Toggle on
      → explicit consent confirmation
      → consent=true
      → eligible unprocessed entries may be queued according to backfill limits
```

### Error/recovery branches
Consent state update must persist server-side before UI claims completion. A job must re-check current consent before sending text to AI, preventing a race where a user opted out after queueing.

### Analytics checkpoints
`ai_consent_changed`; no journal content.

### Related acceptance criteria
F-005.

---

## UF-010 — Export personal data

- **User intent:** obtain a copy of their data.
- **Starting state:** Settings → Data & Privacy.
- **Preconditions:** authenticated; network.

```text
Data & Privacy → Export
  → Request export
      → server validates user
      → create export job
          ├─ running → status
          ├─ failed → retry
          └─ ready → authenticated/time-limited download
                        → complete
```

### Error/recovery branches
Expired download token/link → request a new authorized delivery; never publish a permanent public object URL.

### Analytics checkpoints
`export_requested`, `export_ready`, `export_failed`.

### Related acceptance criteria
F-010.

---

## UF-011 — Delete account and all owned journal data

- **User intent:** permanently remove account data.
- **Starting state:** Settings → Data & Privacy.
- **Preconditions:** authenticated; network; recent auth if policy requires.

```text
Data & Privacy → Delete account
  → Explain irreversible effects
  → User explicitly confirms
      → optional re-auth
      → server starts idempotent deletion
          ├─ failure → remain signed in or controlled recovery state + retry/support reference
          └─ success → revoke/delete auth account
                        → clear local protected state
                        → signed-out confirmation/auth entry
```

### Error/recovery branches
Never sign the user out with a “deleted” success message before server deletion is confirmed. Partial failure must be resumable/idempotent.

### Analytics checkpoints
`account_delete_requested`, `account_delete_completed`, `account_delete_failed`; no deleted content.

### Related acceptance criteria
F-010.

---

## UF-012 — Network loss and recovery

- **User intent:** understand what remains available and avoid losing work.
- **Starting state:** any authenticated screen.
- **Preconditions:** network unavailable/intermittent.

```text
Network lost
  → Current screen class
      ├─ Today question already in memory/cache → show prompt; editor may be used in-memory; Save disabled/fails safely
      ├─ Protected history/report not available → offline explanation
      └─ Already rendered protected data → retain only within current authenticated app state; do not cross logout/user switch
  → Network restored
      → explicit/automatic safe retry
      → refetch canonical server state
```

### Error/recovery branches
No raw answer is persisted to unencrypted AsyncStorage. No queued write is silently assumed successful.

### Analytics checkpoints
Non-content network error counters only.

### Related acceptance criteria
F-001 through F-010 where applicable.

---

## Coverage gate

Every MVP feature in `docs/PRODUCT_SPEC.md` is reachable from at least one flow above. Major loading, empty, insufficient-data, permission-denied, offline, destructive and retry states are represented. Payments and moderation are N/A for the current MVP.
