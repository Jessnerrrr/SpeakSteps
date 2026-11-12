export const targetSounds = ['/s/ Sound', '/l/ Sound', '/r/ Sound', '/k/ Sound', '/t/ Sound'] as const;

export const patientSuffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'] as const;

export const languageProfiles = [
  'Bilingual Tagalog (L1) & English (L2)',
  'Bilingual English (L1) & Tagalog (L2)',
  'Bilingual Regional (L1) & Tagalog (L2)',
  'Multilingual (Regional / Tagalog / English)',
] as const;

export const hierarchyLevels = [
  'Isolation',
  'Syllable',
  'Word Level',
  'Phrase Level',
  'Sentence Level',
] as const;

export const dominantErrorPatterns = [
  'Substitution',
  'Omission',
  'Distortion',
  'Addition',
  'Cluster Reduction',
  'Multiple Patterns',
  'Others:',
] as const;

export const phonemePositions = ['Initial', 'Medial', 'Final'] as const;

export type TargetSound = (typeof targetSounds)[number];
export type PatientSuffix = (typeof patientSuffixes)[number];
export type LanguageProfile = (typeof languageProfiles)[number];
export type HierarchyLevel = (typeof hierarchyLevels)[number];
export type DominantErrorPattern = (typeof dominantErrorPatterns)[number];
export type PhonemePosition = (typeof phonemePositions)[number];
