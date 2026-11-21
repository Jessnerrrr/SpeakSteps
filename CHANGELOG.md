11-18-2026

## Unreleased

### Added
- Added backend models and API routes for activities, word-bank/practice items, patient assignments, submissions, speech check-ins, reviews, SOAP notes, and accomplishments.
- Added authenticated account/profile APIs, admin account-status updates, and patient search by name or patient code.
- Connected role screens to the centralized API client: Admin dashboard, Teacher dashboard, therapist workflows, and parent/child learning screens.
- Persisted child profile edits and speech check-in answers.
- Connected child sentence practice to practice items for assigned targets when assigned activity words are unavailable.

### Changed
- Connected authentication screens to backend registration and login APIs.
- Updated patient practice and progress screens to use server data while keeping progression therapist-controlled.
- Kept automated speech scores empty unless supplied; recording URIs remain device-local.
- Added loading and error feedback to connected screens.
- Fixed the `parent-progress.tsx` category-name TypeScript error.

### Verification
- Frontend `npx tsc --noEmit` passed.
- Backend tests passed (11/11).
- Backend learning route syntax check passed.