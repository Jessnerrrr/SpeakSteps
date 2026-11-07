/**
 * SpeakSteps - Patient / Child Dashboard Mock Data
 * 
 * BACKEND INTEGRATION NOTE:
 * When connecting to your real backend API, replace this static object
 * with your API fetch hook (e.g. useQuery or useEffect) returning this shape.
 */

export interface AdventureCategory {
  id: string;
  name: string;
  iconType: 'sounds' | 'words' | 'phrases' | 'sentences';
  symbol: string;
  bgColor: string;
  badgeCount?: number;
  route?: string;
}

export interface PatientDashboardData {
  childName: string;
  greetingEmoji: string;
  activeBuddy: {
    name: string;
    speechBubbleText: string;
    // ASSET HOOK: When you import your buddy asset, update this image path
    avatarSource?: any;
  };
  stepsProgress: {
    earnedStars: number;
    completedActivities: number;
    totalActivities: number;
    encouragementText: string;
  };
  adventures: AdventureCategory[];
  quickActions: {
    activitiesCount: number;
    starsSummaryText: string;
  };
}

export const MOCK_PATIENT_DASHBOARD: PatientDashboardData = {
  childName: 'Mia!',
  greetingEmoji: '👋',
  activeBuddy: {
    name: 'Chirpy',
    speechBubbleText: "Hi Mia! Let's play with Chirpy! 🎉",
    avatarSource: null, // Set to require('../../assets/images/bird-logo.gif') later
  },
  stepsProgress: {
    earnedStars: 2,
    completedActivities: 2,
    totalActivities: 6,
    encouragementText: 'Great job, Mia!',
  },
  adventures: [
    {
      id: 'sounds',
      name: 'Sounds',
      iconType: 'sounds',
      symbol: 'musical-notes',
      bgColor: '#4DAEEB',
    },
    {
      id: 'words',
      name: 'Words',
      iconType: 'words',
      symbol: 'Aa',
      bgColor: '#6BB34C',
    },
    {
      id: 'phrases',
      name: 'Phrases',
      iconType: 'phrases',
      symbol: '❝❞',
      bgColor: '#F6A823',
    },
    {
      id: 'sentences',
      name: 'Sentences',
      iconType: 'sentences',
      symbol: 'clipboard',
      bgColor: '#EB4444',
    },
  ],
  quickActions: {
    activitiesCount: 6,
    starsSummaryText: 'See my stars',
  },
};
