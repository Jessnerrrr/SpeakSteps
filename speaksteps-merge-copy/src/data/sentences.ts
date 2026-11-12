import type { Language, Position, Sentence } from '../types/sentences';

// Placeholder content – replace with real sentences per language and sound position.
const makeSet = (language: Language, position: Position): Sentence[] =>
  Array.from({ length: 10 }, (_, i) => ({
    id: `${language}-${position}-${i + 1}`,
    sound: '/s/',
    syllable: 'sa',
    stars: 1 as const,
  }));

export const sentences: Record<Language, Record<Position, Sentence[]>> = {
  English: {
    Initial: makeSet('English', 'Initial'),
    Medial: makeSet('English', 'Medial'),
    Final: makeSet('English', 'Final'),
  },
  Tagalog: {
    Initial: makeSet('Tagalog', 'Initial'),
    Medial: makeSet('Tagalog', 'Medial'),
    Final: makeSet('Tagalog', 'Final'),
  },
};
