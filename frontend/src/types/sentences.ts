export type Position = 'Initial' | 'Medial' | 'Final';
export type Language = 'English' | 'Tagalog';
export const PRACTICE_LANGUAGES = ['English', 'Tagalog'] as const;

export function matchesPracticeLanguage(source: string | undefined, language: string | undefined) {
  return !language || Boolean(source?.includes(language));
}
export type NavTab = 'Home' | 'Play' | 'Stars' | 'Buddy';

export interface Sentence {
  id: string;
  practiceItemId?: string;
  sound: string;   // e.g. "/s/"
  syllable: string; // e.g. "sa"
  stars: 0 | 1 | 2 | 3;
  modelAudioUrl?: string;
}

export const POSITIONS: Position[] = ['Initial', 'Medial', 'Final'];
