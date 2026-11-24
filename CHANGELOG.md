# SpeakSteps change log

This document records the Center Admin design review, the SUDE merge, and subsequent updates to the Student, Guardian, Teacher, and Therapist portals.

## Student Play and Practice

- Redesigned Play with SpeakSteps buddy art, a speech bubble, an English and Tagalog selector, colorful level tiles, and larger play controls. The selected buddy bounces when tapped, and level changes animate the activity cards.
- Activity cards show prompt counts and earned stars from the same practice records used on Home and Stars. Child Mode shows a buddy-led empty state with a next step when there are no activities.
- Practice shows one prompt at a time with a progress bar, sound-position labels, a separate Therapist guidance card, and recording controls. Students can listen to a take or record it again before moving on.
- The completion card brings together the buddy, activity title, practiced prompt count, and Done button. A newly earned star animates with sparkles. Repeat practice shows encouragement and keeps the earlier star.
- Removed colored backgrounds behind the animal artwork and enlarged the transparent animations in Play, Practice, the completion card, and the empty state.
- Used the reference's house, gamepad, outlined star, and paw in Child Mode. Guardian navigation uses matching house, clipboard, and chart icons, with the same highlighted active tab. Guardian Home cards use the same clipboard and chart icons.

## Assignments, reviews, and audio

- Student Play and Practice, Guardian Tasks, and task details show the assigner's name and role from the shared assignment.
- Teacher Reviews supports student and activity multi-select, search, practice-level filtering, single-choice language filtering, and student A–Z / Z–A sorting. The demo review records use matching activity names and phonemes.
- Used the same All languages, English, or Tagalog choice in Therapist review and activity filters. Syllables is tracked separately in My Adventure, Stars, and Guardian progress and feedback.
- Practice recordings and playback are local to the session. Added the SpeakSteps microphone permission message and disabled background recording and playback in the Expo Audio configuration.

## Child name-change approval

- Guardian Child Profile warns that a proposed name requires Center Admin approval. The existing name stays in use while the request is pending.
- Center Admin reviews pending name changes in Student Requests and can approve or decline them. Decisions appear in Activity Logs.
- After approval, the guardian applies the specific approved name to Student and Guardian mode. Approval, application, and shared workflow data are held in the same demo session.

## Recent verification

- Chrome checks covered Play at 320 px, prompt navigation, recording and replay with a test microphone, the first and repeat completion states, assignment attribution, Child Mode empty states, and Guardian navigation.
- Verified the guardian request, Center Admin approval and log, and application of the approved name in one Chrome session. Phone recording and cross-device workflows remain unverified.

## Earlier changes

## Archive Center

- Added archive metadata for the date, reason, and administrator when recorded. Closed care episodes require archive metadata. The demo records include archive dates, which display in the same format as other Center Admin dates.
- Added full-width search by name, ID, or email, plus Role and Sort by dropdowns above the table. The count updates after a restore, and the page shows separate messages for an empty archive and a search with no matches.
- Replaced the circular Restore icon with a text action. Clicking the row opens its details, and clicking Restore opens a confirmation without opening the drawer.
- Added the archive reason to the table and adjusted the spacing between Role, ID, Status, Date, Archive reason, and Actions. The drawer displays the full reason.
- Matched the read-only archive drawer to Student Requests with section dividers for the overview, reason, and applicable authorization, student information, and assignment history. The overview includes role, archive status, date, and administrator when available.
- Removed account edit and suspension actions from the archive drawer. Archived records show archive states such as Suspended and Data model conflict.
- Restoring an account returns it to Directory and writes an activity entry with the actor, timestamp, record, and result. Restoring an archived enrollment requires eligible Therapist and Teacher selections and preserves the closed episode in history.

## Directory

- Balanced the Account and ID widths and added space between the Role badge and ID, including when the detail pane is open. Account and ID are left-aligned. Role, Access, Setup, and Assignments are centered under their headers.
- Added a stronger row chevron and consistent full-row hover feedback for clickable rows. Retained ID sorting and the existing role, setup, and assignment filters.
- Used neutral avatar circles and lighter role and status colors. Pills fit their labels and use readable text and visible status dots. Zero assignments display as **Unassigned**.
- Improved the readability of email addresses and count text. Paginated lists show their range in the footer with larger controls, clear disabled states, and a stronger active page indicator.
- Tightened the professional drawer when there are no assignments and added a divider above the professional or school information section.

## Student Requests and enrollment closure

- Applied the shared table spacing, clickable-row hover, and chevron styling. Status badges and follow-up notes align with the Status header.
- Kept Request Type, Workflow Stage, and Status filters available after results narrow to a single row.
- Moved the closure form into a scrollable area and placed Cancel and Review closure in a footer inside the dialog.
- Added supporting document uploads to enrollment closure requests, with browse or web drag-and-drop selection and attachment previews in request history.

## Activity Logs and Profile Settings

- Put date and time, category, activity, record name and ID, role, actor, result, and reason or note directly in Activity Logs. Rows display their information without opening a drawer.
- Kept search and category filtering and added a stacked presentation for narrower views. The Category dropdown opens above the table.
- Adjusted spacing and alignment in Profile Settings.

## Shared dropdown behavior

- Column filters open in an anchored overlay above scrollable tables. They stay open while selecting multiple options, and close on an outside click or Escape.
- The Directory Role menu fits below its header, highlights options on hover, and shows a checkmark for selected options.
- Archive Sort by uses the same dropdown styling as Role. Outside-click handling for these dropdowns uses a DOM element lookup on the web.

## SUDE merge and Student onboarding

- Merged `fix/patient-icons-sude` into local `ameer` in merge commit `bf20f64`. The branch added adventure artwork, an animated star, buddy sizing and dialogue changes, a user-mode selector, and updates to Child Profile and Parent screens. The merge retained the current registration and profile name validation.
- Returning Student sign-in and the end of speech check-in now reach the mode selector. Selecting Parent or Guardian Mode opens the grown-up check. Parents can switch back to Child Mode from the parent menu.
- Changed visible learner labels from Patient to Student in role selection, sign-in, registration, therapist list and record messages, and Center Admin request messages. The underlying routes and authentication identifiers remain compatible.
- Tightened Create new password into a content-sized card with a safe-area-aware scroll view. Aligned the back button and header, increased input and Show/Hide touch targets, and placed the full-width Save button below the last field.

## Child Home, Play, Stars, and Buddy

- Removed the waving emoji. The compact, 80-point buddy sits beside an emoji-free speech bubble whose tail points toward the selected animal. The greeting uses the child's profile name.
- Updated the Play, Stars, and Buddy tab icons to a controller, star, and paw, with a selected background and accessibility states. Child and Parent tab navigation reuses existing routes to avoid stacking duplicate screens.
- Restored the Sounds notes, Words Aa, and Sentences clipboard icons in My Adventure. Kept SUDE's Phrases icon and restored the medal for My Progress. The same adventure icons now appear in My Stars and Parent Progress & History.
- Gave Continue Practice a taller light blue shape with a stronger shadow and thicker bottom edge. The label and play icon are blue.
- Added web hover and press feedback to Child Home buttons and a shared press-and-release animation to buddy tiles, Stars category cards, Parent Home cards, assigned task cards, feedback cards, and the mode selector.
- Softened the Pick My Buddy selection badge with a pale background, blue checkmark, and a border that follows the buddy card's color.
- Changed Home and Stars category shortcuts to open the Play picker before Practice. Play's Android Back handler is active only while Play is focused.

## Practice submissions and shared progress

- Submit stores the activity in the current session and shows a compact confirmation card aligned with the other Practice cards. The card uses the same animated star as My Steps.
- The first submission earns one participation star. Repeating the same activity increases attempts without adding another completed activity or star. Play cards, My Activities, My Steps, and My Stars show the same submission state.
- Connected Guardian Home and Progress & History to the same submission data as Child Mode. Guardian progress and category filters use the child's actual completions and attempts for the current session.
- Opening Practice from a Guardian task now carries through the selected activity and category. The task list and details show Practice submitted after a submission and keep therapist completion separate.
- An invalid Guardian task link displays an unavailable message. Practice and task details explain when media is unavailable.

## Guardian feedback

- Changed Therapist Feedback and View buttons to light blue with dark blue labels.
- Made the feedback card a single animated action so opening it from the View area behaves the same as tapping the rest of the card.
- Added multi-select category filters. The menu remains open while selections change, matches any selected category, and resets through All Feedback.

## Therapist workflow fixes

- Assign Activity now keeps assignments for every selected student using student IDs. Reassigning the template to one student updates that student's entry while preserving the other assignments. Activity details show the assigned students, due dates, and instructions.
- Removed the prefilled due date and added calendar validation so impossible dates are rejected.
- Save Evaluation requires all targets to be scored before marking a review as Reviewed. Draft messages reflect that drafts are held for the current session.

## Android development setup

- Diagnosed the Expo Go download error using wireless ADB on the POCO. Metro ran on a supported temporary Node.js 22 runtime, and the Android logs confirmed that SpeakSteps started through an ADB reverse connection.
- Direct Wi-Fi still timed out after testing the scoped Windows Firewall rule. The verified mobile workaround was Metro on port 8085, an ADB reverse mapping for that port, and opening `exp://127.0.0.1:8085` in Expo Go.

## Main files changed

- [Center Admin dashboard](frontend/src/app/%28admin%29/admin-dashboard.tsx)
- [Center Admin models and demo records](frontend/src/data/center-admin.ts)
- [Account details header](frontend/src/components/admin/AccountDetailsHeader.tsx)
- [Professional details](frontend/src/components/admin/ProfessionalDetails.tsx)
- [Child bottom navigation](frontend/src/components/child-bottom-nav.tsx)

- [Student sign-in](frontend/src/app/%28auth%29/patient-login.tsx), [registration](frontend/src/app/%28auth%29/register-patient.tsx), and [new password](frontend/src/app/%28auth%29/new-password.tsx)
- [Mode selector](frontend/src/app/%28patient%29/user-mode-select.tsx), [Child Home](frontend/src/app/%28patient%29/patient-dashboard.tsx), [Play](frontend/src/app/%28patient%29/sentences.tsx), [Practice](frontend/src/app/%28patient%29/practice.tsx), [Stars](frontend/src/app/%28patient%29/patient-stars.tsx), and [Pick My Buddy](frontend/src/app/%28patient%29/pick-buddy.tsx)
- [Guardian Home](frontend/src/app/%28patient%29/parent-dashboard.tsx), [Tasks](frontend/src/app/%28patient%29/parent-tasks.tsx), [task details](frontend/src/app/%28patient%29/parent-activity-details.tsx), [Progress & History](frontend/src/app/%28patient%29/parent-progress.tsx), and [Therapist Feedback](frontend/src/app/%28patient%29/parent-therapist-feedback.tsx)
- [Practice submission store](frontend/src/data/practice-submissions.ts), [adventure icons](frontend/src/components/adventure-icon.tsx), [press animation](frontend/src/components/patient-pressable.tsx), and [Parent bottom navigation](frontend/src/components/parent-bottom-nav.tsx)
- [Therapist activity screens](frontend/src/Therapist/TherapistActivities.tsx), [assignment state](frontend/src/Therapist-modules/therapist-activities/state/ActivitiesProvider.tsx), [review screens](frontend/src/Therapist/TherapistReviews.tsx), and [review state](frontend/src/Therapist-modules/therapist-reviews/state/ReviewsProvider.tsx)

## Verification and limits

- Guardian Tasks, Therapist Feedback, and notifications now use the current student's shared workflow records. Tasks distinguish pending work, submitted work awaiting review, and reviewed work.
- Practice stars and attempts remain available when the same demo student signs back in during a session. The Guardian age stepper and staff birthday validation use the same 5–12 age range.
- Therapist profile edits now update the same record used for assignments and written feedback attribution.

- TypeScript and Git whitespace checks passed for the Center Admin changes.
- Chrome checks covered the filter menus on Directory, Student Requests, Archive Center, and Activity Logs. The Requests check included a narrower viewport and a one-row result with all Request Type options visible and selectable.
- Earlier Chrome checks covered archive restoration, archive count and empty state, restore activity entries, and Directory pagination.
- The archive dates come from demo data and available audit history. Older demo records may lack an original reason or administrator.
- The closure dialog layout was type-checked. Its visual layout and the child navigation changes were not verified on a device during this review.
- Opened 28 routes across the Student, Guardian, Therapist, Teacher, and Center Admin portals in mobile-sized Chrome. Also checked check-in navigation, both mode switches, buddy selection and press feedback, password form sizing, and the Guardian filter.
- Chrome verified two distinct submissions and one repeat across Child and Guardian views, assignment to four students, rejection of an impossible due date, rejection of an incomplete evaluation followed by a successful save, and the unavailable-task state.
- Teacher and Therapist assignments for the demo student now appear in Child and Guardian mode. Submissions reach Therapist Reviews, written feedback reaches the Guardian, and Center Admin Activity Logs show the handoffs without the feedback text.
- The shared workflow and practice progress are session-only. Cross-device delivery, recordings, authenticated account enforcement, registration approval, and a real speech check-in result still require backend integration.
- The Android launch was verified through ADB. Later layout and workflow checks ran in Chrome.
- TypeScript and Git whitespace checks passed. Expo lint remained blocked by the local ESLint version even on Node.js 22.
