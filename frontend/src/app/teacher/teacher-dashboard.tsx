import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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
  language: 'English' | 'Tagalog';
  targetSound: string;
  practiceLevel: string;
  wordPositions: string[];
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

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    sound: '/s/',
    soundBg: '#DCFCE7',
    soundColor: '#16A34A',
    category: 'Words',
    title: 'Sunny Sounds',
    subtitle: 'English • Therapist-created',
    instructions: 'Listen to the model. Say each target slowly, then try it on your own.',
    articulatoryGuide: 'Place tongue behind front teeth, blow gentle air.',
    language: 'English',
    targetSound: '/s/',
    practiceLevel: 'Words',
    wordPositions: ['Initial', 'Medial'],
    initialWords: ['sun', 'sand', 'soup'],
    phrases: ['Warm sunny day.', 'Sand on the beach.', 'Hot soup is good.'],
  },
  {
    id: 'act-2',
    sound: '/r/',
    soundBg: '#FFEDD5',
    soundColor: '#EA580C',
    category: 'Phrases',
    title: 'Ready, set, /r/',
    subtitle: 'English • Therapist-created',
    instructions: 'Listen to the model. Say each target slowly, then try it on your own.',
    articulatoryGuide: 'Pull tongue tip back, lips slightly relaxed.',
    language: 'English',
    targetSound: '/r/',
    practiceLevel: 'Phrases',
    wordPositions: ['Initial', 'Medial'],
    initialWords: ['rabbit', 'red', 'run'],
    phrases: [
      '• I see a red apple.',
      '• See the dog run fast.',
      '• The little rabbit hid.',
    ],
  },
  {
    id: 'act-3',
    sound: '/l/',
    soundBg: '#FEF9C3',
    soundColor: '#CA8A04',
    category: 'Syllables',
    title: 'Little /l/ steps',
    subtitle: 'English • Therapist-created',
    instructions: 'Lift tongue tip to alveolar ridge and vocalize.',
    articulatoryGuide: 'Touch tongue tip behind top teeth.',
    language: 'English',
    targetSound: '/l/',
    practiceLevel: 'Syllables',
    wordPositions: ['Initial'],
    initialWords: ['la', 'le', 'li'],
    phrases: ['Sing la la la.', 'Lemon and lime.'],
  },
  {
    id: 'act-4',
    sound: '/s/',
    soundBg: '#E0F2FE',
    soundColor: '#0284C7',
    category: 'Isolation',
    title: 'Sound explorers',
    subtitle: 'English • Therapist-created',
    instructions: 'Hold the hiss sound like a friendly snake.',
    articulatoryGuide: 'Keep teeth lightly touching, hiss steadily.',
    language: 'English',
    targetSound: '/s/',
    practiceLevel: 'Isolation',
    wordPositions: ['Initial'],
    initialWords: ['sss'],
    phrases: ['Hiss like a snake: sssss.'],
  },
  {
    id: 'act-5',
    sound: '/t/',
    soundBg: '#FFE4E6',
    soundColor: '#E11D48',
    category: 'Sentences',
    title: 'Say it in a sentence',
    subtitle: 'English • Therapist-created',
    instructions: 'Focus on clear tongue tap for /t/ at start of words.',
    articulatoryGuide: 'Tap tongue tip sharply behind teeth.',
    language: 'English',
    targetSound: '/t/',
    practiceLevel: 'Sentences',
    wordPositions: ['Initial', 'Final'],
    initialWords: ['tap', 'top', 'time'],
    phrases: ['Take the top ticket.', 'Time to tap.'],
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

export default function TeacherDashboardScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  // --- Main Navigation Tabs ---
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'activities' | 'reviews'>('home');

  // --- Three Lines (Hamburger) Menu, Profile, Settings & Notifications State ---
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Therapist Profile Data
  const [therapistProfile, setTherapistProfile] = useState({
    name: 'Dr. Ameer Andres, SLP-CCC',
    title: 'Speech-Language Pathologist',
    license: 'SLP-PH-2024-8821',
    clinic: 'SpeakSteps',
    contact: '+63 9000 000 000',
    email: 'ameer@speakstep.com',
  });
  const [editProfileForm, setEditProfileForm] = useState({ ...therapistProfile });

  // Settings Toggles & Theme (Screenshot 1 Left)
  const [newRecordingsToggle, setNewRecordingsToggle] = useState(true);
  const [followUpAlertsToggle, setFollowUpAlertsToggle] = useState(true);
  const [themeMode, setThemeMode] = useState<'Auto' | 'Light' | 'Dark'>('Auto');

  // --- Dynamic Color Theme Resolution (Functional Light & Dark) ---
  const systemColorScheme = useColorScheme();
  const isDark = themeMode === 'Auto' ? systemColorScheme === 'dark' : themeMode === 'Dark';
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
  const [activitiesView, setActivitiesView] = useState<'library' | 'preview' | 'edit' | 'assign'>('library');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'ALL' | 'Words' | 'Phrases' | 'Syllables' | 'Isolation' | 'Sentences'>('ALL');
  const [activitySearch, setActivitySearch] = useState('');
  const [currentActivity, setCurrentActivity] = useState<ActivityItem>(INITIAL_ACTIVITIES[1]);

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
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [reviewsFilter, setReviewsFilter] = useState<'All' | 'Pending' | 'Reviewed'>('All');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewEvaluation, setReviewEvaluation] = useState<'Correct' | 'Approximate' | 'Incorrect' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  if (!fontsLoaded) return null;

  // Dynamic Pending count
  const pendingReviewsCount = reviewsList.filter((r) => r.status === 'Pending').length;

  // Filtered Patients
  const filteredPatients = INITIAL_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.targetDescription.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Filtered Activities
  const filteredActivities = INITIAL_ACTIVITIES.filter((act) => {
    const matchesCategory = activityCategoryFilter === 'ALL' || act.category === activityCategoryFilter;
    const matchesSearch = act.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.sound.toLowerCase().includes(activitySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  // SOAP Save
  const handleSaveSoapNote = () => {
    if (!soapInputs.s && !soapInputs.o && !soapInputs.a && !soapInputs.p) return;
    const newNote: SoapNote = {
      sessionNumber: soapNotes.length + 1,
      date: 'Oct 24, 2026',
      s: soapInputs.s || 'Khyll was engaged. Parent reports 6 days of home practice.',
      o: soapInputs.o || 'Initial /r/ in isolated syllables 15/20 correct (75%).',
      a: soapInputs.a || 'Tongue tip elevation improving with visual lip cue.',
      p: soapInputs.p || 'Continue initial /r/ monosyllabic words next session.',
    };
    setSoapNotes([newNote, ...soapNotes]);
    setSoapInputs({ s: '', o: '', a: '', p: '' });
    setShowSoapForm(false);
    triggerToast('SOAP Note added successfully!');
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

  // Submit Review Action
  const handleSubmitReview = (item: ReviewItem) => {
    setReviewsList(
      reviewsList.map((r) => (r.id === item.id ? { ...r, status: 'Reviewed' as const } : r))
    );
    setSelectedReview(null);
    setReviewEvaluation(null);
    setReviewNotes('');
    triggerToast(`Review submitted for ${item.studentName}!`);
  };

  // --- Profile, Settings & Logout Handlers ---
  const handleSaveProfile = () => {
    setTherapistProfile({ ...editProfileForm });
    setShowEditProfileModal(false);
    triggerToast('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('Please fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePasswordModal(false);
    triggerToast('Password changed successfully!');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setShowMenu(false);
    setShowSettingsModal(false);
    triggerToast('Logged out successfully.');
    router.replace('/login' as any);
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
            <Text style={[styles.backArrowText, { color: colors.text }]}>←</Text>
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
            <Svg width="22" height="18" viewBox="0 0 24 18" fill="none">
              <Path d="M1 1.5H23M1 9H23M1 16.5H23" stroke={colors.hamburger} strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
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
            <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
                stroke="#0284C7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M13.73 21A2 2 0 0 1 10.27 21"
                stroke="#0284C7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
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
                  setActiveTab('activities');
                  setActivitiesView('assign');
                }}
              >
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                  <Circle cx="9" cy="7" r="4" stroke="#0F766E" strokeWidth="2" />
                  <Path d="M2 21V18C2 15.2386 4.23858 13 7 13H11C13.7614 13 16 15.2386 16 18V21" stroke="#0F766E" strokeWidth="2" />
                  <Path d="M16 8L18.5 10.5L22 6" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
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
                  <Text style={[styles.statNumber, { color: '#F97316' }]}>3</Text>
                  <View style={[styles.statBadge, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={[styles.statBadgeText, { color: '#C2410C' }]}>Alert</Text>
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

            {/* Patient Progress Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient Progress</Text>
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
                      <View style={[styles.percentBadge, { backgroundColor: item.badgeBg }]}>
                        <Text style={[styles.percentText, { color: item.badgeTextColor }]}>
                          {item.accuracy}%
                        </Text>
                      </View>
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
              {INITIAL_SUBMISSIONS.map((sub) => (
                <View key={sub.id} style={[styles.submissionItem, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
                  <View style={[styles.patientAvatarSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.avatarTextSmall, { color: colors.text }]}>{sub.initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.subPatientName, { color: colors.text }]}>{sub.name}</Text>
                    <Text style={[styles.subDetails, { color: colors.textSub }]}>
                      {sub.phrase} • {sub.time}
                    </Text>
                    <View style={[styles.subProgressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.subProgressFill, { width: `${sub.progress * 100}%` }]} />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      const match = reviewsList.find((r) => r.studentName.includes(sub.name)) || reviewsList[0];
                      setSelectedReview(match);
                    }}
                  >
                    <Text style={styles.reviewButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              ))}
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
              <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.searchInput, { color: colors.inputText }]}
                  placeholder="Search by name, targets..."
                  placeholderTextColor={colors.textMuted}
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                />
              </View>
              <TouchableOpacity style={[styles.filterDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.filterText, { color: colors.textSub }]}>ALL</Text>
                <Text style={[styles.filterArrow, { color: colors.textMuted }]}>▼</Text>
              </TouchableOpacity>
            </View>

            {filteredPatients.map((item) => (
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
                        {item.accuracy}%
                      </Text>
                    </View>
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
                  <TouchableOpacity style={styles.subTabActive}>
                    <Text style={styles.subTabActiveText}>Activity Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.subTabInactive}>
                    <Text style={styles.subTabInactiveText}>Word Bank (6)</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.activitySearchRow}>
                  <View style={styles.activitySearchInputWrapper}>
                    <Text style={{ marginRight: 6, color: '#94A3B8' }}>🔍</Text>
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
                    onPress={() => {
                      setEditStep(1);
                      setActivitiesView('edit');
                    }}
                  >
                    <Text style={styles.createTaskButtonText}>+ Create a Task</Text>
                  </TouchableOpacity>
                </View>

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
                        </View>
                      </View>

                      <View style={styles.activityCardBody}>
                        <Text style={styles.activityCategoryTag}>{act.category}</Text>
                        <Text style={styles.activityCardTitle}>{act.title}</Text>
                        <Text style={styles.activityCardSub}>{act.subtitle}</Text>
                        <Text style={styles.viewActivityLink}>View activity ›</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* VIEW 2: ACTIVITY PREVIEW */}
            {activitiesView === 'preview' && (
              <View style={styles.previewContainer}>
                <View style={styles.previewTagPill}>
                  <Text style={styles.previewTagText}>{currentActivity.category}</Text>
                </View>
                <Text style={styles.previewTitle}>{currentActivity.title}</Text>
                <Text style={styles.previewSoundDesc}>{currentActivity.sound} - Initial - {currentActivity.language}</Text>

                <Text style={styles.previewSectionTitle}>Instructions</Text>
                <Text style={styles.previewSectionBody}>{currentActivity.instructions}</Text>

                <Text style={styles.previewSectionTitle}>Articulatory Guide</Text>
                <Text style={styles.previewSectionBody}>{currentActivity.articulatoryGuide}</Text>

                <Text style={styles.previewSectionTitle}>Practice content</Text>
                <View style={styles.practiceContentCard}>
                  <View style={styles.practiceContentHeader}>
                    <Text style={styles.practicePositionLabel}>Initial</Text>
                    <View style={styles.targetCountBadge}>
                      <Text style={styles.targetCountText}>{currentActivity.initialWords.length} targets</Text>
                    </View>
                  </View>

                  <View style={styles.wordPillsRow}>
                    {currentActivity.initialWords.map((w) => (
                      <View key={w} style={styles.wordPillPeach}>
                        <Text style={styles.wordPillText}>{w}</Text>
                      </View>
                    ))}
                  </View>

                  {currentActivity.phrases.map((phrase, i) => (
                    <Text key={i} style={styles.phraseBulletText}>{phrase}</Text>
                  ))}
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
                    <Text style={styles.audioPlayIcon}>▶</Text>
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
                    <Text style={styles.videoPlayIcon}>▶</Text>
                  </View>
                </View>

                <View style={styles.previewActionsRow}>
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
                      setAssignActivityName(currentActivity.title);
                      setActivitiesView('assign');
                    }}
                  >
                    <Text style={styles.solidBlueBtnText}>Assign Activity</Text>
                  </TouchableOpacity>
                </View>
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
                          <Text style={styles.dropdownArrow}>▼</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.formLabel}>Practice Level</Text>
                        <View style={styles.dropdownSelector}>
                          <Text style={styles.dropdownValue}>{editPracticeLevel}</Text>
                          <Text style={styles.dropdownArrow}>▼</Text>
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
                        <Text style={styles.solidBlueBtnText}>Next Step ›</Text>
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
                          <Text style={{ marginRight: 6, color: '#94A3B8' }}>🔍</Text>
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search existing from word bank..."
                            placeholderTextColor="#94A3B8"
                            value={wordBankSearch}
                            onChangeText={setWordBankSearch}
                          />
                        </View>

                        <View style={styles.wordChecklistContainer}>
                          {['rabbit', 'red', 'run', 'rain', 'rice', 'rock'].map((w) => {
                            const isChecked = checkedWords.includes(w);
                            return (
                              <TouchableOpacity
                                key={w}
                                style={styles.wordCheckItem}
                                onPress={() => toggleWordCheck(w)}
                              >
                                <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareActive]}>
                                  {isChecked && <Text style={styles.checkmarkIcon}>✓</Text>}
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
                              <TouchableOpacity onPress={() => toggleWordCheck(w)}>
                                <Text style={styles.removableChipX}> ×</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        {checkedWords.map((w) => (
                          <View key={w} style={styles.wordPhraseBlock}>
                            <View style={styles.wordPhraseHeader}>
                              <Text style={styles.wordPhraseTitle}>{w}</Text>
                              <Text style={{ color: '#94A3B8', fontWeight: '700' }}>—</Text>
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
                              <TouchableOpacity onPress={() => setCustomWords(customWords.filter((x) => x !== cw))}>
                                <Text style={styles.removableChipX}> ×</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        <TouchableOpacity
                          style={styles.checkboxRow}
                          onPress={() => setSaveToWordBankChecked(!saveToWordBankChecked)}
                        >
                          <View style={[styles.checkboxSquare, saveToWordBankChecked && styles.checkboxSquareActive]}>
                            {saveToWordBankChecked && <Text style={styles.checkmarkIcon}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxRowLabel}>Save to Word Bank</Text>
                        </TouchableOpacity>

                        <View style={styles.formRowTwoCol}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.formLabel}>Target Sound</Text>
                            <View style={styles.dropdownSelector}>
                              <Text style={styles.dropdownValue}>/r/</Text>
                              <Text style={styles.dropdownArrow}>▼</Text>
                            </View>
                          </View>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.formLabel}>Target Position</Text>
                            <View style={styles.dropdownSelector}>
                              <Text style={styles.dropdownValue}>Initial</Text>
                              <Text style={styles.dropdownArrow}>▼</Text>
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
                            <Text style={styles.symbolBtnText}>+</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.formInput, { flex: 1, marginHorizontal: 8, marginBottom: 0 }]}
                            placeholder="Add another phrase..."
                            value={newPhraseInput}
                            onChangeText={setNewPhraseInput}
                          />
                          <TouchableOpacity style={styles.symbolBtn}>
                            <Text style={styles.symbolBtnText}>—</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.savePhraseBtn} onPress={handleAddCustomPhrase}>
                          <Text style={styles.savePhraseBtnText}>Save Phrase</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <Text style={styles.formLabel}>Visual Material</Text>
                    <View style={styles.uploadDashedBox}>
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>📤</Text>
                      <Text style={styles.uploadMainText}>Upload or browse files here</Text>
                      <Text style={styles.uploadSubText}>MP4 or MOV, up to 100MB per file</Text>
                    </View>

                    <Text style={styles.formLabel}>Preview Audio Model</Text>
                    <View style={styles.audioModelCard}>
                      <View style={styles.audioPlayCircle}>
                        <Text style={styles.audioPlayIcon}>▶</Text>
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
                      style={[styles.solidBlueBtn, { marginTop: 16 }]}
                      onPress={() => setEditStep(3)}
                    >
                      <Text style={styles.solidBlueBtnText}>Continue</Text>
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
                        <Text style={styles.audioPlayIcon}>▶</Text>
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
                        <Text style={styles.videoPlayIcon}>▶</Text>
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
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>

                <Text style={styles.formLabel}>Activity</Text>
                <View style={styles.dropdownSelector}>
                  <Text style={styles.dropdownValue}>{assignActivityName}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>

                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setAssignPreviewExpanded(!assignPreviewExpanded)}
                >
                  <Text style={styles.accordionTitle}>Activity Preview</Text>
                  <Text style={styles.accordionArrow}>{assignPreviewExpanded ? '▲' : '▼'}</Text>
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
                        <Text style={styles.audioPlayIcon}>▶</Text>
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
                        <Text style={styles.videoPlayIcon}>▶</Text>
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
                  <Text style={{ fontSize: 16 }}>📅</Text>
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
                  <Text style={styles.reviewChevron}>›</Text>
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
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Submission Details */}
            <Text style={styles.subtextSmall}>
              Submitted {selectedReview?.submittedDate} • Target Word: "{selectedReview?.targetWord}"
            </Text>

            {/* Audio Playback Box */}
            <View style={[styles.audioModelCard, { marginVertical: 12 }]}>
              <View style={styles.audioPlayCircle}>
                <Text style={styles.audioPlayIcon}>▶</Text>
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
                ]}
                onPress={() => setReviewEvaluation('Correct')}
              >
                <Text
                  style={[
                    styles.ratingBtnText,
                    reviewEvaluation === 'Correct' && { color: '#16A34A', fontWeight: '700' },
                  ]}
                >
                  ✓ Correct
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
                ]}
                onPress={() => setReviewEvaluation('Incorrect')}
              >
                <Text
                  style={[
                    styles.ratingBtnText,
                    reviewEvaluation === 'Incorrect' && { color: '#DC2626', fontWeight: '700' },
                  ]}
                >
                  ✕ Needs Practice
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
                <Text style={styles.closeButtonText}>✕</Text>
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
                        <Text style={styles.playIcon}>▶</Text>
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
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="8" r="4" stroke="#0284C7" strokeWidth="2" />
                    <Path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
                <Text style={styles.menuOptionLabel}>Profile</Text>
                <Text style={styles.menuOptionChevron}>›</Text>
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
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="3" stroke="#0284C7" strokeWidth="2" />
                    <Path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
                      stroke="#0284C7"
                      strokeWidth="2"
                    />
                  </Svg>
                </View>
                <Text style={styles.menuOptionLabel}>Settings</Text>
                <Text style={styles.menuOptionChevron}>›</Text>
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
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M16 17l5-5-5-5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M21 12H9" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
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
          --- MODAL: SETTINGS & ACCOUNT (Screenshot 1 Left) ---
          ========================================== */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={styles.settingsModalContainer}>
          <View style={styles.settingsTopBar}>
            <Text style={styles.settingsNavTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
            {/* Header: Avatar + Doctor Info */}
            <View style={styles.settingsProfileHeaderRow}>
              <View style={styles.settingsAvatarCircle}>
                <Text style={styles.settingsAvatarLetter}>A</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.settingsDoctorName}>{therapistProfile.name}</Text>
                <Text style={styles.settingsDoctorRole}>{therapistProfile.title}</Text>
                <Text style={styles.settingsLicenseText}>License: {therapistProfile.license}</Text>
              </View>
            </View>

            {/* SECTION 1: ACCOUNT */}
            <Text style={styles.settingsSectionTitle}>Account</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingsCardRow}
                onPress={() => {
                  setEditProfileForm({ ...therapistProfile });
                  setShowEditProfileModal(true);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowTitle}>Edit Profile</Text>
                  <Text style={styles.settingsRowSub}>Name, clinic, contact number</Text>
                </View>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.settingsRowDivider} />

              <View style={styles.settingsCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowTitle}>Clinic</Text>
                  <Text style={styles.settingsRowSub}>{therapistProfile.clinic}</Text>
                </View>
              </View>

              <View style={styles.settingsRowDivider} />

              <View style={styles.settingsCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowTitle}>Contact</Text>
                  <Text style={styles.settingsRowSub}>{therapistProfile.contact}</Text>
                </View>
              </View>

              <View style={styles.settingsRowDivider} />

              <View style={styles.settingsCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowTitle}>Email</Text>
                  <Text style={styles.settingsRowSub}>{therapistProfile.email}</Text>
                </View>
              </View>

              <View style={styles.settingsRowDivider} />

              <TouchableOpacity
                style={styles.settingsCardRow}
                onPress={() => setShowChangePasswordModal(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsRowTitle}>Change Password</Text>
                </View>
                <Text style={styles.settingsChevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* SECTION 2: NOTIFICATIONS */}
            <Text style={styles.settingsSectionTitle}>Notifications</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingsCardRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.settingsRowTitle}>New Recordings</Text>
                  <Text style={styles.settingsRowSub}>When a child or parent submits</Text>
                </View>
                <Switch
                  value={newRecordingsToggle}
                  onValueChange={(val) => {
                    setNewRecordingsToggle(val);
                    triggerToast(`New recordings alerts ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#1E293B' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingsRowDivider} />

              <View style={styles.settingsCardRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.settingsRowTitle}>Follow-Up Alerts</Text>
                  <Text style={styles.settingsRowSub}>Patients who need practice follow-up</Text>
                </View>
                <Switch
                  value={followUpAlertsToggle}
                  onValueChange={(val) => {
                    setFollowUpAlertsToggle(val);
                    triggerToast(`Follow-up alerts ${val ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: '#CBD5E1', true: '#1E293B' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* SECTION 3: APPEARANCE */}
            <Text style={styles.settingsSectionTitle}>Appearance</Text>
            <View style={styles.settingsCard}>
              <View style={styles.themeRow}>
                <Text style={styles.settingsRowTitle}>Theme</Text>
                <View style={styles.themeSegmentControl}>
                  {(['Auto', 'Light', 'Dark'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.themeSegmentBtn,
                        themeMode === mode && styles.themeSegmentBtnActive,
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
                          styles.themeSegmentText,
                          themeMode === mode && styles.themeSegmentTextActive,
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* LOG OUT BUTTON (Screenshot 1 bottom) */}
            <TouchableOpacity
              style={styles.settingsLogoutButton}
              activeOpacity={0.8}
              onPress={() => setShowLogoutConfirm(true)}
            >
              <Text style={styles.settingsLogoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==========================================
          --- MODAL: PROFILE VIEW & EDIT ---
          ========================================== */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <SafeAreaView style={styles.settingsModalContainer}>
          <View style={styles.settingsTopBar}>
            <Text style={styles.settingsNavTitle}>Therapist Profile</Text>
            <TouchableOpacity onPress={() => setShowProfileModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
            <View style={styles.profileHeroCard}>
              <View style={styles.profileBigAvatarCircle}>
                <Text style={styles.profileBigAvatarLetter}>A</Text>
              </View>
              <Text style={styles.profileHeroName}>{therapistProfile.name}</Text>
              <Text style={styles.profileHeroRole}>{therapistProfile.title}</Text>
              <View style={styles.licenseBadge}>
                <Text style={styles.licenseBadgeText}>{therapistProfile.license}</Text>
              </View>
            </View>

            <Text style={styles.settingsSectionTitle}>Clinical Credentials</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingsCardRow}>
                <View>
                  <Text style={styles.settingsRowSub}>Clinic Organization</Text>
                  <Text style={styles.settingsRowTitle}>{therapistProfile.clinic}</Text>
                </View>
              </View>
              <View style={styles.settingsRowDivider} />
              <View style={styles.settingsCardRow}>
                <View>
                  <Text style={styles.settingsRowSub}>Contact Number</Text>
                  <Text style={styles.settingsRowTitle}>{therapistProfile.contact}</Text>
                </View>
              </View>
              <View style={styles.settingsRowDivider} />
              <View style={styles.settingsCardRow}>
                <View>
                  <Text style={styles.settingsRowSub}>Email Address</Text>
                  <Text style={styles.settingsRowTitle}>{therapistProfile.email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.previewActionsRow}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => {
                  setEditProfileForm({ ...therapistProfile });
                  setShowEditProfileModal(true);
                }}
              >
                <Text style={styles.outlineBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.solidBlueBtn}
                onPress={() => {
                  setShowProfileModal(false);
                  setShowSettingsModal(true);
                }}
              >
                <Text style={styles.solidBlueBtnText}>Go to Settings ›</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==========================================
          --- MODAL: EDIT PROFILE FORM ---
          ========================================== */}
      <Modal
        visible={showEditProfileModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleText}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Full Name</Text>
            <TextInput
              style={styles.formInput}
              value={editProfileForm.name}
              onChangeText={(text) => setEditProfileForm({ ...editProfileForm, name: text })}
              placeholder="e.g. Dr. Ameer Andres, SLP-CCC"
            />

            <Text style={styles.formLabel}>Clinical Role</Text>
            <TextInput
              style={styles.formInput}
              value={editProfileForm.title}
              onChangeText={(text) => setEditProfileForm({ ...editProfileForm, title: text })}
              placeholder="e.g. Speech-Language Pathologist"
            />

            <Text style={styles.formLabel}>License ID</Text>
            <TextInput
              style={styles.formInput}
              value={editProfileForm.license}
              onChangeText={(text) => setEditProfileForm({ ...editProfileForm, license: text })}
              placeholder="e.g. SLP-PH-2024-8821"
            />

            <Text style={styles.formLabel}>Clinic</Text>
            <TextInput
              style={styles.formInput}
              value={editProfileForm.clinic}
              onChangeText={(text) => setEditProfileForm({ ...editProfileForm, clinic: text })}
              placeholder="e.g. SpeakSteps"
            />

            <Text style={styles.formLabel}>Contact Number</Text>
            <TextInput
              style={styles.formInput}
              value={editProfileForm.contact}
              onChangeText={(text) => setEditProfileForm({ ...editProfileForm, contact: text })}
              placeholder="e.g. +63 9000 000 000"
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={styles.formInput}
              value={editProfileForm.email}
              onChangeText={(text) => setEditProfileForm({ ...editProfileForm, email: text })}
              placeholder="e.g. ameer@speakstep.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={[styles.previewActionsRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.solidBlueBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.solidBlueBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
                <Text style={styles.closeButtonText}>✕</Text>
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
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M16 17l5-5-5-5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M21 12H9" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
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
          <Svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'home' ? (isDark ? '#38BDF8' : '#0284C7') : 'none'}>
            <Path
              d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
              stroke={activeTab === 'home' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Tab 2: Patients */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('patients')}
          activeOpacity={0.7}
        >
          {activeTab === 'patients' && <View style={styles.activeTabIndicator} />}
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <Path
              d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
              stroke={activeTab === 'patients' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle cx="9" cy="7" r="4" stroke={activeTab === 'patients' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted} strokeWidth="2" />
            <Path
              d="M23 21V19C22.9986 18.1771 22.7345 17.3789 22.2476 16.7208C21.7607 16.0628 21.0766 15.5783 20.3 15.34"
              stroke={activeTab === 'patients' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88"
              stroke={activeTab === 'patients' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
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
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <Circle cx="10" cy="8" r="4" stroke={activeTab === 'activities' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted} strokeWidth="2" />
            <Path
              d="M2 20C2 16.6863 5.58172 14 10 14C14.4183 14 18 16.6863 18 20"
              stroke={activeTab === 'activities' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M17 7C17.5 7.8 18 8.8 18 10C18 11.2 17.5 12.2 17 13"
              stroke={activeTab === 'activities' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M20 5C21 6.5 22 8.2 22 10C22 11.8 21 13.5 20 15"
              stroke={activeTab === 'activities' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
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
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke={activeTab === 'reviews' ? (isDark ? '#38BDF8' : '#0284C7') : colors.textMuted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
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
    },
    subTabInactiveText: {
      fontSize: 13,
      color: colors.textSub,
    },
    activitySearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    activitySearchInputWrapper: {
      flex: 1,
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      marginRight: 8,
    },
    createTaskButton: {
      backgroundColor: '#0284C7',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    createTaskButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
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
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.isDark ? '#38BDF8' : '#0284C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      backgroundColor: colors.card,
    },
    outlineBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    solidBlueBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#0284C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    solidBlueBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
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
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      marginRight: 8,
    },
    reviewStatusPending: {
      backgroundColor: colors.peachPillBg,
    },
    reviewStatusReviewed: {
      backgroundColor: '#DCFCE7',
    },
    reviewStatusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    reviewStatusTextPending: {
      color: colors.peachPillText,
    },
    reviewStatusTextReviewed: {
      color: '#16A34A',
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
  });
}
