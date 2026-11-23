# SpeakSteps QA & Regression Checklist

This checklist is a test plan, not a claim that every screen is currently wired or passing. Mark each item only after running it against the current backend build. Use test accounts and disposable registrations; do not put passwords, tokens, `MONGODB_URI`, or other secrets in this file, screenshots, or commits.

## Test fixtures

- Roles/accounts: `admin@test.com`, `therapist@test.com`, `teacher@test.com`, and `parent@test.com`.
- Backend role for the Parent/Patient account is `parent`; the frontend may label this experience Parent or Patient.
- Patient code: `645112026`.
- Use the current test passwords from a secure local source. The Admin password was generated separately and should be rotated before shared or production use.
- Use a unique email and a disposable patient for registration, status-rejection, and cross-patient tests. Do not reject or change the passwords of the four shared test accounts during the main run.
- Expected learning seed: one therapist-assigned `/r/` initial-words activity, three word-bank entries, three matching practice items, and one assignment with status `assigned`. No submission or speech score is seeded.

## 1. Pre-test server and environment verification

- [ ] **Check the listener on port 5000**
  - **Action:** In PowerShell, run:
    ```powershell
    $listeners = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
      $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
      [pscustomobject]@{ ProcessId = $listener.OwningProcess; CommandLine = $process.CommandLine }
    }
    ```
  - **Expected UI Result:** No app test yet; identify the SpeakSteps backend process and its PID.
  - **Expected Atlas/API Result:** A listener alone does not prove that the loaded routes are current. Confirm the route probe below. Do not stop a process unless its PID and purpose are confirmed.

- [ ] **Confirm the loaded Express routes are current**
  - **Action:** Send an empty request to the Admin login route. This intentionally supplies no credentials:
    ```powershell
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5000/api/admin/login' -Method Post -ContentType 'application/json' -Body '{}' -TimeoutSec 5
      "HTTP $($response.StatusCode)"
    } catch {
      "HTTP $([int]$_.Exception.Response.StatusCode)"
    }
    ```
  - **Expected UI Result:** No credentials are entered or displayed.
  - **Expected Atlas/API Result:** **400** for missing email/password means the route is loaded; **404** indicates a stale/different server. Do not proceed with end-to-end testing until the updated backend is running.

- [ ] **Restart the backend only after confirming the old process**
  - **Action:** Stop the confirmed backend from its own terminal with Ctrl+C, then run:
    ```powershell
    Set-Location C:\Users\porqu\SpeakSteps\backend
    npm start
    ```
  - **Expected UI Result:** Server startup logs show MongoDB connected and the API listening on the configured port.
  - **Expected Atlas/API Result:** `server.js` calls `Patient.createIndexes()` during startup; this may create the patient-code index. Never print `.env` values. Required config includes `MONGODB_URI` and a `JWT_SECRET` of at least 32 bytes; `PORT` defaults to 5000.

- [ ] **Check health**
  - **Action:**
    ```powershell
    $health = Invoke-RestMethod -Uri 'http://localhost:5000/health' -Method Get -TimeoutSec 5
    $health | ConvertTo-Json -Compress
    ```
  - **Expected UI Result:** Not applicable.
  - **Expected Atlas/API Result:** HTTP **200** with `{ "status": "ok", ... }`. Health indicates the server started, not that every protected route is healthy.

- [ ] **Confirm Expo Go reaches the computer's backend**
  - **Action:** Put the phone and development computer on the same trusted LAN. Run `ipconfig`, identify the computer's LAN IPv4 address, set `EXPO_PUBLIC_API_URL=http://<LAN_IP>:5000/api` in the local frontend environment, then restart Expo with `npx expo start --lan`. Open `http://<LAN_IP>:5000/health` from the phone's browser.
  - **Expected UI Result:** Expo Go loads the app without an API network error; the phone browser shows the health response. Use a host-reachable URL, not `localhost` on a physical phone.
  - **Expected Atlas/API Result:** Phone receives HTTP **200** from `/health`; API requests target the same host and port. Allow the local firewall only as appropriate for the development LAN.

- [ ] **Run offline checks before manual testing**
  - **Action:**
    ```powershell
    Set-Location C:\Users\porqu\SpeakSteps\backend
    npm test
    node --check learning\routes.js
    Set-Location C:\Users\porqu\SpeakSteps\frontend
    npx tsc --noEmit
    ```
  - **Expected UI Result:** Not applicable.
  - **Expected Atlas/API Result:** Backend unit tests pass; route syntax and frontend TypeScript checks pass. `npm test` does not replace live API testing.

## 2. Authentication and session persistence

- [ ] **Sign in with each role**
  - **Action:** Sign in separately using the four test emails and their securely stored current passwords. Use the role-specific screens: Parent `/api/users/login`, Admin `/api/admin/login`, Therapist `/api/therapists/login`, Teacher `/api/teachers/login`.
  - **Expected UI Result:** Each user reaches only its intended role experience; invalid password, wrong-role login, pending, and rejected accounts show a useful error rather than entering the app.
  - **Expected Atlas/API Result:** Successful login is HTTP **200** with a JWT and role-matching user. Wrong credentials return **401**; wrong role or unapproved account returns **403**. Login should not create duplicate account or profile documents. Refresh `users` and the matching role profile collection.

- [ ] **Verify the Admin screen uses real authentication**
  - **Action:** Submit the live Admin test account through the Admin login screen, then open Accounts and search for `parent@test.com`.
  - **Expected UI Result:** Successful sign-in opens the live dashboard; invalid credentials are rejected. Admin user search and status controls are available only after sign-in.
  - **Expected Atlas/API Result:** `/api/admin/login` returns a token; `/api/admin/users` returns user DTOs with status and role. Refresh `users`.
  - **Implementation note:** The hardcoded path was replaced with the shared `loginAccount(..., 'admin')` service. Verify the form now calls `/api/admin/login`, stores the token, and dashboard requests include its Bearer token.

- [ ] **Verify native token persistence and session restoration**
  - **Action:** On a native build, sign in, close/reopen the app, and reload the session. Repeat after a normal device/app restart. On web, separately test refresh behavior.
  - **Expected UI Result:** Native users remain signed in until logout or token expiry; expired or rejected sessions return to sign-in. Web session behavior is documented separately because its token is memory-only and may not survive refresh.
  - **Expected Atlas/API Result:** Native token is stored through `SecureStore`; `/api/users/session` validates it and returns the current user. No new documents should be written. Refresh `users` only to check status if the session is rejected.

- [ ] **Verify logout clears the session**
  - **Action:** Log out from Parent, Therapist, Teacher, and Admin experiences; press Back and reopen the app.
  - **Expected UI Result:** User returns to the correct login/landing screen and protected role screens cannot be reopened from history.
  - **Expected Atlas/API Result:** A cleared or invalid token receives **401** on protected APIs; no data changes. Refresh `users` only if checking account status.
  - **Implementation note:** Parent/Child, Therapist, Teacher, and Admin logout handlers now await the shared `clearSession()` helper before navigation. Verify SecureStore deletion on native and in-memory token clearing on web; navigation alone does not count as a successful logout.

- [ ] **Exercise role guards and MFA/recovery screens**
  - **Action:** Try wrong-role sign-ins, direct links to other role screens, expired/invalid tokens, MFA/OTP retry and resend, TOTP setup, and password recovery.
  - **Expected UI Result:** Wrong-role users cannot enter another role's UI; MFA and recovery screens must not report success unless the backend verifies the challenge.
  - **Expected Atlas/API Result:** Login and protected endpoint responses enforce role/status. No MFA or password-reset data should be recorded unless a real API exists.
  - **Implementation note:** Role guards now validate the session and role for Patient, Therapist, Teacher, and Admin route layouts. MFA/TOTP and password-recovery screens now explicitly report that no verification/recovery API is configured and must not claim success. Verify these behaviors; backend authorization remains the security boundary.

- [ ] **Test new Parent registration and approval policy**
  - **Action:** Register a unique disposable Parent using all required fields, including a verification image. Test duplicate email and invalid/oversized inputs. Test once with `AUTO_APPROVE_REGISTRATIONS=true` in non-production and once with it false; never enable auto-approval in production.
  - **Expected UI Result:** Validation and duplicate-email errors are understandable. Verified registrations can sign in; pending registrations cannot enter protected screens.
  - **Expected Atlas/API Result:** `POST /api/users/register` returns **201** and a 9-digit patient code. The transaction creates linked documents in `users`, `parent_profiles`, and `patients`. Duplicate email returns **409**; invalid payload returns **400**. Refresh all three collections.

- [ ] **Check patient-code format, uniqueness, and search**
  - **Action:** Register/create two disposable patients and verify codes are distinct. Search `645`, `645112026`, and a full patient name.
  - **Expected UI Result:** Search accepts a numeric prefix, full code, and name; exact code result shows the expected patient.
  - **Expected Atlas/API Result:** Patient code is a 9-digit string with a random `100–999` prefix and UTC `MMYYYY` suffix. `GET /api/patients/search?q=645` and `?q=645112026` return only visible patients. Check `patients.patientCode` and the unique sparse index. Refresh `patients`; do not run the backfill migration as a read-only check.

## 3. Parent / Guardian Mode and Child Mode

- [ ] **Exercise Parent dashboard navigation and Child Mode entry**
  - **Action:** Sign in as `parent@test.com`; visit dashboard, tasks, progress, therapist feedback, stars, profile, and Child Mode. Exercise the Grown-Up check/PIN and Android Back behavior.
  - **Expected UI Result:** Existing navigation, profile header, guardian gate, and child-mode return paths work without losing the logged-in Parent session.
  - **Expected Atlas/API Result:** Parent data is scoped to the linked `patientCode: 645112026`; no other patient's data appears. Refresh `users`, `parent_profiles`, `patients`, `patient_assignments`, `submissions`, `clinical_reviews`, and `patient_accomplishments` as relevant.

- [ ] **Update child name and age**
  - **Action:** Change the child name and age, save, leave the screen, and reopen it.
  - **Expected UI Result:** Saved values reload; validation/server errors remain visible; device-local avatar selection remains usable.
  - **Expected Atlas/API Result:** `PATCH /api/patients/me/profile` updates the Parent account and linked patient. Refresh `users` and `patients`. This endpoint updates the first patient returned for the Parent, so use a single-patient test account for this check.

- [ ] **Save and reload speech check-in answers**
  - **Action:** Complete check-in questions and result screens; reopen prior results.
  - **Expected UI Result:** Answers and result summary render after reload. No automated speech score or level recommendation appears unless supplied by an authorized scorer.
  - **Expected Atlas/API Result:** `POST /api/speech-checkins` stores question responses; `GET /api/speech-checkins` retrieves them. `evaluated_sound`, `initial_score`, and `summary_outcome` remain empty when no scorer supplied them. Refresh `speech_checkin_results` and `patients`.

- [ ] **Load assigned activity and standard practice-item fallback**
  - **Action:** In Child Mode, open assigned tasks and the sentence library. Verify the seeded `/r/` initial activity; test a position with no activity words to invoke the standard practice-item fallback.
  - **Expected UI Result:** Only therapist-assigned targets appear; fallback items match the assigned sound, selected position, and language. Unassigned activities must not unlock practice. Scores remain unfilled.
  - **Expected Atlas/API Result:** `GET /api/assignments` returns the assigned `645112026` item. `GET /api/practice-items?sound=%2Fr%2F&position=Initial&language=English` returns matching items. Refresh `patient_assignments`, `therapist_activities`, `activity_words`, and `practice_items`.

- [ ] **Record and submit practice audio**
  - **Action:** Grant microphone permission, record, stop, preview/re-record, and submit. Repeat with microphone denied, an interrupted recording, and a missing/invalid URI.
  - **Expected UI Result:** No crash; permission and validation errors are clear; local recording controls recover and permit retry.
  - **Expected Atlas/API Result:** `POST /api/submissions` stores the device-local URI as recording metadata, duration, waveform sample, assignment, patient, and pending status. No `speech_match_score` or fabricated star rating is added. A linked assignment may transition to `completed`; this alone must not unlock the next level. Refresh `submissions` and `patient_assignments`.
  - **Storage caveat:** Audio is currently device-local; this does not verify playback from another device or a cloud upload.

- [ ] **Verify therapist-controlled progression**
  - **Action:** Complete an activity without a therapist assigning a new level; then have the Therapist create/assign the next activity and revisit Child Mode.
  - **Expected UI Result:** Completion or an empty speech score does not automatically unlock another level. The next level becomes available only after the Therapist assigns it.
  - **Expected Atlas/API Result:** Progress reflects assignment records and completed attempts. `unlockedLevels` reflects assigned activity levels; no score-based progression is written. Refresh `patient_assignments`, `submissions`, and `therapist_activities`.

## 4. Therapist workflow

- [ ] **Search and open patient records**
  - **Action:** In `PatientDirectory.tsx`, search `645`, `645112026`, and the patient's name; open the patient record and use filters/pagination.
  - **Expected UI Result:** Prefix and exact searches show the linked record; empty and error states do not crash; patient details, target fields, and progress load.
  - **Expected Atlas/API Result:** `GET /api/patients/search?q=...` returns at most 50 patients scoped to this Therapist. Refresh `therapist_profiles` and `patients`.

- [ ] **Add a patient linked to a verified Parent**
  - **Action:** Use a disposable patient name and `parent@test.com` as guardian. Try a nonexistent/unverified guardian in a separate validation attempt.
  - **Expected UI Result:** Success displays the generated patient code; invalid guardian/profile errors are actionable.
  - **Expected Atlas/API Result:** `POST /api/patients` creates a patient linked to the Parent profile and current Therapist profile. Missing therapist profile returns **403**; missing/unverified Parent returns **404**; missing Parent profile returns **409**. Refresh `patients`, `parent_profiles`, and `therapist_profiles`.

- [ ] **Edit and reload Therapist profile and password**
  - **Action:** Edit full name, professional title, license, clinic, and contact in `TherapistShell.tsx`; save/reopen. Change password with valid and invalid current/new passwords using a disposable account if possible.
  - **Expected UI Result:** Saved profile fields reload from the server; failed saves/password checks are visible and do not claim success.
  - **Expected Atlas/API Result:** `GET/PATCH /api/therapist/profile` persists profile metadata to `therapist_profiles` and name/contact to `users`; `PATCH /api/account/password` updates the salted hash only after validating the current password and password policy. Refresh `therapist_profiles` and `users`.

- [ ] **Create/edit Therapist word-bank entries and activities**
  - **Action:** In Therapist activity modules, create a custom word-bank entry, filter/search it, create an activity using it, edit the activity, and reload the pages.
  - **Expected UI Result:** Created data survives navigation/reload; errors are visible; standard words cannot be deleted as custom entries.
  - **Expected Atlas/API Result:** `POST /api/word-bank`, `GET /api/word-bank`, `DELETE /api/word-bank/:wordId`, `POST /api/activities`, and `PUT /api/activities/:activityId` behave according to role/ownership. Refresh `word_bank`, `therapist_activities`, and `activity_words`.

- [ ] **Assign an activity and manually advance progression**
  - **Action:** Assign a new activity to a patient in the Therapist caseload with a due date and instructions. Then assign a higher-level activity explicitly.
  - **Expected UI Result:** Patient task and level list update after refresh; due date and instructions are visible. No auto-unlock occurs from a score or completion alone.
  - **Expected Atlas/API Result:** `POST /api/assignments` returns **201** and stores `status: assigned`, patient, therapist, activity, and due date. `GET /api/progress` shows the newly assigned level. Refresh `patient_assignments`, `therapist_activities`, `activity_words`, and `patients`.

- [ ] **Review a Child submission**
  - **Action:** Open the seeded/created submission, play its local recording where available, enter clinical observations, target ratings, parent feedback, and home practice instructions. Reopen Parent feedback.
  - **Expected UI Result:** Therapist review shows the submission's real state; Parent sees only feedback for their linked patient. UI does not invent a speech-match score.
  - **Expected Atlas/API Result:** `POST /api/reviews` writes `clinical_reviews` and `submission_target_ratings`; submission status becomes reviewed; `GET /api/feedback` returns the linked review. Refresh `submissions`, `clinical_reviews`, `submission_target_ratings`, and `patients`.

- [ ] **Create SOAP notes and accomplishments**
  - **Action:** Add a SOAP note and accomplishment for the test patient, then revisit the Therapist record and Parent progress/feedback views.
  - **Expected UI Result:** Records reload in the correct role views with empty optional fields rendered safely.
  - **Expected Atlas/API Result:** SOAP routes write `patient_soap_notes`; accomplishment routes write `patient_accomplishments`. Duplicate SOAP session numbers should return a conflict rather than silently overwrite. Refresh `patient_soap_notes`, `patient_accomplishments`, and `patients`.

## 5. Teacher workflow

- [ ] **Open the linked student and search by patient code**
  - **Action:** Sign in as `teacher@test.com`; open Students and search `645` and `645112026`.
  - **Expected UI Result:** The linked student appears; search/loading/empty/error states remain usable.
  - **Expected Atlas/API Result:** `GET /api/patients` and `/api/patients/search?q=645112026` scope results to the Teacher's assigned students. Refresh `teacher_profiles` and `patients`.

- [ ] **View assigned activities and word bank**
  - **Action:** Open the Teacher Activities tab and Word Bank; search/filter and open the seeded activity preview.
  - **Expected UI Result:** Teacher sees the assigned `/r/` activity and read-only word-bank entries. No create/edit/delete/assign controls are available.
  - **Expected Atlas/API Result:** `GET /api/activities` returns only activities assigned to visible students; `GET /api/word-bank` returns entries. Refresh `patient_assignments`, `therapist_activities`, `activity_words`, and `word_bank`.

- [ ] **Verify Teacher progress, notes, and observations**
  - **Action:** Open student progress, assignments, submissions, SOAP notes/accomplishments, and any preexisting observation UI.
  - **Expected UI Result:** Progress is based on actual assignments/submissions and shows no fabricated accuracy. Therapist clinical notes are read-only; no Teacher-authored save should appear successful unless a Teacher-write endpoint is implemented.
  - **Expected Atlas/API Result:** Teacher reads are limited to linked students. Refresh `patient_assignments`, `submissions`, `patient_soap_notes`, and `patient_accomplishments`; Teacher read should not mutate these collections.

## 6. Admin workflow

- [ ] **Sign in and load Admin data**
  - **Action:** Sign in with `admin@test.com`; open dashboard, account tabs, filters, and patient search.
  - **Expected UI Result:** Live account data loads; search for `645112026` finds the patient; empty/loading/error states are clear.
  - **Expected Atlas/API Result:** `POST /api/admin/login` returns a token; `GET /api/admin/users` lists accounts; `GET /api/patients/search?q=645112026` returns the patient. Refresh `users` and `patients`.
  - **Implementation note:** The Admin login screen now uses the shared backend login/session helper. Confirm `/api/admin/login` succeeds for the Admin account and the dashboard's account/search requests carry its JWT.

- [ ] **Update a disposable account's status**
  - **Action:** Use a disposable user to mark verified/rejected, refresh the dashboard, then test login and an already-issued token. Do not reject the shared four test accounts.
  - **Expected UI Result:** Status badge/action updates to Verified or Rejected; errors do not look like success.
  - **Expected Atlas/API Result:** `PATCH /api/admin/users/:userId/status` accepts `verified` or `rejected` and updates `users.status`. Rejected account login returns **403**; its existing token receives **401** on protected routes because each request rechecks status. Refresh `users`.

## 7. Regression and boundary checks

- [ ] **Check cross-role write isolation**
  - **Action:** With a Teacher token, attempt `POST /api/activities`, `POST /api/word-bank`, `DELETE /api/word-bank/:wordId`, `POST /api/assignments`, and `POST /api/reviews`. Repeat a Therapist-only mutation with a Parent token.
  - **Expected UI Result:** Teacher screens remain read-only; unauthorized attempts show an error and never a success toast.
  - **Expected Atlas/API Result:** Each disallowed write returns **403** and makes no changes. Refresh `therapist_activities`, `activity_words`, `word_bank`, `patient_assignments`, `clinical_reviews`, and `submission_target_ratings`.

- [ ] **Check patient-to-patient isolation**
  - **Action:** Use the Parent account for `645112026` to request another disposable patient's ID/code for profile, progress, assignments, submissions, check-ins, SOAP notes, and accomplishments.
  - **Expected UI Result:** Another patient's records are not rendered; errors/empty results are handled without crashing.
  - **Expected Atlas/API Result:** Requests are rejected with **403** or **404** according to the route; no cross-patient reads or writes occur. Refresh `patients`, `patient_assignments`, `submissions`, `speech_checkin_results`, `patient_soap_notes`, `patient_accomplishments`, and `clinical_reviews`.

- [ ] **Check invalid, expired, missing, and malformed sessions**
  - **Action:** Call a protected endpoint with no token, a corrupted token, an expired token, and a valid token from a different role.
  - **Expected UI Result:** User is sent to sign-in or sees a clear permission error; app does not show success-shaped fallback data.
  - **Expected Atlas/API Result:** Missing/invalid token returns **401**; valid token with wrong role returns **403**. No writes occur; refresh `users` only if confirming account status.

- [ ] **Check empty, null, slow, offline, and server-error responses**
  - **Action:** Test empty collections, a network timeout, backend 500, and API responses with omitted optional arrays/fields in a test environment.
  - **Expected UI Result:** Dashboards, patient lists, activities, reviews, notifications, check-ins, profile, and progress screens show safe empty/loading/error states and provide retry where available.
  - **Expected Atlas/API Result:** Read-only failures cause no writes. Confirm screens do not fabricate patients, accuracy, submissions, assignments, or therapist notes.

- [ ] **Recheck existing UI interactions**
  - **Action:** Exercise navigation/back buttons, filters/sorts, date inputs, forms, search debounce, notifications, theme toggles, recording controls, profile modals, patient directory, review details, and logout on each role.
  - **Expected UI Result:** Existing layout and interactions remain responsive; a failed network action does not discard unsaved input or leave a permanent loading state.
  - **Expected Atlas/API Result:** Only the intended endpoint/collection changes for each explicit Save/Submit action. Theme, local avatars, and local recording URIs remain device-local unless a persistence API is explicitly added.

## Atlas Data Explorer refresh list

Refresh only the collections relevant to the test just run. The complete set used by these flows is:

- Accounts and relationships: `users`, `parent_profiles`, `therapist_profiles`, `teacher_profiles`, `patients`.
- Practice content and assignments: `word_bank`, `practice_items`, `therapist_activities`, `activity_words`, `patient_assignments`.
- Practice/review results: `submissions`, `speech_checkin_results`, `clinical_reviews`, `submission_target_ratings`.
- Clinical/progress records: `patient_soap_notes`, `patient_accomplishments`.

Admin profiles are not required by the current role/profile lookup; Admin account data is in `users`. Use Atlas Data Explorer read-only for inspection, and do not run backfills or bulk updates as part of this checklist.

## Sign-off

- [ ] All pre-test checks pass and the running port 5000 process answers the updated route probe.
- [ ] Each role's intended UI and data access passes; all known gaps above are either fixed or recorded as explicit failures.
- [ ] No generated speech scores, unauthorized writes, cross-patient exposure, or unintended progression changes were observed.
- [ ] `npm test`, `node --check learning\routes.js`, and `npx tsc --noEmit` pass after any fixes.
- [ ] No credentials, tokens, `.env` files, or secret-bearing account notes are added to the commit.
