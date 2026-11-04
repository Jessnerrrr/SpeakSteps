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
