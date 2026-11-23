import { sampleActivities } from '@/Therapist-modules/therapist-activities/data/activityData';
import type { Position } from '@/types/sentences';
import type { LearningPrompt } from './learning-workflow';

export interface ActivityItem {
  id: string;
  sound: string;
  soundBg: string;
  soundColor: string;
  category: 'Words' | 'Phrases' | 'Syllables' | 'Sound' | 'Sentences';
  title: string;
  subtitle: string;
  instructions: string;
  articulatoryGuide: string;
  language: 'English' | 'Tagalog';
  targetSound: string;
  practiceLevel: string;
  wordPositions: string[];
  targetPositions?: Partial<Record<string, Position>>;
  initialWords: string[];
  phrases: string[];
}

const levelPalette: Record<ActivityItem['category'], [string, string]> = {
  Words: ['#DCFCE7', '#16A34A'],
  Phrases: ['#FFEDD5', '#EA580C'],
  Syllables: ['#FEF9C3', '#CA8A04'],
  Sound: ['#E0F2FE', '#0284C7'],
  Sentences: ['#FFE4E6', '#E11D48'],
};

export const INITIAL_ACTIVITIES: ActivityItem[] = sampleActivities.map((activity) => {
  const [soundBg, soundColor] = levelPalette[activity.level];
  return {
    id: activity.id,
    sound: activity.sound,
    targetSound: activity.sound,
    soundBg,
    soundColor,
    category: activity.level,
    practiceLevel: activity.level,
    title: activity.title,
    subtitle: activity.language + ' ? Therapist library',
    instructions: activity.instructions,
    articulatoryGuide: activity.guide,
    language: activity.language === 'Tagalog' ? 'Tagalog' : 'English',
    wordPositions: activity.positions,
    targetPositions: Object.fromEntries(activity.words.map((word) => [word.text, word.position])),
    initialWords: activity.words.map((word) => word.text),
    phrases: activity.words.map((word) => word.phrase),
  };
});

export function getTeacherActivityPrompts(activity: ActivityItem): LearningPrompt[] {
  const phraseLevel = activity.category === 'Phrases' || activity.category === 'Sentences';
  return activity.initialWords.map((target, index) => ({
    text: (phraseLevel ? activity.phrases[index]?.trim() || target : target).trim(),
    position: activity.category === 'Sound' ? undefined : activity.targetPositions?.[target],
  })).filter(({ text }) => text.length > 0);
}
