# SpeakSteps Merge Copy

This folder contains the merge-ready SpeakSteps frontend work.

## Where to copy it

Copy the contents of this folder into the target project's `frontend/` directory. Keep this structure:

```text
frontend/
  assets/
  src/
  app.json
  package.json
  tsconfig.json
```

This copy includes the Initial, Medial, and Final sentence flow, all SpeakSteps assets, updated navigation, and the child-friendly UI.

## Run after merging

```bash
cd frontend
npm install
npm run start -- --web
```

The app opens at the sentence library. Sentence cards open the Practice screen.

## Important merge rules

1. Treat this folder as the source of truth for the SpeakSteps work.
2. Copy `src/app/`, `src/data/`, and `src/types/` into the target `frontend/src/` folders.
3. Copy every file in `assets/` into the target `frontend/assets/` folder. These assets are intentionally flat; do not recreate `assets/images/` or `assets/fonts/`.
4. Copy `app.json` and merge its Expo settings with the target project's `app.json`. Preserve the target project's app name, slug, icons, and unrelated plugins if they exist.
5. Merge the dependencies from this `package.json` into the target `frontend/package.json`; do not replace unrelated dependencies blindly.
6. Do not copy `node_modules/`, `.expo/`, `dist/`, or generated build files.
7. Do not copy old Expo starter components, hooks, or theme files into the target. They are intentionally excluded from this merge copy.

## Files and behavior included

- `src/app/index.tsx`: redirects the app root to `/sentences`.
- `src/app/sentences.tsx`: English/Tagalog language toggle, Initial/Medial/Final tabs, sentence cards, and navigation to Practice.
- `src/app/practice.tsx`: selected sound, video placeholder, microphone interaction, submit action, and navigation footer.
- Login and registration routes for patient and therapist accounts.
- Flattened assets used by the screens, including `SourGummy.ttf`, logos, backgrounds, microphone, calendar, and upload icons.

## Quick verification after merging

```bash
cd frontend
npm install
npx expo export --platform web
npm run start -- --web
```

If the export reports `assets/images` or `assets/fonts` missing, the assets were copied into the wrong location. They must be directly under `frontend/assets/`.
