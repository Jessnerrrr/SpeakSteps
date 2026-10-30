# SpeakSteps — Project Development & Navigation Summary

This document provides a comprehensive overview of all architectural improvements, consolidated frontend structure, screen inventory, UI/UX updates, and a complete navigation guide for **SpeakSteps**.

---

## Table of Contents
1. [Overview of Work Completed](#1-overview-of-work-completed)
2. [Frontend Architecture & Clean-up](#2-frontend-architecture--clean-up)
3. [Complete Screen Inventory](#3-complete-screen-inventory)
4. [Custom Practice Screen Updates](#4-custom-practice-screen-updates)
5. [Data Models & Types](#5-data-models--types)
6. [Navigation & Routing Guide](#6-navigation--routing-guide)
7. [Running & Testing the App](#7-running--testing-the-app)

---

## 1. Overview of Work Completed

- **Consolidated Workspace**: Unified disjointed frontend code and cleaned up obsolete assets into a single clean Expo Router application under `SpeakSteps/frontend/`.
- **Integrated Full Screen Suite**: Connected 8+ dedicated screens for patients, parents, therapists, sentence selection, and speech practice.
- **Custom Mic & Visual Updates**: 
  - Integrated custom microphone icon asset (`assets/images/mic.png`).
  - Implemented `#F66540` vibrant circular recording trigger with active feedback.
  - Added bottom navigation bar (`Home`, `Play`, `Stars`, `Buddy`) to the Practice screen.
- **Dynamic Speech Dataset**: Added typed speech sentence cards supporting bilingual modes (**English** & **Tagalog**) across phoneme positions (**Initial**, **Medial**, **Final**).
- **Verified in Expo Web**: Configured and validated live testing on `http://localhost:8081`.

---

## 2. Frontend Architecture & Clean-up

The project uses **Expo Router v3+** with file-based routing:

```text
SpeakSteps/frontend/
├── assets/
│   ├── fonts/
│   │   └── SourGummy.ttf             # Custom playful brand typography
│   └── images/
│       ├── bird-logo.gif             # Chirpy mascot animation
│       ├── landing-bg-pattern.png    # Subtle background pattern
│       ├── landing-logo.gif          # Main animated brand logo
│       └── mic.png                   # Custom microphone asset
├── src/
│   ├── app/                          # Expo Router file-based pages
│   │   ├── _layout.tsx               # Root layout & Stack configuration
│   │   ├── index.tsx                 # Landing / Splash screen
│   │   ├── login.tsx                 # Portal selection (Patient vs Therapist)
│   │   ├── patient-login.tsx         # Patient / Parent login
│   │   ├── therapist-login.tsx       # Therapist clinical login
│   │   ├── create-account.tsx        # Registration hub
│   │   ├── register-patient.tsx      # Child / Patient registration form
│   │   ├── register-therapist.tsx    # Speech therapist registration form
│   │   ├── sentences.tsx             # Bilingual sentence & sound browser
│   │   └── practice.tsx              # Interactive speech exercise page
│   ├── data/
│   │   └── sentences.ts              # Categorized phoneme and syllable data
│   └── types/
│       └── sentences.ts              # TypeScript definitions for speech exercises
├── package.json
└── app.json
```

---

## 3. Complete Screen Inventory

| Route | File Path | Purpose & Key Features |
|---|---|---|
| `/` | `src/app/index.tsx` | **Landing Page**: Animated Chirpy logo, "Get Started" and "About SpeakSteps" action buttons. |
| `/login` | `src/app/login.tsx` | **Role Selection**: Two prominent entry cards for "Patient / Parent" and "Speech Therapist", plus account creation link. |
| `/patient-login` | `src/app/patient-login.tsx` | **Patient Auth**: Credentials login specifically tailored for families and kids. |
| `/therapist-login` | `src/app/therapist-login.tsx` | **Therapist Auth**: Practitioner sign-in portal with clinical profile authentication. |
| `/create-account` | `src/app/create-account.tsx` | **Registration Gateway**: Role selector leading to dedicated patient or therapist registration paths. |
| `/register-patient` | `src/app/register-patient.tsx` | **Patient Onboarding**: Form collecting child name, age, guardian details, and speech targets. |
| `/register-therapist` | `src/app/register-therapist.tsx` | **Therapist Onboarding**: Professional credentials, license number, and clinic info. |
| `/sentences` | `src/app/sentences.tsx` | **Sentences & Sound Hub**: Language switcher (English / Tagalog), position tabs (Initial / Medial / Final), 2-column exercise grid with star rating previews. |
| `/practice` | `src/app/practice.tsx` | **Practice Room**: Video demo card, Chirpy mascot banner, custom `#F66540` mic button, long-press recording, submit action, and bottom navigation bar. |

---

## 4. Custom Practice Screen Updates

1. **Custom Mic Icon (`assets/images/mic.png`)**:
   - Replaced default mic glyph with the user-provided PNG asset.
   - Contained inside an orange circular container with `#F66540` background and shadow elevation.
   - Long-press support (`onPressIn` and `onPressOut`) for real-time visual tactile feedback.
2. **Bottom Navigation Footer**:
   - Added sticky footer navigation with `Home`, `Play`, `Stars`, and `Buddy` items.
   - Active highlight on current section (`Play`).
   - Wired handlers to navigate directly to `/` (`Home`) and `/sentences` (`Play`).
3. **Sound Banner**:
   - Features animated Chirpy mascot alongside the active phoneme (e.g. `/s/ sa`).
4. **Video Modeling Card**:
   - Visual video demonstration area with "Watch again" replay action.

---

## 5. Data Models & Types

### Types (`src/types/sentences.ts`)
```typescript
export type Language = 'English' | 'Tagalog';
export type Position = 'Initial' | 'Medial' | 'Final';

export interface Sentence {
  id: string;
  sound: string;
  syllable: string;
  sentence: string;
  stars: 0 | 1 | 2 | 3;
}

export type SentencesData = Record<Language, Record<Position, Sentence[]>>;
```

### Supported Languages & Phoneme Positions
- **Languages**: English, Tagalog
- **Phoneme Positions**:
  - `Initial` (e.g., `/s/ sa`, `/s/ see`)
  - `Medial` (e.g., `/s/ asa`, `/s/ oso`)
  - `Final` (e.g., `/s/ us`, `/s/ is`)

---

## 6. Navigation & Routing Guide

### Interactive In-App Flow
```text
Landing (/)
   └── Click "Get Started"
        └── Login Hub (/login)
             ├── Choose "Patient" ──────> Patient Login (/patient-login)
             ├── Choose "Therapist" ────> Therapist Login (/therapist-login)
             └── Click "Create Account" ─> Create Account Hub (/create-account)
                                           ├── "I am a Patient" ───> Register Patient (/register-patient)
                                           └── "I am a Therapist" ─> Register Therapist (/register-therapist)

Sentences Browser (/sentences)
   ├── Toggle "English" / "Tagalog"
   ├── Toggle "Initial" / "Medial" / "Final"
   └── Tap any card (e.g., /s/ sa)
        └── Practice Room (/practice?sentenceId=English-Initial-1&sound=%2Fs%2F&syllable=sa&position=Initial)
             ├── Tap "‹" (Back) ────> Returns to /sentences
             ├── Tap "Home" ────────> Returns to /
             └── Tap "Play" ────────> Returns to /sentences
```

### Direct Browser URLs (Localhost)
When running on port **8081**:
- Landing Screen: `http://localhost:8081/`
- Role Login Hub: `http://localhost:8081/login`
- Patient Login: `http://localhost:8081/patient-login`
- Therapist Login: `http://localhost:8081/therapist-login`
- Create Account Hub: `http://localhost:8081/create-account`
- Register Patient: `http://localhost:8081/register-patient`
- Register Therapist: `http://localhost:8081/register-therapist`
- Sentences Catalog: `http://localhost:8081/sentences`
- Practice Screen (Sample): `http://localhost:8081/practice?sentenceId=English-Initial-1&sound=%2Fs%2F&syllable=sa&position=Initial`

---

## 7. Running & Testing the App

### Starting the Development Server
From `SpeakSteps/frontend`:
```bash
npm install
npx expo start --web --port 8081
```

### Hot Keys & Controls
- Press `w` in the terminal to open in browser.
- Press `r` to reload the bundler.
- Press `a` to open in Android Emulator (if configured).
- Press `i` to open in iOS Simulator (macOS only).
