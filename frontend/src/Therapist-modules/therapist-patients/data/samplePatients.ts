import type { DominantErrorPattern, HierarchyLevel, LanguageProfile, PhonemePosition, TargetSound } from '@/Therapist-modules/therapist-patients/data/options';

export type AccuracyTone = 'green' | 'peach' | 'blue';

export type SoapNote = {
  id: string;
  number: number;
  dateLabel: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export type Accomplishment = {
  id: string;
  dateLabel: string;
  title: string;
  targetAccuracy: string;
  clinicianNotes: string;
  quote?: string;
  audioLabel: string;
  accent: 'orange' | 'green';
  bars: number[];
};

export type PatientRecord = {
  id: string;
  initials: string;
  avatar: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  dateOfBirth: string;
  age: string;
  languageProfile: LanguageProfile | string;
  diagnosis: string;
  guardianName: string;
  relationship: string;
  contactNumber: string;
  guardianEmail: string;
  targetSound: TargetSound | string;
  hierarchyLevel: HierarchyLevel | string;
  phonemePositions: PhonemePosition[];
  secondaryTargets: string;
  dominantErrorPattern: DominantErrorPattern | string;
  dominantErrorOther: string;
  errorPatternTaxonomy: string;
  clinicalNotation: string;
  accuracy: number;
  accuracyDelta?: number;
  baseline?: boolean;
  compliance?: number;
  complianceNote?: string;
  tone: AccuracyTone;
  overviewPrimary: string;
  overviewSecondary: string;
  overviewError: string;
  overviewLanguage: string;
  targetDetail: string;
  patternDetail: string;
  languageDetail: string;
  sessions: SoapNote[];
  accomplishments: Accomplishment[];
};

export type NewPatientInput = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  dateOfBirth: string;
  age: string;
  languageProfile: string;
  diagnosis: string;
  guardianName: string;
  relationship: string;
  contactNumber: string;
  guardianEmail: string;
  targetSound: string;
  hierarchyLevel: string;
  phonemePositions: PhonemePosition[];
  secondaryTargets: string;
  dominantErrorPattern: string;
  dominantErrorOther: string;
  errorPatternTaxonomy: string;
  clinicalNotation: string;
};

const waveform = [6, 14, 8, 18, 10, 16, 7, 20, 12, 9, 17, 8, 15, 11, 19, 6];

export const samplePatients: PatientRecord[] = [
  {
    id: 'khyll',
    initials: 'KS',
    avatar: '#94A3B8',
    firstName: 'Khyll',
    middleName: 'Shervin',
    lastName: 'Sude',
    suffix: '',
    dateOfBirth: '03/12/2020',
    age: '6',
    languageProfile: 'Bilingual Tagalog (L1) & English (L2)',
    diagnosis: 'Articulation Disorder (Rhoticity /r/)',
    guardianName: 'Parent Sude',
    relationship: 'Parent',
    contactNumber: '+63 900 000 0001',
    guardianEmail: 'parent.sude@email.com',
    targetSound: '/r/ Sound',
    hierarchyLevel: 'Isolation',
    phonemePositions: ['Initial'],
    secondaryTargets: '/l/, /w/',
    dominantErrorPattern: 'Substitution',
    dominantErrorOther: '',
    errorPatternTaxonomy: 'Gliding',
    clinicalNotation: 'Gliding (I/Y → /w/) e.g. "Rabbit" → "Wabbit"',
    accuracy: 35,
    accuracyDelta: 10,
    baseline: true,
    compliance: 85,
    complianceNote: '10/7 Days Active',
    tone: 'green',
    overviewPrimary: 'Primary Phoneme Target:',
    overviewSecondary: 'Secondary Targets:',
    overviewError: 'Error Pattern Taxonomy:',
    overviewLanguage: 'Language Profile:',
    targetDetail: '/r/ Target',
    patternDetail: 'Gliding (I/Y → /w/) e.g. "Rabbit" → "Wabbit"',
    languageDetail: 'Bilingual Tagalog (L1) & English (L2)',
    sessions: [
      {
        id: 'soap-1',
        number: 1,
        dateLabel: 'Oct 24, 2026',
        subjective: 'Khyll was energetic. Parent reports 4x home practice.',
        objective: 'Initial /r/ in isolated syllables 15/20 correct (75%).',
        assessment: 'Tongue tip elevation improving with visual lip cue.',
        plan: 'Continue Initial /r/ monosyllabic words next session.',
      },
    ],
    accomplishments: [
      {
        id: 'acc-1',
        dateLabel: 'Oct 31, 2025 • 10:30 AM (25 mins)',
        title: 'Isolated /r/ Sound Production (Initial Position)',
        targetAccuracy: 'Target Accuracy: 0/10 trials correct',
        clinicianNotes: 'Clinician notes:',
        quote: '"Khyll showed improved tongue elevation when given visual prompts in Tagalog word drills."',
        audioLabel: 'Opens Recording • 0:27',
        accent: 'orange',
        bars: waveform,
      },
      {
        id: 'acc-2',
        dateLabel: 'Oct 27, 2025 • 4:15 PM (15 mins)',
        title: 'Tagalog Word Recognition & Repetition',
        targetAccuracy: 'Target Accuracy: 7 of 10 words correct',
        clinicianNotes: 'Good effort on words "Baga" and "Baka".',
        audioLabel: 'Opens Recording • 0:27',
        accent: 'orange',
        bars: [5, 12, 9, 16, 8, 14, 18, 7, 11, 15, 6, 13, 10, 17, 8, 12],
      },
      {
        id: 'acc-3',
        dateLabel: 'Oct 24, 2025 • 11:00 AM (30 mins)',
        title: 'Baseline Assessment - Rhoticity /r/',
        targetAccuracy: '88 trials completed. Initial evaluation completed. Identifies frequent substitution of /w/ for /r/.',
        clinicianNotes: '',
        audioLabel: 'Opens Recording • 0:08',
        accent: 'green',
        bars: [8, 10, 14, 6, 12, 16, 9, 18, 7, 11, 15, 5, 13, 9, 17, 8],
      },
    ],
  },
  {
    id: 'angelica',
    initials: 'A',
    avatar: '#43B05C',
    firstName: 'Angelica',
    middleName: '',
    lastName: 'Vega',
    suffix: '',
    dateOfBirth: '06/02/2019',
    age: '7',
    languageProfile: 'Bilingual Tagalog (L1) & English (L2)',
    diagnosis: 'Sibilant Frontal Lisp /s/',
    guardianName: 'Parent Vega',
    relationship: 'Parent',
    contactNumber: '+63 900 000 0002',
    guardianEmail: 'parent.vega@email.com',
    targetSound: '/s/ Sound',
    hierarchyLevel: 'Sentence Level',
    phonemePositions: ['Initial'],
    secondaryTargets: '/z/',
    dominantErrorPattern: 'Distortion',
    dominantErrorOther: '',
    errorPatternTaxonomy: 'Frontal lisp',
    clinicalNotation: 'Frontal lisp on /s/',
    accuracy: 80,
    tone: 'peach',
    compliance: undefined,
    overviewPrimary: 'Primary Phoneme Target:',
    overviewSecondary: 'Secondary Targets:',
    overviewError: 'Error Pattern Taxonomy:',
    overviewLanguage: 'Language Profile:',
    targetDetail: '/s/ Target',
    patternDetail: 'Frontal lisp',
    languageDetail: 'Bilingual Tagalog (L1) & English (L2)',
    sessions: [],
    accomplishments: [],
  },
  {
    id: 'jhonas',
    initials: 'J',
    avatar: '#F5A524',
    firstName: 'Jhonas',
    middleName: '',
    lastName: 'Elsisura',
    suffix: '',
    dateOfBirth: '11/18/2021',
    age: '5',
    languageProfile: 'Bilingual English (L1) & Tagalog (L2)',
    diagnosis: 'Phonological Process (Fronting)',
    guardianName: 'Parent Elsisura',
    relationship: 'Parent',
    contactNumber: '+63 900 000 0003',
    guardianEmail: 'parent.elsisura@email.com',
    targetSound: '/s/ Sound',
    hierarchyLevel: 'Syllable',
    phonemePositions: ['Initial'],
    secondaryTargets: '/k/, /g/',
    dominantErrorPattern: 'Substitution',
    dominantErrorOther: '',
    errorPatternTaxonomy: 'Fronting',
    clinicalNotation: 'Fronting of back sounds',
    accuracy: 45,
    tone: 'blue',
    overviewPrimary: 'Primary Phoneme Target:',
    overviewSecondary: 'Secondary Targets:',
    overviewError: 'Error Pattern Taxonomy:',
    overviewLanguage: 'Language Profile:',
    targetDetail: '/s/ Target',
    patternDetail: 'Fronting',
    languageDetail: 'Bilingual English (L1) & Tagalog (L2)',
    sessions: [],
    accomplishments: [],
  },
  {
    id: 'mcgravy',
    initials: 'M',
    avatar: '#3F83B8',
    firstName: 'Mcgravy',
    middleName: 'Ameer',
    lastName: 'Jr.',
    suffix: 'Jr.',
    dateOfBirth: '01/09/2020',
    age: '6',
    languageProfile: 'Bilingual Tagalog (L1) & English (L2)',
    diagnosis: 'Articulation Distortion /k/',
    guardianName: 'Parent Ameer',
    relationship: 'Parent',
    contactNumber: '+63 900 000 0004',
    guardianEmail: 'parent.ameer@email.com',
    targetSound: '/k/ Sound',
    hierarchyLevel: 'Sentence Level',
    phonemePositions: ['Initial'],
    secondaryTargets: '/g/',
    dominantErrorPattern: 'Distortion',
    dominantErrorOther: '',
    errorPatternTaxonomy: 'Distortion',
    clinicalNotation: 'Distorted /k/ in sentences',
    accuracy: 75,
    tone: 'green',
    overviewPrimary: 'Primary Phoneme Target:',
    overviewSecondary: 'Secondary Targets:',
    overviewError: 'Error Pattern Taxonomy:',
    overviewLanguage: 'Language Profile:',
    targetDetail: '/k/ Target',
    patternDetail: 'Distortion',
    languageDetail: 'Bilingual Tagalog (L1) & English (L2)',
    sessions: [],
    accomplishments: [],
  },
];

export function patientName(patient: Pick<PatientRecord, 'firstName' | 'middleName' | 'lastName' | 'suffix'>) {
  return [patient.firstName, patient.middleName, patient.lastName, patient.suffix && patient.lastName !== patient.suffix ? patient.suffix : '']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

export function patientMeta(patient: Pick<PatientRecord, 'age' | 'languageProfile' | 'targetSound' | 'hierarchyLevel'>) {
  const languageMatch = patient.languageProfile.match(/^(?:Bilingual|Multilingual)\s+([A-Za-z]+)/);
  const language = languageMatch?.[1] || 'Multilingual';
  const sound = patient.targetSound.replace(' Sound', '');
  const stage =
    patient.hierarchyLevel === 'Isolation'
      ? 'Isolated Sounds'
      : patient.hierarchyLevel === 'Syllable'
        ? 'Syllables'
        : patient.hierarchyLevel === 'Sentence Level'
          ? 'Sentences'
          : patient.hierarchyLevel;
  return `${patient.age} yrs old · ${language} · ${sound} Target · ${stage}`;
}

export function createPatient(input: NewPatientInput): PatientRecord {
  const initials = `${input.firstName.trim()[0] || ''}${input.lastName.trim()[0] || ''}`.toUpperCase() || 'P';
  return {
    id: `patient-${Date.now()}`,
    initials,
    avatar: '#0EA5E9',
    firstName: input.firstName.trim(),
    middleName: input.middleName.trim(),
    lastName: input.lastName.trim(),
    suffix: input.suffix,
    dateOfBirth: input.dateOfBirth.trim(),
    age: input.age.trim(),
    languageProfile: input.languageProfile,
    diagnosis: input.diagnosis.trim(),
    guardianName: input.guardianName.trim(),
    relationship: input.relationship.trim(),
    contactNumber: input.contactNumber.trim(),
    guardianEmail: input.guardianEmail.trim(),
    targetSound: input.targetSound,
    hierarchyLevel: input.hierarchyLevel,
    phonemePositions: input.phonemePositions,
    secondaryTargets: input.secondaryTargets.trim(),
    dominantErrorPattern: input.dominantErrorPattern,
    dominantErrorOther: input.dominantErrorOther.trim(),
    errorPatternTaxonomy: input.errorPatternTaxonomy.trim(),
    clinicalNotation: input.clinicalNotation.trim(),
    accuracy: 0,
    tone: 'blue',
    overviewPrimary: 'Primary Phoneme Target:',
    overviewSecondary: 'Secondary Targets:',
    overviewError: 'Error Pattern Taxonomy:',
    overviewLanguage: 'Language Profile:',
    targetDetail: input.targetSound.replace(' Sound', ' Target'),
    patternDetail: input.dominantErrorPattern === 'Others:' ? input.dominantErrorOther.trim() : input.errorPatternTaxonomy.trim(),
    languageDetail: input.languageProfile,
    sessions: [],
    accomplishments: [],
  };
}

export function formatSoapDate(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
