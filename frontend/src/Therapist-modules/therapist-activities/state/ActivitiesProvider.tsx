import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  activityFromDraft,
  draftFromActivity,
  emptyDraft,
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
  getWordBank,
  saveActivity as saveActivityRequest,
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
  assignActivity: (activityId: string, patientCode: string, dueDate: string, instructions: string) => Promise<void>;
  addBankWord: (word: Omit<BankWord, 'language'> & { language?: string }) => Promise<void>;
  removeBankWord: (id: string) => Promise<void>;
};

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [wordBank, setWordBank] = useState<BankWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraftState] = useState<ActivityDraft>(emptyDraft);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activityItems, wordItems] = await Promise.all([getActivities(), getWordBank()]);
      setActivities(activityItems.map((item) => ({
        ...item,
        sound: item.sound as Activity['sound'],
        level: item.level as Activity['level'],
        positions: item.positions as Activity['positions'],
        words: item.words.map((word) => ({
          ...word,
          sound: word.sound as Activity['sound'],
        })),
      })));
      setWordBank(wordItems.map((word) => ({
        ...word,
        sound: word.sound as BankWord['sound'],
        position: word.position as BankWord['position'],
      })));
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
    const next = activityFromDraft(draft, wordBank, draft.id ? activities.find((item) => item.id === draft.id)?.status || status : status);
    try {
      const saved = await saveActivityRequest(next);
      setActivities((current) => [saved as Activity, ...current.filter((item) => item.id !== saved.id)]);
      setError(null);
      return saved.id;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this activity.');
      throw saveError;
    }
  }, [activities, draft, wordBank]);

  const assignActivity = useCallback(async (activityId: string, patientCode: string, dueDate: string, instructions: string) => {
    await createAssignment({ activityId, patientCode, dueDate, instructions });
    await refresh();
  }, [refresh]);

  const addBankWord = useCallback(async (word: Omit<BankWord, 'language'> & { language?: string }) => {
    const saved = await createWordBankEntry({
      text: word.text,
      sound: word.sound,
      position: word.position,
      language: word.language || 'English',
    });
    setWordBank((current) => [...current.filter((item) => item.id !== saved.id), {
      ...saved,
      sound: saved.sound as BankWord['sound'],
      position: saved.position as BankWord['position'],
    }]);
  }, []);

  const removeBankWord = useCallback(async (id: string) => {
    await deleteWordBankEntry(id);
    setWordBank((current) => current.filter((item) => item.id !== id));
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
