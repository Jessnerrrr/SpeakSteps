import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { TherapistNotification, TherapistProfile } from '@/Therapist-modules/therapist-homepage/data/sampleData';
import {
  type NewPatientInput,
  type PatientRecord,
  type SoapNote,
} from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { phonemePositions, type PhonemePosition } from '@/Therapist-modules/therapist-patients/data/options';
import { darkPalette, lightPalette, type ThemeMode, type TherapistPalette } from '@/styles/therapistPalette';
import {
  changeAccountPassword,
  createSoapNote,
  createTherapistPatient,
  getAccomplishments,
  getNotifications,
  getPatients,
  getSoapNotes,
  getTherapistProfile,
  updateTherapistProfile,
  type ApiAccomplishment,
  type ApiSoapNote,
  type PatientSearchResult,
} from '@/services/user-api';

type TherapistContextValue = {
  palette: TherapistPalette;
  actionNotice: { message: string } | null;
  showActionNotice: (message: string) => void;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  profile: TherapistProfile;
  updateProfile: (patch: Partial<Pick<TherapistProfile, 'fullName' | 'role' | 'license' | 'clinic' | 'contact' | 'photoUri'>>) => Promise<void>;
  notifications: TherapistNotification[];
  unreadCount: number;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  newRecordings: boolean;
  setNewRecordings: (value: boolean) => void;
  followUpAlerts: boolean;
  setFollowUpAlerts: (value: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  passwordUpdated: boolean;
  updatePassword: (currentPassword: string, nextPassword: string) => Promise<string | null>;
  patients: PatientRecord[];
  patientsLoading: boolean;
  patientsError: string | null;
  refreshPatients: () => Promise<void>;
  addPatientOpen: boolean;
  setAddPatientOpen: (open: boolean) => void;
  addPatient: (input: NewPatientInput) => Promise<PatientSearchResult>;
  addSoapNote: (patientId: string, note: SoapNote) => Promise<void>;
};

const TherapistContext = createContext<TherapistContextValue | null>(null);

const emptyProfile: TherapistProfile = {
  fullName: '',
  role: '',
  license: '',
  clinic: '',
  contact: '',
  email: '',
};

function mapSoapNote(note: ApiSoapNote): SoapNote {
  return {
    id: note.id,
    number: note.number,
    dateLabel: new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    subjective: note.subjective,
    objective: note.objective,
    assessment: note.assessment,
    plan: note.plan,
  };
}

function mapAccomplishment(item: ApiAccomplishment): PatientRecord['accomplishments'][number] {
  return {
    id: item.id,
    dateLabel: new Date(item.achievedDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    title: item.title,
    targetAccuracy: item.targetAccuracy,
    clinicianNotes: item.clinicianNotes,
    quote: item.quote || undefined,
    audioLabel: item.audioSampleUrl ? 'Open recording' : '',
    accent: item.accentColor === 'green' ? 'green' : 'orange',
    bars: item.waveform,
  };
}

function mapPatient(item: PatientSearchResult, notes: ApiSoapNote[], accomplishments: ApiAccomplishment[]): PatientRecord {
  const firstName = item.firstName || '';
  const middleName = item.middleName || '';
  const lastName = item.lastName || '';
  const positions = (item.phonemePositions || []).filter((position): position is PhonemePosition =>
    (phonemePositions as readonly string[]).includes(position),
  );
  return {
    id: item.id,
    patientCode: item.patientCode,
    initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'P',
    avatar: '#0EA5E9',
    firstName,
    middleName,
    lastName,
    suffix: '',
    dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString('en-US') : '',
    age: item.age || '',
    languageProfile: item.languageProfile || '',
    diagnosis: item.diagnosis || '',
    guardianName: item.guardianName || '',
    relationship: item.relationship || '',
    contactNumber: item.contactNumber || '',
    guardianEmail: item.guardianEmail || '',
    targetSound: item.targetSound || '',
    hierarchyLevel: item.hierarchyLevel || '',
    phonemePositions: positions,
    secondaryTargets: item.secondaryTargets || '',
    dominantErrorPattern: item.dominantErrorPattern || '',
    dominantErrorOther: item.dominantErrorOther || '',
    errorPatternTaxonomy: item.errorPatternTaxonomy || '',
    clinicalNotation: item.clinicalNotation || '',
    accuracy: 0,
    baseline: false,
    tone: 'blue',
    overviewPrimary: 'Primary Phoneme Target:',
    overviewSecondary: 'Secondary Targets:',
    overviewError: 'Error Pattern Taxonomy:',
    overviewLanguage: 'Language Profile:',
    targetDetail: item.targetSound || '',
    patternDetail: item.clinicalNotation || item.errorPatternTaxonomy || '',
    languageDetail: item.languageProfile || '',
    sessions: notes.map(mapSoapNote),
    accomplishments: accomplishments.map(mapAccomplishment),
  };
}

export function TherapistProvider({ children }: { children: ReactNode }) {
  const [actionNotice, setActionNotice] = useState<{ message: string } | null>(null);
  const showActionNotice = useCallback((message: string) => setActionNotice({ message }), []);
  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [profile, setProfile] = useState<TherapistProfile>(emptyProfile);
  const [notifications, setNotifications] = useState<TherapistNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newRecordings, setNewRecordings] = useState(true);
  const [followUpAlerts, setFollowUpAlerts] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  const refreshPatients = useCallback(async () => {
    setPatientsLoading(true);
    setPatientsError(null);
    try {
      const savedPatients = await getPatients();
      const records = await Promise.all(savedPatients.map(async (patient) => {
        const [notes, accomplishments] = await Promise.all([
          getSoapNotes(patient.id),
          getAccomplishments(patient.id),
        ]);
        return mapPatient(patient, notes, accomplishments);
      }));
      setPatients(records);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load therapist patient records.';
      setPatientsError(message);
      throw error;
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getTherapistProfile(), getNotifications()])
      .then(([savedProfile, savedNotifications]) => {
        if (!active) return;
        setProfile({
          fullName: savedProfile.fullName,
          email: savedProfile.email,
          contact: savedProfile.contact,
          role: savedProfile.title,
          license: savedProfile.license,
          clinic: savedProfile.clinic,
        });
        setNotifications(savedNotifications.map((item) => ({
          id: item.id,
          title: `${item.name} ${item.action}`,
          body: item.detail,
          time: new Date(item.time).toLocaleString(),
          read: !item.unread,
        })));
      })
      .catch((error: unknown) => {
        if (active) setPatientsError(error instanceof Error ? error.message : 'Could not load therapist profile.');
      });
    void refreshPatients().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [refreshPatients]);

  const addPatient = useCallback(async (input: NewPatientInput) => {
    const patient = await createTherapistPatient(input);
    await refreshPatients();
    return patient;
  }, [refreshPatients]);

  const addSoapNote = useCallback(async (patientId: string, note: SoapNote) => {
    await createSoapNote(patientId, {
      number: note.number,
      date: new Date().toISOString(),
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
    });
    await refreshPatients();
  }, [refreshPatients]);

  const isDark = themeMode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  const updateProfile = useCallback(async (
    patch: Partial<Pick<TherapistProfile, 'fullName' | 'role' | 'license' | 'clinic' | 'contact' | 'photoUri'>>,
  ) => {
    const next = { ...profile, ...patch };
    const saved = await updateTherapistProfile({
      fullName: next.fullName,
      contact: next.contact,
      title: next.role,
      license: next.license,
      clinic: next.clinic,
    });
    setProfile((current) => ({
      ...current,
      fullName: saved.fullName,
      email: saved.email,
      contact: saved.contact,
      role: saved.title,
      license: saved.license,
      clinic: saved.clinic,
      photoUri: next.photoUri,
    }));
  }, [profile]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, nextPassword: string) => {
    if (!currentPassword.trim()) return 'Enter your current password.';
    if (nextPassword.length < 8 || nextPassword.length > 20) return 'Use 8 to 20 characters.';
    if (!/[a-z]/.test(nextPassword)) return 'Include a lowercase letter.';
    if (!/[A-Z]/.test(nextPassword)) return 'Include a capital letter.';
    if (!/\d/.test(nextPassword)) return 'Include a number.';
    if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(nextPassword)) return 'Include a special character.';
    try {
      await changeAccountPassword({ currentPassword, newPassword: nextPassword });
      setPasswordUpdated(true);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not change your password.';
    }
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const value = useMemo(() => ({
    palette,
    actionNotice,
    showActionNotice,
    isDark,
    themeMode,
    setThemeMode,
    profile,
    updateProfile,
    notifications,
    unreadCount,
    notificationsOpen,
    setNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    newRecordings,
    setNewRecordings,
    followUpAlerts,
    setFollowUpAlerts,
    settingsOpen,
    setSettingsOpen,
    passwordUpdated,
    updatePassword,
    patients,
    patientsLoading,
    patientsError,
    refreshPatients,
    addPatientOpen,
    setAddPatientOpen,
    addPatient,
    addSoapNote,
  }), [
    palette,
    actionNotice,
    showActionNotice,
    isDark,
    themeMode,
    profile,
    updateProfile,
    notifications,
    unreadCount,
    notificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    newRecordings,
    followUpAlerts,
    settingsOpen,
    passwordUpdated,
    updatePassword,
    patients,
    patientsLoading,
    patientsError,
    refreshPatients,
    addPatientOpen,
    addPatient,
    addSoapNote,
  ]);

  return <TherapistContext.Provider value={value}>{children}</TherapistContext.Provider>;
}

export function useTherapist() {
  const value = useContext(TherapistContext);
  if (!value) throw new Error('useTherapist must be used inside TherapistProvider');
  return value;
}
