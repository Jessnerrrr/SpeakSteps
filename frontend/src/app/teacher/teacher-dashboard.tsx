import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
  Switch,
  Pressable,
  useColorScheme,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { clearSession } from '@/services/user-api';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  changeAccountPassword,
  getActivities,
  getAccountProfile,
  getAccomplishments,
  getAssignments,
  getNotifications,
  getPatients,
  getProgress,
  getSoapNotes,
  getSubmissions,
  getWordBank,
  searchPatients,
  updateAccountProfile,
  type ApiAccomplishment,
  type ApiActivity,
  type ApiAssignment,
  type ApiSoapNote,
  type ApiSubmission,
  type ApiWordBankEntry,
  type PatientSearchResult,
} from '@/services/user-api';
import {
  Menu,
  ArrowLeft,
  Bell,
  Search,
  Plus,
  Minus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Play,
  Upload,
  Calendar,
  Home,
  Users,
  Speech,
  Star,
  User,
  Settings,
  LogOut,
  Palette,
  SunMoon,
  Lock,
  ShieldCheck,
  Camera,
  TrendingUp,
  UserCheck,
  Filter,
  Trash2,
  Pencil,
  ArrowUpDown,
} from 'lucide-react-native';

// ==========================================
// --- Data Interfaces ---
// ==========================================
interface Patient {
  id: string;
  patientCode?: string;
  initials: string;
  name: string;
  age: number;
  targetDescription: string;
  accuracy: number | null;
  accuracyColor: string;
  progressColor: string;
  badgeBg: string;
  badgeTextColor: string;
  stage: string;
  compliance: string;
  complianceDays: string;
  phonemeTarget: {
    primary: string;
    secondary: string;
    errorPattern: string;
    languageProfile: string;
  };
  assignedCount?: number;
  completedCount?: number;
  submissionCount?: number;
  accomplishments?: ApiAccomplishment[];
}

interface SoapNote {
  sessionNumber: number;
  date: string;
  s: string;
  o: string;
  a: string;
  p: string;
}

interface Accomplishment {
  id: string;
  date: string;
  duration: string;
  title: string;
  accuracyText: string;
  notes: string;
  audioDuration: string;
}

interface ActivityItem {
  id: string;
  sound: string;
  soundBg: string;
  soundColor: string;
  category: 'Words' | 'Phrases' | 'Syllables' | 'Isolation' | 'Sentences';
  title: string;
  subtitle: string;
  instructions: string;
  articulatoryGuide: string;
  language: string;
  targetSound: string;
  practiceLevel: string;
  wordPositions: string[];
  words: ApiActivity['words'];
  initialWords: string[];
  phrases: string[];
}

interface ReviewItem {
  id: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  studentName: string;
  activityTitle: string;
  phonemeDesc: string;
  status: 'Pending' | 'Reviewed';
  submittedDate: string;
  targetWord: string;
  audioDuration: string;
  audioRecordingUrl?: string;
  observations?: string;
}

// ==========================================
// --- Initial Mock Data ---
// ==========================================
const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    initials: 'KS',
    name: 'Khyl Shervin Sude',
    age: 5,
    targetDescription: 'isolated sounds • target /r/ initial',
    accuracy: 35,
    accuracyColor: '#DC2626',
    progressColor: '#F87171',
    badgeBg: '#FEE2E2',
    badgeTextColor: '#DC2626',
    stage: 'Isolated sounds',
    compliance: '85%',
    complianceDays: '5/7 days',
    phonemeTarget: {
      primary: '/r/ initial',
      secondary: '/s/ initial, /l/ medial',
      errorPattern: 'Gliding (/r/ → /w/) e.g. "Relos" → "Welos"',
      languageProfile: 'Bilingual Tagalog (L1) & English (L2)',
    },
  },
  {
    id: '2',
    initials: 'AV',
    name: 'Angelica Vega',
    age: 6,
    targetDescription: 'words • target /l/ medial',
    accuracy: 46,
    accuracyColor: '#D97706',
    progressColor: '#FBBF24',
    badgeBg: '#FEF3C7',
    badgeTextColor: '#D97706',
    stage: 'Words',
    compliance: '70%',
    complianceDays: '4/7 days',
    phonemeTarget: {
      primary: '/l/ medial',
      secondary: '/k/ initial',
      errorPattern: 'Omission of medial consonants',
      languageProfile: 'English (L1)',
    },
  },
  {
    id: '3',
    initials: 'JE',
    name: 'Jhonas Elsisura',
    age: 7,
    targetDescription: 'phrases • target /s/ final',
    accuracy: 86,
    accuracyColor: '#16A34A',
    progressColor: '#22C55E',
    badgeBg: '#DCFCE7',
    badgeTextColor: '#16A34A',
    stage: 'Phrases',
    compliance: '95%',
    complianceDays: '7/7 days',
    phonemeTarget: {
      primary: '/s/ final',
      secondary: '/th/ initial',
      errorPattern: 'Fronting of fricatives',
      languageProfile: 'Bilingual Tagalog & English',
    },
  },
];

const INITIAL_SUBMISSIONS = [
  {
    id: 'sub-1',
    initials: 'AV',
    name: 'Khyl Shervin Sude',
    phrase: '“rabbit”',
    time: '35 min ago',
    progress: 0.65,
  },
  {
    id: 'sub-2',
    initials: 'AV',
    name: 'Angelica Vega',
    phrase: '“sun and sand”',
    time: '1 hr ago',
    progress: 0.55,
  },
  {
    id: 'sub-3',
    initials: 'JE',
    name: 'Jhonas Elsisura',
    phrase: '“lemon”',
    time: 'October 26, 2026',
    progress: 0.6,
  },
];

const SAMPLE_ACCOMPLISHMENTS: Accomplishment[] = [
  {
    id: 'acc-1',
    date: 'Oct 31, 2026 • 10:30 AM',
    duration: '25 min',
    title: 'Isolated /r/ Sound Production (Initial Position)',
    accuracyText: '8 of 20 trials correct',
    notes: 'Khyl showed improved tongue elevation when given visual prompts in Tagalog word drills.',
    audioDuration: '0:06',
  },
  {
    id: 'acc-2',
    date: 'Oct 27, 2026 • 4:15 AM',
    duration: '15 min',
    title: 'Tagalog Word Recognition & Repetition',
    accuracyText: '7 of 20 trials correct',
    notes: 'Good effort on words "Raya" and "Relo"',
    audioDuration: '0:06',
  },
];

// Mock Reviews matching Image 2 ("Teacher - Reviews")
const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /r/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Pending',
    submittedDate: '35 min ago',
    targetWord: 'rabbit',
    audioDuration: '0:06',
  },
  {
    id: 'rev-2',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /t/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Pending',
    submittedDate: '1 hr ago',
    targetWord: 'red',
    audioDuration: '0:08',
  },
  {
    id: 'rev-3',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /r/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Reviewed',
    submittedDate: 'Oct 26, 2026',
    targetWord: 'run',
    audioDuration: '0:07',
  },
  {
    id: 'rev-4',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /r/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Pending',
    submittedDate: 'Yesterday',
    targetWord: 'rice',
    audioDuration: '0:06',
  },
  {
    id: 'rev-5',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /t/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Pending',
    submittedDate: 'Oct 24, 2026',
    targetWord: 'tap',
    audioDuration: '0:05',
  },
  {
    id: 'rev-6',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /r/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Reviewed',
    submittedDate: 'Oct 22, 2026',
    targetWord: 'rain',
    audioDuration: '0:06',
  },
  {
    id: 'rev-7',
    initials: 'KS',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    studentName: 'Khyl Shervin Sude',
    activityTitle: 'Ready, set, /r/',
    phonemeDesc: '/r/ - Phrases',
    status: 'Pending',
    submittedDate: 'Oct 20, 2026',
    targetWord: 'rock',
    audioDuration: '0:07',
  },
];

// Mock Notifications matching Screenshot 1 Right
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    name: 'Khyll',
    action: 'submitted an audio recording',
    detail: '/r/ Isolated Sounds (Target: 35% accuracy)',
    time: '5m ago',
    unread: true,
  },
  {
    id: 'notif-2',
    name: 'Angelica',
    action: 'completed Sentences practice',
    detail: 'Achieved 80% accuracy score on Sibilant /s/ targets',
    time: '1h ago',
    unread: true,
  },
  {
    id: 'notif-3',
    name: 'Jhonas',
    action: 'submitted Syllables home practice',
    detail: '15/20 correct trials recorded by parent',
    time: '3h ago',
    unread: true,
  },
  {
    id: 'notif-4',
    name: 'Mcgravy',
    action: 'completed Phrases practice',
    detail: 'Achieved 75% accuracy rate',
    time: 'Today at 09:09 AM',
    unread: false,
  },
];

interface WordBankEntry {
  id: string;
  text: string;
  sound: string;
  position: 'Initial' | 'Medial' | 'Final';
  language: string;
}

// Theme Colors Palette Generator
const getThemeColors = (isDark: boolean) => ({
  isDark,
  bg: isDark ? '#0B1120' : '#FFFFFF',
  bgSecondary: isDark ? '#0F172A' : '#F8FAFC',
  card: isDark ? '#1E293B' : '#FFFFFF',
  cardSubtle: isDark ? '#0F172A' : '#F8FAFC',
  border: isDark ? '#334155' : '#E2E8F0',
  borderLight: isDark ? '#1E293B' : '#F1F5F9',
  text: isDark ? '#F8FAFC' : '#1E293B',
  textSub: isDark ? '#94A3B8' : '#64748B',
  textMuted: isDark ? '#64748B' : '#94A3B8',
  heading: isDark ? '#38BDF8' : '#0369A1',
  primary: '#0284C7',
  primaryLight: isDark ? '#082F49' : '#CFFAFE',
  hamburger: isDark ? '#F8FAFC' : '#1E293B',
  inputBg: isDark ? '#0B1120' : '#FFFFFF',
  inputText: isDark ? '#F8FAFC' : '#1E293B',
  segmentBg: isDark ? '#0B1120' : '#FFFFFF',
  logoutBtnBg: isDark ? '#334155' : '#CBD5E1',
  logoutBtnText: isDark ? '#F8FAFC' : '#1E293B',
  divider: isDark ? '#334155' : '#F1F5F9',
  modalOverlay: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.65)',
  menuOverlay: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.25)',
  peachCardBg: isDark ? '#2D1B11' : '#FFF7ED',
  peachCardBorder: isDark ? '#7C2D12' : '#FED7AA',
  peachPillBg: isDark ? '#431407' : '#FFEDD5',
  peachPillText: isDark ? '#FDBA74' : '#C2410C',
  peachText: isDark ? '#FB923C' : '#C2410C',
  yellowCardBg: isDark ? '#2D2305' : '#FFFBEB',
  yellowCardBorder: isDark ? '#78350F' : '#FEF3C7',
  bottomNavBg: isDark ? '#1E293B' : '#FFFFFF',
  bottomNavBorder: isDark ? '#334155' : '#E2E8F0',
});

const SPECIALTY_PALETTE = [
  { border: '#38BDF8', text: '#0284C7', darkText: '#7DD3FC', darkBg: 'rgba(56, 189, 248, 0.14)' },
  { border: '#FB923C', text: '#EA580C', darkText: '#FDBA74', darkBg: 'rgba(251, 146, 60, 0.14)' },
  { border: '#4ADE80', text: '#16A34A', darkText: '#86EFAC', darkBg: 'rgba(74, 222, 128, 0.14)' },
  { border: '#FBBF24', text: '#D97706', darkText: '#FDE68A', darkBg: 'rgba(251, 191, 36, 0.14)' },
  { border: '#84CC16', text: '#65A30D', darkText: '#BEF264', darkBg: 'rgba(132, 204, 22, 0.14)' },
  { border: '#F97316', text: '#EA580C', darkText: '#FDBA74', darkBg: 'rgba(249, 115, 22, 0.14)' },
  { border: '#38BDF8', text: '#0284C7', darkText: '#7DD3FC', darkBg: 'rgba(56, 189, 248, 0.14)' },
  { border: '#94A3B8', text: '#475569', darkText: '#CBD5E1', darkBg: 'rgba(148, 163, 184, 0.14)' },
];

function mapTeacherPatient(
  item: PatientSearchResult,
  assignments: ApiAssignment[],
  submissions: ApiSubmission[],
): Patient {
  const patientAssignments = assignments.filter((assignment) => assignment.patientId === item.id);
  const completedCount = patientAssignments.filter((assignment) => assignment.status === 'Completed').length;
  const patientSubmissions = submissions.filter((submission) => submission.patientId === item.id);
  const name = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ');
  const primaryTarget = item.targetSound || '';
  return {
    id: item.id,
    patientCode: item.patientCode,
    initials: `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`.toUpperCase() || 'P',
    name: name || 'Unnamed patient',
    age: Number(item.age) || 0,
    targetDescription: [item.hierarchyLevel || 'No level set', primaryTarget ? `target ${primaryTarget}` : 'No target recorded'].join(' • '),
    accuracy: null,
    accuracyColor: '#64748B',
    progressColor: '#94A3B8',
    badgeBg: '#F1F5F9',
    badgeTextColor: '#475569',
    stage: item.hierarchyLevel || patientAssignments[0]?.activity.level || 'Not set',
    compliance: `${completedCount}/${patientAssignments.length} tasks`,
    complianceDays: `${patientSubmissions.length} submissions`,
    phonemeTarget: {
      primary: primaryTarget || 'Not recorded',
      secondary: item.secondaryTargets || 'Not recorded',
      errorPattern: item.dominantErrorPattern || item.errorPatternTaxonomy || 'Not recorded',
      languageProfile: item.languageProfile || 'Not recorded',
    },
    assignedCount: patientAssignments.length,
    completedCount,
    submissionCount: patientSubmissions.length,
  };
}

function mapTeacherActivity(activity: ApiActivity): ActivityItem {
  const level = activity.level.toLowerCase();
  const category: ActivityItem['category'] =
    level === 'word' || level === 'words' ? 'Words'
      : level === 'phrase' || level === 'phrases' ? 'Phrases'
        : level === 'syllable' || level === 'syllables' ? 'Syllables'
          : level === 'isolation' ? 'Isolation'
            : 'Sentences';
  const soundColors: Record<string, [string, string]> = {
    '/s/': ['#DCFCE7', '#16A34A'],
    '/r/': ['#FFEDD5', '#EA580C'],
    '/l/': ['#FEF9C3', '#CA8A04'],
    '/t/': ['#FFE4E6', '#E11D48'],
  };
  const [soundBg, soundColor] = soundColors[activity.sound] || ['#E0F2FE', '#0284C7'];
  const phrases = activity.words.map((word) => word.phrase).filter(Boolean);
  return {
    id: activity.id,
    sound: activity.sound,
    soundBg,
    soundColor,
    category,
    title: activity.title,
    subtitle: `${activity.language} · Therapist assigned`,
    instructions: activity.instructions,
    articulatoryGuide: activity.guide,
    language: activity.language,
    targetSound: activity.sound,
    practiceLevel: activity.level,
    wordPositions: activity.positions,
    words: activity.words,
    initialWords: activity.words.map((word) => word.text),
    phrases: [...phrases, ...activity.customLines],
  };
}

export default function TeacherDashboardScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  // --- Main Navigation Tabs ---
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'activities' | 'reviews'>('home');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const routeParams = useLocalSearchParams<{ tab?: string; view?: string }>();

  // Sync route params with dashboard tab/view
  useEffect(() => {
    if (routeParams?.tab === 'activities') {
      setActiveTab('activities');
      if (routeParams?.view === 'wordbank') {
        setActivitiesView('wordbank');
      } else if (routeParams?.view === 'library') {
        setActivitiesView('library');
      }
    }
  }, [routeParams?.tab, routeParams?.view]);

  // --- Three Lines (Hamburger) Menu, Profile, Settings & Notifications State ---
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState<Array<typeof INITIAL_NOTIFICATIONS[number]>>([]);

  // Therapist / Teacher Profile Data
  const [therapistProfile, setTherapistProfile] = useState({
    name: 'Dr. Ameer Andres',
    credentials: 'SLP-CCC',
    fullName: 'Dr. Ameer Andres, SLP-CCC',
    title: 'Speech-Language Pathologist',
    license: 'PRC #0048291',
    clinic: 'LittleVoices Pediatric Speech Center',
    contact: '+63 9000 000 000',
    email: 'ameer@speakstep.com',
    photoUri: null as string | null,
    specializations: [
      'Articulation',
      'Phonological',
      'Fluency',
      'Language',
      'Voice',
      'Early intervention',
      'Bilingual',
      'AAC',
    ],
  });
  const [editProfileForm, setEditProfileForm] = useState({ ...therapistProfile });

  // Settings Toggles & Theme (Screenshot 1 Left)
  const [newRecordingsToggle, setNewRecordingsToggle] = useState(true);
  const [followUpAlertsToggle, setFollowUpAlertsToggle] = useState(true);
  const [readyToLevelUpToggle, setReadyToLevelUpToggle] = useState(false);
  const [teacherUpdatesToggle, setTeacherUpdatesToggle] = useState(true);
  const [missedExercisesToggle, setMissedExercisesToggle] = useState(true);
  const [twoFactorAuthToggle, setTwoFactorAuthToggle] = useState(true);
  const [themeMode, setThemeMode] = useState<'Auto' | 'Light' | 'Dark'>('Auto');
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', device: 'Redmi 15', isCurrent: true, location: 'Quezon City', lastActive: 'Active now' },
    { id: '2', device: 'Samsung Galaxy Tab S9 FE', isCurrent: false, location: 'Android App', lastActive: 'Yesterday' },
    { id: '3', device: 'Samsung Galaxy S24', isCurrent: false, location: 'Chrome', lastActive: 'Nov 10' },
  ]);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');
  const [profileOpenedFromSettings, setProfileOpenedFromSettings] = useState(false);

  // --- Dynamic Color Theme Resolution (Functional Light & Dark) ---
  const systemColorScheme = useColorScheme();
  const isDark = themeMode === 'Auto' ? systemColorScheme === 'dark' : themeMode === 'Dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // --- Patients Tab State ---
  const [patientSearch, setPatientSearch] = useState('');
  const [livePatientResults, setLivePatientResults] = useState<PatientSearchResult[] | null>(null);
  const [livePatientError, setLivePatientError] = useState<string | null>(null);
  const [livePatientLoading, setLivePatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [soapNotes, setSoapNotes] = useState<SoapNote[]>([]);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const query = patientSearch.trim();
    if (!query) {
      setLivePatientResults(null);
      setLivePatientError(null);
      setLivePatientLoading(false);
      return;
    }

    let active = true;
    setLivePatientResults(null);
    setLivePatientLoading(true);
    setLivePatientError(null);
    const timeout = setTimeout(() => {
      searchPatients(query)
        .then((results) => {
          if (active) setLivePatientResults(results);
        })
        .catch((error: unknown) => {
          if (active) setLivePatientError(error instanceof Error ? error.message : 'Patient search failed.');
        })
        .finally(() => {
          if (active) setLivePatientLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [patientSearch]);

  useEffect(() => {
    const patientId = selectedPatient?.id;
    if (!patientId) {
      setSoapNotes([]);
      return;
    }
    let active = true;
    setSoapNotes([]);
    setPatientDetailLoading(true);
    Promise.all([
      getProgress(patientId),
      getSoapNotes(patientId),
      getAccomplishments(patientId),
    ])
      .then(([progress, savedNotes, accomplishments]) => {
        if (!active) return;
        setSelectedPatient((current) => current?.id === patientId
          ? {
            ...current,
            assignedCount: progress.assignedCount,
            completedCount: progress.completedCount,
            submissionCount: progress.submissionCount,
            accomplishments,
          }
          : current);
        setSoapNotes(savedNotes.map((note: ApiSoapNote) => ({
          sessionNumber: note.number,
          date: new Date(note.date).toLocaleDateString(),
          s: note.subjective,
          o: note.objective,
          a: note.assessment,
          p: note.plan,
        })));
      })
      .catch((error: unknown) => {
        if (active) setTeacherError(error instanceof Error ? error.message : 'Could not load student progress and notes.');
      })
      .finally(() => {
        if (active) setPatientDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedPatient?.id]);

  // --- Activities Sub-View State ---
  const [activitiesView, setActivitiesView] = useState<'library' | 'preview' | 'edit' | 'assign' | 'wordbank'>('library');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'ALL' | 'Words' | 'Phrases' | 'Syllables' | 'Isolation' | 'Sentences'>('ALL');
  const [activitySearch, setActivitySearch] = useState('');
  const [showActivityFilterPanel, setShowActivityFilterPanel] = useState(false);
  const [activitySortBy, setActivitySortBy] = useState<'default' | 'title-asc' | 'title-desc' | 'sound'>('default');
  const [activitySoundFilter, setActivitySoundFilter] = useState<string[]>([]);
  const [activityLanguageFilter, setActivityLanguageFilter] = useState<string>('ALL');

  const isActivityFilterActive =
    showActivityFilterPanel ||
    activitySortBy !== 'default' ||
    activitySoundFilter.length > 0 ||
    activityLanguageFilter !== 'ALL';
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null);

  // --- Word Bank Tab State ---
  const [wordBankEntries, setWordBankEntries] = useState<WordBankEntry[]>([]);
  const [wordBankQuery, setWordBankQuery] = useState('');
  const [wordBankFiltersOpen, setWordBankFiltersOpen] = useState(false);
  const [wordBankFilterSounds, setWordBankFilterSounds] = useState<string[]>([]);
  const [wordBankFilterPositions, setWordBankFilterPositions] = useState<('Initial' | 'Medial' | 'Final')[]>([]);
  const [wordBankFilterLanguages, setWordBankFilterLanguages] = useState<string[]>([]);

  const filteredWordBank = useMemo(() => {
    const q = wordBankQuery.trim().toLowerCase();
    return wordBankEntries.filter((item) => {
      if (wordBankFilterSounds.length > 0 && !wordBankFilterSounds.includes(item.sound)) return false;
      if (wordBankFilterPositions.length > 0 && !wordBankFilterPositions.includes(item.position)) return false;
      if (wordBankFilterLanguages.length > 0 && !wordBankFilterLanguages.includes(item.language)) return false;
      if (!q) return true;
      return item.text.toLowerCase().includes(q) || item.sound.toLowerCase().includes(q);
    });
  }, [wordBankEntries, wordBankQuery, wordBankFilterSounds, wordBankFilterPositions, wordBankFilterLanguages]);

  const wordBankChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    wordBankFilterSounds.forEach((s) => {
      chips.push({
        key: `sound-${s}`,
        label: s,
        clear: () => setWordBankFilterSounds((curr) => curr.filter((x) => x !== s)),
      });
    });
    wordBankFilterPositions.forEach((pos) => {
      chips.push({
        key: `pos-${pos}`,
        label: pos,
        clear: () => setWordBankFilterPositions((curr) => curr.filter((x) => x !== pos)),
      });
    });
    wordBankFilterLanguages.forEach((lang) => {
      chips.push({
        key: `lang-${lang}`,
        label: lang,
        clear: () => setWordBankFilterLanguages((curr) => curr.filter((x) => x !== lang)),
      });
    });
    return chips;
  }, [wordBankFilterSounds, wordBankFilterPositions, wordBankFilterLanguages]);

  // --- Edit Activity Wizard State (3 Steps) ---
  const [editStep, setEditStep] = useState<1 | 2 | 3>(1);
  const [editTitle, setEditTitle] = useState('Ready, set, /r/');
  const [editTargetSound, setEditTargetSound] = useState('/r/');
  const [editPracticeLevel, setEditPracticeLevel] = useState('Phrases');
  const [editPositions, setEditPositions] = useState<string[]>(['Initial', 'Medial']);
  const [editLanguage, setEditLanguage] = useState<'English' | 'Tagalog'>('English');
  const [editInstructions, setEditInstructions] = useState('Listen to the model. Say each target slowly, then try it on your own.');
  const [editArticulatoryGuide, setEditArticulatoryGuide] = useState('Pull tongue tip back, lips slightly relaxed.');

  // Step 2 Content State
  const [wordOrigin, setWordOrigin] = useState<'wordBank' | 'custom'>('wordBank');
  const [wordBankPositionTab, setWordBankPositionTab] = useState<'Initial' | 'Medial' | 'Final'>('Initial');
  const [wordBankSearch, setWordBankSearch] = useState('');
  const [checkedWords, setCheckedWords] = useState<string[]>(['rabbit', 'red', 'run']);
  const [wordPhrases, setWordPhrases] = useState<{ [key: string]: string }>({
    rabbit: 'The little rabbit hid.',
    red: 'I see a red apple.',
    run: 'See the dog run fast.',
  });

  // Custom Word State
  const [newCustomWordInput, setNewCustomWordInput] = useState('');
  const [customWords, setCustomWords] = useState<string[]>(['Rice', 'Rich']);
  const [saveToWordBankChecked, setSaveToWordBankChecked] = useState(true);
  const [customPhrases, setCustomPhrases] = useState<string[]>([
    'The rice is rich.',
    'The red rabbit runs.',
  ]);
  const [newPhraseInput, setNewPhraseInput] = useState('');

  // Assign Activity View State
  const [assignStudent, setAssignStudent] = useState('Mc Grady Andrea Andres');
  const [assignActivityName, setAssignActivityName] = useState('Ready, set, /r/');
  const [assignDueDate, setAssignDueDate] = useState('01/11/2026');
  const [assignInstructions, setAssignInstructions] = useState('Listen to the model. Say each target slowly, then try it on your own.');
  const [assignPreviewExpanded, setAssignPreviewExpanded] = useState(false);

  // --- Reviews Tab State (Image 2) ---
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [reviewsFilter, setReviewsFilter] = useState<'All' | 'Pending' | 'Reviewed'>('All');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  useEffect(() => {
    let active = true;
    const loadTeacherDashboard = async () => {
      setTeacherLoading(true);
      setTeacherError(null);
      try {
        const [profile, savedPatients, savedAssignments, savedSubmissions, savedNotifications, savedActivities, savedWordBank] = await Promise.all([
          getAccountProfile(),
          getPatients(),
          getAssignments(),
          getSubmissions(),
          getNotifications(),
          getActivities(),
          getWordBank(),
        ]);
        if (!active) return;
        setTherapistProfile((current) => ({
          ...current,
          name: profile.fullName,
          fullName: profile.fullName,
          email: profile.email,
          contact: profile.contact,
        }));
        setEditProfileForm((current) => ({
          ...current,
          name: profile.fullName,
          fullName: profile.fullName,
          email: profile.email,
          contact: profile.contact,
        }));
        setAssignments(savedAssignments);
        setSubmissions(savedSubmissions);
        setActivities(savedActivities.map(mapTeacherActivity));
        setWordBankEntries(savedWordBank.map((word: ApiWordBankEntry) => ({
          id: word.id,
          text: word.text,
          sound: word.sound,
          position: word.position,
          language: word.language,
        })));
        setPatients(savedPatients.map((patient) => mapTeacherPatient(patient, savedAssignments, savedSubmissions)));
        setReviewsList(savedSubmissions.map((submission) => ({
          id: submission.id,
          initials: submission.initial,
          avatarBg: '#E0F2FE',
          avatarColor: '#0369A1',
          studentName: submission.student,
          activityTitle: submission.activity,
          phonemeDesc: submission.sound || 'Speech practice',
          status: submission.status,
          submittedDate: new Date(submission.submittedAt).toLocaleDateString(),
          targetWord: submission.activity,
          audioDuration: submission.durationSeconds == null ? '' : `${Math.round(submission.durationSeconds)} sec`,
          audioRecordingUrl: submission.audioRecordingUrl,
          observations: submission.review?.observations || '',
        })));
        setNotifications(savedNotifications.map((item) => ({
          id: item.id,
          name: item.name,
          action: item.action,
          detail: item.detail,
          time: item.time,
          unread: item.unread,
        })));
      } catch (error) {
        if (active) setTeacherError(error instanceof Error ? error.message : 'Could not load teacher data.');
      } finally {
        if (active) setTeacherLoading(false);
      }
    };
    void loadTeacherDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (!fontsLoaded) return null;

  // Dynamic Pending count
  const pendingReviewsCount = reviewsList.filter((r) => r.status === 'Pending').length;

  // Filtered Patients
  const searchResultIds = livePatientResults ? new Set(livePatientResults.map((item) => item.id)) : null;
  const filteredPatients = patients.filter((p) =>
    (!searchResultIds || searchResultIds.has(p.id)) && (
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.patientCode || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.targetDescription.toLowerCase().includes(patientSearch.toLowerCase())
    )
  );

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    let list = activities.filter((act) => {
      const matchesCategory =
        activityCategoryFilter === 'ALL' || act.category === activityCategoryFilter;
      const matchesSearch =
        act.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
        act.sound.toLowerCase().includes(activitySearch.toLowerCase());
      const matchesSound =
        activitySoundFilter.length === 0 || activitySoundFilter.includes(act.sound);
      const matchesLanguage =
        activityLanguageFilter === 'ALL' || act.language === activityLanguageFilter;

      return matchesCategory && matchesSearch && matchesSound && matchesLanguage;
    });

    if (activitySortBy === 'title-asc') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (activitySortBy === 'title-desc') {
      list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    } else if (activitySortBy === 'sound') {
      list = [...list].sort((a, b) => a.sound.localeCompare(b.sound));
    }

    return list;
  }, [
    activities,
    activityCategoryFilter,
    activitySearch,
    activitySoundFilter,
    activityLanguageFilter,
    activitySortBy,
  ]);

  // Filtered Reviews
  const filteredReviews = reviewsList.filter((rev) => {
    if (reviewsFilter === 'All') return true;
    return rev.status === reviewsFilter;
  });

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Word in checklist
  const toggleWordCheck = (word: string) => {
    if (checkedWords.includes(word)) {
      setCheckedWords(checkedWords.filter((w) => w !== word));
    } else {
      setCheckedWords([...checkedWords, word]);
    }
  };

  // Add Custom Word
  const handleAddCustomWord = () => {
    if (!newCustomWordInput.trim()) return;
    if (!customWords.includes(newCustomWordInput.trim())) {
      setCustomWords([...customWords, newCustomWordInput.trim()]);
    }
    setNewCustomWordInput('');
  };

  // Add Custom Phrase
  const handleAddCustomPhrase = () => {
    if (!newPhraseInput.trim()) return;
    setCustomPhrases([...customPhrases, newPhraseInput.trim()]);
    setNewPhraseInput('');
  };

  // --- Profile, Settings & Logout Handlers ---
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const saved = await updateAccountProfile({
        fullName: editProfileForm.name.trim(),
        contact: editProfileForm.contact.trim(),
      });
      setTherapistProfile((current) => ({
        ...current,
        ...editProfileForm,
        name: saved.fullName,
        fullName: saved.fullName,
        email: saved.email,
        contact: saved.contact,
      }));
      setShowProfileModal(false);
      triggerToast('Account name and contact updated.');
      if (profileOpenedFromSettings) {
        setShowSettingsModal(true);
        setProfileOpenedFromSettings(false);
      }
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not save your account profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddSpecialty = () => {
    const trimmed = newSpecialtyInput.trim();
    if (!trimmed) return;
    if (!editProfileForm.specializations.includes(trimmed)) {
      setEditProfileForm((prev) => ({
        ...prev,
        specializations: [...prev.specializations, trimmed],
      }));
    }
    setNewSpecialtyInput('');
  };

  const handleRemoveSpecialty = (item: string) => {
    setEditProfileForm((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== item),
    }));
  };

  const handleRevokeSession = (id: string) => {
    setActiveSessions((current) => current.filter((s) => s.id !== id));
    triggerToast('Session revoked successfully.');
  };

  const handlePickPhoto = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setEditProfileForm((prev) => ({ ...prev, photoUri: url }));
      };
      input.click();
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('Please fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await changeAccountPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
      triggerToast('Password changed successfully!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not change your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await clearSession();
      setShowLogoutConfirm(false);
      setShowMenu(false);
      setShowSettingsModal(false);
      router.replace('/teacher-login' as any);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not clear your session. Please try again.');
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    triggerToast('All notifications marked as read.');
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ==========================================
          --- GLOBAL TOP HEADER ---
          ========================================== */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        {/* If inside subviews (preview, edit, assign), show Back Arrow; else Hamburger */}
        {activeTab === 'activities' && activitiesView !== 'library' ? (
          <TouchableOpacity
            style={[styles.backCircleBtn, { borderColor: colors.border }]}
            onPress={() => {
              if (activitiesView === 'edit' && editStep > 1) {
                setEditStep((editStep - 1) as any);
              } else {
                setActivitiesView('library');
              }
            }}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => {
              setShowNotificationsDropdown(false);
              setShowMenu(!showMenu);
            }}
          >
            <Menu size={22} color={colors.hamburger} />
          </TouchableOpacity>
        )}

        <Text style={[styles.appTitle, { color: isDark ? '#38BDF8' : '#0284C7' }]}>SpeakSteps</Text>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => {
            setShowMenu(false);
            setShowNotificationsDropdown(!showNotificationsDropdown);
          }}
        >
          <View>
            <Bell size={22} color="#0284C7" />
            {notifications.some((n) => n.unread) && <View style={styles.notificationDot} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* ==========================================
          --- MAIN SCROLLABLE CONTENT BODY ---
          ========================================== */}
      <ScrollView
        style={[styles.mainScrollView, { backgroundColor: colors.bgSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------
            TAB 1: HOME DASHBOARD
           ---------------------------------------------------- */}
        {activeTab === 'home' && (
          <>
            <View style={styles.greetingSection}>
              <Text style={[styles.dateText, { color: colors.textSub }]}>{new Date().toLocaleDateString()}</Text>
              <Text style={[styles.greetingTitle, { color: colors.heading }]}>Welcome, {therapistProfile.name}</Text>
              <Text style={[styles.greetingSubtitle, { color: colors.textSub }]}>Here's what needs your attention today.</Text>

              <TouchableOpacity
                style={[styles.assignButton, { backgroundColor: colors.primaryLight }]}
                activeOpacity={0.8}
                onPress={() => setActiveTab('patients')}
              >
                <Users size={18} color="#0F766E" style={{ marginRight: 6 }} />
                <Text style={styles.assignButtonText}>View Student Roster</Text>
              </TouchableOpacity>
            </View>
            {teacherLoading ? <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>Loading student data…</Text> : null}
            {teacherError ? <Text style={[styles.pageSubtitle, { color: '#DC2626' }]}>{teacherError}</Text> : null}

            {/* 2x2 Metric Cards Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveTab('reviews');
                  setReviewsFilter('Pending');
                }}
              >
                <View style={styles.statCardTop}>
                  <Text style={[styles.statNumber, { color: '#16A34A' }]}>{pendingReviewsCount}</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.statBadgeText, { color: '#15803D' }]}>Pending</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Recordings to Review</Text>
              </TouchableOpacity>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statCardTop}>
                  <Text style={[styles.statNumber, { color: '#F97316' }]}>{patients.length}</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={[styles.statBadgeText, { color: '#C2410C' }]}>Alert</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Students</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statCardTop}>
                  <Text style={[styles.statNumber, { color: '#0EA5E9' }]}>{submissions.length}</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#BAE6FD' }]}>
                    <Text style={[styles.statBadgeText, { color: '#0369A1' }]}>Today</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Submissions Received</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statCardTop}>
                  <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{assignments.filter((assignment) => assignment.status === 'Assigned').length}</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statBadgeText, { color: '#B45309' }]}>Active</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Active Assignments</Text>
              </View>
            </View>

            {/* Patient Progress Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient Progress</Text>
              <TouchableOpacity onPress={() => setActiveTab('patients')}>
                <Text style={[styles.viewAllText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.patientListContainer}>
              {patients.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedPatient(item)}
                >
                  <View style={[styles.patientAvatar, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
                    <Text style={[styles.avatarText, { color: colors.text }]}>{item.initials}</Text>
                  </View>
                  <View style={styles.patientCardBody}>
                    <View style={styles.patientCardTopRow}>
                      <Text style={[styles.patientName, { color: colors.text }]}>{item.name}</Text>
                      <View style={[styles.percentBadge, { backgroundColor: item.badgeBg }]}>
                        <Text style={[styles.percentText, { color: item.badgeTextColor }]}>
                          {item.accuracy == null ? 'No score' : `${item.accuracy}%`}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>{item.targetDescription}</Text>
                    <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>
                      {item.completedCount || 0}/{item.assignedCount || 0} assigned activities completed
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Submissions Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent submissions</Text>
              <TouchableOpacity onPress={() => setActiveTab('reviews')}>
                <Text style={[styles.viewAllText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.submissionsCardWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {submissions.slice(0, 5).map((sub) => (
                <View key={sub.id} style={[styles.submissionItem, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
                  <View style={[styles.patientAvatarSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.avatarTextSmall, { color: colors.text }]}>{sub.initial}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.subPatientName, { color: colors.text }]}>{sub.student}</Text>
                    <Text style={[styles.subDetails, { color: colors.textSub }]}>
                      {sub.activity} • {new Date(sub.submittedAt).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPatient(patients.find((patient) => patient.id === sub.patientId) || null)}
                  >
                    <Text style={styles.reviewButtonText}>Student</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {!teacherLoading && submissions.length === 0
                ? <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>No submissions recorded.</Text>
                : null}
            </View>
          </>
        )}

        {/* ----------------------------------------------------
            TAB 2: PATIENTS LIST
           ---------------------------------------------------- */}
        {activeTab === 'patients' && (
          <View style={styles.patientsTabContainer}>
            <Text style={[styles.pageTitle, { color: colors.heading }]}>Patients</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>Track development and review progress</Text>

            <View style={styles.searchFilterRow}>
              <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }]}>
                <Search size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.inputText, flex: 1 }]}
                  placeholder="Search by name, 9-digit ID, targets..."
                  placeholderTextColor={colors.textMuted}
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                />
              </View>
              <TouchableOpacity style={[styles.filterDropdown, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={[styles.filterText, { color: colors.textSub, marginRight: 4 }]}>ALL</Text>
                <ChevronDown size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {patientSearch.trim() ? (
              <>
                {livePatientLoading ? <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>Searching saved patients…</Text> : null}
                {livePatientError ? <Text style={[styles.pageSubtitle, { color: '#DC2626' }]}>{livePatientError}</Text> : null}
                {!livePatientLoading && !livePatientError && livePatientResults?.length === 0 ? (
                  <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>No saved patients match this search.</Text>
                ) : null}
                {livePatientResults?.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedPatient(
                      patients.find((patient) => patient.id === item.id) ||
                      mapTeacherPatient(item, assignments, submissions),
                    )}
                  >
                    <View style={styles.patientCardBody}>
                      <Text style={[styles.patientName, { color: colors.text }]}>
                        {[item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ')}
                      </Text>
                      <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>
                        Patient ID: {item.patientCode || 'Not assigned'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : filteredPatients.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => setSelectedPatient(item)}
              >
                <View style={[styles.patientAvatar, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>{item.initials}</Text>
                </View>
                <View style={styles.patientCardBody}>
                  <View style={styles.patientCardTopRow}>
                    <Text style={[styles.patientName, { color: colors.text }]}>{item.name}</Text>
                    <View style={[styles.percentBadge, { backgroundColor: item.badgeBg }]}>
                      <Text style={[styles.percentText, { color: item.badgeTextColor }]}>
                        {item.accuracy == null ? 'No score' : `${item.accuracy}%`}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>{item.targetDescription}</Text>
                  <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>
                    {item.completedCount || 0}/{item.assignedCount || 0} assigned activities completed · {item.submissionCount || 0} submissions
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {!teacherLoading && !patientSearch.trim() && filteredPatients.length === 0
              ? <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>No students are assigned to this account.</Text>
              : null}
          </View>
        )}

        {/* ----------------------------------------------------
            TAB 3: ACTIVITIES (LIBRARY, PREVIEW, EDIT, ASSIGN)
           ---------------------------------------------------- */}
        {activeTab === 'activities' && (
          <View>
            {/* VIEW 1: ACTIVITY LIBRARY */}
            {activitiesView === 'library' && (
              <View>
                <Text style={styles.subHeadingCaps}>PURPOSEFUL PRACTICE</Text>
                <Text style={styles.pageTitle}>Assigned activities.</Text>
                <Text style={styles.pageSubtitle}>Activities are created and assigned by your students’ therapist.</Text>

                <View style={styles.subTabsRow}>
                  <TouchableOpacity
                    style={styles.subTabActive}
                    onPress={() => setActivitiesView('library')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subTabActiveText}>Activity Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.subTabInactive}
                    onPress={() => setActivitiesView('wordbank')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subTabInactiveText}>Word Bank ({wordBankEntries.length})</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.activitySearchRow}>
                  <View style={styles.activitySearchInputWrapper}>
                    <Search size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search activities..."
                      placeholderTextColor="#94A3B8"
                      value={activitySearch}
                      onChangeText={setActivitySearch}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.activityFilterBtn, isActivityFilterActive && styles.activityFilterBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => setShowActivityFilterPanel((prev) => !prev)}
                  >
                    <View style={styles.activityFilterIconWrap}>
                      <ArrowUpDown
                        size={17}
                        color={isActivityFilterActive ? '#0284C7' : (colors.isDark ? '#94A3B8' : '#64748B')}
                        strokeWidth={2}
                      />
                      <View style={styles.activityFilterDot} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Expandable Activity Filter & Sort Panel */}
                {showActivityFilterPanel && (
                  <View style={styles.activityFilterPanel}>
                    <View style={styles.activityFilterPanelHeader}>
                      <Text style={styles.activityFilterPanelTitle}>Filter & Sort Activities</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isActivityFilterActive && (
                          <TouchableOpacity
                            onPress={() => {
                              setActivitySortBy('default');
                              setActivitySoundFilter([]);
                              setActivityLanguageFilter('ALL');
                              setActivityCategoryFilter('ALL');
                            }}
                            style={{ marginRight: 12 }}
                          >
                            <Text style={styles.activityFilterResetText}>Reset</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => setShowActivityFilterPanel(false)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={16} color={colors.textSub} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sort Options */}
                    <Text style={styles.activityFilterSectionHeading}>Sort By</Text>
                    <View style={styles.activityFilterPillsRow}>
                      {[
                        { id: 'default', label: 'Default' },
                        { id: 'title-asc', label: 'Name (A–Z)' },
                        { id: 'title-desc', label: 'Name (Z–A)' },
                        { id: 'sound', label: 'By Sound' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.activityFilterPill,
                            activitySortBy === opt.id && styles.activityFilterPillActive,
                          ]}
                          onPress={() => setActivitySortBy(opt.id as any)}
                        >
                          <Text
                            style={[
                              styles.activityFilterPillText,
                              activitySortBy === opt.id && styles.activityFilterPillTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Sound Filters */}
                    <Text style={[styles.activityFilterSectionHeading, { marginTop: 10 }]}>Sound</Text>
                    <View style={styles.activityFilterPillsRow}>
                      {['/s/', '/r/', '/l/', '/t/'].map((s) => {
                        const isSelected = activitySoundFilter.includes(s);
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[
                              styles.activityFilterPill,
                              isSelected && styles.activityFilterPillActive,
                            ]}
                            onPress={() => {
                              setActivitySoundFilter((prev) =>
                                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                              );
                            }}
                          >
                            <Text
                              style={[
                                styles.activityFilterPillText,
                                isSelected && styles.activityFilterPillTextActive,
                              ]}
                            >
                              {s}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Language Filters */}
                    <Text style={[styles.activityFilterSectionHeading, { marginTop: 10 }]}>Language</Text>
                    <View style={styles.activityFilterPillsRow}>
                      {['ALL', 'English', 'Tagalog'].map((lang) => (
                        <TouchableOpacity
                          key={lang}
                          style={[
                            styles.activityFilterPill,
                            activityLanguageFilter === lang && styles.activityFilterPillActive,
                          ]}
                          onPress={() => setActivityLanguageFilter(lang)}
                        >
                          <Text
                            style={[
                              styles.activityFilterPillText,
                              activityLanguageFilter === lang && styles.activityFilterPillTextActive,
                            ]}
                          >
                            {lang}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Category Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {(['ALL', 'Words', 'Syllables', 'Isolation', 'Sentences'] as const).map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={[styles.chipButton, activityCategoryFilter === chip && styles.chipButtonActive]}
                      onPress={() => setActivityCategoryFilter(chip)}
                    >
                      <Text style={[styles.chipText, activityCategoryFilter === chip && styles.chipTextActive]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* 2-Column Activity Cards Grid */}
                {teacherLoading ? <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>Loading assigned activities…</Text> : null}
                {teacherError ? <Text style={[styles.pageSubtitle, { color: '#DC2626' }]}>{teacherError}</Text> : null}
                <View style={styles.activityGrid}>
                  {filteredActivities.map((act) => (
                    <TouchableOpacity
                      key={act.id}
                      style={styles.activityGridCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        setCurrentActivity(act);
                        setActivitiesView('preview');
                      }}
                    >
                      <View style={[styles.activitySoundHeader, { backgroundColor: act.soundBg }]}>
                        <Text style={[styles.activitySoundText, { color: act.soundColor }]}>{act.sound}</Text>
                        <View style={styles.soundWavesSmall}>
                          {[10, 16, 8, 20, 14, 18, 12].map((h, idx) => (
                            <View key={idx} style={[styles.waveLine, { height: h, backgroundColor: act.soundColor }]} />
                          ))}
                          {!teacherLoading && filteredActivities.length === 0
                            ? <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>No therapist-assigned activities are available.</Text>
                            : null}
                        </View>
                      </View>

                      <View style={styles.activityCardBody}>
                        <Text style={styles.activityCategoryTag}>{act.category}</Text>
                        <Text style={styles.activityCardTitle}>{act.title}</Text>
                        <Text style={styles.activityCardSub}>{act.subtitle}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Text style={styles.viewActivityLink}>View activity</Text>
                          <ChevronRight size={13} color={isDark ? '#38BDF8' : '#0284C7'} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* VIEW 2: ACTIVITY PREVIEW */}
            {activitiesView === 'preview' && currentActivity && (
              <View style={styles.previewContainer}>
                <View style={styles.previewTagPill}>
                  <Text style={styles.previewTagText}>{currentActivity.category}</Text>
                </View>
                <Text style={styles.previewTitle}>{currentActivity.title}</Text>
                <Text style={styles.previewSoundDesc}>{currentActivity.sound} · {currentActivity.wordPositions.join(', ') || 'No positions set'} · {currentActivity.language}</Text>

                <Text style={styles.previewSectionTitle}>Instructions</Text>
                <Text style={styles.previewSectionBody}>{currentActivity.instructions}</Text>

                <Text style={styles.previewSectionTitle}>Articulatory Guide</Text>
                <Text style={styles.previewSectionBody}>{currentActivity.articulatoryGuide}</Text>

                <Text style={styles.previewSectionTitle}>Practice content</Text>
                {currentActivity.wordPositions.map((position) => {
                  const words = (currentActivity.words || []).filter((word) => word.position === position);
                  return (
                    <View key={position} style={styles.practiceContentCard}>
                      <View style={styles.practiceContentHeader}>
                        <Text style={styles.practicePositionLabel}>{position}</Text>
                        <View style={styles.targetCountBadge}>
                          <Text style={styles.targetCountText}>{words.length} targets</Text>
                        </View>
                      </View>
                      <View style={styles.wordPillsRow}>
                        {words.map((word) => (
                          <View key={word.id} style={styles.wordPillPeach}>
                            <Text style={styles.wordPillText}>{word.text}</Text>
                          </View>
                        ))}
                      </View>
                      {words.filter((word) => word.phrase).map((word) => (
                        <Text key={`${word.id}-phrase`} style={styles.phraseBulletText}>{word.phrase}</Text>
                      ))}
                    </View>
                  );
                })}
                {currentActivity.phrases.length === 0 && currentActivity.wordPositions.length === 0
                  ? <Text style={styles.noTargetsSub}>No practice targets are available.</Text>
                  : null}
                <Text style={styles.noTargetsSub}>Read-only preview. Ask the therapist to change assigned activities.</Text>
              </View>
            )}

            {/* VIEW 3: EDIT ACTIVITY (3-Step Wizard) */}
            {activitiesView === 'edit' && (
              <View style={styles.editWizardContainer}>
                <Text style={styles.editWizardTitle}>Edit Activity</Text>

                <View style={styles.stepperBar}>
                  <TouchableOpacity
                    style={[styles.stepItem, editStep === 1 && styles.stepItemActive]}
                    onPress={() => setEditStep(1)}
                  >
                    <Text style={[styles.stepText, editStep === 1 && styles.stepTextActive]}>Clinical focus</Text>
                    {editStep === 1 && <View style={styles.stepIndicatorLine} />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepItem, editStep === 2 && styles.stepItemActive]}
                    onPress={() => setEditStep(2)}
                  >
                    <Text style={[styles.stepText, editStep === 2 && styles.stepTextActive]}>Activity content</Text>
                    {editStep === 2 && <View style={styles.stepIndicatorLine} />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepItem, editStep === 3 && styles.stepItemActive]}
                    onPress={() => setEditStep(3)}
                  >
                    <Text style={[styles.stepText, editStep === 3 && styles.stepTextActive]}>Preview & save</Text>
                    {editStep === 3 && <View style={styles.stepIndicatorLine} />}
                  </TouchableOpacity>
                </View>

                {/* Step 1: Clinical Focus */}
                {editStep === 1 && (
                  <View>
                    <Text style={styles.formLabel}>Activity Title</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="e.g. Ready, set, /r/"
                    />

                    <View style={styles.formRowTwoCol}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.formLabel}>Target Sound</Text>
                        <View style={styles.dropdownSelector}>
                          <Text style={styles.dropdownValue}>{editTargetSound}</Text>
                          <ChevronDown size={14} color={colors.text} />
                        </View>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.formLabel}>Practice Level</Text>
                        <View style={styles.dropdownSelector}>
                          <Text style={styles.dropdownValue}>{editPracticeLevel}</Text>
                          <ChevronDown size={14} color={colors.text} />
                        </View>
                      </View>
                    </View>

                    <Text style={styles.formLabel}>Word Position (choose one or more)</Text>
                    <View style={styles.pillsSelectRow}>
                      {['Initial', 'Medial', 'Final'].map((pos) => {
                        const selected = editPositions.includes(pos);
                        return (
                          <TouchableOpacity
                            key={pos}
                            style={[styles.posPill, selected && styles.posPillSelected]}
                            onPress={() => {
                              if (selected) {
                                setEditPositions(editPositions.filter((p) => p !== pos));
                              } else {
                                setEditPositions([...editPositions, pos]);
                              }
                            }}
                          >
                            <Text style={[styles.posPillText, selected && styles.posPillTextSelected]}>{pos}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.formLabel}>Language</Text>
                    <View style={styles.langSegmentControl}>
                      <TouchableOpacity
                        style={[styles.langSegmentBtn, editLanguage === 'English' && styles.langSegmentBtnActive]}
                        onPress={() => setEditLanguage('English')}
                      >
                        <Text style={[styles.langSegmentText, editLanguage === 'English' && styles.langSegmentTextActive]}>
                          English
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.langSegmentBtn, editLanguage === 'Tagalog' && styles.langSegmentBtnActive]}
                        onPress={() => setEditLanguage('Tagalog')}
                      >
                        <Text style={[styles.langSegmentText, editLanguage === 'Tagalog' && styles.langSegmentTextActive]}>
                          Tagalog
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.formLabel}>Instructions for Student/Facilitator</Text>
                    <TextInput
                      style={[styles.formInput, { height: 60 }]}
                      multiline
                      value={editInstructions}
                      onChangeText={setEditInstructions}
                    />

                    <Text style={styles.formLabel}>Articulatory Guide</Text>
                    <TextInput
                      style={[styles.formInput, { height: 60 }]}
                      multiline
                      value={editArticulatoryGuide}
                      onChangeText={setEditArticulatoryGuide}
                    />

                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        onPress={() => triggerToast('Draft saved successfully!')}
                      >
                        <Text style={styles.outlineBtnText}>Save Draft</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.solidBlueBtn}
                        onPress={() => setEditStep(2)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={styles.solidBlueBtnText}>Next Step </Text>
                          <ChevronRight size={14} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Step 2: Activity Content */}
                {editStep === 2 && (
                  <View>
                    <Text style={styles.formLabel}>Word origin</Text>
                    <View style={styles.wordOriginRadioRow}>
                      <TouchableOpacity
                        style={[styles.originCard, wordOrigin === 'wordBank' && styles.originCardActive]}
                        onPress={() => setWordOrigin('wordBank')}
                      >
                        <View style={[styles.radioDot, wordOrigin === 'wordBank' && styles.radioDotActive]} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.originTitle}>Word Bank</Text>
                          <Text style={styles.originSub}>Pick from the library</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.originCard, wordOrigin === 'custom' && styles.originCardActive]}
                        onPress={() => setWordOrigin('custom')}
                      >
                        <View style={[styles.radioDot, wordOrigin === 'custom' && styles.radioDotActive]} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.originTitle}>Custom Word</Text>
                          <Text style={styles.originSub}>Type your own</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Word Bank Sub-flow */}
                    {wordOrigin === 'wordBank' && (
                      <>
                        <View style={styles.posCountersRow}>
                          {(['Initial', 'Medial', 'Final'] as const).map((tab) => (
                            <TouchableOpacity
                              key={tab}
                              style={[styles.posCounterBox, wordBankPositionTab === tab && styles.posCounterBoxActive]}
                              onPress={() => setWordBankPositionTab(tab)}
                            >
                              <Text style={styles.posCounterLabel}>{tab}</Text>
                              <Text style={styles.posCounterValue}>{tab === 'Initial' ? `${checkedWords.length}/5` : '0/5'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={styles.formLabel}>Word bank - {wordBankPositionTab}</Text>
                        <View style={styles.wordBankSearchWrapper}>
                          <Search size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search existing from word bank..."
                            placeholderTextColor="#94A3B8"
                            value={wordBankSearch}
                            onChangeText={setWordBankSearch}
                          />
                        </View>

                        <View style={styles.wordChecklistContainer}>
                          {wordBankEntries.map((item) => {
                            const w = item.text;
                            const isChecked = checkedWords.includes(w);
                            return (
                              <TouchableOpacity
                                key={item.id}
                                style={styles.wordCheckItem}
                                onPress={() => toggleWordCheck(w)}
                              >
                                <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareActive]}>
                                  {isChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                                </View>
                                <Text style={styles.checkWordLabel}>{w}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <View style={styles.selectedChipsWrap}>
                          {checkedWords.map((w) => (
                            <View key={w} style={styles.removableChip}>
                              <Text style={styles.removableChipText}>{w}</Text>
                              <TouchableOpacity
                                onPress={() => toggleWordCheck(w)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                style={{ marginLeft: 4 }}
                              >
                                <X size={11} color="#FDBA74" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        {checkedWords.map((w) => (
                          <View key={w} style={styles.wordPhraseBlock}>
                            <View style={styles.wordPhraseHeader}>
                              <Text style={styles.wordPhraseTitle}>{w}</Text>
                              <Minus size={14} color="#94A3B8" />
                            </View>
                            <TextInput
                              style={styles.phraseInput}
                              value={wordPhrases[w] || ''}
                              onChangeText={(txt) => setWordPhrases({ ...wordPhrases, [w]: txt })}
                              placeholder={`Sentence for ${w}...`}
                            />
                          </View>
                        ))}
                      </>
                    )}

                    {/* Custom Word Sub-flow */}
                    {wordOrigin === 'custom' && (
                      <>
                        <Text style={styles.formLabel}>Custom Word</Text>
                        <View style={styles.customWordInputRow}>
                          <TextInput
                            style={[styles.formInput, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                            placeholder="Add a custom word"
                            value={newCustomWordInput}
                            onChangeText={setNewCustomWordInput}
                          />
                          <TouchableOpacity style={styles.addWordBtn} onPress={handleAddCustomWord}>
                            <Text style={styles.addWordBtnText}>ADD</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.selectedChipsWrap}>
                          {customWords.map((cw) => (
                            <View key={cw} style={styles.removableChip}>
                              <Text style={styles.removableChipText}>{cw}</Text>
                              <TouchableOpacity
                                onPress={() => setCustomWords(customWords.filter((x) => x !== cw))}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                style={{ marginLeft: 4 }}
                              >
                                <X size={11} color="#FDBA74" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        <TouchableOpacity
                          style={styles.checkboxRow}
                          onPress={() => setSaveToWordBankChecked(!saveToWordBankChecked)}
                        >
                          <View style={[styles.checkboxSquare, saveToWordBankChecked && styles.checkboxSquareActive]}>
                            {saveToWordBankChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                          <Text style={styles.checkboxRowLabel}>Save to Word Bank</Text>
                        </TouchableOpacity>

                        <View style={styles.formRowTwoCol}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.formLabel}>Target Sound</Text>
                            <View style={styles.dropdownSelector}>
                              <Text style={styles.dropdownValue}>/r/</Text>
                              <ChevronDown size={14} color={colors.text} />
                            </View>
                          </View>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.formLabel}>Target Position</Text>
                            <View style={styles.dropdownSelector}>
                              <Text style={styles.dropdownValue}>Initial</Text>
                              <ChevronDown size={14} color={colors.text} />
                            </View>
                          </View>
                        </View>

                        <Text style={styles.formLabel}>Practice Content Builder</Text>
                        <Text style={styles.subtextSmall}>
                          Target words are vocabulary references. Write the exact phrases the child will say.
                        </Text>
                        <TextInput
                          style={[styles.formInput, { height: 50, marginTop: 6 }]}
                          multiline
                          value="The rice is rich."
                          editable={false}
                        />

                        <View style={styles.phraseBuilderRow}>
                          <TouchableOpacity style={styles.symbolBtn} onPress={handleAddCustomPhrase}>
                            <Plus size={16} color={colors.text} />
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.formInput, { flex: 1, marginHorizontal: 8, marginBottom: 0 }]}
                            placeholder="Add another phrase..."
                            value={newPhraseInput}
                            onChangeText={setNewPhraseInput}
                          />
                          <TouchableOpacity style={styles.symbolBtn}>
                            <Minus size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.savePhraseBtn} onPress={handleAddCustomPhrase}>
                          <Text style={styles.savePhraseBtnText}>Save Phrase</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <Text style={styles.formLabel}>Visual Material</Text>
                    <View style={styles.uploadDashedBox}>
                      <Upload size={32} color={isDark ? '#38BDF8' : '#0284C7'} style={{ marginBottom: 6 }} />
                      <Text style={styles.uploadMainText}>Upload or browse files here</Text>
                      <Text style={styles.uploadSubText}>MP4 or MOV, up to 100MB per file</Text>
                    </View>

                    <Text style={styles.formLabel}>Preview Audio Model</Text>
                    <View style={styles.audioModelCard}>
                      <View style={styles.audioPlayCircle}>
                        <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.audioModelTitle}>Sample Audio Model</Text>
                        <Text style={styles.audioModelSub}>Demo Playback · 0:08</Text>
                      </View>
                      <View style={styles.audioWaveformRow}>
                        {[12, 22, 14, 26, 18, 10, 20].map((h, i) => (
                          <View key={i} style={[styles.audioWaveBar, { height: h }]} />
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.continueBtn}
                      onPress={() => setEditStep(3)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.continueBtnText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 3: Preview & Save */}
                {editStep === 3 && (
                  <View>
                    <View style={styles.bigPhonemeHero}>
                      <Text style={styles.bigHeroSound}>{editTargetSound}</Text>
                      <Text style={styles.bigHeroTitle}>{editTitle}</Text>
                      <Text style={styles.bigHeroSubtitle}>{editPracticeLevel} • Initial position • {editLanguage}</Text>
                    </View>

                    <Text style={styles.previewSectionTitle}>Instructions</Text>
                    <Text style={styles.previewSectionBody}>{editInstructions}</Text>

                    <Text style={styles.previewSectionTitle}>Articulatory Guide</Text>
                    <Text style={styles.previewSectionBody}>{editArticulatoryGuide}</Text>

                    <Text style={styles.previewSectionTitle}>Practice Content</Text>
                    <View style={styles.wordPillsRow}>
                      {checkedWords.map((w) => (
                        <View key={w} style={styles.wordPillPeach}>
                          <Text style={styles.wordPillText}>{w}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.phraseBulletText, { marginTop: 8 }]}>The red rabbit runs.</Text>

                    <Text style={styles.previewSectionTitle}>Preview Audio Model</Text>
                    <View style={styles.audioModelCard}>
                      <View style={styles.audioPlayCircle}>
                        <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.audioModelTitle}>Pronunciation Model</Text>
                        <Text style={styles.audioModelSub}>Demo Playback · 0:08</Text>
                      </View>
                      <View style={styles.audioWaveformRow}>
                        {[12, 22, 14, 26, 18, 10, 20].map((h, i) => (
                          <View key={i} style={[styles.audioWaveBar, { height: h }]} />
                        ))}
                      </View>
                    </View>

                    <Text style={styles.previewSectionTitle}>Visual Material</Text>
                    <View style={styles.videoPlaceholderBox}>
                      <View style={styles.videoPlayCircle}>
                        <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                    </View>

                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        onPress={() => setEditStep(2)}
                      >
                        <Text style={styles.outlineBtnText}>Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.solidBlueBtn}
                        onPress={() => {
                          setActivitiesView('library');
                          triggerToast('Activity saved successfully!');
                        }}
                      >
                        <Text style={styles.solidBlueBtnText}>Save Activity</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* VIEW 4: ASSIGN ACTIVITY */}
            {activitiesView === 'assign' && (
              <View style={styles.assignScreenContainer}>
                <Text style={styles.pageTitle}>Assign Activity</Text>

                <Text style={styles.formLabel}>Student</Text>
                <View style={styles.dropdownSelector}>
                  <Text style={styles.dropdownValue}>{assignStudent}</Text>
                  <ChevronDown size={16} color={colors.text} />
                </View>

                <Text style={styles.formLabel}>Activity</Text>
                <View style={styles.dropdownSelector}>
                  <Text style={styles.dropdownValue}>{assignActivityName}</Text>
                  <ChevronDown size={16} color={colors.text} />
                </View>

                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setAssignPreviewExpanded(!assignPreviewExpanded)}
                >
                  <Text style={styles.accordionTitle}>Activity Preview</Text>
                  {assignPreviewExpanded ? <ChevronUp size={16} color="#EA580C" /> : <ChevronDown size={16} color="#EA580C" />}
                </TouchableOpacity>

                {assignPreviewExpanded && (
                  <View style={styles.expandedAccordionCard}>
                    <Text style={styles.previewSectionTitle}>Practice content</Text>
                    <View style={styles.practiceContentCard}>
                      <View style={styles.practiceContentHeader}>
                        <Text style={styles.practicePositionLabel}>Initial</Text>
                        <View style={styles.targetCountBadge}>
                          <Text style={styles.targetCountText}>3 targets</Text>
                        </View>
                      </View>

                      <View style={styles.wordPillsRow}>
                        {['red', 'run', 'rabbit'].map((w) => (
                          <View key={w} style={styles.wordPillPeach}>
                            <Text style={styles.wordPillText}>{w}</Text>
                          </View>
                        ))}
                      </View>

                      <Text style={styles.phraseBulletText}>• I see a red apple.</Text>
                      <Text style={styles.phraseBulletText}>• See the dog run fast.</Text>
                      <Text style={styles.phraseBulletText}>• The little rabbit hid.</Text>
                    </View>

                    <View style={styles.emptyTargetCard}>
                      <Text style={styles.practicePositionLabel}>Medial</Text>
                      <View style={styles.zeroTargetBadge}>
                        <Text style={styles.zeroTargetText}>0 target</Text>
                      </View>
                    </View>
                    <Text style={styles.noTargetsSub}>No targets yet.</Text>

                    <View style={styles.emptyTargetCard}>
                      <Text style={styles.practicePositionLabel}>Final</Text>
                      <View style={styles.zeroTargetBadge}>
                        <Text style={styles.zeroTargetText}>0 target</Text>
                      </View>
                    </View>
                    <Text style={styles.noTargetsSub}>No targets yet.</Text>

                    <Text style={styles.previewSectionTitle}>Preview audio model</Text>
                    <View style={styles.audioModelCard}>
                      <View style={styles.audioPlayCircle}>
                        <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.audioModelTitle}>Pronunciation Model</Text>
                        <Text style={styles.audioModelSub}>Demo Playback · 0:08</Text>
                      </View>
                      <View style={styles.audioWaveformRow}>
                        {[12, 22, 14, 26, 18, 10, 20].map((h, i) => (
                          <View key={i} style={[styles.audioWaveBar, { height: h }]} />
                        ))}
                      </View>
                    </View>

                    <Text style={styles.previewSectionTitle}>Visual material</Text>
                    <View style={styles.videoPlaceholderBox}>
                      <View style={styles.videoPlayCircle}>
                        <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                    </View>

                    <View style={[styles.previewActionsRow, { marginTop: 12 }]}>
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        onPress={() => {
                          setEditStep(1);
                          setActivitiesView('edit');
                        }}
                      >
                        <Text style={styles.outlineBtnText}>Edit Activity</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.solidBlueBtn}
                        onPress={() => {
                          setActivitiesView('library');
                          triggerToast('Activity assigned to ' + assignStudent);
                        }}
                      >
                        <Text style={styles.solidBlueBtnText}>Assign Activity</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={styles.formLabel}>Due Date</Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    style={styles.dateTextInput}
                    value={assignDueDate}
                    onChangeText={setAssignDueDate}
                  />
                  <Calendar size={18} color={isDark ? '#38BDF8' : '#0284C7'} />
                </View>

                <Text style={styles.formLabel}>Instructions</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  multiline
                  value={assignInstructions}
                  onChangeText={setAssignInstructions}
                />

                <View style={[styles.previewActionsRow, { marginTop: 20 }]}>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() => setActivitiesView('library')}
                  >
                    <Text style={styles.outlineBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.solidBlueBtn}
                    onPress={() => {
                      setActivitiesView('library');
                      triggerToast('Activity assigned to ' + assignStudent);
                    }}
                  >
                    <Text style={styles.solidBlueBtnText}>Assign Activity</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* VIEW 5: WORD BANK */}
            {activitiesView === 'wordbank' && (
              <View>
                <Text style={styles.subHeadingCaps}>PURPOSEFUL PRACTICE</Text>
                <Text style={styles.pageTitle}>The word bank.</Text>
                <Text style={styles.pageSubtitle}>Reusable targets organized by sound, position and language. Therapists manage these entries.</Text>

                <View style={styles.subTabsRow}>
                  <TouchableOpacity
                    style={styles.subTabInactive}
                    onPress={() => setActivitiesView('library')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subTabInactiveText}>Activity Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.subTabActive}
                    onPress={() => setActivitiesView('wordbank')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subTabActiveText}>Word Bank ({wordBankEntries.length})</Text>
                  </TouchableOpacity>
                </View>

                {/* Word Bank Search, Add & Filter Row */}
                <View style={styles.wbSearchRow}>
                  <View style={styles.wbSearchInputWrapper}>
                    <Search size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.wbSearchInput}
                      placeholder="Search for a specific word..."
                      placeholderTextColor="#94A3B8"
                      value={wordBankQuery}
                      onChangeText={setWordBankQuery}
                    />
                  </View>
                  <Text style={[styles.wbPositionBadgeText, { marginHorizontal: 4 }]}>Read-only</Text>
                  <TouchableOpacity
                    style={[styles.wbFilterBtn, wordBankFiltersOpen && styles.wbFilterBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => setWordBankFiltersOpen((curr) => !curr)}
                  >
                    <Filter size={16} color={wordBankFiltersOpen ? '#0284C7' : colors.textSub} />
                  </TouchableOpacity>
                </View>

                {/* Filter Panel */}
                {wordBankFiltersOpen && (
                  <View style={styles.wbFilterPanel}>
                    <Text style={styles.wbFilterHeading}>Sound</Text>
                    <View style={styles.wbFilterOptionsWrap}>
                      {['/r/', '/s/', '/l/', '/t/', '/k/', '/p/', '/m/'].map((s) => {
                        const isSel = wordBankFilterSounds.includes(s);
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[styles.wbChoicePill, isSel && styles.wbChoicePillActive]}
                            onPress={() => {
                              setWordBankFilterSounds((curr) =>
                                curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s]
                              );
                            }}
                          >
                            <Text style={[styles.wbChoicePillText, isSel && styles.wbChoicePillTextActive]}>{s}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={[styles.wbFilterHeading, { marginTop: 10 }]}>Position</Text>
                    <View style={styles.wbFilterOptionsWrap}>
                      {(['Initial', 'Medial', 'Final'] as const).map((pos) => {
                        const isSel = wordBankFilterPositions.includes(pos);
                        return (
                          <TouchableOpacity
                            key={pos}
                            style={[styles.wbChoicePill, isSel && styles.wbChoicePillActive]}
                            onPress={() => {
                              setWordBankFilterPositions((curr) =>
                                curr.includes(pos) ? curr.filter((x) => x !== pos) : [...curr, pos]
                              );
                            }}
                          >
                            <Text style={[styles.wbChoicePillText, isSel && styles.wbChoicePillTextActive]}>{pos}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={[styles.wbFilterHeading, { marginTop: 10 }]}>Language</Text>
                    <View style={styles.wbFilterOptionsWrap}>
                      {['English', 'Tagalog'].map((lang) => {
                        const isSel = wordBankFilterLanguages.includes(lang);
                        return (
                          <TouchableOpacity
                            key={lang}
                            style={[styles.wbChoicePill, isSel && styles.wbChoicePillActive]}
                            onPress={() => {
                              setWordBankFilterLanguages((curr) =>
                                curr.includes(lang) ? curr.filter((x) => x !== lang) : [...curr, lang]
                              );
                            }}
                          >
                            <Text style={[styles.wbChoicePillText, isSel && styles.wbChoicePillTextActive]}>{lang}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Filter Chips */}
                {wordBankChips.length > 0 && (
                  <View style={styles.wbChipsRow}>
                    {wordBankChips.map((chip) => (
                      <TouchableOpacity key={chip.key} style={styles.wbChip} onPress={chip.clear} activeOpacity={0.7}>
                        <Text style={styles.wbChipLabel}>{chip.label}</Text>
                        <X size={12} color="#0284C7" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Word Bank List Header */}
                <View style={styles.wbListHeader}>
                  <Text style={styles.wbListTitle}>Word Bank List ({filteredWordBank.length})</Text>
                </View>

                {/* Word Bank List */}
                <View style={styles.wbListCard}>
                  {filteredWordBank.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.wbListRow,
                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.wbWordText}>{item.text}</Text>
                        <View style={styles.wbSoundBadgeWrap}>
                          <Text style={styles.wbSoundBadgeText}>{item.sound}</Text>
                        </View>
                      </View>

                      <View style={styles.wbPositionBadge}>
                        <Text style={styles.wbPositionBadgeText}>{item.position}</Text>
                      </View>
                    </View>
                  ))}
                  {filteredWordBank.length === 0 && (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>No words match your search or filters.</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ----------------------------------------------------
            TAB 4: REVIEWS (Image 2: "Teacher - Reviews")
           ---------------------------------------------------- */}
        {activeTab === 'reviews' && (
          <View style={styles.reviewsTabContainer}>
            {/* Header Titles */}
            <Text style={styles.reviewsCapsHeading}>LISTEN. REFLECT. GUIDE</Text>
            <Text style={styles.reviewsTitle}>Every attempt matters.</Text>
            <Text style={styles.reviewsSubtitle}>Your clinical judgment stays at the center.</Text>

            {/* Filter Tabs: All, Pending, Reviewed */}
            <View style={styles.reviewsFilterTabsBar}>
              {(['All', 'Pending', 'Reviewed'] as const).map((tab) => {
                const isActive = reviewsFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.reviewsFilterTab, isActive && styles.reviewsFilterTabActive]}
                    onPress={() => setReviewsFilter(tab)}
                  >
                    <Text style={[styles.reviewsFilterTabText, isActive && styles.reviewsFilterTabTextActive]}>
                      {tab}
                    </Text>
                    {isActive && <View style={styles.reviewsFilterTabIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reviews List Cards */}
            <View style={styles.reviewsListContainer}>
              {filteredReviews.map((rev) => (
                <TouchableOpacity
                  key={rev.id}
                  style={styles.reviewCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReview(rev)}
                >
                  {/* Avatar KS */}
                  <View style={[styles.reviewAvatar, { backgroundColor: rev.avatarBg }]}>
                    <Text style={[styles.reviewAvatarText, { color: rev.avatarColor }]}>{rev.initials}</Text>
                  </View>

                  {/* Body Info */}
                  <View style={styles.reviewCardBody}>
                    <Text style={styles.reviewStudentName}>{rev.studentName}</Text>
                    <Text style={styles.reviewActivityDesc}>
                      {rev.activityTitle} • {rev.phonemeDesc}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.reviewStatusBadge,
                      rev.status === 'Pending'
                        ? styles.reviewStatusPending
                        : styles.reviewStatusReviewed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reviewStatusText,
                        rev.status === 'Pending'
                          ? styles.reviewStatusTextPending
                          : styles.reviewStatusTextReviewed,
                      ]}
                    >
                      {rev.status}
                    </Text>
                  </View>

                  {/* Chevron › */}
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==========================================
          --- MODAL: REVIEW AUDIO & SUBMIT FEEDBACK ---
          ========================================== */}
      <Modal
        visible={selectedReview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={[styles.reviewAvatar, { backgroundColor: selectedReview?.avatarBg }]}>
                <Text style={[styles.reviewAvatarText, { color: selectedReview?.avatarColor }]}>
                  {selectedReview?.initials}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalPatientName}>{selectedReview?.studentName}</Text>
                <Text style={styles.modalPatientAge}>
                  {selectedReview?.activityTitle} • {selectedReview?.phonemeDesc}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReview(null)} style={styles.closeButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Submission Details */}
            <Text style={styles.subtextSmall}>
              Submitted {selectedReview?.submittedDate} • Target Word: "{selectedReview?.targetWord}"
            </Text>

            <View style={[styles.audioModelCard, { marginVertical: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.audioModelTitle}>Recording metadata</Text>
                <Text style={styles.audioModelSub}>
                  Duration: {selectedReview?.audioDuration || 'Not recorded'}
                </Text>
                <Text style={styles.audioModelSub} selectable>
                  {selectedReview?.audioRecordingUrl || 'No audio URI saved.'}
                </Text>
              </View>
            </View>

            <Text style={styles.formLabel}>Therapist observations</Text>
            <Text style={styles.subtextSmall}>
              {selectedReview?.observations || 'No therapist review has been saved.'}
            </Text>

            <View style={[styles.previewActionsRow, { marginTop: 10 }]}>
              <TouchableOpacity style={styles.solidBlueBtn} onPress={() => setSelectedReview(null)}>
                <Text style={styles.solidBlueBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          --- MODAL: PATIENT DETAILS & SOAP ---
          ========================================== */}
      <Modal
        visible={selectedPatient !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPatient(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.patientAvatarModal}>
                <Text style={styles.avatarTextModal}>{selectedPatient?.initials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalPatientName}>{selectedPatient?.name}</Text>
                <Text style={styles.modalPatientAge}>
                  Age {selectedPatient?.age} • {selectedPatient?.targetDescription}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.closeButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* 3 Metric Summary Boxes */}
            <View style={styles.modalMetricsRow}>
              <View style={[styles.modalMetricBox, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.metricBoxTitle}>Current Accuracy</Text>
                <Text style={[styles.metricBoxValue, { color: '#16A34A' }]}>
                  {selectedPatient?.accuracy == null ? 'Not scored' : `${selectedPatient.accuracy}%`}
                </Text>
                <Text style={styles.metricBoxSubtitle}>No automated score supplied</Text>
              </View>

              <View style={[styles.modalMetricBox, { backgroundColor: '#CFFAFE' }]}>
                <Text style={styles.metricBoxTitle}>Current Stage</Text>
                <Text style={[styles.metricBoxValue, { color: '#0284C7' }]}>
                  {selectedPatient?.stage}
                </Text>
                <Text style={styles.metricBoxSubtitle}>Target: sounds</Text>
              </View>

              <View style={[styles.modalMetricBox, { backgroundColor: '#FFE4E6' }]}>
                <Text style={styles.metricBoxTitle}>Assigned Activity Completion</Text>
                <Text style={[styles.metricBoxValue, { color: '#E11D48' }]}>
                  {selectedPatient?.completedCount || 0}/{selectedPatient?.assignedCount || 0}
                </Text>
                <Text style={styles.metricBoxSubtitle}>{selectedPatient?.submissionCount || 0} submissions</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* OVERVIEW Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionHeading}>OVERVIEW</Text>
                <View style={styles.overviewBox}>
                  <Text style={styles.overviewTitle}>Phoneme Target & Error Profile</Text>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Primary phoneme target:</Text>
                    <Text style={styles.profileValue}>{selectedPatient?.phonemeTarget.primary}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Secondary targets:</Text>
                    <Text style={styles.profileValue}>{selectedPatient?.phonemeTarget.secondary}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Error pattern taxonomy:</Text>
                    <Text style={styles.profileValue}>{selectedPatient?.phonemeTarget.errorPattern}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>Language profile:</Text>
                    <Text style={styles.profileValue}>{selectedPatient?.phonemeTarget.languageProfile}</Text>
                  </View>
                </View>
              </View>

              {/* SOAP SESSION HISTORY */}
              <View style={styles.modalSection}>
                <View style={styles.sectionRowWithButton}>
                  <Text style={styles.modalSectionHeading}>THERAPIST NOTES (READ ONLY)</Text>
                </View>

                {patientDetailLoading ? <Text style={styles.emptySessionSubtitle}>Loading notes…</Text> : null}
                {soapNotes.length === 0 && !patientDetailLoading ? (
                  <View style={styles.emptySessionBox}>
                    <Text style={styles.emptySessionTitle}>No therapist notes recorded.</Text>
                    <Text style={styles.emptySessionSubtitle}>
                      Notes added by the therapist will appear here.
                    </Text>
                  </View>
                ) : (
                  soapNotes.map((note) => (
                    <View key={note.sessionNumber} style={styles.soapEntryCard}>
                      <Text style={styles.soapEntryHeader}>
                        Session #{note.sessionNumber} • {note.date}
                      </Text>
                      <Text style={styles.soapEntryLine}>
                        <Text style={styles.soapEntryPrefix}>S: </Text>
                        {note.s}
                      </Text>
                      <Text style={styles.soapEntryLine}>
                        <Text style={styles.soapEntryPrefix}>O: </Text>
                        {note.o}
                      </Text>
                      <Text style={styles.soapEntryLine}>
                        <Text style={styles.soapEntryPrefix}>A: </Text>
                        {note.a}
                      </Text>
                      <Text style={styles.soapEntryLine}>
                        <Text style={styles.soapEntryPrefix}>P: </Text>
                        {note.p}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* ACCOMPLISHMENT HISTORY */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionHeading}>OBSERVATIONS & ACCOMPLISHMENTS</Text>
                {(selectedPatient?.accomplishments || []).map((acc) => (
                  <View key={acc.id} style={styles.accomplishmentCard}>
                    <Text style={styles.accDate}>
                      {new Date(acc.achievedDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.accTitle}>{acc.title}</Text>
                    {acc.targetAccuracy ? <Text style={styles.accAccuracy}>Target accuracy: {acc.targetAccuracy}</Text> : null}
                    <Text style={styles.notesLabel}>NOTES & OBSERVATION</Text>
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>{acc.clinicianNotes || acc.quote || 'No observation recorded.'}</Text>
                    </View>
                    {acc.audioSampleUrl ? <Text style={styles.audioSub}>Saved audio URI: {acc.audioSampleUrl}</Text> : null}
                  </View>
                ))}
                {!patientDetailLoading && (selectedPatient?.accomplishments || []).length === 0
                  ? <Text style={styles.emptySessionSubtitle}>No saved observations or accomplishments.</Text>
                  : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          --- THREE LINES (HAMBURGER) DROPDOWN MENU (Screenshot 2) ---
          ========================================== */}
      {showMenu && (
        <Modal transparent animationType="fade" visible={showMenu} onRequestClose={() => setShowMenu(false)}>
          <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.menuDropdownContainer}>
              {/* Therapist Profile Snippet Header */}
              <TouchableOpacity
                style={styles.menuUserHeader}
                activeOpacity={0.8}
                onPress={() => {
                  setShowMenu(false);
                  setShowProfileModal(true);
                }}
              >
                <View style={styles.menuAvatarCircle}>
                  <Text style={styles.menuAvatarText}>A</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.menuUserName} numberOfLines={1}>{therapistProfile.name}</Text>
                  <Text style={styles.menuUserRole} numberOfLines={1}>{therapistProfile.title}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.menuSectionDivider} />

              {/* Option 1: Profile */}
              <TouchableOpacity
                style={styles.menuOptionRow}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMenu(false);
                  setShowProfileModal(true);
                }}
              >
                <View style={styles.menuIconCircle}>
                  <User size={18} color="#0284C7" />
                </View>
                <Text style={styles.menuOptionLabel}>Profile</Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Option 2: Settings */}
              <TouchableOpacity
                style={styles.menuOptionRow}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMenu(false);
                  setShowSettingsModal(true);
                }}
              >
                <View style={styles.menuIconCircle}>
                  <Settings size={18} color="#0284C7" />
                </View>
                <Text style={styles.menuOptionLabel}>Settings</Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.menuSectionDivider} />

              {/* Option 3: Logout */}
              <TouchableOpacity
                style={styles.menuOptionRow}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMenu(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <LogOut size={18} color="#DC2626" />
                </View>
                <Text style={[styles.menuOptionLabel, { color: '#DC2626', fontWeight: '700' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* ==========================================
          --- NOTIFICATIONS POPOVER (Screenshot 1 Right) ---
          ========================================== */}
      {showNotificationsDropdown && (
        <Modal
          transparent
          animationType="fade"
          visible={showNotificationsDropdown}
          onRequestClose={() => setShowNotificationsDropdown(false)}
        >
          <Pressable style={styles.menuOverlay} onPress={() => setShowNotificationsDropdown(false)}>
            <View style={styles.notifDropdownContainer}>
              <View style={styles.notifDropdownHeaderRow}>
                <Text style={styles.notifDropdownTitle}>Notifications</Text>
                <View style={styles.notifFilterPillsRow}>
                  <TouchableOpacity
                    style={[
                      styles.notifPill,
                      notificationsFilter === 'All' && styles.notifPillActive,
                    ]}
                    onPress={() => setNotificationsFilter('All')}
                  >
                    <Text
                      style={[
                        styles.notifPillText,
                        notificationsFilter === 'All' && styles.notifPillTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.notifPill,
                      notificationsFilter === 'Unread' && styles.notifPillActive,
                    ]}
                    onPress={() => setNotificationsFilter('Unread')}
                  >
                    <Text
                      style={[
                        styles.notifPillText,
                        notificationsFilter === 'Unread' && styles.notifPillTextActive,
                      ]}
                    >
                      Unread
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {notifications
                  .filter((item) => (notificationsFilter === 'Unread' ? item.unread : true))
                  .map((item) => (
                    <View key={item.id} style={styles.notifItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifItemTitle}>
                          <Text style={{ fontWeight: '700' }}>{item.name} </Text>
                          {item.action}
                        </Text>
                        <Text style={styles.notifItemDetail}>{item.detail}</Text>
                      </View>
                      <Text style={styles.notifItemTime}>{item.time}</Text>
                    </View>
                  ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.markAllReadBtn}
                onPress={handleMarkAllNotificationsRead}
              >
                <Text style={styles.markAllReadBtnText}>Mark All as Read</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* ==========================================
          --- MODAL: SETTINGS (Screenshot 1 Left) ---
          ========================================== */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={styles.settingsModalContainer}>
          {/* Header Row */}
          <View style={styles.newHeaderRow}>
            <TouchableOpacity
              onPress={() => setShowSettingsModal(false)}
              style={styles.newBackButton}
              accessibilityLabel="Back"
            >
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.newHeaderTitle}>Settings</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
            {/* Top Profile Card */}
            <TouchableOpacity
              style={styles.newProfileCard}
              activeOpacity={0.8}
              onPress={() => {
                setProfileOpenedFromSettings(true);
                setEditProfileForm({ ...therapistProfile });
                setShowSettingsModal(false);
                setShowProfileModal(true);
              }}
            >
              <View style={styles.newProfileAvatar}>
                {therapistProfile.photoUri ? (
                  <Image source={{ uri: therapistProfile.photoUri }} style={styles.newProfileAvatarImg} />
                ) : (
                  <Text style={styles.newProfileAvatarText}>A</Text>
                )}
              </View>
              <View style={styles.newProfileInfo}>
                <View style={styles.newProfileNameRow}>
                  <Text style={styles.newProfileName}>{therapistProfile.fullName}</Text>
                  <View style={styles.newVerifiedBadge}>
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </View>
                <Text style={styles.newProfileSubtitle}>
                  {therapistProfile.license} {therapistProfile.title}
                </Text>
                <Text style={styles.newProfileHint}>Tap to edit credentials & specializations</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Notifications Section */}
            <View style={styles.newSectionHeader}>
              <Bell size={18} color={colors.text} />
              <Text style={styles.newSectionTitle}>Notifications</Text>
            </View>
            <View style={styles.newCard}>
              <View style={styles.newToggleRow}>
                <View style={styles.newToggleRowCopy}>
                  <Text style={styles.newRowTitle}>New Recordings</Text>
                  <Text style={styles.newRowSubtitle}>When a child or parent submits</Text>
                </View>
                <Switch
                  value={newRecordingsToggle}
                  onValueChange={(val) => {
                    setNewRecordingsToggle(val);
                    triggerToast(`New recordings alerts ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.newDivider} />

              <View style={styles.newToggleRow}>
                <View style={styles.newToggleRowCopy}>
                  <Text style={styles.newRowTitle}>Follow-Up Alerts</Text>
                  <Text style={styles.newRowSubtitle}>Patients who need practice follow-up</Text>
                </View>
                <Switch
                  value={followUpAlertsToggle}
                  onValueChange={(val) => {
                    setFollowUpAlertsToggle(val);
                    triggerToast(`Follow-up alerts ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.newDivider} />

              <View style={styles.newToggleRow}>
                <View style={styles.newToggleRowCopy}>
                  <Text style={styles.newRowTitle}>Ready to level up</Text>
                  <Text style={styles.newRowSubtitle}>A child reaches your threshold</Text>
                </View>
                <Switch
                  value={readyToLevelUpToggle}
                  onValueChange={(val) => {
                    setReadyToLevelUpToggle(val);
                    triggerToast(`Level up alerts ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.newDivider} />

              <View style={styles.newToggleRow}>
                <View style={styles.newToggleRowCopy}>
                  <Text style={styles.newRowTitle}>Teacher updates</Text>
                  <Text style={styles.newRowSubtitle}>Classroom notes from linked teachers</Text>
                </View>
                <Switch
                  value={teacherUpdatesToggle}
                  onValueChange={(val) => {
                    setTeacherUpdatesToggle(val);
                    triggerToast(`Teacher updates ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.newDivider} />

              <View style={styles.newToggleRow}>
                <View style={styles.newToggleRowCopy}>
                  <Text style={styles.newRowTitle}>Missed Exercises</Text>
                  <Text style={styles.newRowSubtitle}>Alert after 3 consecutive missed practice days</Text>
                </View>
                <Switch
                  value={missedExercisesToggle}
                  onValueChange={(val) => {
                    setMissedExercisesToggle(val);
                    triggerToast(`Missed exercises alerts ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Appearance Section */}
            <View style={styles.newSectionHeader}>
              <Palette size={18} color={colors.text} />
              <Text style={styles.newSectionTitle}>Appearance</Text>
            </View>
            <View style={styles.newCard}>
              <View style={styles.newThemeRow}>
                <View style={styles.newThemeLeft}>
                  <SunMoon size={18} color={colors.text} />
                  <Text style={styles.newRowTitle}>Theme</Text>
                </View>
                <View style={styles.newThemeSegmentControl}>
                  {(['Auto', 'Light', 'Dark'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.newThemeSegmentBtn,
                        themeMode === mode && styles.newThemeSegmentBtnActive,
                      ]}
                      onPress={() => {
                        setThemeMode(mode);
                        triggerToast(
                          mode === 'Auto'
                            ? `Auto theme enabled (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})`
                            : `${mode} theme enabled`
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.newThemeSegmentText,
                          themeMode === mode && styles.newThemeSegmentTextActive,
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Privacy & Security Section */}
            <View style={styles.newSectionHeader}>
              <Lock size={18} color={colors.text} />
              <Text style={styles.newSectionTitle}>Privacy & Security</Text>
            </View>
            <View style={styles.newCard}>
              <View style={styles.newToggleRow}>
                <View style={styles.newShieldIcon}>
                  <ShieldCheck size={26} color="#22C55E" />
                </View>
                <View style={styles.newToggleRowCopy}>
                  <Text style={styles.newRowTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.newRowSubtitle}>Required for pediatric audio playback</Text>
                </View>
                <Switch
                  value={twoFactorAuthToggle}
                  onValueChange={(val) => {
                    setTwoFactorAuthToggle(val);
                    triggerToast(`Two-factor authentication ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Text style={styles.newSubSectionTitle}>Active Mobile Session</Text>
            <View style={styles.newCard}>
              {activeSessions.map((session, index) => (
                <React.Fragment key={session.id}>
                  <View style={styles.newSessionRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.newRowTitle}>{session.device}</Text>
                        {session.isCurrent ? (
                          <View style={styles.newThisDeviceBadge}>
                            <Text style={styles.newThisDeviceText}>This Device</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.newRowSubtitle}>{session.location} • {session.lastActive}</Text>
                    </View>
                    {!session.isCurrent ? (
                      <TouchableOpacity
                        onPress={() => handleRevokeSession(session.id)}
                        style={styles.newRevokeBtn}
                      >
                        <Text style={styles.newRevokeBtnText}>Revoke</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {index < activeSessions.length - 1 ? <View style={styles.newDivider} /> : null}
                </React.Fragment>
              ))}
            </View>

            {/* About Help Section */}
            <View style={styles.newSectionHeader}>
              <Text style={styles.newSectionTitle}>About Help</Text>
            </View>
            <View style={styles.newCard}>
              <View style={styles.newAboutRow}>
                <Text style={styles.newRowTitle}>Help center</Text>
                <Text style={styles.newRowSubtitle}>Guides and FAQs</Text>
              </View>
              <View style={styles.newDivider} />
              <View style={styles.newAboutRow}>
                <Text style={styles.newRowTitle}>Contact support</Text>
                <Text style={styles.newRowSubtitle}>We reply within a day</Text>
              </View>
              <View style={styles.newDivider} />
              <View style={styles.newAboutRow}>
                <Text style={styles.newRowTitle}>Terms & privacy policy</Text>
                <Text style={styles.newRowSubtitle}>Updated this year</Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.newSignOutBtn}
              activeOpacity={0.8}
              onPress={() => {
                setShowSettingsModal(false);
                setShowLogoutConfirm(true);
              }}
            >
              <LogOut size={18} color={colors.isDark ? '#FED7AA' : '#C48B5A'} style={{ marginRight: 8 }} />
              <Text style={styles.newSignOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==========================================
          --- MODAL: PROFILE & CREDENTIALS (Screenshot 1 Right) ---
          ========================================== */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowProfileModal(false);
          if (profileOpenedFromSettings) {
            setShowSettingsModal(true);
            setProfileOpenedFromSettings(false);
          }
        }}
      >
        <SafeAreaView style={styles.settingsModalContainer}>
          {/* Header Row */}
          <View style={styles.newHeaderRow}>
            <TouchableOpacity
              onPress={() => {
                setShowProfileModal(false);
                if (profileOpenedFromSettings) {
                  setShowSettingsModal(true);
                  setProfileOpenedFromSettings(false);
                }
              }}
              style={styles.newBackButton}
              accessibilityLabel="Back"
            >
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.newHeaderTitle}>Profile & Credentials</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
            {/* Upload Photo Card */}
            <TouchableOpacity
              style={styles.newUploadPhotoCard}
              activeOpacity={0.8}
              onPress={handlePickPhoto}
            >
              <View style={styles.newPhotoAvatarWrapper}>
                <View style={styles.newPhotoAvatar}>
                  {editProfileForm.photoUri ? (
                    <Image source={{ uri: editProfileForm.photoUri }} style={styles.newPhotoAvatarImg} />
                  ) : (
                    <Text style={styles.newPhotoAvatarText}>A</Text>
                  )}
                </View>
                <View style={styles.newCameraBadge}>
                  <Camera size={14} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.newUploadPhotoLabel}>Upload Photo</Text>
            </TouchableOpacity>

            {/* Profile Section */}
            <Text style={styles.newSectionTitleStandalone}>Profile</Text>
            <View style={styles.newCard}>
              <View style={styles.newProfileFieldRow}>
                <Text style={styles.newFieldLabel}>Name</Text>
                <TextInput
                  style={styles.newFieldInput}
                  value={editProfileForm.name}
                  onChangeText={(text) =>
                    setEditProfileForm((prev) => ({
                      ...prev,
                      name: text,
                      fullName: `${text}, ${prev.credentials}`,
                    }))
                  }
                  placeholder="Dr. Ameer Andres"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.newDivider} />

              <View style={styles.newProfileFieldRow}>
                <Text style={styles.newFieldLabel}>Professional Title</Text>
                <TextInput
                  style={styles.newFieldInput}
                  value={editProfileForm.title}
                  onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, title: text }))}
                  placeholder="Speech-Language Pathologist"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.newDivider} />

              <View style={styles.newProfileFieldRow}>
                <Text style={styles.newFieldLabel}>Contact Number</Text>
                <TextInput
                  style={styles.newFieldInput}
                  value={editProfileForm.contact}
                  onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, contact: text }))}
                  placeholder="+63 9000 000 000"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.newDivider} />

              <View style={styles.newProfileFieldRow}>
                <Text style={styles.newFieldLabel}>PRC / Licensed Number</Text>
                <TextInput
                  style={styles.newFieldInput}
                  value={editProfileForm.license}
                  onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, license: text }))}
                  placeholder="PRC #0048291"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.newDivider} />

              <View style={styles.newProfileFieldRow}>
                <Text style={styles.newFieldLabel}>Clinic/School</Text>
                <TextInput
                  style={styles.newFieldInput}
                  value={editProfileForm.clinic}
                  onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, clinic: text }))}
                  placeholder="LittleVoices Pediatric Speech Center"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Specialization Section */}
            <Text style={styles.newSectionTitleStandalone}>Specialization</Text>
            <View style={styles.newSpecialtyContainer}>
              <View style={styles.newChipsRow}>
                {editProfileForm.specializations.map((spec, index) => {
                  const colorInfo = SPECIALTY_PALETTE[index % SPECIALTY_PALETTE.length];
                  return (
                    <View
                      key={spec}
                      style={[
                        styles.newChip,
                        {
                          borderColor: colorInfo.border,
                          backgroundColor: colors.isDark ? colorInfo.darkBg : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.newChipText,
                          { color: colors.isDark ? colorInfo.darkText : colorInfo.text },
                        ]}
                      >
                        {spec}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveSpecialty(spec)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.newChipRemove}
                      >
                        <X size={12} color={colors.isDark ? colorInfo.darkText : colorInfo.text} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <View style={styles.newAddSpecialtyRow}>
                <TextInput
                  style={styles.newAddSpecialtyInput}
                  value={newSpecialtyInput}
                  onChangeText={setNewSpecialtyInput}
                  onSubmitEditing={handleAddSpecialty}
                  placeholder="Add Specialty e.g., Articulation"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Save Credentials Button */}
            <View style={styles.newSaveContainer}>
              <TouchableOpacity
                style={styles.newSaveCredentialsBtn}
                activeOpacity={0.8}
                disabled={profileSaving}
                onPress={handleSaveProfile}
              >
                <Text style={styles.newSaveCredentialsBtnText}>{profileSaving ? 'Saving…' : 'Save Account Info'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==========================================
          --- MODAL: CHANGE PASSWORD ---
          ========================================== */}
      <Modal
        visible={showChangePasswordModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleText}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)} style={styles.closeButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Current Password</Text>
            <TextInput
              style={styles.formInput}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
            />

            <Text style={styles.formLabel}>New Password</Text>
            <TextInput
              style={styles.formInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min. 8 characters)"
            />

            <Text style={styles.formLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.formInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
            />

            <View style={[styles.previewActionsRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.solidBlueBtn}
                disabled={passwordSaving}
                onPress={handleChangePassword}
              >
                <Text style={styles.solidBlueBtnText}>{passwordSaving ? 'Updating…' : 'Update Password'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          --- MODAL: LOGOUT CONFIRMATION ---
          ========================================== */}
      <Modal
        visible={showLogoutConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={[styles.menuIconCircle, { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEE2E2', marginBottom: 12 }]}>
              <LogOut size={26} color="#DC2626" />
            </View>
            <Text style={[styles.modalPatientName, { fontSize: 18, marginBottom: 6 }]}>Log Out of SpeakSteps?</Text>
            <Text style={[styles.subtextSmall, { textAlign: 'center', marginBottom: 20 }]}>
              You will need to sign back in with your credentials to manage your patients.
            </Text>

            <View style={[styles.previewActionsRow, { width: '100%', marginTop: 0 }]}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.solidBlueBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleLogout}
              >
                <Text style={styles.solidBlueBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Toast Feedback Banner */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ==========================================
          --- BOTTOM NAVIGATION BAR ---
          ========================================== */}
      <View style={styles.bottomNav}>
        {/* Tab 1: Home */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          {activeTab === 'home' && <View style={styles.activeTabIndicator} />}
          <Home
            size={22}
            color={activeTab === 'home' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
            fill={activeTab === 'home' ? (isDark ? '#38BDF8' : '#0284C7') : 'none'}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Tab 2: Patients */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('patients')}
          activeOpacity={0.7}
        >
          {activeTab === 'patients' && <View style={styles.activeTabIndicator} />}
          <Users
            size={22}
            color={activeTab === 'patients' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'patients' && styles.navLabelActive]}>Patients</Text>
        </TouchableOpacity>

        {/* Tab 3: Activities */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('activities');
            setActivitiesView('library');
          }}
          activeOpacity={0.7}
        >
          {activeTab === 'activities' && <View style={styles.activeTabIndicator} />}
          <Speech
            size={22}
            color={activeTab === 'activities' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
          />
          <Text style={[styles.navLabel, activeTab === 'activities' && styles.navLabelActive]}>Activities</Text>
        </TouchableOpacity>

        {/* Tab 4: Reviews */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('reviews')}
          activeOpacity={0.7}
        >
          {activeTab === 'reviews' && <View style={styles.activeTabIndicator} />}
          <View>
            <Star
              size={22}
              color={activeTab === 'reviews' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
            />
            {pendingReviewsCount > 0 && (
              <View style={styles.starBadgeContainer}>
                <Text style={styles.starBadgeText}>{pendingReviewsCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, activeTab === 'reviews' && styles.navLabelActive]}>Reviews</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// --- STYLESHEET ---
// ==========================================
function createStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    topHeader: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
    iconButton: {
      padding: 8,
    },
    backCircleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    backArrowText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '700',
    },
    appTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 22,
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    notificationDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },
    mainScrollView: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    // Greeting
    greetingSection: {
      marginTop: 16,
      marginBottom: 16,
    },
    dateText: {
      fontSize: 13,
      color: colors.textSub,
      marginBottom: 4,
    },
    greetingTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 24,
      color: colors.heading,
      marginBottom: 4,
    },
    greetingSubtitle: {
      fontSize: 14,
      color: colors.textSub,
      marginBottom: 14,
    },
    assignButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    assignButtonText: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 13,
      color: colors.isDark ? '#38BDF8' : '#0F766E',
    },
    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    },
    statCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statNumber: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 28,
    },
    statBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    statBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    // Section Headers
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    viewAllText: {
      fontSize: 13,
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '600',
    },
    // Patient Cards
    patientListContainer: {
      marginBottom: 16,
    },
    patientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
    },
    patientAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardSubtle,
      marginRight: 12,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    patientCardBody: {
      flex: 1,
    },
    patientCardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    patientName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    percentBadge: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    percentText: {
      fontSize: 12,
      fontWeight: '700',
    },
    patientSubtitle: {
      fontSize: 12,
      color: colors.textSub,
      marginBottom: 6,
    },
    progressBarBackground: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    // Recent Submissions
    submissionsCardWrapper: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 8,
      marginBottom: 20,
    },
    submissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSubtle,
      borderRadius: 14,
      padding: 10,
      marginBottom: 8,
    },
    patientAvatarSmall: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    avatarTextSmall: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    subPatientName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    subDetails: {
      fontSize: 11,
      color: colors.textSub,
      marginVertical: 2,
    },
    subProgressBar: {
      height: 5,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      width: '100%',
    },
    subProgressFill: {
      height: '100%',
      backgroundColor: '#22C55E',
    },
    reviewButton: {
      backgroundColor: '#0284C7',
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 14,
    },
    reviewButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    // Patients Tab
    patientsTabContainer: {
      paddingTop: 8,
    },
    pageTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 24,
      color: colors.heading,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.textSub,
      marginBottom: 16,
    },
    searchFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    searchInputWrapper: {
      flex: 1,
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      justifyContent: 'center',
      marginRight: 8,
    },
    searchInput: {
      fontSize: 13,
      color: colors.inputText,
    },
    filterDropdown: {
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
    },
    filterText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSub,
      marginRight: 4,
    },
    filterArrow: {
      fontSize: 9,
      color: colors.textMuted,
    },
    // Activity Library
    subHeadingCaps: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSub,
      letterSpacing: 1,
      marginTop: 10,
    },
    subTabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 14,
    },
    subTabActive: {
      paddingVertical: 8,
      borderBottomWidth: 2,
      borderBottomColor: '#0284C7',
      marginRight: 20,
    },
    subTabActiveText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#0284C7',
    },
    subTabInactive: {
      paddingVertical: 8,
      marginRight: 20,
    },
    subTabInactiveText: {
      fontSize: 13,
      color: colors.textSub,
    },
    activitySearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    activitySearchInputWrapper: {
      flex: 1,
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      marginRight: 10,
    },
    createTaskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 42,
      backgroundColor: '#0284C7',
      paddingHorizontal: 14,
      borderRadius: 12,
      marginRight: 10,
    },
    createTaskButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    activityFilterBtn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityFilterBtnActive: {
      borderColor: '#0284C7',
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
    },
    activityFilterIconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityFilterDot: {
      position: 'absolute',
      top: -2,
      right: -5,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#0284C7',
    },
    activityFilterPanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 14,
    },
    activityFilterPanelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    activityFilterPanelTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    activityFilterResetText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#0284C7',
    },
    activityFilterSectionHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSub,
      marginBottom: 8,
    },
    activityFilterPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    activityFilterPill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
      backgroundColor: colors.card,
    },
    activityFilterPillActive: {
      borderColor: '#0284C7',
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
    },
    activityFilterPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSub,
    },
    activityFilterPillTextActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    // Word Bank Styles
    wbSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    wbSearchInputWrapper: {
      flex: 1,
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      marginRight: 8,
    },
    wbSearchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.inputText,
      paddingVertical: 0,
    },
    wbAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 42,
      backgroundColor: '#0284C7',
      paddingHorizontal: 12,
      borderRadius: 12,
      marginRight: 8,
    },
    wbAddBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    wbFilterBtn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wbFilterBtnActive: {
      borderColor: '#0284C7',
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
    },
    wbFilterPanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 12,
    },
    wbFilterHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSub,
      marginBottom: 8,
    },
    wbFilterOptionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    wbChoicePill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.card,
    },
    wbChoicePillActive: {
      borderColor: '#0284C7',
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
    },
    wbChoicePillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSub,
    },
    wbChoicePillTextActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    wbChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    wbChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.isDark ? '#0284C7' : '#BAE6FD',
      backgroundColor: colors.isDark ? '#082F49' : '#F0F9FF',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    wbChipLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    wbAddForm: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 14,
    },
    wbAddFormTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    wbFormLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSub,
      marginBottom: 6,
    },
    wbFormInput: {
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.inputText,
      backgroundColor: colors.inputBg,
      marginBottom: 10,
    },
    wbSaveWordBtn: {
      alignSelf: 'flex-end',
      backgroundColor: '#0284C7',
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginTop: 12,
    },
    wbSaveWordBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    wbListHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginTop: 4,
    },
    wbListTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    wbEditModeBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    wbListCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      overflow: 'hidden',
      marginBottom: 20,
    },
    wbListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
    },
    wbWordText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    wbSoundBadgeWrap: {
      marginLeft: 8,
      backgroundColor: colors.isDark ? '#1E3A5F' : '#F1F5F9',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    wbSoundBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.isDark ? '#7DD3FC' : '#0369A1',
    },
    wbPositionBadge: {
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    wbPositionBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    wbDeleteBtn: {
      padding: 4,
    },
    chipsScroll: {
      marginBottom: 14,
    },
    chipButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginRight: 8,
    },
    chipButtonActive: {
      backgroundColor: '#0284C7',
      borderColor: '#0284C7',
    },
    chipText: {
      fontSize: 12,
      color: colors.textSub,
      fontWeight: '600',
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    activityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    activityGridCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 14,
    },
    activitySoundHeader: {
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 12,
    },
    activitySoundText: {
      fontSize: 26,
      fontWeight: '800',
      marginRight: 10,
    },
    soundWavesSmall: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    waveLine: {
      width: 2.5,
      marginHorizontal: 1.5,
      borderRadius: 1.5,
    },
    activityCardBody: {
      padding: 10,
    },
    activityCategoryTag: {
      fontSize: 10,
      color: '#D97706',
      fontWeight: '700',
      marginBottom: 2,
    },
    activityCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    activityCardSub: {
      fontSize: 10,
      color: colors.textSub,
      marginBottom: 8,
    },
    viewActivityLink: {
      fontSize: 11,
      color: colors.textSub,
      fontWeight: '600',
    },
    // Preview
    previewContainer: {
      paddingTop: 8,
    },
    previewTagPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.peachPillBg,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 6,
    },
    previewTagText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    previewTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 24,
      color: colors.text,
      marginBottom: 2,
    },
    previewSoundDesc: {
      fontSize: 12,
      color: colors.textSub,
      marginBottom: 14,
    },
    previewSectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: 14,
      marginBottom: 6,
    },
    previewSectionBody: {
      fontSize: 12,
      color: colors.textSub,
      lineHeight: 18,
    },
    practiceContentCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginTop: 6,
    },
    practiceContentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    practicePositionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    targetCountBadge: {
      backgroundColor: colors.isDark ? '#082F49' : '#BAE6FD',
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    targetCountText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0369A1',
    },
    wordPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    wordPillPeach: {
      backgroundColor: colors.peachPillBg,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginRight: 6,
      marginBottom: 4,
    },
    wordPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    phraseBulletText: {
      fontSize: 12,
      color: colors.text,
      lineHeight: 20,
    },
    emptyTargetCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 10,
      marginTop: 8,
    },
    zeroTargetBadge: {
      backgroundColor: colors.cardSubtle,
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    zeroTargetText: {
      fontSize: 11,
      color: colors.textSub,
    },
    noTargetsSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginLeft: 4,
      marginTop: 2,
    },
    audioModelCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.yellowCardBg,
      borderWidth: 1,
      borderColor: colors.yellowCardBorder,
      borderRadius: 14,
      padding: 12,
      marginTop: 6,
    },
    audioPlayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F97316',
      justifyContent: 'center',
      alignItems: 'center',
    },
    audioPlayIcon: {
      color: '#FFFFFF',
      fontSize: 12,
      marginLeft: 2,
    },
    audioModelTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    audioModelSub: {
      fontSize: 11,
      color: colors.textSub,
    },
    audioWaveformRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    audioWaveBar: {
      width: 3.5,
      backgroundColor: '#F97316',
      marginHorizontal: 1.5,
      borderRadius: 2,
    },
    videoPlaceholderBox: {
      height: 120,
      backgroundColor: colors.cardSubtle,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
    },
    videoPlayCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    videoPlayIcon: {
      color: colors.textSub,
      fontSize: 16,
      marginLeft: 2,
    },
    previewActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 18,
    },
    outlineBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.isDark ? '#38BDF8' : '#0284C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      backgroundColor: colors.card,
    },
    outlineBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    solidBlueBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#0284C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    solidBlueBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    continueBtn: {
      width: '100%',
      height: 50,
      borderRadius: 12,
      backgroundColor: '#0284C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    continueBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    // Edit Wizard
    editWizardContainer: {
      paddingTop: 8,
    },
    editWizardTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 24,
      color: colors.heading,
      marginBottom: 8,
    },
    stepperBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 16,
    },
    stepItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    stepItemActive: {},
    stepText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    stepTextActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    stepIndicatorLine: {
      position: 'absolute',
      bottom: -1,
      left: '15%',
      right: '15%',
      height: 2,
      backgroundColor: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    formLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginTop: 10,
      marginBottom: 4,
    },
    formInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      color: colors.inputText,
      marginBottom: 8,
    },
    formRowTwoCol: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dropdownSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 8,
    },
    dropdownValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    dropdownArrow: {
      fontSize: 10,
      color: colors.textSub,
    },
    pillsSelectRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    posPill: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginRight: 8,
    },
    posPillSelected: {
      backgroundColor: colors.peachPillBg,
      borderColor: '#FB923C',
    },
    posPillText: {
      fontSize: 12,
      color: colors.textSub,
      fontWeight: '600',
    },
    posPillTextSelected: {
      color: colors.peachPillText,
      fontWeight: '700',
    },
    langSegmentControl: {
      flexDirection: 'row',
      backgroundColor: colors.cardSubtle,
      borderRadius: 10,
      padding: 3,
      marginBottom: 8,
    },
    langSegmentBtn: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 8,
    },
    langSegmentBtnActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    langSegmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSub,
    },
    langSegmentTextActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    wordOriginRadioRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    originCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 10,
    },
    originCardActive: {
      borderColor: '#FB923C',
      backgroundColor: colors.peachCardBg,
    },
    radioDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    radioDotActive: {
      borderColor: '#EA580C',
      backgroundColor: '#EA580C',
    },
    originTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    originSub: {
      fontSize: 10,
      color: colors.textSub,
    },
    posCountersRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    posCounterBox: {
      width: '31%',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 8,
      alignItems: 'center',
    },
    posCounterBoxActive: {
      borderColor: '#FB923C',
      backgroundColor: colors.peachCardBg,
    },
    posCounterLabel: {
      fontSize: 11,
      color: colors.textSub,
    },
    posCounterValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: 2,
    },
    wordBankSearchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 40,
      marginBottom: 10,
    },
    wordChecklistContainer: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 8,
      marginBottom: 10,
    },
    wordCheckItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 6,
    },
    checkboxSquare: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      backgroundColor: colors.card,
    },
    checkboxSquareActive: {
      backgroundColor: '#EA580C',
      borderColor: '#EA580C',
    },
    checkmarkIcon: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    checkWordLabel: {
      fontSize: 13,
      color: colors.text,
    },
    selectedChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    removableChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.peachPillBg,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginRight: 6,
      marginBottom: 6,
    },
    removableChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    removableChipX: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    wordPhraseBlock: {
      marginBottom: 10,
    },
    wordPhraseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    wordPhraseTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    phraseInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      fontSize: 12,
      color: colors.inputText,
    },
    customWordInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    addWordBtn: {
      height: 40,
      backgroundColor: '#0284C7',
      paddingHorizontal: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addWordBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 12,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    checkboxRowLabel: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    subtextSmall: {
      fontSize: 11,
      color: colors.textSub,
      marginBottom: 4,
    },
    phraseBuilderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    symbolBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    symbolBtnText: {
      fontSize: 16,
      color: colors.textSub,
      fontWeight: '700',
    },
    savePhraseBtn: {
      alignSelf: 'flex-end',
      backgroundColor: '#D97706',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      marginBottom: 12,
    },
    savePhraseBtnText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    uploadDashedBox: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
      backgroundColor: colors.cardSubtle,
      marginVertical: 8,
    },
    uploadMainText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    uploadSubText: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
    bigPhonemeHero: {
      backgroundColor: colors.peachCardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 14,
    },
    bigHeroSound: {
      fontSize: 54,
      fontWeight: '800',
      color: '#C2410C',
    },
    bigHeroTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 20,
      color: colors.text,
      marginTop: 4,
    },
    bigHeroSubtitle: {
      fontSize: 12,
      color: colors.textSub,
      marginTop: 2,
    },
    // Assign Activity
    assignScreenContainer: {
      paddingTop: 8,
    },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.peachCardBg,
      borderWidth: 1,
      borderColor: colors.peachCardBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginVertical: 8,
    },
    accordionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.peachText,
    },
    accordionArrow: {
      fontSize: 10,
      color: colors.peachText,
    },
    expandedAccordionCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
    },
    dateInputWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 42,
      marginBottom: 8,
    },
    dateTextInput: {
      flex: 1,
      fontSize: 13,
      color: colors.inputText,
    },
    // ==========================================
    // --- REVIEWS TAB STYLES (Image 2) ---
    // ==========================================
    reviewsTabContainer: {
      paddingTop: 8,
    },
    reviewsCapsHeading: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSub,
      letterSpacing: 1,
      marginBottom: 4,
    },
    reviewsTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 24,
      color: colors.heading,
      marginBottom: 4,
    },
    reviewsSubtitle: {
      fontSize: 13,
      color: colors.textSub,
      marginBottom: 14,
    },
    reviewsFilterTabsBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 14,
    },
    reviewsFilterTab: {
      paddingVertical: 8,
      marginRight: 24,
      alignItems: 'center',
    },
    reviewsFilterTabActive: {},
    reviewsFilterTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSub,
    },
    reviewsFilterTabTextActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    reviewsFilterTabIndicator: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    reviewsListContainer: {
      marginBottom: 20,
    },
    reviewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
    },
    reviewAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    reviewAvatarText: {
      fontSize: 15,
      fontWeight: '700',
    },
    reviewCardBody: {
      flex: 1,
    },
    reviewStudentName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    reviewActivityDesc: {
      fontSize: 11,
      color: colors.textSub,
    },
    reviewStatusBadge: {
      width: 78,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    reviewStatusPending: {
      backgroundColor: colors.isDark ? 'rgba(196, 139, 90, 0.22)' : colors.peachPillBg,
    },
    reviewStatusReviewed: {
      backgroundColor: colors.isDark ? 'rgba(67, 176, 92, 0.22)' : '#DCFCE7',
    },
    reviewStatusText: {
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },
    reviewStatusTextPending: {
      color: colors.isDark ? '#FED7AA' : colors.peachPillText,
    },
    reviewStatusTextReviewed: {
      color: colors.isDark ? '#86EFAC' : '#16A34A',
    },
    reviewChevron: {
      fontSize: 16,
      color: colors.textMuted,
      fontWeight: '600',
    },
    // Rating buttons in Review Modal
    ratingButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    ratingBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 7,
      alignItems: 'center',
      marginHorizontal: 2,
      backgroundColor: colors.cardSubtle,
    },
    ratingBtnText: {
      fontSize: 10,
      color: colors.textSub,
      fontWeight: '600',
    },
    // Modal (Patient & SOAP)
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    patientAvatarModal: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardSubtle,
    },
    avatarTextModal: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    modalPatientName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    modalPatientAge: {
      fontSize: 12,
      color: colors.textSub,
    },
    closeButton: {
      padding: 6,
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.textSub,
      fontWeight: '700',
    },
    modalMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalMetricBox: {
      width: '31%',
      borderRadius: 12,
      padding: 8,
      alignItems: 'center',
    },
    metricBoxTitle: {
      fontSize: 9,
      color: colors.textSub,
      textAlign: 'center',
      marginBottom: 2,
    },
    metricBoxValue: {
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    metricBoxSubtitle: {
      fontSize: 9,
      color: colors.textSub,
      marginTop: 2,
      textAlign: 'center',
    },
    modalSection: {
      marginBottom: 16,
    },
    modalSectionHeading: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSub,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    overviewBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    overviewTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.heading,
      marginBottom: 8,
    },
    profileRow: {
      marginBottom: 6,
    },
    profileLabel: {
      fontSize: 11,
      color: colors.textSub,
    },
    profileValue: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    sectionRowWithButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    newSoapButton: {
      backgroundColor: '#0284C7',
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    newSoapButtonText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    emptySessionBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    emptySessionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    emptySessionSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
    },
    soapFormCard: {
      backgroundColor: colors.cardSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    soapFormTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.heading,
      marginBottom: 8,
    },
    soapInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 11,
      color: colors.inputText,
      marginBottom: 6,
    },
    saveSoapButton: {
      backgroundColor: '#0284C7',
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 4,
    },
    saveSoapButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    soapEntryCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.cardSubtle,
    },
    soapEntryHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.heading,
      marginBottom: 6,
    },
    soapEntryLine: {
      fontSize: 11,
      color: colors.text,
      marginBottom: 3,
      lineHeight: 16,
    },
    soapEntryPrefix: {
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    accomplishmentCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    accDate: {
      fontSize: 10,
      color: colors.textSub,
      marginBottom: 2,
    },
    accTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    accAccuracy: {
      fontSize: 11,
      color: '#059669',
      fontWeight: '600',
      marginBottom: 6,
    },
    notesLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textSub,
      marginBottom: 2,
    },
    notesBox: {
      backgroundColor: colors.cardSubtle,
      borderRadius: 6,
      padding: 6,
      marginBottom: 8,
    },
    notesText: {
      fontSize: 10,
      color: colors.textSub,
      fontStyle: 'italic',
    },
    audioPlayerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.yellowCardBg,
      borderRadius: 10,
      padding: 8,
    },
    playButtonCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#F97316',
      justifyContent: 'center',
      alignItems: 'center',
    },
    playIcon: {
      color: '#FFFFFF',
      fontSize: 10,
      marginLeft: 2,
    },
    audioLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    audioSub: {
      fontSize: 9,
      color: colors.textSub,
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    waveBar: {
      width: 3,
      backgroundColor: '#F97316',
      marginHorizontal: 1.5,
      borderRadius: 1.5,
    },
    toastContainer: {
      position: 'absolute',
      bottom: 75,
      alignSelf: 'center',
      backgroundColor: '#0284C7',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    toastText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    // Bottom Nav
    bottomNav: {
      flexDirection: 'row',
      height: 60,
      backgroundColor: colors.bottomNavBg,
      borderTopWidth: 1,
      borderTopColor: colors.bottomNavBorder,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      height: '100%',
    },
    activeTabIndicator: {
      position: 'absolute',
      top: 0,
      width: 32,
      height: 3,
      backgroundColor: colors.isDark ? '#38BDF8' : '#0284C7',
      borderRadius: 2,
    },
    navLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 3,
      fontWeight: '500',
    },
    navLabelActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    starBadgeContainer: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: '#EF4444',
      borderRadius: 8,
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    starBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },

    // --- Three Lines (Hamburger) Dropdown Styles ---
    menuOverlay: {
      flex: 1,
      backgroundColor: colors.menuOverlay,
    },
    menuDropdownContainer: {
      position: 'absolute',
      top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 52 : 52,
      left: 14,
      width: 250,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 10,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuUserHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 6,
      borderRadius: 10,
    },
    menuAvatarCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuAvatarText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    menuUserName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    menuUserRole: {
      fontSize: 11,
      color: colors.textSub,
    },
    menuSectionDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 6,
    },
    menuOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    menuIconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.isDark ? '#0F172A' : '#F0F9FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    menuOptionLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    menuOptionChevron: {
      fontSize: 16,
      color: colors.textMuted,
      fontWeight: '700',
    },

    // --- Notifications Dropdown Styles (Screenshot 1 Right) ---
    notifDropdownContainer: {
      position: 'absolute',
      top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 52 : 52,
      right: 14,
      width: 320,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.14,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notifDropdownHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    notifDropdownTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    notifFilterPillsRow: {
      flexDirection: 'row',
    },
    notifPill: {
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 6,
      backgroundColor: colors.card,
    },
    notifPillActive: {
      backgroundColor: '#38BDF8',
      borderColor: '#38BDF8',
    },
    notifPillText: {
      fontSize: 11,
      color: colors.textSub,
      fontWeight: '600',
    },
    notifPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    notifItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    notifItemTitle: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 2,
      lineHeight: 16,
    },
    notifItemDetail: {
      fontSize: 11,
      color: colors.textSub,
      lineHeight: 15,
    },
    notifItemTime: {
      fontSize: 10,
      color: colors.textMuted,
      marginLeft: 8,
      fontWeight: '500',
    },
    markAllReadBtn: {
      marginTop: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    markAllReadBtnText: {
      fontSize: 11,
      color: colors.textSub,
      fontWeight: '600',
    },

    // --- Settings & Account Styles (Screenshot 1 Left) ---
    settingsModalContainer: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
    },
    settingsTopBar: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingsNavTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 18,
      color: colors.heading,
    },
    settingsScrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    settingsProfileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 6,
    },
    settingsAvatarCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsAvatarLetter: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 28,
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    settingsDoctorName: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 16,
      color: colors.heading,
      marginBottom: 2,
    },
    settingsDoctorRole: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    settingsLicenseText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    settingsSectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      marginTop: 12,
    },
    settingsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 12,
    },
    settingsCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    settingsRowDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: 16,
    },
    settingsRowTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    settingsRowSub: {
      fontSize: 12,
      color: colors.textSub,
    },
    settingsChevron: {
      fontSize: 16,
      color: colors.textMuted,
      fontWeight: '700',
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    themeSegmentControl: {
      flexDirection: 'row',
      backgroundColor: colors.segmentBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 3,
    },
    themeSegmentBtn: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 16,
    },
    themeSegmentBtnActive: {
      backgroundColor: '#38BDF8',
    },
    themeSegmentText: {
      fontSize: 12,
      color: colors.textSub,
      fontWeight: '600',
    },
    themeSegmentTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    settingsLogoutButton: {
      backgroundColor: colors.logoutBtnBg,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 10,
    },
    settingsLogoutButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.logoutBtnText,
    },

    // --- Profile Screen Hero Styles ---
    profileHeroCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: 'center',
      marginBottom: 14,
    },
    profileBigAvatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    profileBigAvatarLetter: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 34,
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    profileHeroName: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 18,
      color: colors.heading,
      marginBottom: 2,
    },
    profileHeroRole: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 6,
    },
    licenseBadge: {
      backgroundColor: colors.cardSubtle,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    licenseBadgeText: {
      fontSize: 11,
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '600',
    },
    modalTitleText: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 16,
      color: colors.heading,
    },

    // --- New Settings & Profile Modal Styles ---
    newHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    newBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.isDark ? '#334155' : '#E2E8F0',
      backgroundColor: colors.isDark ? '#1E293B' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newBackButtonText: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
      marginTop: -2,
    },
    newHeaderTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    newProfileCard: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#334155' : '#E2E8F0',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    newProfileAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    newProfileAvatarImg: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    newProfileAvatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    newProfileInfo: {
      flex: 1,
      gap: 2,
    },
    newProfileNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    newProfileName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    newVerifiedBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#22C55E',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newVerifiedCheck: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    newProfileSubtitle: {
      fontSize: 12,
      color: colors.textSub,
    },
    newProfileHint: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    newChevronRight: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '600',
    },
    newSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      marginBottom: 4,
    },
    newSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    newSectionTitleStandalone: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: 14,
      marginBottom: 6,
    },
    newSubSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSub,
      marginTop: 12,
      marginBottom: 4,
    },
    newCard: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#334155' : '#E2E8F0',
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
    },
    newToggleRow: {
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    newToggleRowCopy: {
      flex: 1,
      gap: 2,
    },
    newRowTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    newRowSubtitle: {
      fontSize: 12,
      color: colors.textSub,
    },
    newDivider: {
      height: 1,
      backgroundColor: colors.isDark ? '#334155' : '#F1F5F9',
    },
    newShieldIcon: {
      marginRight: 2,
    },
    newThemeRow: {
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    newThemeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    newThemeSegmentControl: {
      flexDirection: 'row',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.isDark ? '#334155' : '#E2E8F0',
      backgroundColor: colors.isDark ? '#0F172A' : '#F8FAFC',
      padding: 2,
      gap: 2,
    },
    newThemeSegmentBtn: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newThemeSegmentBtnActive: {
      backgroundColor: colors.isDark ? 'rgba(196,139,90,0.28)' : 'rgba(196,139,90,0.18)',
    },
    newThemeSegmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSub,
    },
    newThemeSegmentTextActive: {
      color: colors.isDark ? '#FED7AA' : '#C48B5A',
      fontWeight: '700',
    },
    newSessionRow: {
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    newThisDeviceBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: colors.isDark ? 'rgba(34,197,94,0.22)' : 'rgba(34,197,94,0.15)',
    },
    newThisDeviceText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#22C55E',
    },
    newRevokeBtn: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#7F1D1D' : '#FCA5A5',
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 4,
      backgroundColor: colors.isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
    },
    newRevokeBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.isDark ? '#FCA5A5' : '#DC2626',
    },
    newAboutRow: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 2,
    },
    newSignOutBtn: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#C48B5A' : '#C48B5A',
      backgroundColor: colors.isDark ? 'rgba(196,139,90,0.14)' : 'rgba(196,139,90,0.08)',
      borderRadius: 12,
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'center',
      width: 200,
      marginTop: 14,
      marginBottom: 24,
    },
    newSignOutBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.isDark ? '#FED7AA' : '#C48B5A',
    },
    newUploadPhotoCard: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#334155' : '#E2E8F0',
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    newPhotoAvatarWrapper: {
      position: 'relative',
    },
    newPhotoAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    newPhotoAvatarImg: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    newPhotoAvatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    newCameraBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.card,
      backgroundColor: colors.isDark ? '#334155' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newUploadPhotoLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    newProfileFieldRow: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    newFieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSub,
    },
    newFieldInput: {
      fontSize: 14,
      color: colors.text,
      padding: 0,
      minHeight: 22,
    },
    newSpecialtyContainer: {
      gap: 12,
    },
    newChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    newChip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    newChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    newChipRemove: {
      padding: 2,
    },
    newChipX: {
      fontSize: 10,
      fontWeight: '700',
    },
    newAddSpecialtyRow: {
      width: '100%',
    },
    newAddSpecialtyInput: {
      height: 42,
      borderWidth: 1,
      borderColor: colors.isDark ? '#334155' : '#E2E8F0',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      fontSize: 13,
      color: colors.text,
    },
    newSaveContainer: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 28,
    },
    newSaveCredentialsBtn: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#C48B5A' : '#C48B5A',
      backgroundColor: colors.isDark ? 'rgba(196,139,90,0.18)' : 'rgba(196,139,90,0.12)',
      borderRadius: 10,
      paddingHorizontal: 36,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newSaveCredentialsBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.isDark ? '#FED7AA' : '#C48B5A',
    },
  });
}
