11-22-2026

### Added
- Added a non-blocking MongoDB audit logger and initialized/indexed the `audit_logs` collection at backend startup.
- Recorded successful logins, parent registrations, admin account-status changes, therapist activity creation, audio uploads, practice submissions, clinical reviews, and SOAP-note creation.
- Added admin-authenticated `GET /api/admin/audit-logs` with search and category filters.

### Changed
- Connected the Admin Activity Logs screen and dashboard recent-activity panel to live audit records; removed the hardcoded activity-log sample data.
- Preserved existing search and category controls and added filters for activity, practice, clinical, and media events.

### Verification
- Backend syntax checks passed.
- Backend tests passed (14/14).
- Frontend `npx tsc --noEmit` passed.

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