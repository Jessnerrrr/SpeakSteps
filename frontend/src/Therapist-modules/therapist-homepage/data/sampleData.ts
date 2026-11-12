import type { TherapistRoute } from '@/navigation/therapistTabs';

export type StatTone = 'green' | 'alert' | 'primary' | 'orange';

export type HomeStat = {
  id: string;
  value: string;
  label: string;
  badge: string;
  tone: StatTone;
  href: TherapistRoute;
};

export type Submission = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  stage: string;
  progress: number;
  timestamp: string;
};

export type TherapistNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export type TherapistProfile = {
  fullName: string;
  role: string;
  license: string;
  clinic: string;
  contact: string;
  email: string;
};

export const sampleProfile: TherapistProfile = {
  fullName: 'Dr. Ameer Andres, SLP-CCC',
  role: 'Speech-Language Pathologist',
  license: 'SLP-PH-2024-4891',
  clinic: 'SpeakSteps',
  contact: '+63 900 000 0000',
  email: 'ameer@speakstep.com',
};

export const sampleStats: HomeStat[] = [
  {
    id: 'recordings',
    value: '4',
    label: 'Recordings to Review',
    badge: 'Pending',
    tone: 'green',
    href: '/therapist/reviews',
  },
  {
    id: 'follow-up',
    value: '3',
    label: 'Require Follow-up',
    badge: 'Alert',
    tone: 'alert',
    href: '/therapist/patients',
  },
  {
    id: 'submissions',
    value: '7',
    label: 'Submissions Received',
    badge: 'Today',
    tone: 'primary',
    href: '/therapist/reviews',
  },
  {
    id: 'overdue',
    value: '14',
    label: 'Overdue / Active Task',
    badge: 'Active',
    tone: 'orange',
    href: '/therapist/activities',
  },
];

export const sampleSubmissions: Submission[] = [
  {
    id: 'khyl',
    initials: 'KS',
    name: 'Khyl Shervin Sude',
    detail: '8 yrs old · Tagalog · /r/ Target',
    stage: 'Stage: Isolated Sounds',
    progress: 0.35,
    timestamp: 'Today at 11:12 AM',
  },
  {
    id: 'angelica',
    initials: 'A',
    name: 'Angelica Vega',
    detail: '7 yrs old · Tagalog & English · All Target · Sentences',
    stage: 'Stage: Sentences',
    progress: 0.8,
    timestamp: 'Today at 08:09 AM',
  },
  {
    id: 'jhonas',
    initials: 'J',
    name: 'Jhonas Elsisura',
    detail: '6 yrs old · English · /l/ Target · Syllables',
    stage: 'Stage: Syllables',
    progress: 0.45,
    timestamp: 'Yesterday at 09:09 AM',
  },
  {
    id: 'mcgravy',
    initials: 'M',
    name: 'Mcgravy Ameer Jr.',
    detail: '9 yrs old · Tagalog · /r/ Target · Phrases',
    stage: 'Stage: Phrases',
    progress: 0.75,
    timestamp: 'October 25, 2026 at 09:09 AM',
  },
];

export const sampleNotifications: TherapistNotification[] = [
  {
    id: 'n1',
    title: 'Khylf submitted an audio recording',
    body: 'In Syllable Sounds / Target: /sh/ sound',
    time: '5h ago',
    read: false,
  },
  {
    id: 'n2',
    title: 'Angelica completed Sentences practice',
    body: 'Practice set finished and ready to review',
    time: '1h ago',
    read: false,
  },
  {
    id: 'n3',
    title: 'Jhonas submitted Syllables home practice',
    body: '15/20 correct. Ready to review.',
    time: 'Today at 09:00 AM',
    read: true,
  },
  {
    id: 'n4',
    title: 'Mcgravy completed Phrases practice',
    body: 'Achieved 75% accuracy',
    time: 'Today at 08:00 AM',
    read: true,
  },
];

export function greetingName(fullName: string) {
  const withoutCredentials = fullName.split(',')[0]?.trim() || fullName;
  const parts = withoutCredentials.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] || 'Andres';
  if (/^dr\.?$/i.test(parts[0] || '')) {
    return `Dr. ${last}`;
  }
  return withoutCredentials;
}

export function profileInitial(fullName: string) {
  const withoutTitle = fullName.replace(/^dr\.?\s+/i, '').trim();
  return (withoutTitle[0] || 'A').toUpperCase();
}

export function formatHomeDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
