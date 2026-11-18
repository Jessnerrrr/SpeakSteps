# SpeakSteps Center Admin design notes

## Product and surface

Center administrators use this Operate workspace to manage professional accounts, review patient access requests, oversee Therapist assignments, and keep an administrative history. The main safety risks are suspending the wrong account and deactivating a Therapist before patients have a replacement.

## Visual system

- Use the sign-in experience’s Geist typography, Sour Gummy brand wordmark, and SpeakSteps mark. The sign-in screen itself is out of scope.
- Use SpeakSteps blue (`#0865AD`) for primary actions and navigation, white for working surfaces, and light blue (`#EAF7FF`) for selected and informational states.
- Use green for active or completed, yellow for pending, and red for suspended or consequential actions. Status labels always include text.
- Use a 4 px spacing base, compact directory rows, 7–10 px corner radii, and tinted dividers. Avoid decorative gradients and repeated card grids.
- Keep the desktop sidebar stable; switch to a labeled menu on smaller screens. Directory rows become stacked records on narrow screens.

## Information and interaction rules

- Primary navigation is Dashboard, Accounts, Patients, and Activity Logs. Settings and administrator controls stay secondary.
- Account access and invitation setup are separate states. Patient account access and center enrollment are also separate states.
- Patient identity and guardian information are read-only. Patient enrollment is created by Therapists, not Center Admins.
- Routine Therapist deactivation requires every enrolled patient to be reassigned to an active Therapist. Emergency suspension preserves assignments and raises follow-up attention.
- A Therapist suspension request can be approved (suspending patient access) or declined (leaving access unchanged); either decision is logged.
- Demo changes use shared in-memory frontend state and reset on reload. Invitation actions are simulated; no email is sent.
