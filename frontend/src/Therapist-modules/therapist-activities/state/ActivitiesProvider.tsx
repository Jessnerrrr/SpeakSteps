import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import {
  activityFromDraft,
  draftFromActivity,
  emptyDraft,
  practiceLevels,
  targetSounds,
  wordPositions,
  type Activity,
  type ActivityDraft,
  type ActivityStatus,
  type BankWord,
} from '@/Therapist-modules/therapist-activities/data/activityData';
import {
  createAssignment,
  createWordBankEntry,
  deleteWordBankEntry,
  getActivities,
  getAssignments,
  getWordBank,
  saveActivity as saveActivityRequest,
  type ApiActivity,
} from '@/services/user-api';

type ActivitiesContextValue = {
  activities: Activity[];
  wordBank: BankWord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  draft: ActivityDraft;
  setDraft: (patch: Partial<ActivityDraft> | ((current: ActivityDraft) => ActivityDraft)) => void;
  beginNewActivity: () => void;
  beginEdit: (id: string) => void;
  saveActivity: (status?: ActivityStatus) => Promise<string>;
  assignActivity: (activityId: string, student: { id: string; name: string; patientCode?: string }, dueDate: string, instructions: string) => Promise<void>;
  addBankWord: (word: Omit<BankWord, 'language'> & { language?: string }) => Promise<void>;
  removeBankWord: (id: string) => Promise<void>;
};

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

function isTargetSound(value: string): value is (typeof targetSounds)[number] {
  return (targetSounds as readonly string[]).includes(value);
}

function isPracticeLevel(value: string): value is (typeof practiceLevels)[number] {
  return (practiceLevels as readonly string[]).includes(value);
}

function isWordPosition(value: string): value is (typeof wordPositions)[number] {
  return (wordPositions as readonly string[]).includes(value);
}

function mapActivity(item: ApiActivity): Activity {
  if (!isTargetSound(item.sound)) {
    throw new Error(`The backend returned an unsupported target sound for "${item.title}".`);
  }
  if (!isPracticeLevel(item.level)) {
    throw new Error(`The backend returned an unsupported practice level for "${item.title}".`);
  }
  const positions = item.positions.filter(isWordPosition);
  const words = item.words.map((word) => {
    if (!isTargetSound(word.sound)) {
      throw new Error(`The backend returned an unsupported sound for the word "${word.text}".`);
    }
    return {
      ...word,
      sound: word.sound,
    };
  });
  return {
    ...item,
    sound: item.sound as Activity['sound'],
    level: item.level as Activity['level'],
    positions,
    words,
  };
}

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const { profile, patients } = useTherapist();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [wordBank, setWordBank] = useState<BankWord[]>([]);
  const [draft, setDraftState] = useState<ActivityDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activityItems, wordItems, assignments] = await Promise.all([
        getActivities(),
        getWordBank(),
        getAssignments(),
      ]);
      const mappedAssignments = assignments.reduce<Record<string, NonNullable<Activity['assignments']>>>((records, assignment) => {
        records[assignment.activityId] = [
          ...(records[assignment.activityId] || []),
          {
            studentId: assignment.patientId,
            studentName: assignment.studentName,
            dueDate: assignment.dueDate || '',
            instructions: assignment.activity.instructions || '',
          },
        ];
        return records;
      }, {});
      setActivities(activityItems.map((item) => ({
        ...mapActivity(item),
        assignments: mappedAssignments[item.id] || [],
        status: assignments.some((record) => record.activityId === item.id && record.status === 'Completed')
          ? 'Completed'
          : mappedAssignments[item.id]?.length
            ? 'Assigned'
            : item.status,
      })));
      setWordBank(wordItems.map((word) => {
        if (!isTargetSound(word.sound)) {
          throw new Error(`The backend returned an unsupported sound for the word "${word.text}".`);
        }
        if (!isWordPosition(word.position)) {
          throw new Error(`The backend returned an unsupported position for the word "${word.text}".`);
        }
        return { ...word, sound: word.sound, position: word.position };
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load therapist activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setDraft = useCallback((patch: Partial<ActivityDraft> | ((current: ActivityDraft) => ActivityDraft)) => {
    setDraftState((current) => (typeof patch === 'function' ? patch(current) : { ...current, ...patch }));
  }, []);

  const beginNewActivity = useCallback(() => setDraftState(emptyDraft()), []);

  const beginEdit = useCallback((id: string) => {
    const activity = activities.find((item) => item.id === id);
    if (activity) setDraftState(draftFromActivity(activity));
  }, [activities]);

  const saveActivity = useCallback(async (status: ActivityStatus = 'Unassigned') => {
    const next = activityFromDraft(
      draft,
      wordBank,
      draft.id ? activities.find((item) => item.id === draft.id)?.status || status : status,
    );
    try {
      const saved = mapActivity(await saveActivityRequest(next));
      setActivities((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setError(null);
      return saved.id;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this activity.');
      throw saveError;
    }
  }, [activities, draft, wordBank]);

  const assignActivity = useCallback(async (
    activityId: string,
    student: { id: string; name: string; patientCode?: string },
    dueDate: string,
    instructions: string,
  ) => {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity) throw new Error('This activity is no longer available.');
    const patient = patients.find((item) => item.id === student.id);
    const patientCode = student.patientCode || patient?.patientCode;
    if (!patientCode) throw new Error(`A valid patient ID is required to assign an activity to ${student.name}.`);
    try {
      const assignment = await createAssignment({
        activityId,
        patientCode,
        dueDate: dueDate.trim(),
        instructions: instructions.trim(),
      });
      setActivities((current) => current.map((item) => item.id === activityId ? {
        ...item,
        status: assignment.status === 'Completed' ? 'Completed' : 'Assigned',
        assignments: [
          ...(item.assignments || []).filter((entry) => entry.studentId !== assignment.patientId),
          {
            studentId: assignment.patientId,
            studentName: assignment.studentName,
            dueDate: assignment.dueDate || '',
            instructions: instructions.trim(),
          },
        ],
      } : item));
      setError(null);
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : 'Could not assign this activity.');
      throw assignmentError;
    }
  }, [activities, patients]);

  const addBankWord = useCallback(async (word: Omit<BankWord, 'language'> & { language?: string }) => {
    try {
      const saved = await createWordBankEntry({
        text: word.text,
        sound: word.sound,
        position: word.position,
        language: word.language || 'English',
        modelAudioUrl: word.modelAudioUrl,
      });
      setWordBank((current) => [...current.filter((item) => item.id !== saved.id), {
        ...saved,
        sound: saved.sound as BankWord['sound'],
        position: saved.position,
      }]);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this word.');
      throw saveError;
    }
  }, []);

  const removeBankWord = useCallback(async (id: string) => {
    try {
      await deleteWordBankEntry(id);
      setWordBank((current) => current.filter((item) => item.id !== id));
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not remove this word.');
      throw deleteError;
    }
  }, []);

  const value = useMemo(
    () => ({ activities, wordBank, loading, error, refresh, draft, setDraft, beginNewActivity, beginEdit, saveActivity, assignActivity, addBankWord, removeBankWord }),
    [activities, wordBank, loading, error, refresh, draft, setDraft, beginNewActivity, beginEdit, saveActivity, assignActivity, addBankWord, removeBankWord],
  );

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const value = useContext(ActivitiesContext);
  if (!value) throw new Error('useActivities must be used inside ActivitiesProvider');
  return value;
}
