# SpeakSteps Center Admin design notes

## Product and surface

Center administrators use this Operate workspace to manage professional accounts, review Student Requests, oversee Teacher and Therapist assignments, and keep an administrative history. The main safety risks are changing the wrong Student's access or enrollment and assigning a Student to an ineligible professional.

## Visual system

- Use the sign-in experience’s Geist typography, Sour Gummy brand wordmark, and SpeakSteps mark. The sign-in screen itself is out of scope.
- Use SpeakSteps blue (`#0865AD`) for primary actions and navigation, white for working surfaces, and light blue (`#EAF7FF`) for selected and informational states.
- Use green for active or completed, yellow for pending, and red for suspended or consequential actions. Status labels always include text.
- Use a 4 px spacing base, compact directory rows, 7–10 px corner radii, and tinted dividers. Avoid decorative gradients and repeated card grids.
- Keep the desktop sidebar stable; switch to a labeled menu on smaller screens. Directory rows become stacked records on narrow screens.

## Information and interaction rules

- Primary navigation is Dashboard, Accounts, and Activity Logs. Accounts contains Directory, Student Requests, and Archive Center. Settings and administrator controls stay secondary.
- Account access and invitation setup are separate states. Student account access, enrollment, and therapy status are also separate states.
- Student and Guardian identity information are read-only. Student enrollment is created through the existing Accounts workflow, not from Student Details.
- The shared Accounts Directory supports all account types through All, Student, Therapist, and Teacher tabs. The Student tab or an exact Student ID search shows Teacher, Therapist, and Enrollment columns; the table does not repeat the selected role. Open Student Requests show the responsible party, verification stage, and original explanation; final decisions depend on the required evidence.
- Teacher and Therapist changes update shared Student records. New assignments require active access, active membership, and completed setup; Therapist counts do not have a maximum.
- Access suspension requires an administrative reason and preserves enrollment and assignments. Enrollment archive and restoration require separate confirmation and an administrative record.
- Reminder dates and request history are deterministic mock state. No messages are delivered and changes reset on reload.
- Demo changes use shared in-memory frontend state and reset on reload. Invitation actions are simulated; no email is sent.

## Consolidated Accounts contract

- **Product and user:** Center Admin managing all Student and professional accounts, and reviewing administrative requests during school operations.
- **Surface:** Operate.
- **Primary action:** Identify the account or request, review its source information, then make an eligible administrative change; if prerequisites are missing, preserve the current record and show the missing requirement.
- **Content:** Student name and number, grade and section, school, Guardian contact when recorded, Teacher and Therapist assignments, access and enrollment states, request origin, standardized reason, original explanation, evidence reference, verification stage, and event history.
- **Reuse:** Geist typography, SpeakSteps blue `#0865AD`, primary yellow `#FFB923` for real follow-up attention, neutral surfaces, existing shared in-memory records, assignment eligibility rules, activity logs, and notifications.
- **Required states:** Search/filter results, no matching Students or requests, unavailable identity fields, ineligible or missing professional assignments, open and resolved requests, pending verification, due reminders, overdue follow-up, and confirmation validation.
- **Out of scope:** Backend persistence, official school record lookup, Guardian/Teacher/Therapist portal redesign, message delivery, and scheduled jobs.
- **Signature:** One shared account directory opens into role-appropriate detail drawers; Student Requests remain a dedicated child workspace, with source, verification, evidence, and history grouped before decisions.

## Accounts module contract

- **Product and user:** Center Admin locating current accounts, reviewing inactive records, and starting a safe recovery during school operations.
- **Surface:** Operate.
- **Primary action:** Find the account, inspect its status and relationships, then use the existing validated account workflow.
- **Content:** Account name, authoritative identifier, access, setup, assignments, and lifecycle status. Student rows show Assigned when a Teacher or Therapist is linked and Unassigned when neither is linked; Teacher and Therapist rows show their assigned Student count. Role selection lives in the account type tabs; the Student tab or exact Student ID search adds Teacher, Therapist, and Enrollment details to the table.
- **Reuse:** Shared in-memory account records, existing registration and detail experiences, Geist, SpeakSteps blue `#0865AD`, and yellow only for attention.
- **Required states:** Directory search and sorting, setup pending, archived or suspended records, no results, recovery confirmation, and eligibility blocks.
- **Out of scope:** Backend persistence, duplicate archive records, and a separate account data store.
- **Signature:** Accounts opens into dedicated Directory, Student Requests, and Archive Center routes. The selected child is reflected in the sidebar and breadcrumb, while account and request records stay in one shared in-memory store across route changes.
