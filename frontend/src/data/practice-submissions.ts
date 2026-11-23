import { useSyncExternalStore } from 'react';
import type { AdventureCategory } from './patient-dashboard-mock';

export const PARTICIPATION_STARS = 1;

type PracticeActivity = {
  id: string;
  title: string;
  position: string;
  category: AdventureCategory['iconType'];
};

let submissions: readonly (PracticeActivity & { attempts: number })[] = [];
const listeners = new Set<() => void>();

export function submitPractice(activity: PracticeActivity): boolean {
  const previous = submissions.find(({ id }) => id === activity.id);
  submissions = previous
    ? submissions.map((entry) => entry.id === activity.id ? { ...entry, attempts: entry.attempts + 1 } : entry)
    : [{ ...activity, attempts: 1 }, ...submissions];
  listeners.forEach((listener) => listener());
  return !previous;
}

export function subscribePracticeSubmissions(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getPracticeSubmissions() {
  return submissions;
}

export function usePracticeSubmissions() {
  return useSyncExternalStore(subscribePracticeSubmissions, getPracticeSubmissions, getPracticeSubmissions);
}
