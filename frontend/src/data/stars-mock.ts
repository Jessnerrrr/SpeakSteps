/**
 * SpeakSteps - Patient Stars Mock Data
 * 
 * BACKEND INTEGRATION NOTE:
 * When connecting to your real backend API, replace this static object
 * with your API fetch hook returning this data structure.
 */

export interface CategoryProgress {
  id: 'sounds' | 'words' | 'phrases' | 'sentences';
  title: string;
  completed: number;
  total: number;
  badgeBgColor: string;
  iconType: 'sounds' | 'words' | 'phrases' | 'sentences';
}

export interface StarsScreenData {
  childName: string;
  totalStarsEarned: number;
  totalActivitiesCompleted: number;
  totalActivitiesTarget: number;
  encouragementText: string;
  categories: CategoryProgress[];
}

export const MOCK_STARS_DATA: StarsScreenData = {
  childName: 'Mia',
  totalStarsEarned: 2,
  totalActivitiesCompleted: 2,
  totalActivitiesTarget: 6,
  encouragementText: 'Great job, Mia!',
  categories: [
    {
      id: 'sounds',
      title: 'Sounds',
      completed: 1,
      total: 6,
      badgeBgColor: '#4DAEEB',
      iconType: 'sounds',
    },
    {
      id: 'words',
      title: 'Words',
      completed: 1,
      total: 6,
      badgeBgColor: '#6BB34C',
      iconType: 'words',
    },
    {
      id: 'phrases',
      title: 'Phrases',
      completed: 0,
      total: 6,
      badgeBgColor: '#F6A823',
      iconType: 'phrases',
    },
    {
      id: 'sentences',
      title: 'Sentences',
      completed: 0,
      total: 6,
      badgeBgColor: '#EB4444',
      iconType: 'sentences',
    },
  ],
};
