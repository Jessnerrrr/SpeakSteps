import type { Language, Position, Sentence } from '../types/sentences';
import type { PracticeLevel } from './practice-levels';

const isolatedSounds = ['/s/', '/l/', '/r/', '/k/', '/t/'] as const;

const syllableFrames: Record<Position, readonly string[]> = {
  Initial: ['_a', '_i'],
  Medial: ['a_a', 'i_i'],
  Final: ['a_', 'i_'],
};


const prompts: Record<'words' | 'phrases' | 'sentences', Record<Language, readonly string[]>> = {
  words: {
    English: ['Sun', 'Soap', 'Sock', 'Sand', 'Seal', 'Soup'],
    Tagalog: ['Susi', 'Saging', 'Sabon', 'Sapatos', 'Sako', 'Sulat'],
  },
  phrases: {
    English: ['Soft sand', 'A blue sock', 'Wash with soap', 'A sunny day', 'Sip some soup', 'A small seal'],
    Tagalog: ['Gintong susi', 'Isang saging', 'Mabangong sabon', 'Bagong sapatos', 'Isang sako', 'Maikling sulat'],
  },
  sentences: {
    English: ['The sun is up.', 'I wash my hands with soap.', 'I put on my socks.', 'We play in the sand.', 'I sip warm soup.', 'The seal swims in the water.'],
    Tagalog: ['Nasa mesa ang susi.', 'Kumain ako ng saging.', 'Naghugas ako ng kamay gamit ang sabon.', 'Nagsuot ako ng sapatos.', 'May isang sako ng bigas.', 'Sumulat ako ng liham.'],
  },
};

export function getPracticePrompts(level: PracticeLevel, language: Language, position: Position): Sentence[] {
  if (level === 'Sound') {
    return isolatedSounds.map((sound) => ({ id: 'isolation-' + sound, sound, syllable: '', stars: 0 }));
  }

  if (level === 'Syllables') {
    return isolatedSounds.flatMap((sound) => syllableFrames[position].map((frame) => ({
      id: ['syllable', language, position, sound, frame].join('-'),
      sound,
      syllable: frame.replace('_', sound.slice(1, -1)),
      stars: 0,
    })));
  }

  const category = level.toLowerCase() as keyof typeof prompts;
  return prompts[category][language].map((prompt, index) => ({
    id: category + '-' + language + '-' + (index + 1),
    sound: '',
    syllable: prompt,
    stars: 0,
  }));
}
