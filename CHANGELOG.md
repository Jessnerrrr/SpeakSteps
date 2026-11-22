# SpeakSteps change log

This document records the Center Admin changes from the design review and the child navigation update in the current working tree.

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

## Activity Logs and Profile Settings

- Put date and time, category, activity, record name and ID, role, actor, result, and reason or note directly in Activity Logs. Rows display their information without opening a drawer.
- Kept search and category filtering and added a stacked presentation for narrower views. The Category dropdown opens above the table.
- Adjusted spacing and alignment in Profile Settings.

## Shared dropdown behavior

- Column filters open in an anchored overlay above scrollable tables. They stay open while selecting multiple options, and close on an outside click or Escape.
- The Directory Role menu fits below its header, highlights options on hover, and shows a checkmark for selected options.
- Archive Sort by uses the same dropdown styling as Role. Outside-click handling for these dropdowns uses a DOM element lookup on the web.

## Child navigation

- Updated the Play, Stars, and Buddy tab icons to a controller, star, and paw. Added an active-tab background and selected-state accessibility metadata.

## Files changed

- [Center Admin dashboard](frontend/src/app/%28admin%29/admin-dashboard.tsx)
- [Center Admin models and demo records](frontend/src/data/center-admin.ts)
- [Account details header](frontend/src/components/admin/AccountDetailsHeader.tsx)
- [Professional details](frontend/src/components/admin/ProfessionalDetails.tsx)
- [Child bottom navigation](frontend/src/components/child-bottom-nav.tsx)

## Verification and limits

- TypeScript and Git whitespace checks passed for the Center Admin changes.
- Chrome checks covered the filter menus on Directory, Student Requests, Archive Center, and Activity Logs. The Requests check included a narrower viewport and a one-row result with all Request Type options visible and selectable.
- Earlier Chrome checks covered archive restoration, archive count and empty state, restore activity entries, and Directory pagination.
- The archive dates come from demo data and available audit history. Older demo records may lack an original reason or administrator.
- The closure dialog layout was type-checked. Its visual layout and the child navigation changes were not verified on a device during this review.
- Expo lint did not run because the local Node.js and ESLint versions did not meet its requirements.
