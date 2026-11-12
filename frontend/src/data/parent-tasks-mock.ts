/**
 * SpeakSteps - Parent Assigned Activities Mock Data
 *
 * In sync with Child Dashboard (`MOCK_PATIENT_DASHBOARD`) & Stars Mock (`MOCK_STARS_DATA`):
 * - Total Activities: 6
 * - Completed Activities: 2 (Sounds: 1, Words: 1)
 * - Pending Activities: 4 (Sounds: 1, Words: 1, Phrases: 1, Sentences: 1)
 * - Total Stars Earned: 2
 */

import { MOCK_PATIENT_DASHBOARD } from './patient-dashboard-mock';
import { MOCK_STARS_DATA } from './stars-mock';

export type ActivityCategory = 'Sounds' | 'Words' | 'Phrases' | 'Sentences';
export type ActivityStatus = 'pending' | 'completed';

export interface AssignedActivity {
  id: string;
  title: string;
  level: string;
  category: ActivityCategory;
  assignedBy: string;
  status: ActivityStatus;
  completedDate?: string;
  thumbnail: any;
  description?: string;
  attempts: number;
  bestScore: string;
  stars: string;
}

/**
 * 6 Assigned Activities perfectly aligned with the Child Dashboard:
 * - Sounds (2 total: 1 completed, 1 pending)
 * - Words (2 total: 1 completed, 1 pending)
 * - Phrases (1 pending)
 * - Sentences (1 pending)
 * Total: 6 activities (2 completed, 4 pending)
 */
export const INITIAL_ASSIGNED_ACTIVITIES: AssignedActivity[] = [
  {
    id: 'task-1',
    title: 'baa',
    level: 'Level 1 • Sounds',
    category: 'Sounds',
    assignedBy: 'Teacher Anna',
    status: 'completed',
    completedDate: 'Nov 4, 2026',
    thumbnail: require('../../assets/images/sheep.png'),
    description: 'Practice the /b/ animal sound by imitating a sheep.',
    attempts: 1,
    bestScore: '95%',
    stars: '1 ★',
  },
  {
    id: 'task-2',
    title: 'baa',
    level: 'Level 1 • Sounds',
    category: 'Sounds',
    assignedBy: 'Doc. Tere',
    status: 'pending',
    thumbnail: require('../../assets/images/sheep.png'),
    description: 'Listen and repeat the sheep sound clearly with open vowels.',
    attempts: 0,
    bestScore: '—',
    stars: '—',
  },
  {
    id: 'task-3',
    title: 'baa',
    level: 'Level 1 • Words',
    category: 'Words',
    assignedBy: 'Teacher Anna',
    status: 'completed',
    completedDate: 'Nov 2, 2026',
    thumbnail: require('../../assets/images/sheep.png'),
    description: 'Practice consonant articulation with familiar single-syllable word.',
    attempts: 1,
    bestScore: '92%',
    stars: '1 ★',
  },
  {
    id: 'task-4',
    title: 'baa',
    level: 'Level 1 • Words',
    category: 'Words',
    assignedBy: 'Doc. Tere',
    status: 'pending',
    thumbnail: require('../../assets/images/sheep.png'),
    description: 'Practice lip closure and vocal release on word initiation.',
    attempts: 0,
    bestScore: '—',
    stars: '—',
  },
  {
    id: 'task-5',
    title: 'baa',
    level: 'Level 1 • Phrases',
    category: 'Phrases',
    assignedBy: 'Teacher Anna',
    status: 'pending',
    thumbnail: require('../../assets/images/sheep.png'),
    description: 'Combine short expressive sounds smoothly with rhythm.',
    attempts: 0,
    bestScore: '—',
    stars: '—',
  },
  {
    id: 'task-6',
    title: 'baa',
    level: 'Level 1 • Sentences',
    category: 'Sentences',
    assignedBy: 'Doc. Tere',
    status: 'pending',
    thumbnail: require('../../assets/images/sheep.png'),
    description: 'Animal sound repetition in simple sentence pattern.',
    attempts: 0,
    bestScore: '—',
    stars: '—',
  },
];

let activeTaskId: string = INITIAL_ASSIGNED_ACTIVITIES[0].id;

export const getActivityById = (id?: string | null): AssignedActivity => {
  if (!id) return INITIAL_ASSIGNED_ACTIVITIES[0];
  const found = INITIAL_ASSIGNED_ACTIVITIES.find((item) => item.id === id);
  return found || INITIAL_ASSIGNED_ACTIVITIES[0];
};

export const TaskStore = {
  getActivities(): AssignedActivity[] {
    return INITIAL_ASSIGNED_ACTIVITIES;
  },

  getActivityById(id?: string | null): AssignedActivity {
    return getActivityById(id);
  },

  setActiveTaskId(id: string) {
    activeTaskId = id;
  },

  getActiveTaskId(): string {
    return activeTaskId;
  },

  getActiveTask(): AssignedActivity {
    return getActivityById(activeTaskId);
  },
};
