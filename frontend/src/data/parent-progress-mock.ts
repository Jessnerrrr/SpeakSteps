/**
 * SpeakSteps - Parent Progress & History Mock Data
 *
 * In sync with Child Dashboard (`MOCK_PATIENT_DASHBOARD`) & Stars Mock (`MOCK_STARS_DATA`):
 * - Completed: 2 activities (Sounds: 1, Words: 1)
 * - Pending: 4 activities (Sounds: 1, Words: 1, Phrases: 1, Sentences: 1)
 * - Practice Attempts: 2
 * - Level Progress:
 *   - Sounds: 1/3
 *   - Words: 1/3
 *   - Phrases: 0/3
 *   - Sentences: 0/3
 */

import { MOCK_STARS_DATA } from './stars-mock';
import { MOCK_PATIENT_DASHBOARD } from './patient-dashboard-mock';
import { INITIAL_ASSIGNED_ACTIVITIES } from './parent-tasks-mock';

export interface CategoryProgress {
  id: string;
  name: 'Sounds' | 'Words' | 'Phrases' | 'Sentences';
  iconType: 'sounds' | 'words' | 'phrases' | 'sentences';
  completedCount: number;
  totalCount: number;
  attempts: number;
  pendingCount: number;
  barColor: string;
  circleBg: string;
}

export interface TherapistFeedbackItem {
  id: string;
  therapistName: string;
  specialty?: string;
  date: string;
  displayDate?: string;
  title: string;
  comments: string;
  category: 'Sounds' | 'Words' | 'Phrases' | 'Sentences' | 'General';
  recommendations?: string;
  avatarImage?: any;
}

export interface ProgressSummary {
  completed: number;
  pending: number;
  practiceAttempts: number;
  categories: CategoryProgress[];
  feedback: TherapistFeedbackItem[];
}

export const MOCK_FEEDBACK_ITEMS: TherapistFeedbackItem[] = [
  {
    id: 'fb-1',
    therapistName: 'Teacher Jadey',
    specialty: 'Speech-Language Pathologist',
    date: '2026 - 10 - 31',
    displayDate: 'October 31, 2026',
    title: 'Lip Closure & Bilabial Sounds Practice',
    comments:
      'Mia showed tremendous improvement in imitating bilabial sounds like /b/, /p/, and /m/. She is very responsive to interactive visual prompts and playful clapping rhythms.',
    category: 'Sounds',
    recommendations:
      'Practice popping bubbles and saying "Pop!" during play or bath time. Encourage exaggerated lip movements in front of a mirror.',
  },
  {
    id: 'fb-2',
    therapistName: 'Teacher Jadey',
    specialty: 'Speech-Language Pathologist',
    date: '2026 - 10 - 31',
    displayDate: 'October 31, 2026',
    title: 'Single Syllable Word Articulation',
    comments:
      'Great attention and focus during the picture card exercises. She successfully pronounced "Ball", "Mom", and "Cup" with clear initial consonants.',
    category: 'Words',
    recommendations:
      'Read picture books together daily. Point to simple everyday objects and have Mia repeat each word twice with gentle positive praise.',
  },
  {
    id: 'fb-3',
    therapistName: 'Teacher Jadey',
    specialty: 'Speech-Language Pathologist',
    date: '2026 - 10 - 28',
    displayDate: 'October 28, 2026',
    title: 'Two-Word Phrase Combinations',
    comments:
      'Mia is progressing well with combining words like "More milk" and "Big dog". Her vocal pitch is becoming more confident and clear.',
    category: 'Phrases',
    recommendations:
      'Model two-word phrases during snack time (e.g., "Want water", "More apple"). Wait 5 seconds to give her time to respond before assisting.',
  },
  {
    id: 'fb-4',
    therapistName: 'Teacher Jadey',
    specialty: 'Speech-Language Pathologist',
    date: '2026 - 10 - 25',
    displayDate: 'October 25, 2026',
    title: 'Vowel Sound Sustaining & Pitch',
    comments:
      'Practiced sustaining long vowel sounds ("ah", "ee", "oo") with toy cars and animals. Mia demonstrated steady breath support and good vocal loudness.',
    category: 'Sounds',
    recommendations:
      'Sing nursery rhymes emphasizing long vowel sounds (e.g., "Old MacDonald"). Encourage holding the sound for 3 seconds.',
  },
  {
    id: 'fb-5',
    therapistName: 'Teacher Jadey',
    specialty: 'Speech-Language Pathologist',
    date: '2026 - 10 - 20',
    displayDate: 'October 20, 2026',
    title: 'Early Sentence Structure Building',
    comments:
      'Mia is beginning to connect 3-word sentences with visual flashcards ("I see bird", "Cat is soft"). Her enthusiasm was palpable today!',
    category: 'Sentences',
    recommendations:
      'Use visual choice boards at home. Ask open questions like "Who is that?" to invite complete short sentences.',
  },
  {
    id: 'fb-6',
    therapistName: 'Doc. Tere',
    specialty: 'Clinical Speech Pathologist',
    date: '2026 - 10 - 15',
    displayDate: 'October 15, 2026',
    title: 'Action Verbs & Motor Coordination',
    comments:
      'Focused on high-frequency action verbs (run, jump, eat). Mia engaged with full physical actions while vocalizing the verbs.',
    category: 'Words',
    recommendations:
      'Play gentle Simon Says games incorporating vocal imitation of verbs during physical movement.',
  },
  {
    id: 'fb-7',
    therapistName: 'Teacher Anna',
    specialty: 'Pediatric Speech Specialist',
    date: '2026 - 10 - 10',
    displayDate: 'October 10, 2026',
    title: 'Initial Consonant Precision (/d/ & /t/)',
    comments:
      'Good progress on alveolar sounds /d/ and /t/. We used tactile tapping on the table to provide multi-sensory feedback.',
    category: 'Sounds',
    recommendations:
      'Tap gently on a table or drum while making the /d/ sound to reinforce the tongue-to-roof contact.',
  },
];

// Target milestones per level: 3 milestones
const TARGET_MILESTONES = 3;

// Synchronized metrics derived from child dashboard mock data
const soundsCompleted = MOCK_STARS_DATA.categories.find((c) => c.id === 'sounds')?.completed ?? 1;
const wordsCompleted = MOCK_STARS_DATA.categories.find((c) => c.id === 'words')?.completed ?? 1;
const phrasesCompleted = MOCK_STARS_DATA.categories.find((c) => c.id === 'phrases')?.completed ?? 0;
const sentencesCompleted = MOCK_STARS_DATA.categories.find((c) => c.id === 'sentences')?.completed ?? 0;

export const INITIAL_PROGRESS_DATA: ProgressSummary = {
  completed: MOCK_PATIENT_DASHBOARD.stepsProgress.completedActivities, // 2
  pending:
    MOCK_PATIENT_DASHBOARD.stepsProgress.totalActivities -
    MOCK_PATIENT_DASHBOARD.stepsProgress.completedActivities, // 4
  practiceAttempts: 2,
  categories: [
    {
      id: 'cat-sounds',
      name: 'Sounds',
      iconType: 'sounds',
      completedCount: soundsCompleted, // 1
      totalCount: TARGET_MILESTONES, // 3
      attempts: 1,
      pendingCount: 1,
      barColor: '#0D68AC',
      circleBg: '#5DADE2',
    },
    {
      id: 'cat-words',
      name: 'Words',
      iconType: 'words',
      completedCount: wordsCompleted, // 1
      totalCount: TARGET_MILESTONES, // 3
      attempts: 1,
      pendingCount: 1,
      barColor: '#68BA50',
      circleBg: '#76C25B',
    },
    {
      id: 'cat-phrases',
      name: 'Phrases',
      iconType: 'phrases',
      completedCount: phrasesCompleted, // 0
      totalCount: TARGET_MILESTONES, // 3
      attempts: 0,
      pendingCount: 1,
      barColor: '#F5A623',
      circleBg: '#F5A623',
    },
    {
      id: 'cat-sentences',
      name: 'Sentences',
      iconType: 'sentences',
      completedCount: sentencesCompleted, // 0
      totalCount: TARGET_MILESTONES, // 3
      attempts: 0,
      pendingCount: 1,
      barColor: '#FF4D4D',
      circleBg: '#FF4D4D',
    },
  ],
  feedback: MOCK_FEEDBACK_ITEMS,
};