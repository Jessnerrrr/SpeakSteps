export type ReviewStatus = 'Pending' | 'Reviewed';
export type WordPosition = 'Initial' | 'Medial' | 'Final';

export type ReviewTarget = {
  id: string;
  text: string;
  position: WordPosition;
  score: number | null;
  feedback: string;
  remarks: string;
  notesOpen: boolean;
};

export type ReviewRecord = {
  id: string;
  student: string;
  initial: string;
  avatar: string;
  activity: string;
  sound: string;
  level: string;
  status: ReviewStatus;
  targets: ReviewTarget[];
  observations: string;
  parentFeedback: string;
  homePractice: string;
};

export const ratingGuide = [
  'Unable to produce',
  'Emerging production',
  'Partially correct',
  'Mostly correct',
  'Correct production',
] as const;

export const positions: WordPosition[] = ['Initial', 'Medial', 'Final'];

const avatars = ['#D7E7C8', '#F8E4D4', '#D5E5F4', '#F8E4D4', '#D7E7C8', '#F8E4D4', '#D5E5F4', '#F8E4D4', '#F6D4CE'];
const statuses: ReviewStatus[] = ['Pending', 'Pending', 'Reviewed', 'Pending', 'Reviewed', 'Reviewed', 'Pending', 'Reviewed', 'Pending'];

function targets(reviewed: boolean): ReviewTarget[] {
  return [
    { id: 'rabbit', text: 'rabbit', position: 'Initial', score: reviewed ? 5 : 3, feedback: '', remarks: '', notesOpen: !reviewed },
    { id: 'red', text: 'red', position: 'Initial', score: reviewed ? 5 : null, feedback: '', remarks: '', notesOpen: false },
    { id: 'run', text: 'run', position: 'Initial', score: reviewed ? 5 : null, feedback: '', remarks: '', notesOpen: false },
  ];
}

export const sampleReviews: ReviewRecord[] = statuses.map((status, index) => ({
  id: `review-${index + 1}`,
  student: 'Ameera Andrea Andres',
  initial: 'A',
  avatar: avatars[index],
  activity: 'Ready, set, /r/',
  sound: '/r/',
  level: 'Phrases',
  status,
  targets: targets(status === 'Reviewed'),
  observations: '',
  parentFeedback: '',
  homePractice: '',
}));

export function scoredTargets(review: ReviewRecord) {
  return review.targets.filter((target) => target.score !== null);
}

export function averageScore(review: ReviewRecord) {
  const scored = scoredTargets(review);
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, target) => sum + (target.score || 0), 0);
  return total / scored.length;
}

export function formatAverage(value: number | null) {
  return value === null ? '—' : `${value.toFixed(1)}/5`;
}
