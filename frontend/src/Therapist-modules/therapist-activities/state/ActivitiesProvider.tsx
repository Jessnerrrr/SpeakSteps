import { assignLearningActivity } from '@/data/learning-workflow';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  activityFromDraft,
  draftFromActivity,
  emptyDraft,
  sampleActivities,
  sampleWordBank,
  therapistPracticePrompts,
  type Activity,
  type ActivityDraft,
  type ActivityStatus,
  type BankWord,
} from '@/Therapist-modules/therapist-activities/data/activityData';

type ActivitiesContextValue = {
  activities: Activity[];
  wordBank: BankWord[];
  draft: ActivityDraft;
  setDraft: (patch: Partial<ActivityDraft> | ((current: ActivityDraft) => ActivityDraft)) => void;
  beginNewActivity: () => void;
  beginEdit: (id: string) => void;
  saveActivity: (status?: ActivityStatus) => string;
  assignActivity: (activityId: string, student: { id: string; name: string }, dueDate: string, instructions: string) => void;
  addBankWord: (word: Omit<BankWord, 'language'> & { language?: string }) => void;
  removeBankWord: (id: string) => void;
};

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const { profile } = useTherapist();
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [wordBank, setWordBank] = useState<BankWord[]>(() => {
    const entries = new Map(sampleWordBank.map((word) => [word.id, word]));
    for (const activity of sampleActivities) {
      for (const { id, text, sound, position } of activity.words) {
        if (!entries.has(id)) entries.set(id, { id, text, sound, position, language: activity.language });
      }
    }
    return [...entries.values()];
  });
  const [draft, setDraftState] = useState<ActivityDraft>(emptyDraft);

  const setDraft = useCallback((patch: Partial<ActivityDraft> | ((current: ActivityDraft) => ActivityDraft)) => {
    setDraftState((current) => (typeof patch === 'function' ? patch(current) : { ...current, ...patch }));
  }, []);

  const beginNewActivity = useCallback(() => setDraftState(emptyDraft()), []);

  const beginEdit = useCallback((id: string) => {
    const activity = activities.find((item) => item.id === id);
    if (activity) setDraftState(draftFromActivity(activity));
  }, [activities]);

  const saveActivity = useCallback((status: ActivityStatus = 'Unassigned') => {
    const next = activityFromDraft(draft, wordBank, draft.id ? activities.find((item) => item.id === draft.id)?.status || status : status);
    setActivities((current) => {
      const exists = current.some((item) => item.id === next.id);
      return exists ? current.map((item) => (item.id === next.id ? { ...item, ...next, status: item.status === 'Assigned' ? item.status : next.status } : item)) : [next, ...current];
    });
    return next.id;
  }, [activities, draft, wordBank]);

  const assignActivity = useCallback((activityId: string, student: { id: string; name: string }, dueDate: string, instructions: string) => {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity) throw new Error('This activity is no longer available.');
    assignLearningActivity({
      source: 'Therapist', activityId, studentId: student.id, studentName: student.name,
      title: activity.title, level: activity.level, dueDate: dueDate.trim(),
      language: activity.language,
      instructions: instructions.trim(), assignedBy: profile.fullName,
      prompts: therapistPracticePrompts(activity), guidance: activity.guide,
    });
    setActivities((current) =>
      current.map((item) =>
        item.id === activityId ? {
          ...item,
          status: 'Assigned',
          assignments: [
            ...(item.assignments ?? []).filter((assignment) => assignment.studentId !== student.id),
            { studentId: student.id, studentName: student.name, dueDate: dueDate.trim(), instructions: instructions.trim() },
          ],
        } : item,
      ),
    );
  }, [activities, profile.fullName]);

  const addBankWord = useCallback((word: Omit<BankWord, 'language'> & { language?: string }) => {
    const entry: BankWord = { ...word, language: word.language || 'English' };
    setWordBank((current) => (current.some((item) => item.text === entry.text && item.sound === entry.sound && item.position === entry.position) ? current : [...current, entry]));
  }, []);

  const removeBankWord = useCallback((id: string) => {
    setWordBank((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ activities, wordBank, draft, setDraft, beginNewActivity, beginEdit, saveActivity, assignActivity, addBankWord, removeBankWord }),
    [activities, wordBank, draft, setDraft, beginNewActivity, beginEdit, saveActivity, assignActivity, addBankWord, removeBankWord],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const value = useContext(ActivitiesContext);
  if (!value) throw new Error('useActivities must be used inside ActivitiesProvider');
  return value;
}
