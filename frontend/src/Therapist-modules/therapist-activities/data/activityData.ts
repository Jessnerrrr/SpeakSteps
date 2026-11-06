export const practiceLevels = ['Words', 'Phrases', 'Syllables', 'Isolation', 'Sentences'] as const;
export type PracticeLevel = (typeof practiceLevels)[number];

export const targetSounds = ['/s/', '/l/', '/r/', '/k/', '/t/'] as const;
export type TargetSound = (typeof targetSounds)[number];

export const wordPositions = ['Initial', 'Medial', 'Final'] as const;
export type WordPosition = (typeof wordPositions)[number];

export const positionChoices = [
  'Initial',
  'Medial',
  'Final',
  'Initial, Medial',
  'Initial, Final',
  'Medial, Final',
  'Initial, Medial, Final',
] as const;

export const activityLanguages = [
  'English',
  'Tagalog',
  'Bilingual Tagalog (L1) & English (L2)',
  'Bilingual English (L1) & Tagalog (L2)',
] as const;

export type ActivityStatus = 'Unassigned' | 'Assigned' | 'Completed';

export type BankWord = {
  id: string;
  text: string;
  sound: TargetSound;
  position: WordPosition;
  language: string;
};

export type ActivityWord = {
  id: string;
  text: string;
  sound: TargetSound;
  position: WordPosition;
  phrase: string;
};

export type Activity = {
  id: string;
  title: string;
  sound: TargetSound;
  level: PracticeLevel;
  positions: WordPosition[];
  language: string;
  instructions: string;
  guide: string;
  status: ActivityStatus;
  words: ActivityWord[];
  customLines: string[];
  visualName: string;
  studentName?: string;
  dueDate?: string;
};

export type ActivityDraft = {
  id?: string;
  step: 'focus' | 'content' | 'preview';
  title: string;
  sound: TargetSound;
  level: PracticeLevel;
  positionLabel: (typeof positionChoices)[number];
  language: string;
  instructions: string;
  guide: string;
  origin: 'bank' | 'custom';
  selectedSounds: TargetSound[];
  selectedWordIds: string[];
  phrases: Record<string, string>;
  customInput: string;
  customWords: ActivityWord[];
  customLines: string[];
  saveToBank: boolean;
  customSound: TargetSound;
  customPosition: WordPosition;
  visualName: string;
};

export const levelColors: Record<PracticeLevel, string> = {
  Words: '#D7E7C8',
  Phrases: '#F4D3C4',
  Syllables: '#F6E6BE',
  Isolation: '#D5E5F4',
  Sentences: '#F6D4CE',
};

export const sampleWordBank: BankWord[] = [
  { id: 'sun', text: 'sun', sound: '/s/', position: 'Initial', language: 'English' },
  { id: 'soap', text: 'soap', sound: '/s/', position: 'Initial', language: 'English' },
  { id: 'sock', text: 'sock', sound: '/s/', position: 'Initial', language: 'English' },
  { id: 'rabbit', text: 'rabbit', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'rain', text: 'rain', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'rat', text: 'rat', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'red', text: 'red', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'rice', text: 'rice', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'rich', text: 'rich', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'rose', text: 'rose', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'run', text: 'run', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'rock', text: 'rock', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'lip', text: 'lip', sound: '/l/', position: 'Initial', language: 'English' },
  { id: 'lake', text: 'lake', sound: '/l/', position: 'Initial', language: 'English' },
  { id: 'cat', text: 'cat', sound: '/k/', position: 'Initial', language: 'English' },
  { id: 'cup', text: 'cup', sound: '/k/', position: 'Initial', language: 'English' },
  { id: 'top', text: 'top', sound: '/t/', position: 'Initial', language: 'English' },
  { id: 'tea', text: 'tea', sound: '/t/', position: 'Initial', language: 'English' },
];

const defaultInstructions = 'Listen to the model. Say each target slowly, then try it on your own.';

export const sampleActivities: Activity[] = [
  {
    id: 'sunny-sounds',
    title: 'Sunny Sounds',
    sound: '/s/',
    level: 'Words',
    positions: ['Initial'],
    language: 'English',
    instructions: defaultInstructions,
    guide: 'Keep the tongue tip behind the teeth and send the air forward.',
    status: 'Unassigned',
    words: [
      { id: 'sun', text: 'sun', sound: '/s/', position: 'Initial', phrase: '' },
      { id: 'sock', text: 'sock', sound: '/s/', position: 'Initial', phrase: '' },
    ],
    customLines: [],
    visualName: '',
  },
  {
    id: 'ready-set-r',
    title: 'Ready, set, /r/',
    sound: '/r/',
    level: 'Phrases',
    positions: ['Initial', 'Medial', 'Final'],
    language: 'English',
    instructions: defaultInstructions,
    guide: 'Pull tongue tip back, lips slightly relaxed.',
    status: 'Unassigned',
    words: [
      { id: 'red', text: 'red', sound: '/r/', position: 'Initial', phrase: 'I see a red apple.' },
      { id: 'run', text: 'run', sound: '/r/', position: 'Initial', phrase: 'See the dog run fast!' },
      { id: 'rabbit', text: 'rabbit', sound: '/r/', position: 'Initial', phrase: 'The little rabbit hid.' },
    ],
    customLines: [],
    visualName: '',
  },
  {
    id: 'little-l',
    title: 'Little /l/ steps',
    sound: '/l/',
    level: 'Syllables',
    positions: ['Initial'],
    language: 'English',
    instructions: defaultInstructions,
    guide: 'Lift the tongue tip to the ridge behind the top teeth.',
    status: 'Unassigned',
    words: [{ id: 'lip', text: 'lip', sound: '/l/', position: 'Initial', phrase: '' }],
    customLines: [],
    visualName: '',
  },
  {
    id: 'sound-explorers',
    title: 'Sound explorers',
    sound: '/s/',
    level: 'Isolation',
    positions: ['Initial'],
    language: 'English',
    instructions: defaultInstructions,
    guide: 'Hold a long, quiet /s/ with the teeth close together.',
    status: 'Unassigned',
    words: [{ id: 'sun', text: 'sun', sound: '/s/', position: 'Initial', phrase: '' }],
    customLines: [],
    visualName: '',
  },
  {
    id: 'say-sentence',
    title: 'Say it in a sentence',
    sound: '/t/',
    level: 'Sentences',
    positions: ['Initial'],
    language: 'English',
    instructions: defaultInstructions,
    guide: 'Tap the tongue tip up, then release the air for /t/.',
    status: 'Unassigned',
    words: [{ id: 'tea', text: 'tea', sound: '/t/', position: 'Initial', phrase: 'I want tea.' }],
    customLines: [],
    visualName: '',
  },
];

export function usesPhraseFields(level: PracticeLevel) {
  return level === 'Phrases' || level === 'Sentences';
}

export function positionsFromLabel(label: string): WordPosition[] {
  return wordPositions.filter((position) => label.includes(position));
}

export function emptyDraft(): ActivityDraft {
  return {
    step: 'focus',
    title: '',
    sound: '/r/',
    level: 'Phrases',
    positionLabel: 'Initial, Medial, Final',
    language: 'English',
    instructions: defaultInstructions,
    guide: '',
    origin: 'bank',
    selectedSounds: ['/r/'],
    selectedWordIds: [],
    phrases: {},
    customInput: '',
    customWords: [],
    customLines: [''],
    saveToBank: false,
    customSound: '/r/',
    customPosition: 'Initial',
    visualName: '',
  };
}

export function draftFromActivity(activity: Activity): ActivityDraft {
  return {
    id: activity.id,
    step: 'focus',
    title: activity.title,
    sound: activity.sound,
    level: activity.level,
    positionLabel: positionChoices.find((choice) => positionsFromLabel(choice).join(',') === activity.positions.join(',')) || 'Initial',
    language: activity.language,
    instructions: activity.instructions,
    guide: activity.guide,
    origin: 'bank',
    selectedSounds: [activity.sound],
    selectedWordIds: activity.words.map((word) => word.id),
    phrases: Object.fromEntries(activity.words.map((word) => [word.id, word.phrase])),
    customInput: '',
    customWords: [],
    customLines: activity.customLines.length > 0 ? activity.customLines : [''],
    saveToBank: false,
    customSound: activity.sound,
    customPosition: activity.positions[0] || 'Initial',
    visualName: activity.visualName,
  };
}

export function activityFromDraft(draft: ActivityDraft, wordBank: BankWord[], status: ActivityStatus): Activity {
  const positions = positionsFromLabel(draft.positionLabel);
  const bankWords = wordBank
    .filter((word) => draft.selectedWordIds.includes(word.id))
    .map((word) => ({ ...word, phrase: draft.phrases[word.id] || '' }));
  const words = draft.origin === 'custom' ? draft.customWords : bankWords;
  return {
    id: draft.id || `activity-${Date.now()}`,
    title: draft.title.trim(),
    sound: draft.sound,
    level: draft.level,
    positions,
    language: draft.language,
    instructions: draft.instructions.trim(),
    guide: draft.guide.trim(),
    status,
    words,
    customLines: usesPhraseFields(draft.level) ? draft.customLines.map((line) => line.trim()).filter(Boolean) : [],
    visualName: draft.visualName,
  };
}
