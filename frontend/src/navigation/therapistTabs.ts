export type TherapistTab = 'home' | 'patients' | 'activities' | 'reviews';

export type TherapistRoute =
  | '/therapist'
  | '/therapist/patients'
  | '/therapist/activities'
  | '/therapist/reviews';

export const therapistTabs: { key: TherapistTab; label: string; href: TherapistRoute }[] = [
  { key: 'home', label: 'Home', href: '/therapist' },
  { key: 'patients', label: 'Students', href: '/therapist/patients' },
  { key: 'activities', label: 'Activities', href: '/therapist/activities' },
  { key: 'reviews', label: 'Reviews', href: '/therapist/reviews' },
];
