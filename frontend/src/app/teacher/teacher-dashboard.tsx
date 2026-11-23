import { ListPagination, useListPagination } from '@/components/list-pagination';
import { ChecklistFilter } from '@/components/therapist/TherapistChecklistFilter';
import { matchesPracticeLanguage, PRACTICE_LANGUAGES } from '@/types/sentences';
import { INITIAL_ACTIVITIES, getTeacherActivityPrompts, type ActivityItem } from '@/data/teacher-activities';
import { practiceLevels } from '@/data/practice-levels';
import { assignLearningActivity, DEMO_STUDENT_ID, useLearningAssignments } from '@/data/learning-workflow';
import { AssignmentCalendar } from '@/components/assignment-calendar';
import { ProfileEditWarning } from '@/components/profile-edit-warning';
import { todayCalendarDate } from '@/data/calendar-date';
import { isAssignmentDate } from '@/Therapist-modules/therapist-activities/data/activityData';
import { SessionRevokeWarning } from '@/components/session-revoke-warning';
import { CENTER_NAME } from '@/data/center-name';
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
  useWindowDimensions,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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
  BookOpen,
  Sparkles,
  Layers,
  Volume2,
  Video,
  FileText,
  Send,
  Edit3,
} from 'lucide-react-native';

// ==========================================
// --- Data Interfaces ---
// ==========================================
interface Patient {
  id: string;
  initials: string;
  name: string;
  age: number;
  targetDescription: string;
  accuracy: number;
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
}

// ==========================================
// --- Options & Constants ---
// ==========================================
const TARGET_SOUND_OPTIONS = [
  '/s/', '/r/', '/l/', '/t/', '/k/', '/p/', '/m/',
  '/b/', '/d/', '/f/', '/v/', '/th/', '/ch/', '/sh/'
];
const PRACTICE_LEVEL_OPTIONS = ['Words', 'Phrases', 'Sentences', 'Sound', 'Syllables'];

// ==========================================
// --- Initial Mock Data ---
// ==========================================
const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    initials: 'KS',
    name: 'Khyl Shervin Sude',
    age: 5,
    targetDescription: 'Sound • target /r/ initial',
    accuracy: 35,
    accuracyColor: '#DC2626',
    progressColor: '#F87171',
    badgeBg: '#FEE2E2',
    badgeTextColor: '#DC2626',
    stage: 'Sound',
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
  {
    id: DEMO_STUDENT_ID,
    initials: 'MS',
    name: 'Mia Santos',
    age: 5,
    targetDescription: 'Individual sounds',
    accuracy: 0,
    accuracyColor: '#0284C7',
    progressColor: '#38BDF8',
    badgeBg: '#E0F2FE',
    badgeTextColor: '#0865AD',
    stage: 'Sound',
    compliance: '—',
    complianceDays: '',
    phonemeTarget: { primary: '/s/', secondary: '', errorPattern: '', languageProfile: 'Bilingual Tagalog & English' },
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

// Helper: Get student accuracy badge colors preserving Red, Yellow, Green in Dark & Light Modes
const getStudentBadgeTheme = (item: Patient, isDark: boolean) => {
  if (!isDark) return { bg: item.badgeBg, color: item.badgeTextColor };
  if (item.badgeBg === '#FEE2E2' || item.badgeTextColor === '#DC2626') {
    return { bg: '#4C0519', color: '#FB7185' };
  }
  if (item.badgeBg === '#FEF3C7' || item.badgeTextColor === '#D97706') {
    return { bg: '#451A03', color: '#FBBF24' };
  }
  return { bg: '#064E3B', color: '#4ADE80' };
};

// Helper: Get sound header & category colors preserving Orange, Yellow, Blue, Red, Green in Dark & Light Modes
const getActivitySoundColors = (act: ActivityItem, isDark: boolean) => {
  if (!isDark) {
    return {
      bg: act.soundBg,
      color: act.soundColor,
      categoryColor: act.soundColor === '#CA8A04' ? '#D97706' : act.soundColor,
    };
  }

  // Dark Mode: Rich, vibrant dark mode palettes preserving the signature color of each sound card
  // 1. Green (act-1: Sunny Sounds, #DCFCE7 / #16A34A)
  if (act.soundBg === '#DCFCE7' || act.soundColor === '#16A34A' || act.category === 'Words') {
    return { bg: '#064E3B', color: '#4ADE80', categoryColor: '#4ADE80' };
  }
  // 2. Orange (act-2: Ready, set, /r/, #FFEDD5 / #EA580C)
  if (act.soundBg === '#FFEDD5' || act.soundColor === '#EA580C' || act.category === 'Phrases') {
    return { bg: '#431407', color: '#FB923C', categoryColor: '#FB923C' };
  }
  // 3. Yellow (act-3: Little /l/ steps, #FEF9C3 / #CA8A04)
  if (act.soundBg === '#FEF9C3' || act.soundColor === '#CA8A04' || act.category === 'Syllables') {
    return { bg: '#451A03', color: '#FACC15', categoryColor: '#FACC15' };
  }
  // 4. Blue (act-4: Sound explorers, #E0F2FE / #0284C7)
  if (act.soundBg === '#E0F2FE' || act.soundColor === '#0284C7' || act.category === 'Sound') {
    return { bg: '#082F49', color: '#38BDF8', categoryColor: '#38BDF8' };
  }
  // 5. Red (act-5: Say it in a sentence, #FFE4E6 / #E11D48)
  if (act.soundBg === '#FFE4E6' || act.soundColor === '#E11D48' || act.category === 'Sentences') {
    return { bg: '#4C0519', color: '#FB7185', categoryColor: '#FB7185' };
  }

  return { bg: '#1E293B', color: '#38BDF8', categoryColor: '#38BDF8' };
};

// Helper: Get category & level theme colors preserving Green (Words), Yellow (Syllables), Blue (Isolation), Red (Sentences), Orange (Phrases)
const getCategoryLevelColors = (levelOrCategory: string, isDark: boolean) => {
  const norm = (levelOrCategory || '').toLowerCase();
  if (norm.includes('word')) {
    // Words: Green
    return {
      bg: isDark ? '#064E3B' : '#DCFCE7',
      color: isDark ? '#4ADE80' : '#16A34A',
    };
  }
  if (norm.includes('syllable')) {
    // Syllables: Yellow
    return {
      bg: isDark ? '#451A03' : '#FEF9C3',
      color: isDark ? '#FACC15' : '#CA8A04',
    };
  }
  if (norm === 'sound' || norm.includes('isolation')) {
    // Sound: Blue
    return {
      bg: isDark ? '#082F49' : '#E0F2FE',
      color: isDark ? '#38BDF8' : '#0284C7',
    };
  }
  if (norm.includes('sentence')) {
    // Sentences: Red
    return {
      bg: isDark ? '#4C0519' : '#FFE4E6',
      color: isDark ? '#FB7185' : '#E11D48',
    };
  }
  if (norm.includes('phrase')) {
    // Phrases: Orange
    return {
      bg: isDark ? '#431407' : '#FFEDD5',
      color: isDark ? '#FB923C' : '#EA580C',
    };
  }
  return {
    bg: isDark ? '#082F49' : '#E0F2FE',
    color: isDark ? '#38BDF8' : '#0284C7',
  };
};

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
    activityTitle: 'Ready, set, /r/',
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
    activityTitle: 'Try these /t/ words',
    phonemeDesc: '/t/ - Words',
    status: 'Pending',
    submittedDate: 'Oct 24, 2026',
    targetWord: 'tea',
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
    detail: '/r/ Sound (Target: 35% accuracy)',
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

const INITIAL_WORD_BANK_ENTRIES: WordBankEntry[] = [
  { id: 'wb-1', text: 'rabbit', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'wb-2', text: 'red', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'wb-3', text: 'run', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'wb-4', text: 'rain', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'wb-5', text: 'rice', sound: '/r/', position: 'Initial', language: 'English' },
  { id: 'wb-6', text: 'rock', sound: '/r/', position: 'Initial', language: 'English' },
];

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
  peachCardBg: isDark ? '#082F49' : '#FFF7ED',
  peachCardBorder: isDark ? '#0284C7' : '#FED7AA',
  peachPillBg: isDark ? '#0C4A6E' : '#FFEDD5',
  peachPillText: isDark ? '#38BDF8' : '#C2410C',
  peachText: isDark ? '#38BDF8' : '#C2410C',
  peachAccent: isDark ? '#38BDF8' : '#EA580C',
  yellowCardBg: isDark ? '#082F49' : '#FFFBEB',
  yellowCardBorder: isDark ? '#0369A1' : '#FEF3C7',
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

export default function TeacherDashboardScreen() {
  const { width } = useWindowDimensions();
  const wide = width > 430;
  const columnWidth = Math.min(width, 430);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  // --- Main Navigation Tabs ---
  const learningAssignments = useLearningAssignments();
  const teacherSubmissions = learningAssignments.flatMap((item) => {
    if (item.source !== 'Teacher' || !item.submittedAt) return [];
    return [{
      id: item.id,
      name: item.studentName,
      initials: item.studentName.split(' ').map((part) => part[0]).slice(0, 2).join(''),
      phrase: item.title,
      time: new Date(item.submittedAt).toLocaleDateString(),
    }];
  });
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'activities' | 'reviews'>('home');
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
  const [editingProfile, setEditingProfile] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Therapist / Teacher Profile Data
  const [therapistProfile, setTherapistProfile] = useState({
    name: 'Dr. Ameer Andres',
    credentials: 'SLP-CCC',
    fullName: 'Dr. Ameer Andres, SLP-CCC',
    title: 'Speech-Language Pathologist',
    license: 'PRC #0048291',
    clinic: CENTER_NAME,
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
  const [themeMode, setThemeMode] = useState<'Light' | 'Dark'>('Light');
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; device: string } | null>(null);
  const [sessionNotice, setSessionNotice] = useState('');
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', device: 'Redmi 15', isCurrent: true, location: 'Quezon City', lastActive: 'Active now' },
    { id: '2', device: 'Samsung Galaxy Tab S9 FE', isCurrent: false, location: 'Android App', lastActive: 'Yesterday' },
    { id: '3', device: 'Samsung Galaxy S24', isCurrent: false, location: 'Chrome', lastActive: 'Nov 10' },
  ]);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');
  const [profileOpenedFromSettings, setProfileOpenedFromSettings] = useState(false);

  // --- Dynamic Color Theme Resolution (Functional Light & Dark) ---
  const isDark = themeMode === 'Dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Patients Tab State ---
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSoapForm, setShowSoapForm] = useState(false);
  const [soapNotes, setSoapNotes] = useState<SoapNote[]>([]);
  const [soapInputs, setSoapInputs] = useState({ s: '', o: '', a: '', p: '' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Activities Sub-View State ---
  const [activitiesView, setActivitiesView] = useState<'library' | 'preview' | 'edit' | 'assign' | 'wordbank'>('library');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<ActivityItem['category'][]>([]);
  const [activitySearch, setActivitySearch] = useState('');
  const [showActivityFilterPanel, setShowActivityFilterPanel] = useState(false);
  const [activitySortBy, setActivitySortBy] = useState<'default' | 'title-asc' | 'title-desc' | 'sound'>('default');
  const [activitySoundFilter, setActivitySoundFilter] = useState<string[]>([]);
  const [activityLanguageFilter, setActivityLanguageFilter] = useState<string>('ALL');

  const isActivityFilterActive =
    showActivityFilterPanel ||
    activitySortBy !== 'default' ||
    activitySoundFilter.length > 0 ||
    activityLanguageFilter !== 'ALL' ||
    activityCategoryFilter.length > 0;
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [currentActivity, setCurrentActivity] = useState<ActivityItem>(INITIAL_ACTIVITIES[0]);

  // --- Word Bank Tab State ---
  const [wordBankEntries, setWordBankEntries] = useState<WordBankEntry[]>(INITIAL_WORD_BANK_ENTRIES);
  const [wordBankQuery, setWordBankQuery] = useState('');
  const [wordBankFiltersOpen, setWordBankFiltersOpen] = useState(false);
  const [wordBankAdding, setWordBankAdding] = useState(false);
  const [wordBankEditing, setWordBankEditing] = useState(false);
  const [wordBankFilterSounds, setWordBankFilterSounds] = useState<string[]>([]);
  const [wordBankFilterPositions, setWordBankFilterPositions] = useState<('Initial' | 'Medial' | 'Final')[]>([]);
  const [wordBankFilterLanguages, setWordBankFilterLanguages] = useState<string[]>([]);
  const [newWordText, setNewWordText] = useState('');
  const [newWordSound, setNewWordSound] = useState('/r/');
  const [newWordPosition, setNewWordPosition] = useState<'Initial' | 'Medial' | 'Final'>('Initial');
  const [newWordLanguage, setNewWordLanguage] = useState('English');

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

  const handleAddWordBankEntry = () => {
    const trimmed = newWordText.trim().toLowerCase();
    if (!trimmed) {
      triggerToast('Please enter a target word.');
      return;
    }
    const exists = wordBankEntries.some((w) => w.text.toLowerCase() === trimmed);
    if (exists) {
      triggerToast(`"${trimmed}" is already in the word bank.`);
      return;
    }
    const newEntry: WordBankEntry = {
      id: `wb-${Date.now()}`,
      text: trimmed,
      sound: newWordSound,
      position: newWordPosition,
      language: newWordLanguage,
    };
    setWordBankEntries((prev) => [newEntry, ...prev]);
    setNewWordText('');
    setWordBankAdding(false);
    triggerToast(`Added "${trimmed}" to Word Bank.`);
  };

  const handleRemoveWordBankEntry = (id: string) => {
    setWordBankEntries((prev) => prev.filter((item) => item.id !== id));
    triggerToast('Word removed from Word Bank.');
  };

  // --- Edit Activity Wizard State (3 Steps) ---
  const [editStep, setEditStep] = useState<1 | 2 | 3>(1);
  const [editTitle, setEditTitle] = useState('Sunny Sounds');
  const [editTargetSound, setEditTargetSound] = useState('/s/');
  const [editPracticeLevel, setEditPracticeLevel] = useState('Words');
  const [editPositions, setEditPositions] = useState<string[]>(['Initial']);
  const [editLanguage, setEditLanguage] = useState<'English' | 'Tagalog'>('English');
  const [editInstructions, setEditInstructions] = useState('Listen to the model. Say each target slowly, then try it on your own.');
  const [editArticulatoryGuide, setEditArticulatoryGuide] = useState('Place tongue behind front teeth, blow gentle air.');

  // Step 2 Content State
  const [wordOrigin, setWordOrigin] = useState<'wordBank' | 'custom'>('wordBank');
  const [wordBankPositionTab, setWordBankPositionTab] = useState<'Initial' | 'Medial' | 'Final'>('Initial');
  const [wordBankSearch, setWordBankSearch] = useState('');
  const [checkedWords, setCheckedWords] = useState<string[]>(['sun', 'sand', 'soup']);
  const [wordPhrases, setWordPhrases] = useState<{ [key: string]: string }>({
    sun: 'Warm sunny day.',
    sand: 'Sand on the beach.',
    soup: 'Hot soup is good.',
  });

  const handleBeginEditActivity = (act: ActivityItem) => {
    setEditStep(1);
    setEditTitle(act.title);
    setEditTargetSound(act.targetSound || act.sound);
    setEditPracticeLevel(act.practiceLevel || act.category);
    setEditPositions(act.wordPositions || ['Initial']);
    setEditLanguage(act.language || 'English');
    setEditInstructions(act.instructions || '');
    setEditArticulatoryGuide(act.articulatoryGuide || '');
    setCheckedWords(act.initialWords || []);
    const pMap: Record<string, string> = {};
    if (act.initialWords && act.phrases) {
      act.initialWords.forEach((w, idx) => {
        pMap[w] = act.phrases[idx] || '';
      });
    }
    setWordPhrases(pMap);
    setActivitiesView('edit');
  };

  const handleBeginNewActivity = () => {
    setEditStep(1);
    setEditTitle('');
    setEditTargetSound('/s/');
    setEditPracticeLevel('Words');
    setEditPositions(['Initial']);
    setEditLanguage('English');
    setEditInstructions('Listen to the model. Say each target slowly, then try it on your own.');
    setEditArticulatoryGuide('');
    setCheckedWords([]);
    setWordPhrases({});
    setActivitiesView('edit');
  };

  const handleSaveEditedActivity = () => {
    const updatedPhrases = checkedWords.map((w) => wordPhrases[w] || '');
    const updatedCategory = (['Words', 'Phrases', 'Syllables', 'Sound', 'Sentences'].includes(editPracticeLevel)
      ? editPracticeLevel
      : 'Words') as ActivityItem['category'];

    const updatedItem: ActivityItem = {
      ...currentActivity,
      title: editTitle.trim() || currentActivity.title,
      targetSound: editTargetSound,
      sound: editTargetSound,
      practiceLevel: editPracticeLevel,
      category: updatedCategory,
      wordPositions: editPositions,
      language: editLanguage,
      instructions: editInstructions,
      articulatoryGuide: editArticulatoryGuide,
      initialWords: checkedWords.length > 0 ? checkedWords : currentActivity.initialWords,
      phrases: updatedPhrases.length > 0 ? updatedPhrases : currentActivity.phrases,
    };

    setActivitiesList((prev) =>
      prev.map((act) => (act.id === currentActivity.id ? updatedItem : act))
    );
    setCurrentActivity(updatedItem);
    setActivitiesView('library');
    triggerToast('Activity saved successfully!');
  };

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
  const [assignActivityId, setAssignActivityId] = useState('ready-set-r');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('Listen to the model. Say each target slowly, then try it on your own.');
  const [assignPreviewExpanded, setAssignPreviewExpanded] = useState(false);

  // Target Sound & Practice Level Dropdowns
  const [showTargetSoundDropdown, setShowTargetSoundDropdown] = useState(false);
  const [showPracticeLevelDropdown, setShowPracticeLevelDropdown] = useState(false);
  const [playingStudentId, setPlayingStudentId] = useState<string | null>(null);
  const [playingAccId, setPlayingAccId] = useState<string | null>(null);

  // Multi-select Assign state
  const [assignSelectedStudents, setAssignSelectedStudents] = useState<string[]>([]);
  const [showAssignStudentDropdown, setShowAssignStudentDropdown] = useState(false);
  const [showAssignActivityDropdown, setShowAssignActivityDropdown] = useState(false);

  // Student list filter state
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [showStudentFilterDropdown, setShowStudentFilterDropdown] = useState(false);

  // --- Reviews Tab State (Image 2) ---
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [reviewsFilter, setReviewsFilter] = useState<'All' | 'Pending' | 'Reviewed'>('All');
  const [reviewActivities, setReviewActivities] = useState<string[]>([]);
  const [reviewStudents, setReviewStudents] = useState<string[]>([]);
  const [reviewLanguage, setReviewLanguage] = useState<string[]>([]);
  const [reviewLevels, setReviewLevels] = useState<string[]>([]);
  const [reviewStudentSort, setReviewStudentSort] = useState<'A–Z' | 'Z–A'>('A–Z');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewEvaluation, setReviewEvaluation] = useState<'Correct' | 'Approximate' | 'Incorrect' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Dynamic Pending count
  const pendingReviewsCount = reviewsList.filter((r) => r.status === 'Pending').length;

  // Filtered Students
  const filteredPatients = INITIAL_PATIENTS.filter((p) => {
    const matchesTarget =
      studentFilter === 'ALL' ||
      p.targetDescription.toLowerCase().includes(studentFilter.toLowerCase().replace(/\//g, ''));
    const matchesSearch =
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.targetDescription.toLowerCase().includes(patientSearch.toLowerCase());
    return matchesTarget && matchesSearch;
  });

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    let list = activitiesList.filter((act) => {
      const matchesCategory =
        activityCategoryFilter.length === 0 || activityCategoryFilter.includes(act.category);
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
    activitiesList,
    activityCategoryFilter,
    activitySearch,
    activitySoundFilter,
    activityLanguageFilter,
    activitySortBy,
  ]);

  // Filtered Reviews
  const reviewCatalog = new Map(activitiesList.map((item) => [item.title, item]));
  const reviewActivityOptions = [...new Set([...reviewCatalog.keys(), ...reviewsList.map((review) => review.activityTitle)])].sort();
  const reviewStudentOptions = [...new Set([...INITIAL_PATIENTS.map((student) => student.name), ...reviewsList.map((review) => review.studentName)])]
    .sort((first, second) => reviewStudentSort === 'A–Z' ? first.localeCompare(second) : second.localeCompare(first));
  const reviewActivityCaptions = new Map(activitiesList.map((item) => [item.title, item.language + ' · ' + item.category]));
  const filteredReviews = reviewsList.filter((review) =>
    (reviewsFilter === 'All' || review.status === reviewsFilter) &&
    (!reviewActivities.length || reviewActivities.includes(review.activityTitle)) &&
    (!reviewStudents.length || reviewStudents.includes(review.studentName)) &&
    (!reviewLevels.length || reviewLevels.some((level) => level === reviewCatalog.get(review.activityTitle)?.category)) &&
    matchesPracticeLanguage(reviewCatalog.get(review.activityTitle)?.language, reviewLanguage[0]),
  ).sort((first, second) => reviewStudentSort === 'A–Z'
    ? first.studentName.localeCompare(second.studentName) : second.studentName.localeCompare(first.studentName));

  const studentPages = useListPagination(filteredPatients.length, 10, JSON.stringify([studentFilter, patientSearch]));
  const activityPages = useListPagination(filteredActivities.length, 10, JSON.stringify([activityCategoryFilter, activitySortBy, activitySoundFilter, activityLanguageFilter, activitySearch]));
  const wordPages = useListPagination(filteredWordBank.length, 10, JSON.stringify([wordBankQuery, wordBankFilterSounds, wordBankFilterPositions, wordBankFilterLanguages]));
  const reviewPages = useListPagination(filteredReviews.length, 10, JSON.stringify([reviewsFilter, reviewActivities, reviewStudents, reviewLanguage, reviewLevels, reviewStudentSort]));

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Assign Multi-Select Helpers & Handler
  const studentOptions = INITIAL_PATIENTS;
  const assignmentStudents = studentOptions.filter(({ id }) => assignSelectedStudents.includes(id));
  const selectedAssignActivity = activitiesList.find((item) => item.id === assignActivityId);
  const allStudentsSelected =
    studentOptions.length > 0 && assignmentStudents.length === studentOptions.length;
  const studentDropdownSummary =
    assignmentStudents.length === 0
      ? 'Select student(s)...'
      : allStudentsSelected
      ? `All Students (${studentOptions.length})`
      : assignmentStudents.length === 1
      ? assignmentStudents[0].name
      : `${assignmentStudents.length} Students Selected`;

  const openAssignment = (activity?: ActivityItem) => {
    setAssignActivityId(activity?.id ?? '');
    setAssignInstructions(activity?.instructions ?? '');
    setAssignSelectedStudents([]);
    setAssignDueDate('');
    setAssignPreviewExpanded(false);
    setActiveTab('activities');
    setActivitiesView('assign');
  };

  const handleAssignActivity = () => {
    try {
      if (assignmentStudents.length === 0) {
        triggerToast('Please select at least one student.');
        return;
      }
      if (!isAssignmentDate(assignDueDate)) {
        triggerToast('Enter a valid due date today or later (mm/dd/yyyy).');
        return;
      }
      if (!assignInstructions.trim()) {
        triggerToast('Please provide activity instructions.');
        return;
      }
      const activity = selectedAssignActivity;
      if (!activity) {
        triggerToast('Select an activity before assigning it.');
        return;
      }
      for (const student of assignmentStudents) {
        assignLearningActivity({
          source: 'Teacher', activityId: activity.id, studentId: student.id, studentName: student.name,
          title: activity.title, level: activity.category, dueDate: assignDueDate,
          language: activity.language,
          instructions: assignInstructions.trim(), assignedBy: therapistProfile.name,
          prompts: getTeacherActivityPrompts(activity),
          guidance: activity.articulatoryGuide,
        });
      }
      setActivitiesView('library');
      const msg =
        assignmentStudents.length === 1
          ? `Activity assigned to ${assignmentStudents[0].name}`
          : `Activity assigned to ${assignmentStudents.length} students`;
      triggerToast(msg);
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to assign activity.');
    }
  };

  // SOAP Save
  const handleSaveSoapNote = () => {
    try {
      if (!soapInputs.s.trim() && !soapInputs.o.trim() && !soapInputs.a.trim() && !soapInputs.p.trim()) {
        triggerToast('Please fill in at least one SOAP note field before saving.');
        return;
      }
      const newNote: SoapNote = {
        sessionNumber: soapNotes.length + 1,
        date: 'Oct 24, 2026',
        s: soapInputs.s.trim() || 'Khyll was engaged. Parent reports 6 days of home practice.',
        o: soapInputs.o.trim() || 'Initial /r/ in isolated syllables 15/20 correct (75%).',
        a: soapInputs.a.trim() || 'Tongue tip elevation improving with visual lip cue.',
        p: soapInputs.p.trim() || 'Continue initial /r/ monosyllabic words next session.',
      };
      setSoapNotes([newNote, ...soapNotes]);
      setSoapInputs({ s: '', o: '', a: '', p: '' });
      setShowSoapForm(false);
      triggerToast('SOAP Note added successfully!');
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to save SOAP note.');
    }
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
    try {
      const trimmed = newCustomWordInput.trim();
      if (!trimmed) {
        triggerToast('Please enter a target word.');
        return;
      }
      if (!/^[a-zA-Z\s-]+$/.test(trimmed)) {
        triggerToast('Word should only contain letters and hyphens (no numbers).');
        return;
      }
      if (customWords.map((w) => w.toLowerCase()).includes(trimmed.toLowerCase())) {
        triggerToast(`"${trimmed}" is already added.`);
        return;
      }
      setCustomWords([...customWords, trimmed]);
      setNewCustomWordInput('');
      triggerToast(`Added "${trimmed}" to custom words.`);
    } catch (err: any) {
      triggerToast(err?.message || 'Error adding custom word.');
    }
  };

  // Add Custom Phrase
  const handleAddCustomPhrase = () => {
    try {
      const trimmed = newPhraseInput.trim();
      if (!trimmed) {
        triggerToast('Please enter a custom phrase.');
        return;
      }
      setCustomPhrases([...customPhrases, trimmed]);
      setNewPhraseInput('');
      triggerToast('Phrase added.');
    } catch (err: any) {
      triggerToast(err?.message || 'Error adding custom phrase.');
    }
  };

  // Submit Review Action
  const handleSubmitReview = (item: ReviewItem) => {
    try {
      if (!reviewEvaluation) {
        triggerToast('Please select a clinical accuracy rating (Correct, Approximate, or Needs Practice).');
        return;
      }
      setReviewsList(
        reviewsList.map((r) => (r.id === item.id ? { ...r, status: 'Reviewed' as const } : r))
      );
      setSelectedReview(null);
      setReviewEvaluation(null);
      setReviewNotes('');
      triggerToast(`Review submitted for ${item.studentName}!`);
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to submit review.');
    }
  };

  // --- Profile, Settings & Logout Handlers ---
  const openProfile = () => {
    setEditProfileForm({ ...therapistProfile });
    setEditingProfile(false);
    setShowProfileModal(true);
  };

  const startProfileEditing = () => {
    setEditProfileForm({ ...therapistProfile });
    setEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile) return;
    try {
      if (!editProfileForm.name.trim()) {
        triggerToast('Name is required. Please fill in this field.');
        return;
      }
      if (!/^[a-zA-Z\s.'-]+$/.test(editProfileForm.name.trim())) {
        triggerToast('Name should only contain letters and spaces (no numbers).');
        return;
      }
      if (!editProfileForm.contact.trim()) {
        triggerToast('Contact number is required. Please fill in this field.');
        return;
      }
      const cleanContact = editProfileForm.contact.replace(/\D/g, '');
      if (cleanContact.length < 10 || cleanContact.length > 12) {
        triggerToast('Contact number must follow the correct format (10-12 digits).');
        return;
      }
      // License and clinic/school are permanently locked from edits
      setTherapistProfile((prev) => ({
        ...prev,
        name: editProfileForm.name.trim(),
        title: editProfileForm.title.trim(),
        contact: editProfileForm.contact.trim(),
        specializations: editProfileForm.specializations,
        photoUri: editProfileForm.photoUri,
      }));
      setShowProfileModal(false);
      triggerToast('Credentials saved successfully!');
      if (profileOpenedFromSettings) {
        setShowSettingsModal(true);
        setProfileOpenedFromSettings(false);
      }
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to save profile.');
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
    setSessionNotice('Session revoked successfully.');
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

  const handleChangePassword = () => {
    try {
      if (!currentPassword) {
        triggerToast('Current password is required. Please fill in this field.');
        return;
      }
      if (!newPassword) {
        triggerToast('New password is required. Please fill in this field.');
        return;
      }
      if (newPassword.length < 8) {
        triggerToast('New password must be at least 8 characters long.');
        return;
      }
      if (!confirmPassword) {
        triggerToast('Confirm password is required. Please fill in this field.');
        return;
      }
      if (newPassword !== confirmPassword) {
        triggerToast('New passwords do not match. Please try again.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
      triggerToast('Password changed successfully!');
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to change password.');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setShowMenu(false);
    setShowSettingsModal(false);
    triggerToast('Logged out successfully.');
    if (router.canDismiss()) {
      router.dismissAll();
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    triggerToast('All notifications marked as read.');
  };

  if (!fontsLoaded) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: wide ? '#F1F5F9' : colors.bg,
        alignItems: 'center',
        width: '100%',
        minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 430,
          backgroundColor: colors.bg,
          position: 'relative',
          ...(Platform.OS === 'web' && wide
            ? {
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
                minHeight: '100vh' as any,
              }
            : {}),
        }}
      >
        <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.bg }]}>

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
            accessibilityRole="button"
            accessibilityLabel="Open menu"
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
              <Text style={[styles.dateText, { color: colors.textSub }]}>Friday, October 29</Text>
              <Text style={[styles.greetingTitle, { color: colors.heading }]}>Good morning, Dr. Andres</Text>
              <Text style={[styles.greetingSubtitle, { color: colors.textSub }]}>Here's what needs your attention today.</Text>

              {/* Assign Activity Quick Button -> Switches to Assign Screen */}
              <TouchableOpacity
                style={[styles.assignButton, { backgroundColor: colors.primaryLight }]}
                activeOpacity={0.8}
                onPress={() => {
                  openAssignment(activitiesList.find((item) => item.id === 'ready-set-r') ?? activitiesList[0]);
                }}
              >
                <UserCheck size={18} color="#0F766E" style={{ marginRight: 6 }} />
                <Text style={styles.assignButtonText}>Assign Activity</Text>
              </TouchableOpacity>
            </View>

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
                  <Text style={[styles.statNumber, { color: isDark ? '#38BDF8' : '#F97316' }]}>3</Text>
                  <View style={[styles.statBadge, { backgroundColor: colors.peachPillBg }]}>
                    <Text style={[styles.statBadgeText, { color: colors.peachPillText }]}>Alert</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Require Follow-up</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statCardTop}>
                  <Text style={[styles.statNumber, { color: '#0EA5E9' }]}>7</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#BAE6FD' }]}>
                    <Text style={[styles.statBadgeText, { color: '#0369A1' }]}>Today</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Submissions Received</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statCardTop}>
                  <Text style={[styles.statNumber, { color: '#F59E0B' }]}>14</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statBadgeText, { color: '#B45309' }]}>Active</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.text }]}>Overdue / Active Task</Text>
              </View>
            </View>

            {/* Student Progress Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Progress</Text>
              <TouchableOpacity onPress={() => setActiveTab('patients')}>
                <Text style={[styles.viewAllText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.patientListContainer}>
              {INITIAL_PATIENTS.map((item) => (
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
                      {(() => {
                        const badgeTheme = getStudentBadgeTheme(item, isDark);
                        return (
                          <View style={[styles.percentBadge, { backgroundColor: badgeTheme.bg }]}>
                            <Text style={[styles.percentText, { color: badgeTheme.color }]}>
                              {item.accuracy}%
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>{item.targetDescription}</Text>
                    <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${item.accuracy}%`, backgroundColor: item.progressColor },
                        ]}
                      />
                    </View>
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
              {[...teacherSubmissions, ...INITIAL_SUBMISSIONS].map((sub) => (
                <View key={sub.id} style={[styles.submissionItem, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
                  <View style={[styles.patientAvatarSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.avatarTextSmall, { color: colors.text }]}>{sub.initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.subPatientName, { color: colors.text }]}>{sub.name}</Text>
                    <Text style={[styles.subDetails, { color: colors.textSub }]}>
                      {sub.phrase} • {sub.time}
                    </Text>
                    {'progress' in sub && typeof sub.progress === 'number' ? <View style={[styles.subProgressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.subProgressFill, { width: `${sub.progress * 100}%` }]} />
                    </View> : <Text style={styles.subDetails}>Practice submitted</Text>}
                  </View>
                  {'progress' in sub && typeof sub.progress === 'number' ? <TouchableOpacity
                    style={styles.reviewButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      const match = reviewsList.find((r) => r.studentName === sub.name && r.activityTitle === sub.phrase);
                      if (!match) { triggerToast('No matching review is available.'); return; }
                      setSelectedReview(match);
                    }}
                  >
                    <Text style={styles.reviewButtonText}>Review</Text>
                  </TouchableOpacity> : null}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ----------------------------------------------------
            TAB 2: STUDENTS LIST
           ---------------------------------------------------- */}
        {activeTab === 'patients' && (
          <View style={styles.patientsTabContainer}>
            <Text style={[styles.pageTitle, { color: colors.heading }]}>Students</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSub }]}>Track development and review progress</Text>

            <View style={styles.searchFilterRow}>
              <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }]}>
                <Search size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.inputText, flex: 1 }]}
                  placeholder="Search by name, targets..."
                  placeholderTextColor={colors.textMuted}
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                />
              </View>
              <TouchableOpacity
                style={[styles.filterDropdown, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowStudentFilterDropdown(true)}
              >
                <Text style={[styles.filterText, { color: colors.textSub, marginRight: 4 }]}>
                  {studentFilter === 'ALL' ? 'ALL' : studentFilter}
                </Text>
                <ChevronDown size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {filteredPatients.slice(studentPages.start, studentPages.end).map((item) => {
              return (
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
                      {(() => {
                        const badgeTheme = getStudentBadgeTheme(item, isDark);
                        return (
                          <View style={[styles.percentBadge, { backgroundColor: badgeTheme.bg }]}>
                            <Text style={[styles.percentText, { color: badgeTheme.color }]}>
                              {item.accuracy}%
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    <Text style={[styles.patientSubtitle, { color: colors.textSub }]}>{item.targetDescription}</Text>
                    <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${item.accuracy}%`, backgroundColor: item.progressColor },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            <ListPagination {...studentPages} total={filteredPatients.length} noun="students" accent="#0865AD" muted={colors.textMuted} border={colors.border} surface={colors.card} />
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
                <Text style={styles.pageTitle}>The activity library.</Text>
                <Text style={styles.pageSubtitle}>Build the small steps that make a big difference.</Text>

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
                    style={styles.createTaskButton}
                    activeOpacity={0.8}
                    onPress={handleBeginNewActivity}
                  >
                    <Plus size={15} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 5 }} />
                    <Text style={styles.createTaskButtonText} numberOfLines={1}>Create a Task</Text>
                  </TouchableOpacity>
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
                              setActivityCategoryFilter([]);
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

                    <Text style={[styles.activityFilterSectionHeading, { marginTop: 10 }]}>Activity type</Text>
                    <View style={styles.activityFilterPillsRow}>
                      <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: activityCategoryFilter.length === 0 }}
                        style={[styles.activityFilterPill, activityCategoryFilter.length === 0 && styles.activityFilterPillActive]} onPress={() => setActivityCategoryFilter([])}>
                        <Text style={[styles.activityFilterPillText, activityCategoryFilter.length === 0 && styles.activityFilterPillTextActive]}>All types</Text>
                      </TouchableOpacity>
                      {practiceLevels.map((level) => {
                        const selected = activityCategoryFilter.includes(level);
                        return (
                          <TouchableOpacity key={level} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}
                            style={[styles.activityFilterPill, selected && styles.activityFilterPillActive]}
                            onPress={() => setActivityCategoryFilter((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level])}>
                            <Text style={[styles.activityFilterPillText, selected && styles.activityFilterPillTextActive]}>{level}</Text>
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

                {/* 2-Column Activity Cards Grid */}
                <View style={styles.activityGrid}>
                  {filteredActivities.slice(activityPages.start, activityPages.end).map((act) => {
                    const soundTheme = getActivitySoundColors(act, isDark);
                    return (
                      <TouchableOpacity
                        key={act.id}
                        style={styles.activityGridCard}
                        activeOpacity={0.8}
                        onPress={() => {
                          setCurrentActivity(act);
                          setActivitiesView('preview');
                        }}
                      >
                        <View style={[styles.activitySoundHeader, { backgroundColor: soundTheme.bg }]}>
                          <Text style={[styles.activitySoundText, { color: soundTheme.color }]}>
                            {act.sound}
                          </Text>
                          <View style={styles.soundWavesSmall}>
                            {[10, 16, 8, 20, 14, 18, 12].map((h, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.waveLine,
                                  {
                                    height: h,
                                    backgroundColor: soundTheme.color,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                        </View>

                        <View style={styles.activityCardBody}>
                          <Text style={[styles.activityCategoryTag, { color: soundTheme.categoryColor }]}>
                            {act.category}
                          </Text>
                          <Text style={styles.activityCardTitle}>{act.title}</Text>
                          <Text style={styles.activityCardSub}>{act.subtitle}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Text style={styles.viewActivityLink}>View activity</Text>
                            <ChevronRight size={13} color={isDark ? '#38BDF8' : '#0284C7'} style={{ marginLeft: 2 }} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                  <ListPagination {...activityPages} total={filteredActivities.length} noun="activities" accent="#0865AD" muted={colors.textMuted} border={colors.border} surface={colors.card} />
              </View>
            )}

            {/* VIEW 2: ACTIVITY PREVIEW */}
            {activitiesView === 'preview' && (() => {
              const currentSoundTheme = getActivitySoundColors(currentActivity, isDark);
              return (
                <View style={styles.previewContainer}>
                  {/* Hero Activity Card */}
                  <View style={[styles.heroActivityCard, { borderColor: isDark ? currentSoundTheme.bg : colors.border }]}>
                    <View style={styles.heroActivityTopRow}>
                      <View
                        style={[
                          styles.heroSoundBadgePeach,
                          {
                            backgroundColor: currentSoundTheme.bg,
                            borderColor: isDark ? currentSoundTheme.color : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.heroSoundBadgeText, { color: currentSoundTheme.color }]}>
                          {currentActivity.sound}
                        </Text>
                        <Text style={[styles.heroSoundWaveText, { color: currentSoundTheme.color }]}>≋</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={styles.heroTagsRow}>
                          <View
                            style={[
                              styles.heroLevelBadge,
                              { backgroundColor: currentSoundTheme.bg, borderColor: currentSoundTheme.color },
                            ]}
                          >
                            <Text
                              style={[
                                styles.heroLevelBadgeText,
                                { color: currentSoundTheme.color, fontWeight: '700' },
                              ]}
                            >
                              {currentActivity.category || 'Words'}
                            </Text>
                          </View>
                          <View style={styles.heroLanguageBadge}>
                            <Text style={styles.heroLanguageBadgeText}>{currentActivity.language}</Text>
                          </View>
                        </View>
                        <Text style={styles.heroActivityTitle}>{currentActivity.title}</Text>
                      </View>
                    </View>

                    <View style={styles.heroCardDivider} />

                    {/* 3-Column Stats Row */}
                    <View style={styles.heroMetaRow}>
                      <View style={styles.heroMetaItem}>
                        <Text style={styles.heroMetaLabel}>Position</Text>
                        <Text style={styles.heroMetaValue}>
                          {currentActivity.wordPositions?.[0] || 'Initial'}
                        </Text>
                      </View>
                      <View style={styles.heroMetaDivider} />
                      <View style={styles.heroMetaItem}>
                        <Text style={styles.heroMetaLabel}>Sound Target</Text>
                        <Text style={[styles.heroMetaValue, { color: currentSoundTheme.color }]}>
                          {currentActivity.sound}
                        </Text>
                      </View>
                      <View style={styles.heroMetaDivider} />
                      <View style={styles.heroMetaItem}>
                        <Text style={styles.heroMetaLabel}>Word Targets</Text>
                        <Text style={styles.heroMetaValue}>{currentActivity.initialWords.length} words</Text>
                      </View>
                    </View>
                  </View>

                  {/* Instructions Card */}
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={styles.infoIconWrap}>
                        <BookOpen size={16} color="#0284C7" />
                      </View>
                      <Text style={styles.infoCardTitle}>Instructions</Text>
                    </View>
                    <Text style={styles.infoCardBody}>{currentActivity.instructions}</Text>
                  </View>

                  {/* Articulatory Guide Card */}
                  <View style={styles.guideCardPeach}>
                    <View style={styles.infoCardHeader}>
                      <View style={styles.infoIconWrapPeach}>
                        <Sparkles size={16} color={colors.peachAccent} />
                      </View>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.infoCardTitle, { color: colors.peachText }]}>Articulatory Guide</Text>
                        <View style={styles.guideBadge}>
                          <Text style={styles.guideBadgeText}>Therapist guidance</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.infoCardBody, { color: colors.peachText }]}>{currentActivity.articulatoryGuide}</Text>
                  </View>

                  {/* Practice Content Card */}
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={styles.infoIconWrap}>
                        <Layers size={16} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.infoCardTitle}>Practice Content</Text>
                        <View style={[styles.guideBadge, { backgroundColor: currentSoundTheme.bg }]}>
                          <Text style={[styles.guideBadgeText, { color: currentSoundTheme.color, fontWeight: '700' }]}>
                            {currentActivity.initialWords.length} targets
                          </Text>
                        </View>
                      </View>
                    </View>

                    {(['Initial', 'Medial', 'Final', undefined] as const).map((position) => {
                      const prompts = getTeacherActivityPrompts(currentActivity).filter((prompt) => prompt.position === position);
                      if (!prompts.length) return null;
                      return (
                        <View key={position ?? 'prompts'} style={styles.posBlockCard}>
                          <Text style={styles.posBlockCountText}>{position ?? 'Practice prompts'}</Text>
                          {prompts.map((prompt, index) => (
                            <Text key={index} style={[styles.infoCardBody, { color: colors.text }]}>{prompt.text}</Text>
                          ))}
                        </View>
                      );
                    })}

                    {/* Medial Position (Subtle in-card summary) */}
                    <View style={styles.posBlockCardSubtle}>
                      <View style={styles.posBlockHead}>
                        <View style={styles.posBadgeSubtle}>
                          <Text style={styles.posBadgeSubtleText}>Medial</Text>
                        </View>
                        <Text style={styles.posBlockCountSubtle}>0 targets</Text>
                      </View>
                      <Text style={[styles.infoCardBody, { fontSize: 12, fontStyle: 'italic', color: colors.textMuted }]}>
                        No targets in this position yet.
                      </Text>
                    </View>

                    {/* Final Position (Subtle in-card summary) */}
                    <View style={styles.posBlockCardSubtle}>
                      <View style={styles.posBlockHead}>
                        <View style={styles.posBadgeSubtle}>
                          <Text style={styles.posBadgeSubtleText}>Final</Text>
                        </View>
                        <Text style={styles.posBlockCountSubtle}>0 targets</Text>
                      </View>
                      <Text style={[styles.infoCardBody, { fontSize: 12, fontStyle: 'italic', color: colors.textMuted }]}>
                        No targets in this position yet.
                      </Text>
                    </View>
                  </View>

                  {/* Audio Pronunciation Model Card */}
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={styles.infoIconWrap}>
                        <Volume2 size={16} color="#0284C7" />
                      </View>
                      <Text style={styles.infoCardTitle}>Audio Pronunciation Model</Text>
                    </View>
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
                  </View>

                  {/* Visual Material Card */}
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={styles.infoIconWrap}>
                        <Video size={16} color="#0284C7" />
                      </View>
                      <Text style={styles.infoCardTitle}>Visual Material</Text>
                    </View>
                    <View style={styles.mediaBox}>
                      <View style={styles.mediaIconWrap}>
                        <Play size={20} color="#0284C7" fill="#0284C7" style={{ marginLeft: 2 }} />
                      </View>
                      <Text style={styles.mediaTitle}>Articulation Video Cue</Text>
                      <Text style={styles.mediaSub}>Speech model video cue ready for playback</Text>
                    </View>
                  </View>

                  {/* Bottom Action Buttons */}
                  <View style={styles.previewActionsRow}>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => handleBeginEditActivity(currentActivity)}
                      activeOpacity={0.7}
                    >
                      <Pencil size={15} color={isDark ? '#38BDF8' : '#0284C7'} style={{ marginRight: 6 }} />
                      <Text style={styles.outlineBtnText}>Edit Activity</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.solidBlueBtn}
                      onPress={() => {
                        openAssignment(currentActivity);
                      }}
                      activeOpacity={0.7}
                    >
                      <Send size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.solidBlueBtnText}>Assign Activity</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            {/* VIEW 3: EDIT ACTIVITY (3-Step Wizard) */}
            {activitiesView === 'edit' && (
              <View style={styles.editWizardContainer}>
                {/* Stepper Header (Clean 3-Tab Line Progress) */}
                <View style={styles.stepperContainer}>
                  {[
                    { key: 1, label: 'Clinical focus' },
                    { key: 2, label: 'Activity content' },
                    { key: 3, label: 'Preview & save' },
                  ].map((step, idx) => {
                    const active = editStep === step.key;
                    const completed = editStep > step.key;
                    return (
                      <View key={step.key} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                          style={styles.stepperStepBtn}
                          onPress={() => setEditStep(step.key as 1 | 2 | 3)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.stepperBadge,
                              active && styles.stepperBadgeActive,
                              completed && styles.stepperBadgeCompleted,
                            ]}
                          >
                            {completed ? (
                              <Check size={12} color="#FFFFFF" strokeWidth={3} />
                            ) : (
                              <Text style={[styles.stepperBadgeNum, (active || completed) && { color: '#FFFFFF' }]}>
                                {step.key}
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.stepperLabelText,
                              active && styles.stepperLabelTextActive,
                              completed && { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {step.label}
                          </Text>
                        </TouchableOpacity>
                        {idx < 2 && (
                          <View
                            style={[
                              styles.stepperLine,
                              completed && { backgroundColor: '#0284C7' },
                            ]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Step 1: Clinical Focus */}
                {editStep === 1 && (
                  <View>
                    {/* Card 1: Core Clinical Target */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <View style={styles.infoIconWrap}>
                          <Sparkles size={16} color="#0284C7" />
                        </View>
                        <View>
                          <Text style={styles.infoCardTitle}>Clinical Target</Text>
                          <Text style={styles.infoCardSub}>Define target sound, position, level & language</Text>
                        </View>
                      </View>

                      <Text style={styles.formLabel}>Activity Title</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="e.g. Ready, set, /r/"
                        placeholderTextColor={colors.textMuted}
                      />

                      <View style={styles.formRowTwoCol}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.formLabel}>Target Sound</Text>
                          <TouchableOpacity
                            style={styles.dropdownSelector}
                            onPress={() => setShowTargetSoundDropdown(true)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownValue}>{editTargetSound}</Text>
                            <ChevronDown size={14} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.formLabel}>Practice Level</Text>
                          <TouchableOpacity
                            style={styles.dropdownSelector}
                            onPress={() => setShowPracticeLevelDropdown(true)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownValue}>{editPracticeLevel}</Text>
                            <ChevronDown size={14} color={colors.text} />
                          </TouchableOpacity>
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
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.posPillText, selected && styles.posPillTextSelected]}>
                                {pos}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={styles.formLabel}>Language</Text>
                      <View style={styles.langSegmentControl}>
                        <TouchableOpacity
                          style={[styles.langSegmentBtn, editLanguage === 'English' && styles.langSegmentBtnActive]}
                          onPress={() => setEditLanguage('English')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.langSegmentText, editLanguage === 'English' && styles.langSegmentTextActive]}>
                            English
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.langSegmentBtn, editLanguage === 'Tagalog' && styles.langSegmentBtnActive]}
                          onPress={() => setEditLanguage('Tagalog')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.langSegmentText, editLanguage === 'Tagalog' && styles.langSegmentTextActive]}>
                            Tagalog
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Card 2: Guidance & Instructions */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <View style={styles.infoIconWrapPeach}>
                          <BookOpen size={16} color={colors.peachAccent} />
                        </View>
                        <View>
                          <Text style={styles.infoCardTitle}>Instructions & Guidance</Text>
                          <Text style={styles.infoCardSub}>Student prompts and clinical articulatory tips</Text>
                        </View>
                      </View>

                      <Text style={styles.formLabel}>Instructions for Student/Facilitator</Text>
                      <TextInput
                        style={[styles.formInput, { height: 72, textAlignVertical: 'top', paddingTop: 8 }]}
                        multiline
                        value={editInstructions}
                        onChangeText={setEditInstructions}
                        placeholder="Listen to the model. Say each target slowly, then try it on your own."
                        placeholderTextColor={colors.textMuted}
                      />

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 }}>
                        <Text style={[styles.formLabel, { marginTop: 0, marginBottom: 0 }]}>Articulatory Guide</Text>
                        <View style={styles.guideBadge}>
                          <Text style={styles.guideBadgeText}>Teacher Guidance</Text>
                        </View>
                      </View>
                      <TextInput
                        style={[styles.formInput, { height: 72, textAlignVertical: 'top', paddingTop: 8 }]}
                        multiline
                        value={editArticulatoryGuide}
                        onChangeText={setEditArticulatoryGuide}
                        placeholder="Pull tongue tip back, lips slightly relaxed."
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    {/* Actions */}
                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        onPress={() => triggerToast('Draft saved successfully!')}
                        activeOpacity={0.7}
                      >
                        <FileText size={15} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={styles.outlineBtnText}>Save Draft</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.solidBlueBtn}
                        onPress={() => {
                          if (!editTitle.trim()) {
                            triggerToast('Please provide an activity title before continuing.');
                            return;
                          }
                          if (editPositions.length === 0) {
                            triggerToast('Please select at least one word position (Initial, Medial, or Final).');
                            return;
                          }
                          setEditStep(2);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.solidBlueBtnText}>Next Step</Text>
                        <ChevronRight size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Step 2: Activity Content */}
                {editStep === 2 && (
                  <View>
                    {/* Card 1: Content Source & Positions */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <View style={styles.infoIconWrap}>
                          <Layers size={16} color="#0284C7" />
                        </View>
                        <View>
                          <Text style={styles.infoCardTitle}>Word Origin & Target Counts</Text>
                          <Text style={styles.infoCardSub}>Select source and practice distribution</Text>
                        </View>
                      </View>

                      <View style={styles.wordOriginRadioRow}>
                        <TouchableOpacity
                          style={[styles.originCard, wordOrigin === 'wordBank' && styles.originCardActive]}
                          onPress={() => setWordOrigin('wordBank')}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.radioDot, wordOrigin === 'wordBank' && styles.radioDotActive]} />
                          <View style={{ marginLeft: 8 }}>
                            <Text style={styles.originTitle}>Word Bank</Text>
                            <Text style={{ fontSize: 11, color: colors.textSub }}>Pick from the library</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.originCard, wordOrigin === 'custom' && styles.originCardActive]}
                          onPress={() => setWordOrigin('custom')}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.radioDot, wordOrigin === 'custom' && styles.radioDotActive]} />
                          <View style={{ marginLeft: 8 }}>
                            <Text style={styles.originTitle}>Custom Word</Text>
                            <Text style={{ fontSize: 11, color: colors.textSub }}>Type your own</Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* 3 Position Boxes Side by Side */}
                      <View style={styles.posCountersRow}>
                        {(['Initial', 'Medial', 'Final'] as const).map((tab) => {
                          const isInitial = tab === 'Initial';
                          return (
                            <TouchableOpacity
                              key={tab}
                              style={[styles.posCounterBox, isInitial && styles.posCounterBoxActive]}
                              onPress={() => setWordBankPositionTab(tab)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.posCounterLabel, isInitial && { color: colors.peachText }]}>{tab}</Text>
                              <Text style={[styles.posCounterValue, isInitial && { color: colors.peachText }]}>
                                {isInitial ? `${checkedWords.length || 2}/5` : '0/5'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Card 2: Word Selection */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <View style={styles.infoIconWrap}>
                          <BookOpen size={16} color="#0284C7" />
                        </View>
                        <View>
                          <Text style={styles.infoCardTitle}>Word Selection</Text>
                          <Text style={styles.infoCardSub}>Check words to include in this practice</Text>
                        </View>
                      </View>

                      {/* Word Bank Sub-flow */}
                      {wordOrigin === 'wordBank' && (
                        <>
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
                            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                              {wordBankEntries.slice(0, 6).map((item) => {
                                const w = item.text;
                                const isChecked = checkedWords.includes(w);
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    style={styles.wordCheckItem}
                                    onPress={() => toggleWordCheck(w)}
                                    activeOpacity={0.7}
                                  >
                                    <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareActive]}>
                                      {isChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                                    </View>
                                    <Text style={styles.checkWordLabel}>{w}</Text>
                                    <View style={[styles.targetWordPosBadge, { marginLeft: 'auto' }]}>
                                      <Text style={styles.targetWordPosText}>{item.position || 'Initial'}</Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
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
                                  <X size={11} color={colors.peachText} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
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
                              placeholderTextColor={colors.textMuted}
                              value={newCustomWordInput}
                              onChangeText={setNewCustomWordInput}
                            />
                            <TouchableOpacity style={styles.addWordBtn} onPress={handleAddCustomWord} activeOpacity={0.7}>
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
                                  <X size={11} color={colors.peachText} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        </>
                      )}
                    </View>

                    {/* Card 3: Sentence & Phrase Modeling (for Phrases and Sentences levels) */}
                    {(editPracticeLevel === 'Phrases' || editPracticeLevel === 'Sentences') && (
                      <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                          <View style={styles.infoIconWrap}>
                            <Volume2 size={16} color="#0284C7" />
                          </View>
                          <View>
                            <Text style={styles.infoCardTitle}>
                              {editPracticeLevel === 'Sentences' ? 'Target Sentences Modeling' : 'Target Phrases Modeling'}
                            </Text>
                            <Text style={styles.infoCardSub}>Provide modeled phrase or sentence for each word</Text>
                          </View>
                        </View>

                        {(checkedWords.length > 0 ? checkedWords : ['rabbit', 'red', 'run']).map((w) => (
                          <View key={w} style={styles.targetWordPhraseCard}>
                            <View style={styles.targetWordPhraseHeader}>
                              <View style={styles.targetWordPill}>
                                <Volume2 size={12} color={colors.peachAccent} style={{ marginRight: 4 }} />
                                <Text style={styles.targetWordPillText}>{w}</Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => toggleWordCheck(w)}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Minus size={14} color={colors.textSub} />
                              </TouchableOpacity>
                            </View>
                            <TextInput
                              style={[styles.formInput, { marginBottom: 0 }]}
                              value={wordPhrases[w] || ''}
                              onChangeText={(txt) => setWordPhrases({ ...wordPhrases, [w]: txt })}
                              placeholder={`Enter ${editPracticeLevel.toLowerCase()} for "${w}"...`}
                              placeholderTextColor={colors.textMuted}
                            />
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Card 4: Media & Audio Materials */}
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardHeader}>
                        <View style={styles.infoIconWrap}>
                          <Video size={16} color="#0284C7" />
                        </View>
                        <View>
                          <Text style={styles.infoCardTitle}>Visual & Audio Materials</Text>
                          <Text style={styles.infoCardSub}>Upload videos and test audio model</Text>
                        </View>
                      </View>

                      <Text style={styles.formLabel}>Visual Material</Text>
                      <View style={styles.uploadDashedBox}>
                        <Upload size={22} color="#0284C7" style={{ marginBottom: 6 }} />
                        <Text style={styles.uploadMainText}>Upload or browse files here</Text>
                        <Text style={styles.uploadSubText}>MP4 or MOV, up to 20 MB per file</Text>
                      </View>

                      <Text style={[styles.formLabel, { marginTop: 14 }]}>Preview Audio Model</Text>
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
                    </View>

                    {/* Actions */}
                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.outlineBtn}
                        onPress={() => setEditStep(1)}
                        activeOpacity={0.7}
                      >
                        <ChevronLeft size={16} color={colors.text} style={{ marginRight: 4 }} />
                        <Text style={styles.outlineBtnText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.solidBlueBtn}
                        onPress={() => {
                          const totalWords = checkedWords.length + customWords.length;
                          if (totalWords === 0) {
                            triggerToast('Please select or add at least one practice word.');
                            return;
                          }
                          setEditStep(3);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.solidBlueBtnText}>Next: Preview</Text>
                        <ChevronRight size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Step 3: Preview & Save */}
                {editStep === 3 && (() => {
                  const previewSoundColors = getCategoryLevelColors(editPracticeLevel, isDark);
                  return (
                    <View style={styles.previewContainer}>
                      {/* Hero Activity Card */}
                      <View style={[styles.heroActivityCard, { borderColor: isDark ? previewSoundColors.bg : colors.border }]}>
                        <View style={styles.heroActivityTopRow}>
                          <View
                            style={[
                              styles.heroSoundBadgePeach,
                              {
                                backgroundColor: previewSoundColors.bg,
                                borderColor: isDark ? previewSoundColors.color : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.heroSoundBadgeText, { color: previewSoundColors.color }]}>
                              {editTargetSound}
                            </Text>
                            <Text style={[styles.heroSoundWaveText, { color: previewSoundColors.color }]}>≋</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <View style={styles.heroTagsRow}>
                              <View style={[styles.heroLevelBadge, { backgroundColor: previewSoundColors.bg, borderColor: previewSoundColors.color }]}>
                                <Text style={[styles.heroLevelBadgeText, { color: previewSoundColors.color, fontWeight: '700' }]}>
                                  {editPracticeLevel}
                                </Text>
                              </View>
                              <View style={styles.heroLanguageBadge}>
                                <Text style={styles.heroLanguageBadgeText}>{editLanguage}</Text>
                              </View>
                            </View>
                            <Text style={styles.heroActivityTitle}>{editTitle || currentActivity.title || 'Untitled Activity'}</Text>
                          </View>
                        </View>

                        <View style={styles.heroCardDivider} />

                        {/* 3-Column Stats Row */}
                        <View style={styles.heroMetaRow}>
                          <View style={styles.heroMetaItem}>
                            <Text style={styles.heroMetaLabel}>Position</Text>
                            <Text style={styles.heroMetaValue}>
                              {editPositions[0] || 'Initial'}
                            </Text>
                          </View>
                          <View style={styles.heroMetaDivider} />
                          <View style={styles.heroMetaItem}>
                            <Text style={styles.heroMetaLabel}>Sound Target</Text>
                            <Text style={[styles.heroMetaValue, { color: previewSoundColors.color }]}>
                              {editTargetSound}
                            </Text>
                          </View>
                          <View style={styles.heroMetaDivider} />
                          <View style={styles.heroMetaItem}>
                            <Text style={styles.heroMetaLabel}>Word Targets</Text>
                            <Text style={styles.heroMetaValue}>{checkedWords.length + customWords.length || 3} words</Text>
                          </View>
                        </View>
                      </View>

                      {/* Instructions Card */}
                      <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                          <View style={styles.infoIconWrap}>
                            <BookOpen size={16} color="#0284C7" />
                          </View>
                          <Text style={styles.infoCardTitle}>Instructions</Text>
                        </View>
                        <Text style={styles.infoCardBody}>
                          {editInstructions || 'Listen to the model. Say each target slowly, then try it on your own.'}
                        </Text>
                      </View>

                      {/* Articulatory Guide Card */}
                      <View style={styles.guideCardPeach}>
                        <View style={styles.infoCardHeader}>
                          <View style={styles.infoIconWrapPeach}>
                            <Sparkles size={16} color={colors.peachAccent} />
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.infoCardTitle, { color: colors.peachText }]}>Articulatory Guide</Text>
                            <View style={styles.guideBadge}>
                              <Text style={styles.guideBadgeText}>Teacher Guidance</Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.infoCardBody, { color: colors.peachText }]}>
                          {editArticulatoryGuide || 'Pull tongue tip back, lips slightly relaxed.'}
                        </Text>
                      </View>

                      {/* Practice Content Card */}
                      <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                          <View style={styles.infoIconWrap}>
                            <Layers size={16} color="#0284C7" />
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.infoCardTitle}>Practice Content</Text>
                            <View style={[styles.guideBadge, { backgroundColor: previewSoundColors.bg }]}>
                              <Text style={[styles.guideBadgeText, { color: previewSoundColors.color, fontWeight: '700' }]}>
                                {checkedWords.length + customWords.length || 3} targets
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Initial Position Content */}
                        <View style={styles.posBlockCard}>
                          <View style={styles.posBlockHead}>
                            <View style={[styles.posBadgePeach, { backgroundColor: previewSoundColors.bg, borderColor: previewSoundColors.color }]}>
                              <Text style={[styles.posBadgePeachText, { color: previewSoundColors.color, fontWeight: '700' }]}>Initial</Text>
                            </View>
                            <Text style={styles.posBlockCountText}>
                              {checkedWords.length + customWords.length || 3} targets
                            </Text>
                          </View>

                          <View style={styles.wordPillsRow}>
                            {(checkedWords.length > 0 ? checkedWords : currentActivity.initialWords || []).map((w) => (
                              <View
                                key={w}
                                style={[
                                  styles.wordPillPeachWithIcon,
                                  { backgroundColor: previewSoundColors.bg, borderColor: previewSoundColors.color },
                                ]}
                              >
                                <Volume2
                                  size={12}
                                  color={previewSoundColors.color}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={[
                                    styles.wordPillText,
                                    { color: previewSoundColors.color, fontWeight: '700' },
                                  ]}
                                >
                                  {w}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {(editPracticeLevel === 'Phrases' || editPracticeLevel === 'Sentences') &&
                            (checkedWords.length > 0 ? checkedWords : currentActivity.initialWords || []).map((w, i) =>
                              wordPhrases[w] ? (
                                <View key={i} style={styles.phraseRowCard}>
                                  <Text style={[styles.phraseBulletDot, { color: previewSoundColors.color }]}>•</Text>
                                  <Text style={[styles.infoCardBody, { flex: 1, color: colors.text }]}>
                                    {wordPhrases[w]}
                                  </Text>
                                </View>
                              ) : null
                            )}
                        </View>

                        {/* Medial Position (Subtle in-card summary) */}
                        <View style={styles.posBlockCardSubtle}>
                          <View style={styles.posBlockHead}>
                            <View style={styles.posBadgeSubtle}>
                              <Text style={styles.posBadgeSubtleText}>Medial</Text>
                            </View>
                            <Text style={styles.posBlockCountSubtle}>0 targets</Text>
                          </View>
                          <Text style={[styles.infoCardBody, { fontSize: 12, fontStyle: 'italic', color: colors.textMuted }]}>
                            No targets in this position yet.
                          </Text>
                        </View>

                        {/* Final Position (Subtle in-card summary) */}
                        <View style={styles.posBlockCardSubtle}>
                          <View style={styles.posBlockHead}>
                            <View style={styles.posBadgeSubtle}>
                              <Text style={styles.posBadgeSubtleText}>Final</Text>
                            </View>
                            <Text style={styles.posBlockCountSubtle}>0 targets</Text>
                          </View>
                          <Text style={[styles.infoCardBody, { fontSize: 12, fontStyle: 'italic', color: colors.textMuted }]}>
                            No targets in this position yet.
                          </Text>
                        </View>
                      </View>

                      {/* Audio Pronunciation Model Card */}
                      <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                          <View style={styles.infoIconWrap}>
                            <Volume2 size={16} color="#0284C7" />
                          </View>
                          <Text style={styles.infoCardTitle}>Audio Pronunciation Model</Text>
                        </View>
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
                      </View>

                      {/* Visual Material Card */}
                      <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                          <View style={styles.infoIconWrap}>
                            <Video size={16} color="#0284C7" />
                          </View>
                          <Text style={styles.infoCardTitle}>Visual Material</Text>
                        </View>
                        <View style={styles.mediaBox}>
                          <View style={styles.mediaIconWrap}>
                            <Play size={20} color="#0284C7" fill="#0284C7" style={{ marginLeft: 2 }} />
                          </View>
                          <Text style={styles.mediaTitle}>Articulation Video Cue</Text>
                          <Text style={styles.mediaSub}>Speech model video cue ready for playback</Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.previewActionsRow}>
                        <TouchableOpacity
                          style={styles.outlineBtn}
                          onPress={() => setEditStep(2)}
                          activeOpacity={0.7}
                        >
                          <ChevronLeft size={16} color={colors.text} style={{ marginRight: 4 }} />
                          <Text style={styles.outlineBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.solidBlueBtn}
                          onPress={handleSaveEditedActivity}
                          activeOpacity={0.7}
                        >
                          <Check size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                          <Text style={styles.solidBlueBtnText}>Save Activity</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* VIEW 4: ASSIGN ACTIVITY */}
            {activitiesView === 'assign' && (() => {
              return (
              <View style={styles.assignScreenContainer}>
                <View style={styles.assignHeaderBlock}>
                  <Text style={styles.pageTitle}>Assign Activity</Text>
                  <Text style={styles.pageSubtitle}>Select students and schedule this activity for purposeful practice.</Text>
                </View>

                {/* Card 1: Assignment Target */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={styles.infoIconWrap}>
                      <Users size={16} color="#0284C7" />
                    </View>
                    <View>
                      <Text style={styles.infoCardTitle}>Assignment Target</Text>
                      <Text style={styles.infoCardSub}>Choose recipient student and activity</Text>
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Students</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Select students"
                    style={styles.dropdownSelector}
                    onPress={() => setShowAssignStudentDropdown(true)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <Users size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                      <Text style={styles.dropdownValue} numberOfLines={1}>{studentDropdownSummary}</Text>
                    </View>
                    <ChevronDown size={16} color={colors.text} />
                  </TouchableOpacity>

                  <Text style={[styles.formLabel, { marginTop: 8 }]}>Activity</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Select activity"
                    style={styles.dropdownSelector}
                    onPress={() => setShowAssignActivityDropdown(true)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <Layers size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                      <Text style={styles.dropdownValue} numberOfLines={1}>{selectedAssignActivity?.title ?? 'Select activity'}</Text>
                    </View>
                    <ChevronDown size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Card 2: Activity Preview Accordion */}
                <TouchableOpacity
                  style={[styles.accordionHeader, { borderColor: colors.peachCardBorder, backgroundColor: colors.peachCardBg }]}
                  onPress={() => setAssignPreviewExpanded(!assignPreviewExpanded)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.heroSoundBadgePeach, { width: 34, height: 34, borderRadius: 8, marginRight: 10 }]}>
                      <Text style={[styles.heroSoundBadgeText, { fontSize: 14 }]}>{selectedAssignActivity?.sound ?? '?'}</Text>
                    </View>
                    <View>
                      <Text style={[styles.accordionTitle, { color: colors.peachText }]}>Activity Preview</Text>
                      <Text style={{ fontSize: 11, color: colors.textSub }}>{selectedAssignActivity ? selectedAssignActivity.title + ' - ' + selectedAssignActivity.category : 'Choose an activity to preview'}</Text>
                    </View>
                  </View>
                  {assignPreviewExpanded ? (
                    <ChevronUp size={18} color={colors.peachAccent} />
                  ) : (
                    <ChevronDown size={18} color={colors.peachAccent} />
                  )}
                </TouchableOpacity>

                {assignPreviewExpanded && selectedAssignActivity && (
                  <View style={{ marginBottom: 14 }}>
                    <View style={styles.infoCard}>
                      {(['Initial', 'Medial', 'Final', undefined] as const).map((position) => {
                        const prompts = getTeacherActivityPrompts(selectedAssignActivity).filter((prompt) => prompt.position === position);
                        if (!prompts.length) return null;
                        return (
                          <View key={position ?? 'prompts'} style={styles.posBlockCard}>
                            <Text style={styles.posBlockCountText}>{position ?? 'Practice prompts'}</Text>
                            {prompts.map((prompt, index) => (
                              <Text key={index} style={[styles.infoCardBody, { color: colors.text }]}>{prompt.text}</Text>
                            ))}
                          </View>
                        );
                      })}
                      {selectedAssignActivity.articulatoryGuide.trim() ? (
                        <View style={styles.posBlockCardSubtle}>
                          <Text style={styles.posBlockCountText}>Therapist guidance</Text>
                          <Text style={[styles.infoCardBody, { color: colors.text }]}>{selectedAssignActivity.articulatoryGuide}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* Card 3: Schedule & Instructions */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={styles.infoIconWrap}>
                      <Calendar size={16} color="#0284C7" />
                    </View>
                    <View>
                      <Text style={styles.infoCardTitle}>Schedule & Instructions</Text>
                      <Text style={styles.infoCardSub}>Set completion deadline and student cues</Text>
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Due Date</Text>
                  <AssignmentCalendar value={assignDueDate} onSelect={setAssignDueDate} isDark={isDark} minDate={todayCalendarDate()} showDueDatePresets />

                  <Text style={[styles.formLabel, { marginTop: 8 }]}>Instructions for Student / Facilitator</Text>
                  <TextInput
                    style={[styles.formInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                    multiline
                    value={assignInstructions}
                    onChangeText={setAssignInstructions}
                    placeholder="Listen to the model. Say each target slowly, then try it on your own."
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Bottom Action Row: Cancel and Assign Activity Side by Side */}
                <View style={styles.previewActionsRow}>
                  <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: isDark ? '#38BDF8' : '#0284C7' }]}
                    onPress={() => setActivitiesView('library')}
                    activeOpacity={0.7}
                  >
                    <X size={15} color={isDark ? '#38BDF8' : '#0284C7'} style={{ marginRight: 6 }} />
                    <Text style={[styles.outlineBtnText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.solidBlueBtn}
                    accessibilityRole="button"
                    onPress={handleAssignActivity}
                    activeOpacity={0.7}
                  >
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                    <Text style={styles.solidBlueBtnText}>Assign Activity</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

            {/* VIEW 5: WORD BANK */}
            {activitiesView === 'wordbank' && (
              <View>
                <Text style={styles.subHeadingCaps}>PURPOSEFUL PRACTICE</Text>
                <Text style={styles.pageTitle}>The word bank.</Text>
                <Text style={styles.pageSubtitle}>Reusable targets organized by sound, position and language.</Text>

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
                  <TouchableOpacity
                    style={styles.wbAddBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setWordBankAdding((curr) => !curr);
                      setWordBankEditing(false);
                    }}
                  >
                    <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                    <Text style={styles.wbAddBtnText}>{wordBankAdding ? 'Cancel' : 'Add a word'}</Text>
                  </TouchableOpacity>
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

                {/* Add a Word Entry Form */}
                {wordBankAdding && (
                  <View style={styles.wbAddForm}>
                    <Text style={styles.wbAddFormTitle}>Add a Word Bank Entry</Text>

                    <Text style={styles.wbFormLabel}>Word</Text>
                    <TextInput
                      style={styles.wbFormInput}
                      placeholder="Target word (e.g. rainbow)"
                      placeholderTextColor="#94A3B8"
                      value={newWordText}
                      onChangeText={setNewWordText}
                    />

                    <Text style={styles.wbFormLabel}>Sound</Text>
                    <View style={styles.wbFilterOptionsWrap}>
                      {['/r/', '/s/', '/l/', '/t/', '/k/', '/p/', '/m/'].map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.wbChoicePill, newWordSound === s && styles.wbChoicePillActive]}
                          onPress={() => setNewWordSound(s)}
                        >
                          <Text style={[styles.wbChoicePillText, newWordSound === s && styles.wbChoicePillTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.wbFormLabel, { marginTop: 10 }]}>Position</Text>
                    <View style={styles.wbFilterOptionsWrap}>
                      {(['Initial', 'Medial', 'Final'] as const).map((pos) => (
                        <TouchableOpacity
                          key={pos}
                          style={[styles.wbChoicePill, newWordPosition === pos && styles.wbChoicePillActive]}
                          onPress={() => setNewWordPosition(pos)}
                        >
                          <Text style={[styles.wbChoicePillText, newWordPosition === pos && styles.wbChoicePillTextActive]}>{pos}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.wbFormLabel, { marginTop: 10 }]}>Language</Text>
                    <View style={styles.wbFilterOptionsWrap}>
                      {['English', 'Tagalog'].map((lang) => (
                        <TouchableOpacity
                          key={lang}
                          style={[styles.wbChoicePill, newWordLanguage === lang && styles.wbChoicePillActive]}
                          onPress={() => setNewWordLanguage(lang)}
                        >
                          <Text style={[styles.wbChoicePillText, newWordLanguage === lang && styles.wbChoicePillTextActive]}>{lang}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.wbSaveWordBtn}
                      onPress={handleAddWordBankEntry}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.wbSaveWordBtnText}>Save Target</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Word Bank List Header */}
                <View style={styles.wbListHeader}>
                  <Text style={styles.wbListTitle}>Word Bank List ({filteredWordBank.length})</Text>
                  <TouchableOpacity
                    style={styles.wbEditModeBtn}
                    onPress={() => setWordBankEditing((curr) => !curr)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {wordBankEditing ? (
                      <Check size={18} color="#0284C7" />
                    ) : (
                      <Pencil size={16} color={colors.textSub} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Word Bank List */}
                <View style={styles.wbListCard}>
                  {filteredWordBank.slice(wordPages.start, wordPages.end).map((item, index) => (
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

                      {wordBankEditing ? (
                        <TouchableOpacity
                          onPress={() => handleRemoveWordBankEntry(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.wbDeleteBtn}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.wbPositionBadge}>
                          <Text style={styles.wbPositionBadgeText}>{item.position}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  <ListPagination {...wordPages} total={filteredWordBank.length} noun="words" accent="#0865AD" muted={colors.textMuted} border={colors.border} surface={colors.card} />
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
            <View style={styles.reviewFilterControl}>
              <ChecklistFilter isDark={isDark}
                palette={{ card: colors.card, line: colors.border, text: colors.text, faint: colors.textMuted, primary: isDark ? '#0369A1' : '#0865AD', muted: colors.textSub }}
                label="Filter reviews" sectionLabel="Activities" options={reviewActivityOptions} optionCaptions={reviewActivityCaptions}
                selected={reviewActivities} onChange={setReviewActivities} emptyLabel="All activities" allLabel="All activities" compact resetOnAll searchable
                extraSections={[
                  { label: 'Language', options: PRACTICE_LANGUAGES, selected: reviewLanguage, onChange: setReviewLanguage, allLabel: 'All languages', single: true },
                  { label: 'Level', options: practiceLevels, selected: reviewLevels, onChange: setReviewLevels, allLabel: 'All levels' },
                  { label: 'Students', options: reviewStudentOptions, selected: reviewStudents, onChange: setReviewStudents, allLabel: 'All students',
                    headerContent: (
                      <View style={styles.reviewSortRow}>
                        <Text style={styles.reviewsSubtitle}>Sort by name</Text>
                        {(['A–Z', 'Z–A'] as const).map((order) => (
                          <TouchableOpacity key={order} accessibilityRole="radio" accessibilityState={{ checked: order === reviewStudentSort }}
                            onPress={() => setReviewStudentSort(order)} style={[styles.reviewSortButton, { borderColor: order === reviewStudentSort ? '#0284C7' : colors.border }]}>
                            <Text style={{ color: colors.text }}>{order}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ),
                  },
                ]} />
            </View>
            <View style={styles.reviewsListContainer}>
              {filteredReviews.length === 0 && <Text style={styles.reviewsSubtitle}>No reviews match these filters.</Text>}
              {filteredReviews.slice(reviewPages.start, reviewPages.end).map((rev) => (
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
              <ListPagination {...reviewPages} total={filteredReviews.length} noun="reviews" accent="#0865AD" muted={colors.textMuted} border={colors.border} surface={colors.card} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==========================================
          --- MODAL: TARGET SOUND SELECTION POPUP ---
          ========================================== */}
      <Modal
        visible={showTargetSoundDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTargetSoundDropdown(false)}
      >
        <Pressable
          style={styles.dropdownPopupOverlay}
          onPress={() => setShowTargetSoundDropdown(false)}
        >
          <Pressable
            style={[styles.dropdownPopupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={[styles.dropdownPopupHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownPopupTitle, { color: colors.text }]}>
                Select Target Sound
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowTargetSoundDropdown(false)}
                style={styles.dropdownPopupCloseBtn}
                hitSlop={8}
              >
                <Text style={[styles.dropdownPopupCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {TARGET_SOUND_OPTIONS.map((snd) => {
                const isSelected = editTargetSound === snd;
                return (
                  <TouchableOpacity
                    key={snd}
                    style={[
                      styles.dropdownPopupOption,
                      isSelected && {
                        backgroundColor: colors.isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                      },
                    ]}
                    onPress={() => {
                      setEditTargetSound(snd);
                      setShowTargetSoundDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownPopupOptionText,
                        { color: colors.text },
                        isSelected && {
                          color: colors.isDark ? '#38BDF8' : '#0284C7',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {snd}
                    </Text>
                    {isSelected && (
                      <Check
                        size={16}
                        color={colors.isDark ? '#38BDF8' : '#0284C7'}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==========================================
          --- MODAL: PRACTICE LEVEL SELECTION POPUP ---
          ========================================== */}
      <Modal
        visible={showPracticeLevelDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPracticeLevelDropdown(false)}
      >
        <Pressable
          style={styles.dropdownPopupOverlay}
          onPress={() => setShowPracticeLevelDropdown(false)}
        >
          <Pressable
            style={[styles.dropdownPopupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={[styles.dropdownPopupHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownPopupTitle, { color: colors.text }]}>
                Select Practice Level
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowPracticeLevelDropdown(false)}
                style={styles.dropdownPopupCloseBtn}
                hitSlop={8}
              >
                <Text style={[styles.dropdownPopupCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {PRACTICE_LEVEL_OPTIONS.map((lvl) => {
                const isSelected = editPracticeLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.dropdownPopupOption,
                      isSelected && {
                        backgroundColor: colors.isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                      },
                    ]}
                    onPress={() => {
                      setEditPracticeLevel(lvl);
                      setShowPracticeLevelDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownPopupOptionText,
                        { color: colors.text },
                        isSelected && {
                          color: colors.isDark ? '#38BDF8' : '#0284C7',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {lvl}
                    </Text>
                    {isSelected && (
                      <Check
                        size={16}
                        color={colors.isDark ? '#38BDF8' : '#0284C7'}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==========================================
          --- MODAL: ASSIGN STUDENT CHECKLIST POPUP ---
          ========================================== */}
      <Modal
        visible={showAssignStudentDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAssignStudentDropdown(false)}
      >
        <Pressable
          style={styles.dropdownPopupOverlay}
          onPress={() => setShowAssignStudentDropdown(false)}
        >
          <Pressable
            style={[styles.dropdownPopupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={[styles.dropdownPopupHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownPopupTitle, { color: colors.text }]}>
                Select Student(s)
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowAssignStudentDropdown(false)}
                style={styles.dropdownPopupCloseBtn}
                hitSlop={8}
              >
                <Text style={[styles.dropdownPopupCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.dropdownPopupOption,
                allStudentsSelected && {
                  backgroundColor: colors.isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                },
              ]}
              onPress={() => {
                if (allStudentsSelected) {
                  setAssignSelectedStudents([]);
                } else {
                  setAssignSelectedStudents(studentOptions.map(({ id }) => id));
                }
              }}
            >
              <Text
                style={[
                  styles.dropdownPopupOptionText,
                  { color: colors.text, fontWeight: '700' },
                ]}
              >
                Select all
              </Text>
              <View
                style={[
                  styles.checkboxSquare,
                  allStudentsSelected && styles.checkboxSquareActive,
                ]}
              >
                {allStudentsSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {studentOptions.map(({ id, name }) => {
                const checked = assignSelectedStudents.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    style={[
                      styles.dropdownPopupOption,
                      checked && {
                        backgroundColor: colors.isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                      },
                    ]}
                    onPress={() => {
                      if (checked) {
                        setAssignSelectedStudents((prev) => prev.filter((selectedId) => selectedId !== id));
                      } else {
                        setAssignSelectedStudents((prev) => [...prev, id]);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownPopupOptionText,
                        { color: colors.text },
                        checked && {
                          color: colors.isDark ? '#38BDF8' : '#0284C7',
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {name}
                    </Text>
                    <View
                      style={[
                        styles.checkboxSquare,
                        checked && styles.checkboxSquareActive,
                      ]}
                    >
                      {checked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.dropdownPopupDoneBtn,
                { backgroundColor: '#0284C7' },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Done selecting students"
              onPress={() => setShowAssignStudentDropdown(false)}
            >
              <Text style={styles.dropdownPopupDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==========================================
          --- MODAL: ASSIGN ACTIVITY SELECTION POPUP ---
          ========================================== */}
      <Modal
        visible={showAssignActivityDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAssignActivityDropdown(false)}
      >
        <Pressable
          style={styles.dropdownPopupOverlay}
          onPress={() => setShowAssignActivityDropdown(false)}
        >
          <Pressable
            style={[styles.dropdownPopupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={[styles.dropdownPopupHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownPopupTitle, { color: colors.text }]}>
                Select Activity
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowAssignActivityDropdown(false)}
                style={styles.dropdownPopupCloseBtn}
                hitSlop={8}
              >
                <Text style={[styles.dropdownPopupCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {activitiesList.map((act) => {
                const isSelected = assignActivityId === act.id;
                return (
                  <TouchableOpacity
                    key={act.id}
                    style={[
                      styles.dropdownPopupOption,
                      isSelected && {
                        backgroundColor: colors.isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                      },
                    ]}
                    onPress={() => {
                      setAssignActivityId(act.id);
                      setAssignInstructions(act.instructions);
                      setAssignPreviewExpanded(false);
                      setShowAssignActivityDropdown(false);
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        style={[
                          styles.dropdownPopupOptionText,
                          { color: colors.text },
                          isSelected && {
                            color: colors.isDark ? '#38BDF8' : '#0284C7',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {act.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSub, marginTop: 2 }}>
                        {act.sound} • {act.category} • {act.language}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check
                        size={16}
                        color={colors.isDark ? '#38BDF8' : '#0284C7'}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==========================================
          --- MODAL: STUDENT FILTER SELECTION POPUP ---
          ========================================== */}
      <Modal
        visible={showStudentFilterDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStudentFilterDropdown(false)}
      >
        <Pressable
          style={styles.dropdownPopupOverlay}
          onPress={() => setShowStudentFilterDropdown(false)}
        >
          <Pressable
            style={[styles.dropdownPopupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={[styles.dropdownPopupHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownPopupTitle, { color: colors.text }]}>
                Filter by Target Sound
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowStudentFilterDropdown(false)}
                style={styles.dropdownPopupCloseBtn}
                hitSlop={8}
              >
                <Text style={[styles.dropdownPopupCloseText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {['ALL', ...TARGET_SOUND_OPTIONS].map((opt) => {
                const isSelected = studentFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownPopupOption,
                      isSelected && {
                        backgroundColor: colors.isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE',
                      },
                    ]}
                    onPress={() => {
                      setStudentFilter(opt);
                      setShowStudentFilterDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownPopupOptionText,
                        { color: colors.text },
                        isSelected && {
                          color: colors.isDark ? '#38BDF8' : '#0284C7',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {opt === 'ALL' ? 'All Targets' : opt}
                    </Text>
                    {isSelected && (
                      <Check
                        size={16}
                        color={colors.isDark ? '#38BDF8' : '#0284C7'}
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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

            {/* Audio Playback Box */}
            <View style={[styles.audioModelCard, { marginVertical: 12 }]}>
              <View style={styles.audioPlayCircle}>
                <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.audioModelTitle}>Child Audio Recording</Text>
                <Text style={styles.audioModelSub}>Duration: {selectedReview?.audioDuration}</Text>
              </View>
              <View style={styles.audioWaveformRow}>
                {[14, 26, 12, 28, 18, 10, 22].map((h, i) => (
                  <View key={i} style={[styles.audioWaveBar, { height: h }]} />
                ))}
              </View>
            </View>

            {/* Evaluation Rating Buttons */}
            <Text style={styles.formLabel}>Clinical Accuracy Rating</Text>
            <View style={styles.ratingButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.ratingBtn,
                  reviewEvaluation === 'Correct' && { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                ]}
                onPress={() => setReviewEvaluation('Correct')}
              >
                <Check size={14} color={reviewEvaluation === 'Correct' ? '#16A34A' : colors.textSub} style={{ marginRight: 4 }} />
                <Text
                  style={[
                    styles.ratingBtnText,
                    reviewEvaluation === 'Correct' && { color: '#16A34A', fontWeight: '700' },
                  ]}
                >
                  Correct
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ratingBtn,
                  reviewEvaluation === 'Approximate' && { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
                ]}
                onPress={() => setReviewEvaluation('Approximate')}
              >
                <Text
                  style={[
                    styles.ratingBtnText,
                    reviewEvaluation === 'Approximate' && { color: '#D97706', fontWeight: '700' },
                  ]}
                >
                  ~ Approximate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ratingBtn,
                  reviewEvaluation === 'Incorrect' && { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                ]}
                onPress={() => setReviewEvaluation('Incorrect')}
              >
                <X size={14} color={reviewEvaluation === 'Incorrect' ? '#DC2626' : colors.textSub} style={{ marginRight: 4 }} />
                <Text
                  style={[
                    styles.ratingBtnText,
                    reviewEvaluation === 'Incorrect' && { color: '#DC2626', fontWeight: '700' },
                  ]}
                >
                  Needs Practice
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes / Clinical Feedback Input */}
            <Text style={styles.formLabel}>Feedback for Student / Parent</Text>
            <TextInput
              style={[styles.formInput, { height: 60 }]}
              multiline
              placeholder="Good elevation of tongue tip, keep practicing initial /r/..."
              placeholderTextColor="#94A3B8"
              value={reviewNotes}
              onChangeText={setReviewNotes}
            />

            {/* Action Buttons */}
            <View style={[styles.previewActionsRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setSelectedReview(null)}
              >
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.solidBlueBtn}
                onPress={() => selectedReview && handleSubmitReview(selectedReview)}
              >
                <Text style={styles.solidBlueBtnText}>Submit Review</Text>
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
                  {selectedPatient?.accuracy}% ↑ 10%
                </Text>
                <Text style={styles.metricBoxSubtitle}>Baseline</Text>
              </View>

              <View style={[styles.modalMetricBox, { backgroundColor: '#CFFAFE' }]}>
                <Text style={styles.metricBoxTitle}>Current Stage</Text>
                <Text style={[styles.metricBoxValue, { color: '#0284C7' }]}>
                  {selectedPatient?.stage}
                </Text>
                <Text style={styles.metricBoxSubtitle}>Target: sounds</Text>
              </View>

              <View style={[styles.modalMetricBox, { backgroundColor: '#FFE4E6' }]}>
                <Text style={styles.metricBoxTitle}>Home Compliance</Text>
                <Text style={[styles.metricBoxValue, { color: '#E11D48' }]}>
                  {selectedPatient?.compliance}
                </Text>
                <Text style={styles.metricBoxSubtitle}>{selectedPatient?.complianceDays}</Text>
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
                  <Text style={styles.modalSectionHeading}>SOAP SESSION HISTORY</Text>
                  <TouchableOpacity
                    style={styles.newSoapButton}
                    onPress={() => setShowSoapForm(!showSoapForm)}
                  >
                    <Text style={styles.newSoapButtonText}>+ New SOAP Note</Text>
                  </TouchableOpacity>
                </View>

                {showSoapForm && (
                  <View style={styles.soapFormCard}>
                    <Text style={styles.soapFormTitle}>Add SOAP Clinical Entry</Text>
                    <TextInput
                      style={styles.soapInput}
                      placeholder="S (Subjective): e.g Cooperative"
                      placeholderTextColor="#94A3B8"
                      value={soapInputs.s}
                      onChangeText={(text) => setSoapInputs({ ...soapInputs, s: text })}
                    />
                    <TextInput
                      style={styles.soapInput}
                      placeholder="O (Objective): e.g 15/20 trials"
                      placeholderTextColor="#94A3B8"
                      value={soapInputs.o}
                      onChangeText={(text) => setSoapInputs({ ...soapInputs, o: text })}
                    />
                    <TextInput
                      style={styles.soapInput}
                      placeholder="A (Assessment): e.g Improving"
                      placeholderTextColor="#94A3B8"
                      value={soapInputs.a}
                      onChangeText={(text) => setSoapInputs({ ...soapInputs, a: text })}
                    />
                    <TextInput
                      style={styles.soapInput}
                      placeholder="P (Plan): e.g Advance to words"
                      placeholderTextColor="#94A3B8"
                      value={soapInputs.p}
                      onChangeText={(text) => setSoapInputs({ ...soapInputs, p: text })}
                    />

                    <TouchableOpacity style={styles.saveSoapButton} onPress={handleSaveSoapNote}>
                      <Text style={styles.saveSoapButtonText}>Save Clinical Note</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {soapNotes.length === 0 && !showSoapForm ? (
                  <View style={styles.emptySessionBox}>
                    <Text style={styles.emptySessionTitle}>No Sessions recorded yet.</Text>
                    <Text style={styles.emptySessionSubtitle}>
                      Log the first SOAP note to start tracking articulation progress over time
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
                <Text style={styles.modalSectionHeading}>ACCOMPLISHMENT HISTORY</Text>
                {SAMPLE_ACCOMPLISHMENTS.map((acc) => (
                  <View key={acc.id} style={styles.accomplishmentCard}>
                    <Text style={styles.accDate}>
                      {acc.date} ({acc.duration})
                    </Text>
                    <Text style={styles.accTitle}>{acc.title}</Text>
                    <Text style={styles.accAccuracy}>Target Accuracy: {acc.accuracyText}</Text>
                    <Text style={styles.notesLabel}>NOTES & OBSERVATION</Text>
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>"{acc.notes}"</Text>
                    </View>
                    <View style={styles.audioPlayerRow}>
                      <View style={styles.playButtonCircle}>
                        <Play size={12} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <Text style={styles.audioLabel}>Child Audio</Text>
                        <Text style={styles.audioSub}>Demo Playback • {acc.audioDuration}</Text>
                      </View>
                      <View style={styles.waveformContainer}>
                        {[16, 24, 12, 28, 20, 14, 22, 18, 26, 12].map((height, i) => (
                          <View key={i} style={[styles.waveBar, { height }]} />
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
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
          <Pressable style={[styles.menuOverlay, { alignItems: 'center' }]} onPress={() => setShowMenu(false)}>
            <View style={{ width: columnWidth, position: 'relative' }}>
              <View style={styles.menuDropdownContainer}>
                {/* Therapist Profile Snippet Header */}
                <TouchableOpacity
                  style={styles.menuUserHeader}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowMenu(false);
                    openProfile();
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
                  accessibilityRole="button"
                  accessibilityLabel="View profile and credentials"
                  onPress={() => {
                    setShowMenu(false);
                    openProfile();
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
          <Pressable style={[styles.menuOverlay, { alignItems: 'center' }]} onPress={() => setShowNotificationsDropdown(false)}>
            <View style={{ width: columnWidth, position: 'relative' }}>
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
        onRequestClose={() => sessionToRevoke ? setSessionToRevoke(null) : setShowSettingsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: wide ? (isDark ? '#0F172A' : '#E2E8F0') : colors.bgSecondary, alignItems: 'center' }}>
          <View style={{ flex: 1, width: columnWidth, backgroundColor: colors.bgSecondary }}>
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
                setShowSettingsModal(false);
                openProfile();
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
                  <Text style={styles.newRowSubtitle}>Students who need practice follow-up</Text>
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
                  {(['Light', 'Dark'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.newThemeSegmentBtn,
                        themeMode === mode && styles.newThemeSegmentBtnActive,
                      ]}
                      onPress={() => {
                        setThemeMode(mode);
                        triggerToast(`${mode} theme enabled`);
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
                        accessibilityRole="button"
                        onPress={() => { setSessionNotice(''); setSessionToRevoke(session); }}
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

            {sessionNotice ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.newRowSubtitle, { marginTop: 6 }]}>{sessionNotice}</Text> : null}

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
              <Text style={styles.newSignOutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        {sessionToRevoke ? (
              <SessionRevokeWarning
                device={sessionToRevoke.device}
                isDark={isDark}
                onCancel={() => setSessionToRevoke(null)}
                onConfirm={() => {
                  handleRevokeSession(sessionToRevoke.id);
                  setSessionToRevoke(null);
                }}
              />
            ) : null}
          </SafeAreaView>
          </View>
        </View>
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
        <View style={{ flex: 1, backgroundColor: wide ? (isDark ? '#0F172A' : '#E2E8F0') : colors.bgSecondary, alignItems: 'center' }}>
          <View style={{ flex: 1, width: columnWidth, backgroundColor: colors.bgSecondary }}>
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
            <View style={styles.profileHeading}>
              <Text accessibilityRole="header" style={styles.newHeaderTitle}>Profile & Credentials</Text>
              <Text style={styles.profileMode}>{editingProfile ? 'Editing profile' : 'Profile overview'}</Text>
            </View>
          </View>

          {editingProfile && (
              <ProfileEditWarning isDark={isDark} style={{ marginHorizontal: 16 }} />
            )}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
            {/* Upload Photo Card */}
            <TouchableOpacity
              style={styles.newUploadPhotoCard}
              activeOpacity={0.8}
              onPress={handlePickPhoto}
                disabled={!editingProfile}
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
              <Text style={styles.newUploadPhotoLabel}>{editingProfile ? 'Upload Photo' : 'Profile photo'}</Text>
            </TouchableOpacity>

            {/* Profile Section */}
            <Text style={styles.newSectionTitleStandalone}>Profile</Text>
            <View style={styles.newCard}>
              <View style={styles.newProfileFieldRow}>
                <Text style={styles.newFieldLabel}>Name</Text>
                <TextInput
                  style={styles.newFieldInput}
                  accessibilityLabel="Name"
                  editable={editingProfile}
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
                  accessibilityLabel="Professional title"
                  editable={editingProfile}
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
                  accessibilityLabel="Contact number"
                  editable={editingProfile}
                  value={editProfileForm.contact}
                  onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, contact: text }))}
                  placeholder="+63 9000 000 000"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.newDivider} />

              <View style={[styles.newProfileFieldRow, styles.readOnlyCredential]}>
                <Text style={styles.newFieldLabel}>PRC / Licensed Number</Text>
                <Text style={[styles.newFieldInput, styles.readOnlyCredentialValue]}>{editProfileForm.license || '—'}</Text>
              </View>
              <View style={styles.newDivider} />

              <View style={[styles.newProfileFieldRow, styles.readOnlyCredential]}>
                <Text style={styles.newFieldLabel}>Clinic/School</Text>
                <Text style={[styles.newFieldInput, styles.readOnlyCredentialValue]}>{editProfileForm.clinic || CENTER_NAME}</Text>
              </View>
            </View>

            {/* Specialization Section */}
            <Text style={styles.newSectionTitleStandalone}>Specialization</Text>
            <View style={[styles.newSpecialtyContainer, !editProfileForm.specializations.length && { gap: 0 }]}>
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
                        disabled={!editingProfile}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.newChipRemove}
                      >
                        <X size={12} color={colors.isDark ? colorInfo.darkText : colorInfo.text} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {editingProfile && <View style={styles.newAddSpecialtyRow}>
                <TextInput
                  style={styles.newAddSpecialtyInput}
                  value={newSpecialtyInput}
                  onChangeText={setNewSpecialtyInput}
                  onSubmitEditing={handleAddSpecialty}
                  placeholder="Add Specialty e.g., Articulation"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                />
              </View>}
            </View>

            {/* Save Credentials Button */}
            <View style={styles.newSaveContainer}>
              <TouchableOpacity
                style={styles.newSaveCredentialsBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                onPress={editingProfile ? handleSaveProfile : startProfileEditing}
              >
                <Text style={styles.newSaveCredentialsBtnText}>{editingProfile ? 'Save Credentials' : 'Edit profile'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
          </View>
        </View>
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
                onPress={handleChangePassword}
              >
                <Text style={styles.solidBlueBtnText}>Update Password</Text>
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
              You will need to sign back in with your credentials to manage your students.
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

        {/* Tab 2: Students */}
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
          <Text style={[styles.navLabel, activeTab === 'patients' && styles.navLabelActive]}>Students</Text>
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
          accessibilityRole="button"
          accessibilityLabel="Reviews"
          accessibilityState={{ selected: activeTab === 'reviews' }}
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
      </View>
    </View>
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
      backgroundColor: colors.bg,
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
    // Hero Activity Card & Elements
    heroActivityCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    heroActivityTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroSoundBadgePeach: {
      width: 58,
      height: 58,
      borderRadius: 14,
      backgroundColor: colors.peachCardBg,
      borderWidth: 1,
      borderColor: colors.peachCardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroSoundBadgeText: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.peachAccent,
    },
    heroSoundWaveText: {
      fontSize: 14,
      color: colors.isDark ? '#0284C7' : '#FB923C',
      marginTop: -4,
    },
    heroTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 4,
    },
    heroLevelBadge: {
      backgroundColor: colors.peachPillBg,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    heroLevelBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    heroLanguageBadge: {
      backgroundColor: colors.cardSubtle,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    heroLanguageBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSub,
    },
    heroActivityTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 22,
      color: colors.text,
    },
    heroCardDivider: {
      height: 1,
      backgroundColor: colors.borderLight || colors.border,
      marginVertical: 14,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroMetaItem: {
      flex: 1,
      alignItems: 'center',
    },
    heroMetaLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    heroMetaValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    heroMetaDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.borderLight || colors.border,
    },

    // Modular Info Cards & Peach Accents
    infoCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    infoIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    infoIconWrapPeach: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.peachPillBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    infoCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    infoCardBody: {
      fontSize: 13,
      color: colors.textSub,
      lineHeight: 20,
    },
    infoCardSub: {
      fontSize: 11,
      color: colors.textSub,
      marginTop: 1,
    },
    guideCardPeach: {
      backgroundColor: colors.peachCardBg,
      borderWidth: 1,
      borderColor: colors.peachCardBorder,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
    },
    guideBadge: {
      backgroundColor: colors.peachPillBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    guideBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.peachPillText,
    },

    // Position Blocks & Word Pills
    posBlockCard: {
      backgroundColor: colors.isDark ? '#1E293B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    posBlockHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    posBadgePeach: {
      backgroundColor: colors.peachPillBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    posBadgePeachText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    posBlockCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSub,
    },
    wordPillPeachWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.peachPillBg,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginRight: 6,
      marginBottom: 4,
    },
    phraseRowCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 2,
    },
    phraseBulletDot: {
      fontSize: 14,
      color: colors.peachAccent,
      marginRight: 6,
      lineHeight: 18,
    },
    posBlockCardSubtle: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight || colors.border,
      borderRadius: 12,
      padding: 10,
      marginTop: 6,
    },
    posBadgeSubtle: {
      backgroundColor: colors.cardSubtle,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    posBadgeSubtleText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSub,
    },
    posBlockCountSubtle: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // Video Card Box
    videoCardBox: {
      height: 130,
      borderRadius: 14,
      backgroundColor: colors.cardSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      marginTop: 4,
    },
    videoBadgeTop: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    videoBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSub,
    },
    videoBottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
      borderTopWidth: 1,
      borderTopColor: colors.borderLight || colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    videoBottomTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    videoBottomSub: {
      fontSize: 10,
      color: colors.textMuted,
    },

    // Action Buttons
    actionBtnOutline: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.isDark ? '#38BDF8' : '#0284C7',
      backgroundColor: colors.card,
      marginRight: 8,
    },
    actionBtnOutlineText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    actionBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      borderRadius: 12,
      backgroundColor: '#0284C7',
      marginLeft: 8,
      shadowColor: '#0284C7',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    actionBtnPrimaryText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // Stepper Card Styles
    stepperCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 10,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepperStepItem: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    stepperCircleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    stepperCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.cardSubtle,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    stepperCircleActive: {
      backgroundColor: '#0284C7',
      borderColor: '#0284C7',
    },
    stepperCircleCompleted: {
      backgroundColor: '#16A34A',
      borderColor: '#16A34A',
    },
    stepperCircleText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSub,
    },
    stepperLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    stepperLabelActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    stepperProgressBar: {
      width: '100%',
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.borderLight || colors.border,
    },
    stepperProgressBarActive: {
      backgroundColor: '#0284C7',
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
      backgroundColor: colors.isDark ? '#0284C7' : '#F97316',
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
      backgroundColor: colors.isDark ? '#38BDF8' : '#F97316',
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
    mediaBox: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.isDark ? '#0F172A' : '#F8FAFC',
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    mediaIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    mediaTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    mediaSub: {
      fontSize: 11,
      color: colors.textSub,
    },
    previewActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 18,
      marginBottom: 16,
    },
    outlineBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: colors.card,
    },
    outlineBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    solidBlueBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#0284C7',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
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
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 3,
      elevation: 1,
    },
    stepperStepBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepperBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.cardSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    stepperBadgeActive: {
      backgroundColor: '#0284C7',
      borderColor: '#0284C7',
    },
    stepperBadgeCompleted: {
      backgroundColor: '#0284C7',
      borderColor: '#0284C7',
    },
    stepperBadgeNum: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
    },
    stepperLabelText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    stepperLabelTextActive: {
      color: colors.isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    stepperLine: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 8,
      borderRadius: 1,
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
      borderColor: colors.isDark ? '#0284C7' : '#FB923C',
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
      borderColor: colors.isDark ? '#0284C7' : '#FB923C',
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
      borderColor: colors.peachAccent,
      backgroundColor: colors.peachAccent,
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
      borderColor: colors.isDark ? '#0284C7' : '#FB923C',
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
      backgroundColor: colors.peachAccent,
      borderColor: colors.peachAccent,
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
      color: colors.peachText,
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
    assignHeaderBlock: {
      marginBottom: 14,
    },
    targetWordPhraseCard: {
      backgroundColor: colors.cardSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    targetWordPhraseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    targetWordPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.peachPillBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    targetWordPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.peachPillText,
    },
    targetWordPosBadge: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    targetWordPosText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSub,
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
    reviewFilterControl: { alignSelf: 'flex-end', marginBottom: 12 },
    reviewSortRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    reviewSortButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderRadius: 8 },
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
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '90%',
      alignSelf: 'center',
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
      backgroundColor: colors.isDark ? '#0284C7' : '#F97316',
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
      backgroundColor: colors.isDark ? '#38BDF8' : '#F97316',
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
    profileHeading: { flex: 1, minWidth: 0, gap: 2 },
    profileMode: { color: colors.textSub, fontSize: 13, fontWeight: '600' },
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
    readOnlyCredential: { backgroundColor: colors.isDark ? '#263241' : '#F1F3F5' },
    readOnlyCredentialValue: { color: colors.textSub },
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
    studentPlayBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.isDark ? 'rgba(56,189,248,0.18)' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Popup Dropdown Modal Styles
    dropdownPopupOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 18,
    },
    dropdownPopupCard: {
      width: '100%',
      maxWidth: 380,
      maxHeight: '80%',
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    dropdownPopupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      marginBottom: 8,
      borderBottomWidth: 1,
    },
    dropdownPopupTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    dropdownPopupCloseBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownPopupCloseText: {
      fontSize: 16,
      fontWeight: '600',
    },
    dropdownPopupOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
      marginVertical: 2,
    },
    dropdownPopupOptionText: {
      fontSize: 15,
    },
    dropdownPopupDoneBtn: {
      marginTop: 14,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownPopupDoneBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
