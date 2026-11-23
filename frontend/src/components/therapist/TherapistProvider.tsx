import { DEMO_STUDENT_ID } from '@/data/learning-workflow';
import { studentAgeFromBirthDate, studentBirthDateNotice } from '@/data/calendar-date';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  sampleNotifications,
  sampleProfile,
  type TherapistNotification,
  type TherapistProfile,
} from '@/Therapist-modules/therapist-homepage/data/sampleData';
import { createPatient, samplePatients, type NewPatientInput, type PatientRecord, type SoapNote } from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { darkPalette, lightPalette, type ThemeMode, type TherapistPalette } from '@/styles/therapistPalette';

type TherapistContextValue = {
  palette: TherapistPalette;
  actionNotice: { message: string } | null;
  showActionNotice: (message: string) => void;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  profile: TherapistProfile;
  updateProfile: (patch: Partial<Pick<TherapistProfile, 'fullName' | 'role' | 'contact' | 'photoUri'>>) => void;
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
  updatePassword: (currentPassword: string, nextPassword: string) => string | null;
  patients: PatientRecord[];
  addPatientOpen: boolean;
  setAddPatientOpen: (open: boolean) => void;
  addPatient: (input: NewPatientInput) => void;
  addSoapNote: (patientId: string, note: SoapNote) => void;
};

const TherapistContext = createContext<TherapistContextValue | null>(null);

export function TherapistProvider({ children }: { children: ReactNode }) {
  const [actionNotice, setActionNotice] = useState<{ message: string } | null>(null);
  const showActionNotice = useCallback((message: string) => setActionNotice({ message }), []);
  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [profile, setProfile] = useState<TherapistProfile>(sampleProfile);
  const [notifications, setNotifications] = useState<TherapistNotification[]>(sampleNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newRecordings, setNewRecordings] = useState(true);
  const [followUpAlerts, setFollowUpAlerts] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>(() => [
    ...samplePatients,
    {
      ...createPatient({
        firstName: 'Mia', middleName: '', lastName: 'Santos', suffix: '', dateOfBirth: '',
        age: '5', languageProfile: 'Bilingual Tagalog & English', diagnosis: '',
        guardianName: '', relationship: '', contactNumber: '', guardianEmail: '',
        targetSound: '/s/ Sound', hierarchyLevel: 'Sound', phonemePositions: [],
        secondaryTargets: '', dominantErrorPattern: '', dominantErrorOther: '',
        errorPatternTaxonomy: '', clinicalNotation: '',
      }),
      id: DEMO_STUDENT_ID,
    },
  ]);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  const addPatient = useCallback((input: NewPatientInput) => {
    const age = studentAgeFromBirthDate(input.dateOfBirth);
    if (age === null) throw new Error(studentBirthDateNotice);
    setPatients((current) => [createPatient({ ...input, age: String(age) }), ...current]);
  }, []);

  const addSoapNote = useCallback((patientId: string, note: SoapNote) => {
    setPatients((current) =>
      current.map((patient) => (patient.id === patientId ? { ...patient, sessions: [...patient.sessions, note] } : patient)),
    );
  }, []);

  const isDark = themeMode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  const updateProfile = useCallback((patch: Partial<Pick<TherapistProfile, 'fullName' | 'role' | 'contact' | 'photoUri'>>) => {
    setProfile((current) => ({ ...current, ...patch }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const updatePassword = useCallback((currentPassword: string, nextPassword: string) => {
    if (!currentPassword.trim()) return 'Enter your current password.';
    if (nextPassword.length < 8 || nextPassword.length > 20) return 'Use 8 to 20 characters.';
    if (!/[a-z]/.test(nextPassword)) return 'Include a lowercase letter.';
    if (!/[A-Z]/.test(nextPassword)) return 'Include a capital letter.';
    if (!/\d/.test(nextPassword)) return 'Include a number.';
    if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(nextPassword)) return 'Include a special character.';
    setPasswordUpdated(true);
    return null;
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(
    () => ({
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
      addPatientOpen,
      setAddPatientOpen,
      addPatient,
      addSoapNote,
    }),
    [
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
      addPatientOpen,
      addPatient,
      addSoapNote,
    ],
  );

  return <TherapistContext.Provider value={value}>{children}</TherapistContext.Provider>;
}

export function useTherapist() {
  const value = useContext(TherapistContext);
  if (!value) {
    throw new Error('useTherapist must be used inside TherapistProvider');
  }
  return value;
}
