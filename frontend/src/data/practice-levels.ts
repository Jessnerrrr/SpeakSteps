export const practiceLevels = ['Sound', 'Syllables', 'Words', 'Phrases', 'Sentences'] as const;
export type PracticeLevel = (typeof practiceLevels)[number];
