import { useSyncExternalStore } from 'react';
import type { PracticeLevel } from './practice-levels';
import type { ActivityEntry } from './center-admin';
import type { Position } from '@/types/sentences';
import { formatCalendarDate, parseCalendarDate, todayCalendarDate } from './calendar-date';

export type LearningPrompt = { text: string; position?: Position };

export const DEMO_STUDENT_ID = 'child-1';

export type LearningAssignment = {
  id: string;
  studentId: string;
  studentName: string;
  activityId: string;
  title: string;
  level: PracticeLevel;
  language?: string;
  dueDate: string;
  instructions: string;
  prompts?: readonly LearningPrompt[];
  guidance?: string;
  assignedBy: string;
  source: 'Therapist' | 'Teacher';
  submittedAt?: string;
  feedback?: { message: string; homePractice: string; observations?: string; reviewedBy: string; date: string };
};

let assignments: readonly LearningAssignment[] = [];
const listeners = new Set<() => void>();
let activity: readonly ActivityEntry[] = [];


function recordActivity(assignment: LearningAssignment, title: string, actor: string, result: string) {
  const date = new Date().toISOString();
  activity = [{
    id: 'learning:' + (activity.length + 1),
    title, actor, result, date, read: false, category: 'Student',
    detail: assignment.title,
    subject: { name: assignment.studentName, identifier: assignment.studentId, type: 'Student' },
  }, ...activity];
}

function publish(next: readonly LearningAssignment[]) {
  assignments = next;
  listeners.forEach((listener) => listener());
}

export function assignLearningActivity(input: Omit<LearningAssignment, 'id' | 'submittedAt' | 'feedback'>) {
  const { source, activityId, studentId } = input;
  if (!activityId || !studentId) throw new Error('Choose a student and an activity.');
  const dueDate = parseCalendarDate(input.dueDate);
  if (!dueDate || dueDate < todayCalendarDate()) throw new Error('Enter a valid due date today or later.');
  const instructions = input.instructions.trim();
  if (!instructions) throw new Error('Please provide activity instructions.');
  const matching = assignments.filter((record) => record.source === source && record.activityId === activityId && record.studentId === studentId);
  const existing = matching.find((record) => !record.submittedAt);
  const base = [source, activityId, studentId].join(':');
  const id = existing?.id ?? (matching.length ? base + ':' + (matching.length + 1) : base);
  const item = { ...input, id, dueDate: formatCalendarDate(dueDate), instructions };
  recordActivity(item, 'Practice activity assigned', item.assignedBy, 'Assigned');
  publish(existing ? assignments.map((record) => record.id === id ? item : record) : [item, ...assignments]);
}

export function submitLearningAssignment(id: string, studentId: string) {
  const assignment = assignments.find((record) => record.id === id && record.studentId === studentId);
  if (!assignment) return false;
  if (!assignment.submittedAt) {
    recordActivity(assignment, 'Practice activity submitted', assignment.studentName, 'Submitted');
    publish(assignments.map((record) => record.id === id ? { ...record, submittedAt: new Date().toISOString() } : record));
  }
  return true;
}

export function saveLearningFeedback(id: string, feedback: NonNullable<LearningAssignment['feedback']>) {
  const assignment = assignments.find((record) => record.id === id && record.submittedAt);
  if (!assignment) return false;
  recordActivity(assignment, 'Guardian practice feedback saved', feedback.reviewedBy, 'Reviewed');
  publish(assignments.map((record) => record.id === id ? { ...record, feedback } : record));
  return true;
}

export function learningCategory(level: PracticeLevel): PracticeLevel {
  return level;
}

export function subscribeLearningWorkflow(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getLearningAssignments() {
  return assignments;
}

export function useLearningAssignments() {
  return useSyncExternalStore(subscribeLearningWorkflow, getLearningAssignments, getLearningAssignments);
}

function activitySnapshot() {
  return activity;
}

export function useLearningActivity() {
  return useSyncExternalStore(subscribeLearningWorkflow, activitySnapshot, activitySnapshot);
}
