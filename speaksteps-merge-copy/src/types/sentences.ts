export type Position = 'Initial' | 'Medial' | 'Final';
export type Language = 'English' | 'Tagalog';
export type NavTab = 'Home' | 'Play' | 'Stars' | 'Buddy';

export interface Sentence {
  id: string;
  sound: string;   // e.g. "/s/"
  syllable: string; // e.g. "sa"
  stars: 0 | 1 | 2 | 3;
}

export const POSITIONS: Position[] = ['Initial', 'Medial', 'Final'];
