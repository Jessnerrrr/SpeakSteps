import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  getAssignments,
  getCurrentSession,
  getMyPatients,
  getParentFeedback,
  getProgress,
  getSpeechCheckins,
  type ApiAssignment,
  type FamilyUser,
  type PatientSearchResult,
} from '@/services/user-api';

type PatientProgress = Awaited<ReturnType<typeof getProgress>>;
type PatientFeedback = Awaited<ReturnType<typeof getParentFeedback>>[number];
type SpeechCheckin = Awaited<ReturnType<typeof getSpeechCheckins>>[number];

type PatientLearningValue = {
  user: FamilyUser | null;
  patient: PatientSearchResult | null;
  assignments: ApiAssignment[];
  progress: PatientProgress | null;
  feedback: PatientFeedback[];
  checkins: SpeechCheckin[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const PatientLearningContext = createContext<PatientLearningValue | null>(null);

export function PatientLearningProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FamilyUser | null>(null);
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [progress, setProgress] = useState<PatientProgress | null>(null);
  const [feedback, setFeedback] = useState<PatientFeedback[]>([]);
  const [checkins, setCheckins] = useState<SpeechCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await getCurrentSession();
      if (!session || session.user.role !== 'parent') {
        throw new Error('Sign in with a parent account to view patient activities.');
      }
      const patients = await getMyPatients();
      const selectedPatient = patients[0] || null;
      const [savedAssignments, savedFeedback, savedProgress, savedCheckins] = await Promise.all([
        getAssignments(),
        getParentFeedback(),
        selectedPatient ? getProgress(selectedPatient.id) : Promise.resolve(null),
        selectedPatient ? getSpeechCheckins(selectedPatient.id) : Promise.resolve([]),
      ]);
      setUser(session.user);
      setPatient(selectedPatient);
      setAssignments(savedAssignments);
      setFeedback(savedFeedback);
      setProgress(savedProgress);
      setCheckins(savedCheckins);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load patient activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, patient, assignments, progress, feedback, checkins, loading, error, refresh }),
    [user, patient, assignments, progress, feedback, checkins, loading, error, refresh],
  );

  return <PatientLearningContext.Provider value={value}>{children}</PatientLearningContext.Provider>;
}

export function usePatientLearning() {
  const value = useContext(PatientLearningContext);
  if (!value) throw new Error('usePatientLearning must be used inside PatientLearningProvider');
  return value;
}
