import { useSyncExternalStore } from 'react';
import { ChildProfileStore } from './child-profile-store';

export type StudentNameRequest = {
  id: string;
  studentId: string;
  currentName: string;
  proposedName: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Declined' | 'Applied';
};

let requests: readonly StudentNameRequest[] = [];
const listeners = new Set<() => void>();

function publish(next: readonly StudentNameRequest[]) {
  requests = next;
  listeners.forEach((listener) => listener());
}

function getRequests() {
  return requests;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useStudentNameRequests() {
  return useSyncExternalStore(subscribe, getRequests, getRequests);
}

export function requestStudentNameChange(proposedName: string) {
  const profile = ChildProfileStore.getProfile();
  const name = proposedName.trim().replace(/\s+/g, ' ');
  if (name === profile.fullName) return 'Enter a different name to request a change.';
  if (name.length < 2 || name.length > 80 || !/^\p{L}[\p{L}\p{M} .’'-]*$/u.test(name)) {
    return 'Enter a valid full name using letters, spaces, and name punctuation.';
  }
  if (requests.some((request) => request.studentId === profile.id && (request.status === 'Pending' || request.status === 'Approved'))) {
    return 'A name change is already awaiting review or ready to apply.';
  }
  publish([{
    id: 'name-change-' + (requests.length + 1), studentId: profile.id, currentName: profile.fullName,
    proposedName: name, submittedAt: new Date().toISOString(), status: 'Pending',
  }, ...requests]);
  return '';
}

export function reviewStudentNameChange(id: string, decision: 'Approved' | 'Declined') {
  const request = requests.find((item) => item.id === id && item.status === 'Pending');
  if (!request) return false;
  publish(requests.map((item) => item.id === id ? { ...item, status: decision } : item));
  return true;
}

export function applyApprovedStudentName(id: string) {
  const profile = ChildProfileStore.getProfile();
  const request = requests.find((item) => item.id === id && item.studentId === profile.id &&
    item.currentName === profile.fullName && item.status === 'Approved');
  if (!request) return false;
  ChildProfileStore.updateProfile({ fullName: request.proposedName });
  publish(requests.map((item) => item.id === id ? { ...item, status: 'Applied' } : item));
  return true;
}
