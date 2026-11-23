import type { PracticeLevel } from '@/data/practice-levels';
import type { LearningPrompt } from '@/data/learning-workflow';
import type { Language } from '@/types/sentences';
import { parseCalendarDate, todayCalendarDate } from '@/data/calendar-date';
export { practiceLevels, type PracticeLevel } from '@/data/practice-levels';

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
  assignments?: { studentId: string; studentName: string; dueDate: string; instructions: string }[];
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
  Sound: '#D5E5F4',
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

type StarterTargets = readonly (readonly [string, WordPosition, string?])[];

const soundGuidance: Record<Language, Record<TargetSound, string>> = {
  English: {
    '/s/': 'Keep your teeth close together and let the air flow steadily, like a quiet hiss.',
    '/l/': 'Touch the tip of your tongue just behind your top teeth as you say /l/.',
    '/r/': 'Keep your lips relaxed and listen for the /r/ sound in the target.',
    '/k/': 'Lift the back of your tongue, then let the air out with a short /k/.',
    '/t/': 'Tap the tip of your tongue just behind your top teeth, then release it.',
  },
  Tagalog: {
    '/s/': 'Ilapit ang mga ngipin sa isa’t isa at dahan-dahang palabasin ang hangin para sa /s/.',
    '/l/': 'Idampi ang dulo ng dila sa likod ng mga ngipin sa itaas habang binibigkas ang /l/.',
    '/r/': 'Pakinggan ang tunog na /r/ sa salita bago ito ulitin.',
    '/k/': 'Iangat ang likod ng dila at pakawalan ang hangin para sa maikling /k/.',
    '/t/': 'Idampi sandali ang dulo ng dila sa likod ng mga ngipin sa itaas, saka bitawan.',
  },
};

function starterActivity(
  id: string, title: string, language: Language, level: PracticeLevel,
  sound: TargetSound, targets: StarterTargets, instructions: string,
): Activity {
  return {
    id, title, language, level, sound, instructions,
    guide: soundGuidance[language][sound], status: 'Unassigned', customLines: [], visualName: '',
    positions: [...new Set(targets.map(([, position]) => position))],
    words: targets.map(([text, position, phrase = ''], index) => ({
      id: id + '-' + index, text, position, phrase, sound,
    })),
  };
}

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
    words: [
      { id: 'little-l-la', text: 'la', sound: '/l/', position: 'Initial', phrase: '' },
      { id: 'little-l-li', text: 'li', sound: '/l/', position: 'Initial', phrase: '' },
    ],
    customLines: [],
    visualName: '',
  },
  {
    id: 'sound-explorers',
    title: 'Sound explorers',
    sound: '/s/',
    level: 'Sound',
    positions: ['Initial'],
    language: 'English',
    instructions: defaultInstructions,
    guide: 'Hold a long, quiet /s/ with the teeth close together.',
    status: 'Unassigned',
    words: [{ id: 'sound-explorers-sss', text: 'sss', sound: '/s/', position: 'Initial', phrase: '' }],
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
  starterActivity('en-k-isolation', 'Quiet /k/ taps', 'English', 'Sound', '/k/', [['/k/', 'Initial']], 'Say the sound by itself. Pause between tries.'),
  starterActivity('en-s-syllables', 'Mix and match /s/', 'English', 'Syllables', '/s/', [['sa', 'Initial'], ['asa', 'Medial'], ['as', 'Final']], 'Say each syllable slowly.'),
  starterActivity('en-k-words', 'Find the /k/ words', 'English', 'Words', '/k/', [['cup', 'Initial'], ['baker', 'Medial'], ['book', 'Final']], 'Say each word, then say it once more.'),
  starterActivity('en-l-phrases', 'Little /l/ phrases', 'English', 'Phrases', '/l/', [['leaf', 'Initial', 'a green leaf'], ['balloon', 'Medial', 'a red balloon'], ['bell', 'Final', 'a small bell']], 'Say each phrase slowly.'),
  starterActivity('en-k-sentences', 'Story time with /k/', 'English', 'Sentences', '/k/', [['cake', 'Initial', 'I see a cake.'], ['ticket', 'Medial', 'I have a ticket.'], ['duck', 'Final', 'The duck is in the pond.']], 'Read each sentence aloud.'),
  starterActivity('tl-s-isolation', 'Tunog na /s/', 'Tagalog', 'Sound', '/s/', [['sss', 'Initial']], 'Bigkasin ang tunog na /s/ nang dahan-dahan.'),
  starterActivity('tl-t-isolation', 'Tunog na /t/', 'Tagalog', 'Sound', '/t/', [['/t/', 'Initial']], 'Bigkasin ang tunog na /t/. Huminto sandali bago ulitin.'),
  starterActivity('tl-k-syllables', 'Pantig na may /k/', 'Tagalog', 'Syllables', '/k/', [['ka', 'Initial'], ['aka', 'Medial'], ['ak', 'Final']], 'Bigkasin ang bawat pantig.'),
  starterActivity('tl-l-syllables', 'Pantig na may /l/', 'Tagalog', 'Syllables', '/l/', [['la', 'Initial'], ['ala', 'Medial'], ['al', 'Final']], 'Bigkasin nang dahan-dahan ang bawat pantig.'),
  starterActivity('tl-s-words', 'Mga salitang may /s/', 'Tagalog', 'Words', '/s/', [['susi', 'Initial'], ['baso', 'Medial'], ['gatas', 'Final']], 'Bigkasin ang bawat salita at ulitin ito.'),
  starterActivity('tl-l-words', 'Mga salitang may /l/', 'Tagalog', 'Words', '/l/', [['laro', 'Initial'], ['bala', 'Medial'], ['mahal', 'Final']], 'Bigkasin ang bawat salita nang malinaw.'),
  starterActivity('tl-s-phrases', 'Mga pariralang may /s/', 'Tagalog', 'Phrases', '/s/', [['susi', 'Initial', 'ang gintong susi'], ['baso', 'Medial', 'isang baso'], ['gatas', 'Final', 'mainit na gatas']], 'Basahin nang malakas ang bawat parirala.'),
  starterActivity('tl-k-phrases', 'Mga pariralang may /k/', 'Tagalog', 'Phrases', '/k/', [['kahon', 'Initial', 'maliit na kahon'], ['sako', 'Medial', 'isang sako'], ['manok', 'Final', 'ang puting manok']], 'Bigkasin ang bawat parirala nang dahan-dahan.'),
  starterActivity('tl-s-sentences', 'Mga pangungusap na may /s/', 'Tagalog', 'Sentences', '/s/', [['sabon', 'Initial', 'May sabon dito.'], ['baso', 'Medial', 'May tubig sa baso.'], ['gatas', 'Final', 'Uminom ako ng gatas.']], 'Basahin ang bawat pangungusap.'),
  starterActivity('tl-t-sentences', 'Mga pangungusap na may /t/', 'Tagalog', 'Sentences', '/t/', [['tubig', 'Initial', 'Uminom ako ng tubig.'], ['bata', 'Medial', 'Naglalaro ang bata.'], ['sulat', 'Final', 'May dala akong sulat.']], 'Basahin nang malakas ang bawat pangungusap.'),
  starterActivity("en-l-sound", "Say the /l/ sound", "English", "Sound", "/l/", [["/l/","Initial"]], "Say the sound on its own, then pause."),
  starterActivity("en-t-sound", "Tap out /t/", "English", "Sound", "/t/", [["/t/","Initial"]], "Say the sound on its own, then pause."),
  starterActivity("tl-k-sound", "Tunog na /k/", "Tagalog", "Sound", "/k/", [["/k/","Initial"]], "Bigkasin ang tunog, saka huminto sandali."),
  starterActivity("tl-l-sound", "Tunog na /l/", "Tagalog", "Sound", "/l/", [["/l/","Initial"]], "Bigkasin ang tunog, saka huminto sandali."),
  starterActivity("en-k-syllables", "Try /k/ syllables", "English", "Syllables", "/k/", [["ka","Initial"],["aka","Medial"],["ak","Final"]], "Say each syllable slowly."),
  starterActivity("en-t-syllables", "Tap the /t/ syllables", "English", "Syllables", "/t/", [["ta","Initial"],["ata","Medial"],["at","Final"]], "Say each syllable slowly."),
  starterActivity("tl-s-syllables", "Pantig na may /s/", "Tagalog", "Syllables", "/s/", [["sa","Initial"],["asa","Medial"],["as","Final"]], "Bigkasin nang dahan-dahan ang bawat pantig."),
  starterActivity("tl-t-syllables", "Pantig na may /t/", "Tagalog", "Syllables", "/t/", [["ta","Initial"],["ata","Medial"],["at","Final"]], "Bigkasin nang dahan-dahan ang bawat pantig."),
  starterActivity("en-l-words", "Look for /l/", "English", "Words", "/l/", [["lamp","Initial"],["pillow","Medial"],["bell","Final"]], "Say each word aloud."),
  starterActivity("en-t-words", "Try these /t/ words", "English", "Words", "/t/", [["tea","Initial"],["until","Medial"],["hat","Final"]], "Say each word aloud."),
  starterActivity("tl-k-words", "Mga salitang may /k/", "Tagalog", "Words", "/k/", [["kubo","Initial"],["baka","Medial"],["manok","Final"]], "Bigkasin ang bawat salita."),
  starterActivity("tl-t-words", "Mga salitang may /t/", "Tagalog", "Words", "/t/", [["tasa","Initial"],["bata","Medial"],["sulat","Final"]], "Bigkasin ang bawat salita."),
  starterActivity("en-k-phrases", "A few /k/ phrases", "English", "Phrases", "/k/", [["cup","Initial","a blue cup"],["baker","Medial","a busy baker"],["book","Final","my favorite book"]], "Say each phrase aloud."),
  starterActivity("en-t-phrases", "Short /t/ phrases", "English", "Phrases", "/t/", [["tea","Initial","a cup of tea"],["until","Medial","until next week"],["hat","Final","my red hat"]], "Say each phrase aloud."),
  starterActivity("tl-l-phrases", "Mga pariralang may /l/", "Tagalog", "Phrases", "/l/", [["lobo","Initial","pulang lobo"],["bilog","Medial","ilang bilog"],["dasal","Final","maikling dasal"]], "Bigkasin ang bawat parirala."),
  starterActivity("tl-t-phrases", "Mga pariralang may /t/", "Tagalog", "Phrases", "/t/", [["tasa","Initial","isang tasa"],["bata","Medial","masayang bata"],["sulat","Final","maikling sulat"]], "Bigkasin ang bawat parirala."),
  starterActivity("en-l-sentences", "Story time with /l/", "English", "Sentences", "/l/", [["lamp","Initial","The lamp is on."],["pillow","Medial","I hugged my pillow."],["bell","Final","I heard a bell."]], "Read each sentence aloud."),
  starterActivity("en-s-sentences", "Story time with /s/", "English", "Sentences", "/s/", [["soup","Initial","My soup is warm."],["pencil","Medial","I found a pencil."],["bus","Final","We rode the bus."]], "Read each sentence aloud."),
  starterActivity("tl-k-sentences", "Mga pangungusap na may /k/", "Tagalog", "Sentences", "/k/", [["kahon","Initial","May laman ang kahon."],["baka","Medial","May baka sa bukid."],["manok","Final","Nasa bakuran ang manok."]], "Basahin nang malakas ang bawat pangungusap."),
  starterActivity("tl-l-sentences", "Mga pangungusap na may /l/", "Tagalog", "Sentences", "/l/", [["lobo","Initial","Lumipad ang lobo."],["bilog","Medial","Gumuhit ako ng bilog."],["dasal","Final","May maikling dasal."]], "Basahin nang malakas ang bawat pangungusap."),
];

export function usesPhraseFields(level: PracticeLevel) {
  return level === 'Phrases' || level === 'Sentences';
}

export function therapistPracticePrompts(activity: Activity): LearningPrompt[] {
  const phraseLevel = usesPhraseFields(activity.level);
  const targets: LearningPrompt[] = activity.words.map((word) => ({
    text: (phraseLevel ? word.phrase.trim() || word.text : word.text).trim(),
    position: activity.level === 'Sound' ? undefined : word.position,
  }));
  if (phraseLevel) targets.push(...activity.customLines.map((text) => ({ text: text.trim() })));
  const prompts = targets.filter(({ text }) => text.length > 0);
  return prompts.length ? prompts : [{ text: activity.sound }];
}

export function positionsFromLabel(label: string): WordPosition[] {
  return wordPositions.filter((position) => label.includes(position));
}

export function emptyDraft(): ActivityDraft {
  return {
    step: 'focus',
    title: '',
    sound: '/r/',
    level: 'Words',
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

export function isAssignmentDate(value: string) {
  const date = parseCalendarDate(value);
  return date !== null && date >= todayCalendarDate();
}
