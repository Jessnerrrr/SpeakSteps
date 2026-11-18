import { Ionicons, Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  centerProfile,
  initialActivity,
  initialNotifications,
  initialPatients,
  initialProfessionals,
  initialReleaseRequests,
  initialRequests,
  type ActivityEntry,
  type Patient,
  type PatientAccess,
  type Professional,
  type ProfessionalRole,
  type ProfessionalStatus,
  type ReleaseRequest,
  type RequestStatus,
  type SuspensionRequest,
} from '../../data/center-admin';
import CreatePatientDialog from '../../components/admin/CreatePatientDialog';
import CreateProfessionalDialog, { type ProfessionalDraft } from '../../components/admin/CreateProfessionalDialog';
import ProfessionalDetails from '../../components/admin/ProfessionalDetails';

type Page = 'Dashboard' | 'Accounts' | 'Students' | 'Activity Logs' | 'Settings';
type Selection = { kind: 'professional'; id: string } | { kind: 'patient'; id: string } | { kind: 'request'; id: string } | { kind: 'release'; id: string } | null;
type Confirmation = { title: string; message: string; actionLabel: string; danger?: boolean; requiresReason?: boolean; run: () => void };

const C = {
  blue: '#0865AD', blueDeep: '#12456C', blueSoft: '#EAF7FF', blueLine: '#C8E5F5',
  ink: '#17364D', muted: '#48657A', subtle: '#60788D', page: '#FFFFFF', white: '#FFFFFF',
  line: '#D9E5EE', green: '#287A4B', greenSoft: '#E8F5EC', yellow: '#8A5B00', yellowSoft: '#FFF4D8',
  orange: '#A94D2D', orangeSoft: '#FFF0E8', red: '#AD3B42', redSoft: '#FDEBED', brown: '#17364D',
};

const NAV: { label: Page; icon: React.ComponentProps<typeof Ionicons>['name']; activeIcon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { label: 'Accounts', icon: 'people-outline', activeIcon: 'people' },
  { label: 'Students', icon: 'person-outline', activeIcon: 'person' },
  { label: 'Activity Logs', icon: 'time-outline', activeIcon: 'time' },
];

const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date.slice(0, 10)}T12:00:00`));
const formatTimestamp = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const professionalAccess = (person: Professional) => person.access ?? (person.status === 'Suspended' ? 'Suspended' : 'Active');
const professionalMembership = (person: Professional) => person.membership ?? (person.status === 'Deactivated' ? 'Deactivated' : 'Active');
const professionalSetup = (person: Professional) => person.invitation === 'Completed' ? 'Completed' : 'Pending';
const studentAccess = (student: Patient) => student.access === 'Setup pending' ? 'Active' : student.access;
const studentSetup = (student: Patient) => student.setup ?? (student.access === 'Setup pending' ? 'Pending' : 'Completed');

function IconButton({ icon, label, onPress, badge }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; badge?: string }) {
  return <TouchableOpacity onPress={onPress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label}><Ionicons name={icon} size={19} color={C.ink} />{badge ? <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{badge}</Text></View> : null}</TouchableOpacity>;
}

function Button({ label, onPress, kind = 'secondary', disabled = false, icon }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'text' | 'danger'; disabled?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.button, kind === 'primary' ? styles.button_primary : kind === 'danger' ? styles.button_danger : kind === 'text' ? styles.button_text : styles.button_secondary, disabled && styles.buttonDisabled]}>{icon ? <Ionicons name={icon} size={16} color={kind === 'primary' ? C.white : C.blue} /> : null}<Text style={[styles.buttonText, kind === 'primary' && styles.buttonTextPrimary, kind === 'danger' && styles.buttonTextDanger, disabled && styles.mutedText]}>{label}</Text></TouchableOpacity>;
}

function Status({ label, tone }: { label: string; tone?: 'green' | 'yellow' | 'red' | 'blue' | 'neutral' }) {
  const color = tone === 'green' ? C.green : tone === 'yellow' ? C.yellow : tone === 'red' ? C.red : tone === 'blue' ? C.blue : C.muted;
  const background = tone === 'green' ? C.greenSoft : tone === 'yellow' ? C.yellowSoft : tone === 'red' ? C.redSoft : tone === 'blue' ? C.blueSoft : '#EDF3F6';
  return <View style={[styles.status, { backgroundColor: background }]}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.statusText, { color }]}>{label}</Text></View>;
}

function Filter({ value, options, onChange, label, getLabel = (option) => option }: { value: string; options: string[]; onChange: (value: string) => void; label: string; getLabel?: (value: string) => string }) {
  return <View style={styles.filterWrap}><Text style={styles.filterLabel}>{label}</Text><SelectControl label={label} value={value} options={options} getLabel={getLabel} onChange={onChange} /></View>;
}

function ColumnFilter({ label, active, options }: { label: string; active?: boolean; options: { label: string; selected: boolean; onSelect: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const menu = <View style={styles.columnFilterMenu}>{options.map((option, index) => <TouchableOpacity key={`${option.label}-${index}`} accessibilityRole="button" accessibilityState={{ selected: option.selected }} onPress={() => { option.onSelect(); setOpen(false); }} style={styles.columnFilterOption}><Text style={[styles.columnFilterOptionText, option.selected && styles.columnFilterOptionSelected]}>{option.label}</Text>{option.selected ? <Ionicons name="checkmark" size={15} color={C.blue} /> : null}</TouchableOpacity>)}</View>;
  return <View style={styles.columnFilterWrap}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Filter ${label}`} accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.columnFilterTrigger}><Text style={styles.columnFilterLabel}>{label}</Text><Ionicons name="chevron-down" size={12} color={active ? C.blue : C.muted} /></TouchableOpacity>
    {open && Platform.OS === 'web' ? menu : null}
    {open && Platform.OS !== 'web' ? <Modal transparent animationType="fade" visible onRequestClose={() => setOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: 'transparent' }]} onPress={() => setOpen(false)}>{menu}</Pressable></Modal> : null}
  </View>;
}

function SearchBox({ value, onChange, placeholder, fullWidth = false }: { value: string; onChange: (value: string) => void; placeholder: string; fullWidth?: boolean }) {
  return <View style={[styles.searchBox, fullWidth && styles.searchBoxFullWidth]}><Ionicons name="search-outline" size={18} color={C.muted} /><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.subtle} style={styles.searchInput} accessibilityLabel={placeholder} returnKeyType="search" /></View>;
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <View style={styles.pageHeader}><View style={styles.pageHeaderText}><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>{action}</View>;
}

export default function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const compact = width < 680;
  const [page, setPage] = useState<Page>('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [patients, setPatients] = useState(initialPatients);
  const [requests, setRequests] = useState(initialRequests);
  const [releaseRequests, setReleaseRequests] = useState(initialReleaseRequests);
  const [activity, setActivity] = useState(initialActivity);
  const recentActivityViewport = useRef({ scrollTop: 0, height: 0, panelTop: 0 });
  const recentActivityRows = useRef(new Map<string, { top: number; height: number }>());
  const [viewedAlertIds, setViewedAlertIds] = useState<Set<string>>(() => new Set());
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selection, setSelection] = useState<Selection>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationReason, setConfirmationReason] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [accountRole, setAccountRole] = useState('All roles');
  const [accountAccess, setAccountAccess] = useState('All access');
  const [accountSetup, setAccountSetup] = useState('All setup');
  const [accountMembership, setAccountMembership] = useState('All memberships');
  const [accountEnrollment, setAccountEnrollment] = useState('All enrollment');
  const [accountIdentifier, setAccountIdentifier] = useState('All IDs');
  const [accountAssignments, setAccountAssignments] = useState('All assignments');
  const [patientAccess, setPatientAccess] = useState('All access');
  const [patientEnrollment, setPatientEnrollment] = useState('Enrolled');
  const [patientTherapist, setPatientTherapist] = useState('All therapists');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountFiltersOpen, setAccountFiltersOpen] = useState(false);
  const [accountPageState, setAccountPageState] = useState({ page: 0, filterKey: '' });
  const [pendingRequestsOnly, setPendingRequestsOnly] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationAnchorRef = useRef<React.ElementRef<typeof View>>(null);
  const [notificationPosition, setNotificationPosition] = useState({ top: 72, left: 12 });
  const [showProfile, setShowProfile] = useState(false);
  const profileCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [attentionPage, setAttentionPage] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState<'All' | 'Unread'>('All');
  const [logCategory, setLogCategory] = useState('All activity');
  const [logSearch, setLogSearch] = useState('');
  const [accountNewRole, setAccountNewRole] = useState<ProfessionalRole>('Therapist');
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);
  const [offboardingId, setOffboardingId] = useState<string | null>(null);
  const [offboardingChoices, setOffboardingChoices] = useState<Record<string, string>>({});
  const [offboardingReason, setOffboardingReason] = useState('');
  const [assignmentChoicesOpen, setAssignmentChoicesOpen] = useState<string | null>(null);
  const [teacherChoicesOpen, setTeacherChoicesOpen] = useState<string | null>(null);
  const [releaseReplacement, setReleaseReplacement] = useState('');
  const [releaseNote, setReleaseNote] = useState('');
  const [patientAccessReason, setPatientAccessReason] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [centerSettings, setCenterSettings] = useState(centerProfile);

  const openProfileMenu = () => {
    if (profileCloseTimer.current) clearTimeout(profileCloseTimer.current);
    setShowProfile(true);
  };
  const scheduleProfileMenuClose = () => {
    if (profileCloseTimer.current) clearTimeout(profileCloseTimer.current);
    profileCloseTimer.current = setTimeout(() => setShowProfile(false), 120);
  };
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('../../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../../assets/fonts/Geist-SemiBold.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3200);
  };
  const addLog = (title: string, detail: string, category: ActivityEntry['category'], actor = 'Center admin') => {
    setActivity((current) => [{ id: `evt-${Date.now()}`, title, detail, actor, date: new Date().toISOString(), category, read: false }, ...current]);
  };
  const addNotification = (title: string, detail: string) => {
    setNotifications((current) => [{ id: `note-${Date.now()}`, title, detail, date: new Date().toISOString(), read: false }, ...current]);
  };
  const markVisibleActivityRead = () => {
    const { scrollTop, height, panelTop } = recentActivityViewport.current;
    if (height <= 0) return;
    const recentIds = new Set(orderedActivity.slice(0, 5).map((entry) => entry.id));
    const visibleIds = new Set<string>();
    recentActivityRows.current.forEach(({ top, height: rowHeight }, id) => {
      if (!recentIds.has(id)) return;
      const rowTop = panelTop + top;
      const visibleHeight = Math.max(0, Math.min(rowTop + rowHeight, scrollTop + height) - Math.max(rowTop, scrollTop));
      if (visibleHeight >= Math.min(rowHeight / 2, 24)) visibleIds.add(id);
    });
    if (visibleIds.size > 0) {
      setActivity((current) => current.some((entry) => visibleIds.has(entry.id) && !entry.read)
        ? current.map((entry) => visibleIds.has(entry.id) && !entry.read ? { ...entry, read: true } : entry)
        : current);
    }
  };
  const onRecentActivityViewportLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    recentActivityViewport.current.height = nativeEvent.layout.height;
    markVisibleActivityRead();
  };
  const onRecentActivityScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    recentActivityViewport.current.scrollTop = nativeEvent.contentOffset.y;
    recentActivityViewport.current.height = nativeEvent.layoutMeasurement.height;
    markVisibleActivityRead();
  };
  const onRecentActivityPanelLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    recentActivityViewport.current.panelTop = nativeEvent.layout.y;
    markVisibleActivityRead();
  };
  const goTo = (target: Page) => {
    setPage(target); setMenuOpen(false); setSelection(null);
    if (target === 'Students') setSearch('');
    if (target === 'Accounts') setViewedAlertIds((current) => new Set([...current, ...professionals.filter((person) => person.invitation === 'Pending' || person.invitation === 'Failed').map((person) => person.id), ...patients.filter((student) => studentSetup(student) === 'Pending').map((student) => student.id)]));
    if (target === 'Students') setViewedAlertIds((current) => new Set([...current, ...requests.filter((request) => request.status === 'Pending').map((request) => request.id), ...releaseRequests.filter((request) => request.status === 'Pending' || request.status === 'More information requested').map((request) => request.id), ...patients.filter((student) => student.enrollment === 'Enrolled' && student.therapistId && professionals.some((person) => person.id === student.therapistId && person.status === 'Suspended')).map((student) => student.id)]));
    if (target === 'Activity Logs') setActivity((current) => current.map((entry) => ({ ...entry, read: true })));
  };

  const activeTherapists = professionals.filter((person) => person.role === 'Therapist' && person.status === 'Active').sort((a, b) => patients.filter((patient) => patient.therapistId === a.id && patient.enrollment === 'Enrolled').length - patients.filter((patient) => patient.therapistId === b.id && patient.enrollment === 'Enrolled').length || a.name.localeCompare(b.name));
  const activeTeachers = professionals.filter((person) => person.role === 'Teacher' && person.status === 'Active');
  const therapistCounts = activeTherapists.map((person) => ({ id: person.id, name: person.name, assigned: patients.filter((patient) => patient.therapistId === person.id && patient.enrollment === 'Enrolled').length }));
  const activeTherapistFor = (id: string | null) => professionals.find((person) => person.id === id)?.name ?? 'Unassigned';
  const pendingRequests = requests.filter((request) => request.status === 'Pending');
  const pendingReleaseRequests = releaseRequests.filter((request) => request.status === 'Pending' || request.status === 'More information requested');
  const pendingInvitations = professionals.filter((person) => person.invitation === 'Pending' || person.invitation === 'Failed');
  const pendingPatientSetups = patients.filter((patient) => studentSetup(patient) === 'Pending');
  const pendingAccountSetups = pendingInvitations.length + pendingPatientSetups.length;
  const reassignmentPatients = patients.filter((patient) => patient.enrollment === 'Enrolled' && patient.therapistId && professionals.some((person) => person.id === patient.therapistId && person.status === 'Suspended'));
  const unreadCount = notifications.filter((item) => !item.read).length;
  const shownNotifications = notifications.filter((item) => notificationFilter === 'All' || !item.read);
  const attentionItems = [
    ...pendingReleaseRequests.map((request) => {
      const patient = patients.find((item) => item.id === request.patientId);
      const therapist = professionals.find((item) => item.id === request.therapistId);
      return { key: request.id, title: 'Student release request', detail: `${therapist?.name ?? 'A Therapist'} requested release of ${patient?.name ?? 'a student'}. ${request.reason}.`, date: `Submitted ${formatDate(request.submitted)}`, icon: 'document-text-outline' as const, tone: 'yellow' as const, action: 'Review', run: () => { setPendingRequestsOnly(true); setReleaseReplacement(''); setReleaseNote(''); goTo('Students'); setSelection({ kind: 'release', id: request.id }); } };
    }),
    ...pendingRequests.map((request) => {
      const patient = patients.find((item) => item.id === request.patientId);
      const therapist = professionals.find((item) => item.id === request.therapistId);
      return { key: request.id, title: 'Student access request', detail: `${therapist?.name ?? 'A Therapist'} requested suspension for ${patient?.name ?? 'a student'}.`, date: `Submitted ${formatDate(request.submitted)}`, icon: 'chatbubble-ellipses-outline' as const, tone: 'yellow' as const, action: 'Review', run: () => { setPendingRequestsOnly(true); setPatientAccessReason(''); goTo('Students'); setSelection({ kind: 'request', id: request.id }); } };
    }),
    ...reassignmentPatients.map((patient) => ({ key: patient.id, title: 'Reassignment needed', detail: `${patient.name} is assigned to suspended Therapist ${activeTherapistFor(patient.therapistId)}.`, date: '', icon: 'git-branch-outline' as const, tone: 'orange' as const, action: 'Review', run: () => { setPatientEnrollment('All enrollment'); setPatientAccess('All access'); goTo('Students'); setSearch(patient.name); setSelection({ kind: 'patient', id: patient.id }); } })),
    ...pendingPatientSetups.map((patient) => ({ key: patient.id, title: 'Student account setup pending', detail: `${patient.name} · Guardian invitation setup is pending.`, date: '', icon: 'mail-unread-outline' as const, tone: 'blue' as const, action: 'Review', run: () => { setPatientEnrollment('All enrollment'); setPatientAccess('All access'); goTo('Students'); setSearch(patient.name); setSelection({ kind: 'patient', id: patient.id }); } })),
    ...pendingInvitations.map((person) => ({ key: person.id, title: person.invitation === 'Failed' ? 'Invitation delivery issue' : 'Account setup pending', detail: `${person.name} · ${person.role} · ${person.email}`, date: '', icon: 'mail-unread-outline' as const, tone: 'blue' as const, action: 'Review', run: () => { goTo('Accounts'); setAccountRole(person.role); setAccountSetup('Pending'); setAccountSearch(person.name); setSelection({ kind: 'professional', id: person.id }); } })),
  ];

  const visibleProfessionals = professionals.filter((person) => {
    const query = accountSearch.trim().toLowerCase();
    const identifier = person.role === 'Therapist' ? person.staffId : person.professionalIdentifier;
    const assignedCount = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    return (accountRole === 'All roles' || accountRole === person.role)
      && accountEnrollment === 'All enrollment'
      && (accountAccess === 'All access' || professionalAccess(person) === accountAccess)
      && (accountSetup === 'All setup' || professionalSetup(person) === accountSetup)
      && (accountMembership === 'All memberships' || professionalMembership(person) === accountMembership)
      && (accountIdentifier === 'All IDs' || (accountIdentifier === 'Available ID' ? Boolean(identifier?.trim()) : !identifier?.trim()))
      && (accountAssignments === 'All assignments' || (accountAssignments === 'Assigned' ? assignedCount > 0 : assignedCount === 0))
      && (!query || [person.name, person.email, person.role, professionalAccess(person), professionalSetup(person), person.staffId ?? '', person.professionalIdentifier ?? ''].some((value) => value.toLowerCase().includes(query)));
  });
  const visibleAccountPatients = patients.filter((patient) => {
    const query = accountSearch.trim().toLowerCase();
    const setupStatus = studentSetup(patient);
    return (accountRole === 'All roles' || accountRole === 'Student')
      && accountMembership === 'All memberships'
      && (accountEnrollment === 'All enrollment' || patient.enrollment === accountEnrollment)
      && (accountAccess === 'All access' || studentAccess(patient) === accountAccess)
      && (accountSetup === 'All setup' || accountSetup === setupStatus)
      && accountIdentifier !== 'Missing ID'
      && accountAssignments === 'All assignments'
      && (!query || [patient.name, patient.studentNumber, patient.guardianContact, 'student'].some((value) => value.toLowerCase().includes(query)));
  });
  const accountFilterTags = [
    ...(accountIdentifier !== 'All IDs' ? [{ label: `ID: ${accountIdentifier === 'Available ID' ? 'Available' : 'Missing'}`, clear: () => setAccountIdentifier('All IDs') }] : []),
    ...(accountRole !== 'All roles' ? [{ label: `Role: ${accountRole}`, clear: () => setAccountRole('All roles') }] : []),
    ...(accountAccess !== 'All access' ? [{ label: `Access: ${accountAccess}`, clear: () => setAccountAccess('All access') }] : []),
    ...(accountSetup !== 'All setup' ? [{ label: `Setup: ${accountSetup}`, clear: () => setAccountSetup('All setup') }] : []),
    ...(accountMembership !== 'All memberships' ? [{ label: `Membership: ${accountMembership}`, clear: () => setAccountMembership('All memberships') }] : []),
    ...(accountEnrollment !== 'All enrollment' ? [{ label: `Enrollment: ${accountEnrollment}`, clear: () => setAccountEnrollment('All enrollment') }] : []),
    ...(accountAssignments !== 'All assignments' ? [{ label: `Assignments: ${accountAssignments}`, clear: () => setAccountAssignments('All assignments') }] : []),
  ];
  const accountViewCriteria = [
    ...accountFilterTags.map(({ label }) => label),
    ...(accountSearch.trim() ? [`Search: “${accountSearch.trim()}”`] : []),
  ];
  const accountViewSummary = accountViewCriteria.length ? `Showing ${accountViewCriteria.join(' · ')}` : 'Showing all accounts';
  const resetAccountFilters = () => { setAccountRole('All roles'); setAccountAccess('All access'); setAccountSetup('All setup'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountIdentifier('All IDs'); setAccountAssignments('All assignments'); };
  const accountFilterKey = [accountSearch, accountRole, accountAccess, accountSetup, accountMembership, accountEnrollment, accountIdentifier, accountAssignments].join('|');
  const accountPage = accountPageState.filterKey === accountFilterKey ? accountPageState.page : 0;
  const setAccountPage = (page: number) => setAccountPageState({ page, filterKey: accountFilterKey });
  const accountRows = [
    ...visibleProfessionals.map((person) => ({ kind: 'professional' as const, person })),
    ...visibleAccountPatients.map((patient) => ({ kind: 'student' as const, patient })),
  ];
  const accountPageCount = Math.ceil(accountRows.length / 10);
  const accountPageIndex = Math.min(accountPage, Math.max(0, accountPageCount - 1));
  const accountPageRows = accountRows.slice(accountPageIndex * 10, (accountPageIndex + 1) * 10);
  const accountPageProfessionals = accountPageRows.flatMap((row) => row.kind === 'professional' ? [row.person] : []);
  const accountPageStudents = accountPageRows.flatMap((row) => row.kind === 'student' ? [row.patient] : []);
  const accountPageNumbers = Array.from({ length: Math.min(5, accountPageCount) }, (_, index) => {
    const first = Math.max(0, Math.min(accountPageIndex - 2, accountPageCount - 5));
    return first + index;
  });
  const visiblePatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase();
    return (patientEnrollment === 'All enrollment' || patient.enrollment === patientEnrollment)
      && (patientAccess === 'All access' || studentAccess(patient) === patientAccess)
      && (patientTherapist === 'All therapists' || patient.therapistId === patientTherapist)
      && (!query || [patient.name, patient.studentNumber, activeTherapistFor(patient.therapistId), professionals.find((person) => person.id === patient.teacherId)?.name ?? ''].some((value) => value.toLowerCase().includes(query)));
  });
  const orderedActivity = [...activity].sort((a, b) => b.date.localeCompare(a.date));
  const visibleLogs = orderedActivity.filter((entry) => (logCategory === 'All activity' || entry.category === logCategory)
    && (!logSearch.trim() || [entry.title, entry.detail, entry.actor].some((value) => value.toLowerCase().includes(logSearch.trim().toLowerCase()))));

  const makeProfessional = (draft: ProfessionalDraft) => {
    const profile = draft.role === 'Teacher' ? (({ lookupStaffId: _lookupStaffId, ...teacherRecord }) => teacherRecord)(draft) : draft;
    const person: Professional = { id: `pro-${Date.now()}`, ...profile, access: 'Active', membership: 'Active', status: 'Active', invitation: 'Pending', joined: new Date().toISOString().slice(0, 10), invitationUpdated: new Date().toISOString().slice(0, 10) };
    setProfessionals((current) => [person, ...current]);
    addLog(`${draft.role} account created`, `${person.name} · ${draft.role === 'Therapist' ? `Staff ID ${person.staffId}` : `Professional ID ${person.professionalIdentifier}`} · setup pending`, 'Account');
    addNotification('Invitation awaiting setup', `${person.name} can complete account setup after receiving an invitation.`);
    setNewAccountOpen(false); setCreatePatientOpen(false); setPage('Accounts'); setAccountRole(draft.role); setAccountAccess('All access'); setAccountSetup('All setup'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountSearch('');
    setAccountPage(0);
    setSelection({ kind: 'professional', id: person.id });
    flash(`${person.name} added. Account setup is pending.`);
  };

  const makePatient = (record: { studentNumber: string; name: string; grade: string; section: string; guardian: string; guardianEmail: string; guardianPhone: string; school: string }, teacherId: string, therapistId: string) => {
    const patient: Patient = {
      id: `pt-${Date.now()}`, name: record.name, studentNumber: record.studentNumber, therapistId,
      access: 'Active', setup: 'Pending', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: new Date().toISOString().slice(0, 10),
      guardian: record.guardian, guardianContact: record.guardianEmail, school: record.school, grade: record.grade, section: record.section, teacherId,
    };
    setPatients((current) => [patient, ...current]);
    addLog('Student account created', `${patient.name} · ${patient.studentNumber}; invitation pending`, 'Student');
    addNotification('Student account created', `${patient.name} is assigned to ${activeTherapistFor(therapistId)}. Guardian setup invitation is pending.`);
    addNotification('New student assignment', `${patient.name} · ${patient.studentNumber} was assigned to ${activeTherapistFor(therapistId)}.`);
    setAccountSearch(''); setAccountRole('Student'); setAccountAccess('All access'); setAccountSetup('All setup'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setPatientEnrollment('Enrolled'); setPage('Accounts');
    setAccountPage(0);
    flash(`${patient.name} added. The setup invitation is simulated.`);
  };

  const resendInvitation = (person: Professional) => {
    if (person.invitation === 'Completed') { flash(`${person.name} has already completed account setup.`); return; }
    setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, invitation: 'Pending', invitationUpdated: new Date().toISOString().slice(0, 10) } : item));
    addLog('Invitation simulated', `${person.name} · ${person.email}`, 'Account');
    flash(`Invitation status updated for ${person.name}. No email was sent.`);
  };

  const setProfessionalStatus = (person: Professional, next: ProfessionalStatus, suspensionReason = '') => {
    const assignedStudents = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled');
    const hasPatients = assignedStudents.length > 0;
    if (next === 'Suspended') {
      if (!suspensionReason.trim()) { flash('Enter a reason to suspend access.'); return; }
      setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: 'Suspended', access: 'Suspended', membership: professionalMembership(item) } : item));
      addLog('Professional access suspended', `${person.name} · ${person.role} · ${suspensionReason}`, 'Account');
      if (person.role === 'Therapist' && hasPatients) addNotification('Students need reassignment', `${person.name} was suspended; assigned students remain linked until reassigned.`);
      setSelection(null);
      flash(`${person.name}’s access is suspended.`);
      return;
    }
    if (person.role === 'Therapist' && next === 'Deactivated' && hasPatients) {
      setSelection(null);
      setOffboardingId(person.id);
      setOffboardingChoices({});
      setOffboardingReason('');
      return;
    }
    if (person.role === 'Teacher' && next === 'Deactivated' && hasPatients) {
      setPatientEnrollment('Enrolled'); setSelection(null); goTo('Students'); setSearch(person.name);
      flash(`Reassign ${assignedStudents.length} enrolled student${assignedStudents.length === 1 ? '' : 's'} to another Teacher before deactivating ${person.name}.`);
      return;
    }
    if (next === 'Active') {
      setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: 'Active', access: 'Active', membership: 'Active' } : item));
      addLog('Professional access reactivated', `${person.name} · ${person.role}`, 'Account');
      setSelection(null);
      flash(`${person.name}’s access is active again.`);
      return;
    }
    const verb = 'Deactivate account';
    setConfirmationReason('');
    setConfirmation({
      title: `${verb}: ${person.name}?`,
      message: `This deactivates ${person.name}’s center membership while preserving the account history.`,
      actionLabel: verb,
      danger: true,
      requiresReason: true,
      run: () => {
        if (!confirmationReason.trim()) { flash('Enter a reason to deactivate this account.'); return; }
        setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: next, access: professionalAccess(item), membership: 'Deactivated' } : item));
        addLog('Professional account deactivated', `${person.name} · ${person.role} · ${confirmationReason.trim()}`, 'Account');
        setConfirmation(null); setSelection(null);
        flash(`${person.name}’s account is deactivated.`);
      },
    });
  };

  const finalizeOffboarding = () => {
    if (!offboardingId) return;
    if (!offboardingReason.trim()) { flash('Enter a reason to deactivate this account.'); return; }
    const person = professionals.find((item) => item.id === offboardingId);
    const assigned = patients.filter((patient) => patient.therapistId === offboardingId && patient.enrollment === 'Enrolled');
    const missing = assigned.find((patient) => !offboardingChoices[patient.id]);
    if (missing) { setAssignmentChoicesOpen(missing.id); return; }
    setPatients((current) => current.map((patient) => offboardingChoices[patient.id] ? { ...patient, therapistId: offboardingChoices[patient.id] } : patient));
    setProfessionals((current) => current.map((item) => item.id === offboardingId ? { ...item, status: 'Deactivated', membership: 'Deactivated' } : item));
    assigned.forEach((patient) => addLog('Student reassigned', `${patient.name} · ${person?.name} → ${activeTherapistFor(offboardingChoices[patient.id])}`, 'Student'));
    addLog('Professional account deactivated', `${person?.name} · ${offboardingReason.trim()}`, 'Account');
    setOffboardingId(null); setOffboardingReason(''); setSelection(null); setAssignmentChoicesOpen(null);
    flash(`${person?.name} deactivated after student reassignment.`);
  };

  const reassignPatient = (patient: Patient, therapistId: string) => {
    const replacement = professionals.find((person) => person.id === therapistId && person.role === 'Therapist' && person.status === 'Active');
    if (!replacement) { flash('Choose an active Therapist to receive this student.'); return; }
    if (patient.therapistId === therapistId) { flash(`${patient.name} is already assigned to ${replacement.name}.`); return; }
    const previous = activeTherapistFor(patient.therapistId);
    setConfirmation({ title: `Reassign ${patient.name}?`, message: `Move this student from ${previous} to ${replacement.name}? Their account and history stay unchanged.`, actionLabel: 'Reassign student', run: () => {
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, therapistId } : item));
      addLog('Student reassigned', `${patient.name} · ${previous} → ${replacement.name}`, 'Student');
      addNotification('Student assignment updated', `${patient.name} is now assigned to ${replacement.name}.`);
      setConfirmation(null); setAssignmentChoicesOpen(null); setSelection({ kind: 'patient', id: patient.id });
      flash(`${patient.name} reassigned to ${replacement.name}.`);
    } });
  };

  const changeTeacher = (patient: Patient, teacherId: string) => {
    if (patient.teacherId === teacherId) { setTeacherChoicesOpen(null); return; }
    const teacher = professionals.find((person) => person.id === teacherId);
    if (!teacher || teacher.role !== 'Teacher' || teacher.status !== 'Active') return;
    setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, teacherId } : item));
    addLog('Teacher assignment changed', `${patient.name} · ${teacher.name}`, 'Student');
    addNotification('Teacher assignment updated', `${patient.name} is now assigned to ${teacher.name}.`);
    setTeacherChoicesOpen(null); flash(`${patient.name} is now assigned to ${teacher.name}.`);
  };

  const changePatientAccess = (patient: Patient, next: PatientAccess) => {
    if (next === 'Setup pending') return;
    if (next === 'Suspended' && !patientAccessReason.trim()) { flash('Add a reason before suspending student access.'); return; }
    const actionLabel = next === 'Suspended' ? 'Suspend access' : 'Reactivate access';
    setConfirmation({
      title: `${actionLabel}: ${patient.name}?`,
      message: next === 'Suspended'
        ? `This prevents ${patient.name} from signing in. Enrollment, identity details, and Therapist assignment remain unchanged. Reason: ${patientAccessReason.trim()}`
        : `This restores account access for ${patient.name}. Archived enrollment must be restored separately.`,
      actionLabel,
      danger: next === 'Suspended',
      run: () => {
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, access: next } : item));
        addLog(next === 'Suspended' ? 'Student access suspended' : 'Student access reactivated', `${patient.name} · ${patient.studentNumber}${next === 'Suspended' ? ` · ${patientAccessReason.trim()}` : ''}`, 'Student');
        setConfirmation(null); setPatientAccessReason(''); setSelection({ kind: 'patient', id: patient.id });
        flash(`Access ${next === 'Suspended' ? 'suspended' : 'reactivated'} for ${patient.name}.`);
      },
    });
  };

  const archivePatient = (patient: Patient, restore = false) => {
    const next = restore ? 'Enrolled' : 'Archived';
    setConfirmation({
      title: `${restore ? 'Restore' : 'Archive'} ${patient.name}?`,
      message: restore ? 'This returns the student to the enrolled directory. Account access stays in its current state.' : 'This removes the student from active enrollment counts. Their account state and historical information are preserved.',
      actionLabel: restore ? 'Restore student' : 'Archive student', danger: !restore,
      run: () => {
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, enrollment: next } : item));
        addLog(restore ? 'Student enrollment restored' : 'Student archived', `${patient.name} · ${patient.studentNumber}`, 'Student');
        setConfirmation(null); setSelection({ kind: 'patient', id: patient.id });
        flash(`${patient.name} ${restore ? 'restored to enrollment' : 'archived'}.`);
      },
    });
  };

  const resolveRequest = (request: SuspensionRequest, status: Exclude<RequestStatus, 'Pending'>) => {
    if (request.status !== 'Pending') { flash('This request has already been resolved.'); return; }
    const patient = patients.find((item) => item.id === request.patientId);
    const therapist = professionals.find((item) => item.id === request.therapistId);
    if (status === 'Approved' && patient?.enrollment === 'Archived') { flash('Restore the student’s enrollment before approving this request.'); return; }
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
    if (status === 'Approved' && patient) setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, access: 'Suspended' } : item));
    const decision = status === 'Approved' ? 'approved' : 'declined';
    addLog(`Suspension request ${decision}`, `${patient?.name ?? 'Patient'} · request ${request.id} · by ${therapist?.name ?? 'Therapist'}`, 'Request');
    addNotification(`Request ${decision}`, `${patient?.name ?? 'Patient'} · request ${request.id}`);
    setSelection(null); flash(status === 'Approved' ? `Access suspended for ${patient?.name}.` : `Request declined. ${patient?.name}’s access is unchanged.`);
  };

  const resolveReleaseRequest = (request: ReleaseRequest, decision: 'More information requested' | 'Approved & reassigned' | 'Approved & archived' | 'Declined') => {
    const patient = patients.find((item) => item.id === request.patientId);
    if (!patient) { flash('This student record is no longer available.'); return; }
    if (request.status !== 'Pending' && request.status !== 'More information requested') { flash('This request has already been resolved.'); return; }
    if (decision === 'Approved & reassigned' && (!releaseReplacement || releaseReplacement === patient.therapistId)) { flash('Choose an active replacement Therapist first.'); return; }
    if ((decision === 'More information requested' || decision === 'Declined') && !releaseNote.trim()) { flash('Add a short note so the Therapist knows what needs attention.'); return; }
    if (decision === 'Approved & archived' && patient.enrollment !== 'Archived') {
      setConfirmation({ title: `Approve & archive ${patient.name}?`, message: 'This records the student as no longer enrolled. Their account and history remain in the center, and account access is unchanged.', actionLabel: 'Approve & archive', danger: true, run: () => { applyReleaseDecision(request, decision); setConfirmation(null); } });
      return;
    }
    applyReleaseDecision(request, decision);
  };

  const applyReleaseDecision = (request: ReleaseRequest, decision: ReleaseRequest['status']) => {
    const patient = patients.find((item) => item.id === request.patientId);
    if (!patient) return;
    setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: decision } : item));
    if (decision === 'Approved & reassigned') {
      const replacement = professionals.find((person) => person.id === releaseReplacement);
      if (!replacement || replacement.role !== 'Therapist' || replacement.status !== 'Active') return;
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, therapistId: replacement.id } : item));
      addLog('Student release approved & reassigned', `${patient.name} · ${replacement.name}`, 'Request');
    } else if (decision === 'Approved & archived') {
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, enrollment: 'Archived' } : item));
      addLog('Student release approved & archived', `${patient.name} · ${request.reason}`, 'Request');
    } else if (decision === 'More information requested') {
      addLog('More information requested', `${patient.name} · ${releaseNote.trim() || 'Clarification requested'}`, 'Request');
      addNotification('Release request needs more information', `${patient.name} · ${releaseNote.trim() || 'Please add supporting context.'}`);
    } else {
      addLog('Student release request declined', `${patient.name} · ${releaseNote.trim() || 'Existing assignment retained'}`, 'Request');
    }
    if (decision.startsWith('Approved')) addNotification('Student release request resolved', `${patient.name} · ${decision.toLowerCase()}.`);
    setReleaseReplacement(''); setReleaseNote(''); setSelection(null);
    flash(decision === 'More information requested' ? 'More information requested. The current assignment remains unchanged.' : `Release request ${decision.toLowerCase()}.`);
  };

  const openDashboardMetric = (target: 'accounts' | 'students' | 'requests') => {
    if (target === 'accounts') { goTo('Accounts'); setAccountRole('All roles'); setAccountAccess('All access'); setAccountSetup('Pending'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); }
    else if (target === 'students') { goTo('Students'); setPatientEnrollment('Enrolled'); setPatientAccess('All access'); setPatientTherapist('All therapists'); setPendingRequestsOnly(false); }
    else { setPendingRequestsOnly(true); setPatientEnrollment('All enrollment'); setPatientAccess('All access'); goTo('Students'); setPendingRequestsOnly(true); }
  };

  const openNotification = (item: (typeof notifications)[number]) => {
    setNotifications((current) => current.map((note) => note.id === item.id ? { ...note, read: true } : note));
    setShowNotifications(false);
    const student = patients.find((person) => item.detail.includes(person.name));
    const professional = professionals.find((person) => item.detail.includes(person.name));
    const text = `${item.title} ${item.detail}`.toLowerCase();

    if (text.includes('invitation') || text.includes('setup')) {
      if (student) {
        goTo('Students'); setPatientEnrollment('All enrollment'); setPatientAccess('All access'); setSearch(student.name);
      } else {
        goTo('Accounts'); setAccountRole(professional?.role ?? 'All roles'); setAccountAccess('All access'); setAccountSetup('Pending'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountSearch(professional?.name ?? '');
      }
      return;
    }
    if (text.includes('reassign')) {
      goTo('Students'); setPatientEnrollment('All enrollment'); setPatientAccess('All access'); setSearch(student?.name ?? '');
      return;
    }
    if (text.includes('request') || text.includes('suspend') || text.includes('release')) {
      const hasOpenRequest = requests.some((request) => request.status === 'Pending' && (!student || request.patientId === student.id))
        || releaseRequests.some((request) => (request.status === 'Pending' || request.status === 'More information requested') && (!student || request.patientId === student.id));
      setPatientEnrollment('All enrollment'); setPatientAccess('All access'); goTo('Students'); setPendingRequestsOnly(hasOpenRequest);
      return;
    }
    if (student) {
      goTo('Students'); setPatientEnrollment('All enrollment'); setPatientAccess('All access'); setSearch(student.name);
      return;
    }
    if (professional) {
      goTo('Accounts'); setAccountRole(professional.role); setAccountSearch(professional.name);
      return;
    }
    goTo('Activity Logs'); setLogSearch(item.title);
  };

  const selectedProfessional = selection?.kind === 'professional' ? professionals.find((person) => person.id === selection.id) : undefined;
  const selectedProfessionalStudents = selectedProfessional ? patients.filter((patient) => (selectedProfessional.role === 'Therapist' ? patient.therapistId === selectedProfessional.id : patient.teacherId === selectedProfessional.id)) : [];
  const selectedPatient = selection?.kind === 'patient' ? patients.find((patient) => patient.id === selection.id) : undefined;
  const selectedRequest = selection?.kind === 'request' ? requests.find((request) => request.id === selection.id) : undefined;
  const selectedRelease = selection?.kind === 'release' ? releaseRequests.find((request) => request.id === selection.id) : undefined;
  const selectedRequestPatient = selectedRequest ? patients.find((patient) => patient.id === selectedRequest.patientId) : undefined;
  const selectedRequestTherapist = selectedRequest ? professionals.find((person) => person.id === selectedRequest.therapistId) : undefined;
  const selectedReleasePatient = selectedRelease ? patients.find((patient) => patient.id === selectedRelease.patientId) : undefined;
  const selectedReleaseTherapist = selectedRelease ? professionals.find((person) => person.id === selectedRelease.therapistId) : undefined;
  const offboardingPerson = professionals.find((person) => person.id === offboardingId);
  const offboardingPatients = patients.filter((patient) => patient.therapistId === offboardingId && patient.enrollment === 'Enrolled');
  const eligibleReplacements = (patientId: string) => activeTherapists.filter((person) => person.id !== patients.find((item) => item.id === patientId)?.therapistId);

  if (!fontsLoaded) return null;

  const avatar = (name: string, color = C.blue) => <View style={[styles.avatar, { backgroundColor: color === C.blue ? C.blueSoft : color + '18' }]}><Text style={[styles.avatarText, { color }]}>{initials(name)}</Text></View>;
  const professionalRow = (person: Professional) => {
    const assigned = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    const identifier = person.role === 'Therapist' ? person.staffId ?? 'Not recorded' : person.professionalIdentifier ?? 'Unavailable';
    return <Pressable key={person.id} onPress={() => setSelection({ kind: 'professional', id: person.id })} style={({ hovered }) => [styles.tableRow, hovered && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View ${person.name}, ${person.role}`}>
      <View style={styles.personCell}>{avatar(person.name)}<View style={styles.personText}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.email}</Text></View></View>
      <Text style={[styles.tableCell, styles.idTableCell]} numberOfLines={1}>{identifier}</Text>
      <Text style={[styles.tableCell, styles.roleTableCell]}>{person.role}</Text>
      <View style={[styles.tableCell, styles.statusTableCell]}><Status label={professionalAccess(person)} tone={professionalAccess(person) === 'Active' ? 'green' : 'red'} />{professionalMembership(person) === 'Deactivated' ? <Text style={styles.secondaryText}>Membership deactivated</Text> : null}</View>
      <View style={[styles.tableCell, styles.setupTableCell]}>{person.invitation === 'Completed' ? <Text style={styles.secondaryText}>Completed</Text> : <Status label={person.invitation === 'Failed' ? 'Failed' : 'Pending'} tone={person.invitation === 'Failed' ? 'red' : 'yellow'} />}</View>
      <Text style={[styles.tableCell, styles.assignmentTableCell]}>{assigned}</Text>
      <View style={styles.rowAction}><Ionicons name="chevron-forward" size={17} color={C.subtle} /></View>
    </Pressable>;
  };
  const patientRow = (patient: Patient) => <Pressable key={patient.id} onPress={() => setSelection({ kind: 'patient', id: patient.id })} style={({ hovered }) => [styles.tableRow, hovered && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View ${patient.name}`}>
    <View style={styles.personCell}>{avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber} · {patient.grade ?? 'Grade not listed'}{patient.section ? ` · ${patient.section}` : ''}</Text></View></View>
    <Text style={styles.tableCell}>{professionals.find((person) => person.id === patient.teacherId)?.name ?? '—'}</Text>
    <Text style={styles.tableCell}>{activeTherapistFor(patient.therapistId)}</Text>
    <View style={styles.tableCell}><Status label={studentAccess(patient)} tone={studentAccess(patient) === 'Active' ? 'green' : 'red'} /></View>
    <View style={styles.tableCell}><Status label={patient.enrollment} tone={patient.enrollment === 'Enrolled' ? 'blue' : 'neutral'} /></View>
    <Text style={styles.tableCell}>{formatDate(patient.registered)}</Text>
    <View style={styles.rowAction}><Ionicons name="chevron-forward" size={17} color={C.subtle} /></View>
  </Pressable>;

  const activityLine = (entry: ActivityEntry, compactMode = false) => <View key={entry.id} onLayout={({ nativeEvent }) => { recentActivityRows.current.set(entry.id, { top: nativeEvent.layout.y, height: nativeEvent.layout.height }); markVisibleActivityRead(); }} style={[styles.activityItem, compactMode && styles.activityItemCompact]}>
    {!entry.read ? <View style={[styles.activityMark, { backgroundColor: C.blue }]} /> : null}
    <View style={styles.activityCopy}><Text style={styles.activityTitle}>{entry.title}</Text><Text style={styles.secondaryText}>{entry.detail} · {entry.actor}</Text></View>
    <Text style={styles.activityDate}>{formatTimestamp(entry.date)}</Text>
  </View>;

  const dashboard = () => {
    const metrics = [
      { label: 'Active Therapists', icon: 'heart-outline' as const, value: professionals.filter((person) => person.role === 'Therapist' && professionalAccess(person) === 'Active' && professionalMembership(person) === 'Active').length, foot: 'Professional accounts', click: () => { goTo('Accounts'); setAccountRole('Therapist'); setAccountAccess('Active'); setAccountSetup('All setup'); } },
      { label: 'Active Teachers', icon: 'school-outline' as const, value: professionals.filter((person) => person.role === 'Teacher' && professionalAccess(person) === 'Active' && professionalMembership(person) === 'Active').length, foot: 'Professional accounts', click: () => { goTo('Accounts'); setAccountRole('Teacher'); setAccountAccess('Active'); setAccountSetup('All setup'); } },
      { label: 'Registered Students', icon: 'people-outline' as const, value: patients.filter((patient) => patient.enrollment === 'Enrolled').length, foot: 'Currently enrolled', click: () => openDashboardMetric('students') },
      { label: 'Account Setups', icon: 'mail-unread-outline' as const, value: pendingAccountSetups, foot: 'Invitations awaiting setup', click: () => openDashboardMetric('accounts'), attention: pendingInvitations.some((person) => !viewedAlertIds.has(person.id)) || pendingPatientSetups.some((student) => !viewedAlertIds.has(student.id)) },
      { label: 'Administrative Requests', icon: 'document-text-outline' as const, value: pendingRequests.length + pendingReleaseRequests.length, foot: 'Student requests to review', click: () => openDashboardMetric('requests'), attention: pendingRequests.some((request) => !viewedAlertIds.has(request.id)) || pendingReleaseRequests.some((request) => !viewedAlertIds.has(request.id)) },
    ];
    const pageCount = Math.max(1, Math.ceil(attentionItems.length / 10));
    const pageIndex = Math.min(attentionPage, pageCount - 1);
    const rows = attentionItems.slice(pageIndex * 10, pageIndex * 10 + 10);
    const maxCaseload = 3;
    return <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false} onLayout={onRecentActivityViewportLayout} onScroll={onRecentActivityScroll} scrollEventThrottle={100}>
      <Header title="Dashboard" subtitle="Manage your center's accounts, student access, and recent activity." />
      <View style={[styles.metricStrip, compact && styles.metricStripCompact]}>{metrics.map((metric) => <TouchableOpacity key={metric.label} onPress={metric.click} style={[styles.metric, compact && styles.metricCompact]} accessibilityRole="button" accessibilityLabel={metric.label + ': ' + metric.value + '. ' + metric.foot}><View style={styles.metricTop}><Ionicons name={metric.icon} size={17} color={C.blue} /><Text style={styles.metricLabel}>{metric.label}</Text></View><View style={styles.metricValueLine}><Text style={styles.metricValue}>{metric.value}</Text>{metric.attention ? <View style={styles.attentionDot} /> : null}</View><Text style={styles.metricFoot}>{metric.foot}</Text></TouchableOpacity>)}</View>

      <View style={styles.attentionPanel}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Requires attention</Text><Text style={styles.sectionSub}>Items that need an administrator decision</Text></View><View style={styles.attentionCount} accessibilityLabel={`${attentionItems.length} items require attention`}><Text style={[styles.countText, attentionItems.length === 0 && styles.countTextClear]}>{attentionItems.length}</Text><Text style={[styles.attentionCountLabel, attentionItems.length === 0 && styles.countTextClear]}>items</Text></View></View>
        {rows.map((item) => <View key={item.key} style={styles.attentionRow}><View style={[styles.attentionIcon, { backgroundColor: item.tone === 'yellow' ? C.yellowSoft : item.tone === 'orange' ? C.orangeSoft : C.blueSoft }]}><Ionicons name={item.icon} size={19} color={item.tone === 'yellow' ? C.yellow : item.tone === 'orange' ? C.orange : C.blue} /></View><View style={styles.attentionCopy}><Pressable accessibilityRole="link" accessibilityLabel={`Open ${item.title}`} onPress={item.run} hitSlop={4}><Text style={styles.attentionTitle}>{item.title}</Text></Pressable><Text style={styles.secondaryText}>{item.detail}</Text>{item.date ? <Text style={styles.attentionTime}>{item.date}</Text> : null}</View><Pressable accessibilityRole="link" onPress={item.run} hitSlop={8}><Text style={styles.linkText}>View</Text></Pressable></View>)}
        {attentionItems.length === 0 ? <View style={styles.clearState}><Ionicons name="checkmark-circle-outline" size={23} color={C.green} /><Text style={styles.clearStateText}>Everything is up to date.</Text></View> : null}
        {pageCount > 1 ? <View style={styles.pagination}><Text style={styles.secondaryText}>Showing {pageIndex * 10 + 1} to {Math.min((pageIndex + 1) * 10, attentionItems.length)} of {attentionItems.length}</Text><View style={styles.paginationActions}><Button label="Previous" disabled={pageIndex === 0} onPress={() => setAttentionPage(Math.max(0, pageIndex - 1))} /><Button label="Next" disabled={pageIndex >= pageCount - 1} onPress={() => setAttentionPage(Math.min(pageCount - 1, pageIndex + 1))} /></View></View> : null}
      </View>

      <View style={styles.assignmentOverview}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Therapist caseloads</Text><Text style={styles.sectionSub}>Enrolled students by active Therapist (3 student capacity)</Text></View><TouchableOpacity onPress={() => { goTo('Accounts'); setAccountRole('Therapist'); setAccountAccess('Active'); setAccountSetup('All setup'); }} accessibilityRole="link"><Text style={styles.linkText}>View accounts</Text></TouchableOpacity></View>
        <View style={styles.caseloadList}>{therapistCounts.map((person) => { const full = person.assigned >= maxCaseload; const near = person.assigned === maxCaseload - 1; const fill = full ? '#F76B45' : near ? '#FFB923' : '#83B84A'; return <TouchableOpacity key={person.id} accessibilityRole="link" accessibilityLabel={'View ' + person.name + ' in Accounts. Caseload ' + person.assigned + ' of ' + maxCaseload} onPress={() => { goTo('Accounts'); setAccountRole('Therapist'); setAccountAccess('Active'); setAccountSetup('All setup'); setAccountMembership('Active'); setAccountEnrollment('All enrollment'); setAccountSearch(person.name); }} style={styles.caseloadRow}><View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{initials(person.name)}</Text></View><Text style={styles.assignmentOverviewName}>{person.name}</Text><View style={styles.caseloadTrack}><View style={[styles.caseloadFill, { width: (Math.min(person.assigned, maxCaseload) / maxCaseload * 100) + '%', backgroundColor: fill }]} /></View><Text style={[styles.assignmentOverviewCount, { color: full ? '#F76B45' : near ? '#8A5B00' : '#287A4B' }]}>{person.assigned}/{maxCaseload}</Text><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>; })}{activeTherapists.length === 0 ? <Text style={styles.secondaryText}>No active Therapists. Student enrollment is unavailable until one is active.</Text> : null}</View>
      </View>

      <View style={styles.activityPanel} onLayout={onRecentActivityPanelLayout}><View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionSub}>Latest changes across your center</Text></View><TouchableOpacity onPress={() => goTo('Activity Logs')} accessibilityRole="link"><Text style={styles.linkText}>View logs</Text></TouchableOpacity></View>{orderedActivity.slice(0, 5).map((entry) => activityLine(entry, true))}{orderedActivity.length === 0 ? <Text style={styles.secondaryText}>Activity will appear here as changes are recorded.</Text> : null}</View>
    </ScrollView>;
  };
  const accountPagination = accountPageCount > 1 ? <View style={[styles.accountPagination, compact && styles.accountPaginationCompact]}>
    <Text style={styles.accountPaginationSummary}>Showing {accountPageIndex * 10 + 1}–{Math.min((accountPageIndex + 1) * 10, accountRows.length)} of {accountRows.length} accounts</Text>
    <View style={[styles.accountPaginationControls, compact && styles.accountPaginationControlsCompact]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="First page" disabled={accountPageIndex === 0} onPress={() => setAccountPage(0)} style={[styles.pageArrow, accountPageIndex === 0 && styles.pageArrowDisabled]}><Ionicons name="chevron-back" size={13} color={accountPageIndex === 0 ? C.subtle : C.muted} /><Ionicons name="chevron-back" size={13} color={accountPageIndex === 0 ? C.subtle : C.muted} style={styles.doubleChevronSecond} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous page" disabled={accountPageIndex === 0} onPress={() => setAccountPage(accountPageIndex - 1)} style={[styles.pageArrow, accountPageIndex === 0 && styles.pageArrowDisabled]}><Ionicons name="chevron-back" size={15} color={accountPageIndex === 0 ? C.subtle : C.muted} /></TouchableOpacity>
      {accountPageNumbers.map((pageNumber) => <TouchableOpacity key={pageNumber} accessibilityRole="button" accessibilityLabel={`Page ${pageNumber + 1}`} accessibilityState={{ selected: pageNumber === accountPageIndex }} onPress={() => setAccountPage(pageNumber)} style={[styles.pageNumber, pageNumber === accountPageIndex && styles.pageNumberActive]}><Text style={[styles.pageNumberText, pageNumber === accountPageIndex && styles.pageNumberTextActive]}>{pageNumber + 1}</Text></TouchableOpacity>)}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next page" disabled={accountPageIndex >= accountPageCount - 1} onPress={() => setAccountPage(accountPageIndex + 1)} style={[styles.pageArrow, accountPageIndex >= accountPageCount - 1 && styles.pageArrowDisabled]}><Ionicons name="chevron-forward" size={15} color={accountPageIndex >= accountPageCount - 1 ? C.subtle : C.muted} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Last page" disabled={accountPageIndex >= accountPageCount - 1} onPress={() => setAccountPage(accountPageCount - 1)} style={[styles.pageArrow, accountPageIndex >= accountPageCount - 1 && styles.pageArrowDisabled]}><Ionicons name="chevron-forward" size={13} color={accountPageIndex >= accountPageCount - 1 ? C.subtle : C.muted} /><Ionicons name="chevron-forward" size={13} color={accountPageIndex >= accountPageCount - 1 ? C.subtle : C.muted} style={styles.doubleChevronSecond} /></TouchableOpacity>
    </View>
    {!compact ? <View style={styles.accountPaginationSide} /> : null}
  </View> : null;
  const accounts = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Accounts" subtitle="Manage student and professional accounts across your center." action={<Button label="Add Account" kind="primary" icon="add" onPress={() => setNewAccountOpen(true)} />} />
    <View style={styles.accountSearchArea}>
      <View style={styles.accountSearchRow}>
        <SearchBox value={accountSearch} onChange={setAccountSearch} placeholder="Search names, emails, and IDs" fullWidth />
        {!desktop ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Filters${accountFilterTags.length ? `, ${accountFilterTags.length} active` : ''}`} accessibilityState={{ expanded: accountFiltersOpen }} onPress={() => setAccountFiltersOpen(true)} style={styles.accountFiltersButton}><Ionicons name="filter-outline" size={17} color={C.blueDeep} /><Text style={styles.accountFiltersButtonText}>Filters</Text>{accountFilterTags.length ? <View style={styles.accountFiltersCount}><Text style={styles.accountFiltersCountText}>{accountFilterTags.length}</Text></View> : null}</TouchableOpacity> : null}
      </View>
      {accountFilterTags.length ? <View style={styles.accountFilterTagRow}>{accountFilterTags.map((tag) => <TouchableOpacity key={tag.label} accessibilityRole="button" accessibilityLabel={`Remove ${tag.label} filter`} onPress={tag.clear} style={styles.accountFilterTag}><Text style={styles.accountFilterTagText}>{tag.label}</Text><Ionicons name="close" size={12} color={C.blue} /></TouchableOpacity>)}<TouchableOpacity accessibilityRole="button" onPress={resetAccountFilters} style={styles.accountFilterReset}><Text style={styles.accountFilterResetText}>Reset</Text></TouchableOpacity></View> : null}
      {!desktop ? <Modal visible={accountFiltersOpen} transparent animationType="fade" onRequestClose={() => setAccountFiltersOpen(false)}><Pressable style={styles.overlay} onPress={() => setAccountFiltersOpen(false)}><Pressable style={[styles.dialog, styles.accountFiltersDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title="Filters" subtitle="Choose which accounts to show." onClose={() => setAccountFiltersOpen(false)} /><ScrollView style={styles.accountFiltersDialogBody} contentContainerStyle={styles.accountFiltersDialogContent} showsVerticalScrollIndicator={false}>
        <Filter label="Role" value={accountRole} options={['All roles', 'Student', 'Therapist', 'Teacher']} onChange={setAccountRole} />
        <Filter label="Access" value={accountAccess} options={['All access', 'Active', 'Suspended']} onChange={setAccountAccess} />
        <Filter label="Setup" value={accountSetup} options={['All setup', 'Pending', 'Completed']} onChange={setAccountSetup} />
        <Filter label="Membership" value={accountMembership} options={['All memberships', 'Active', 'Deactivated']} onChange={(value) => { setAccountMembership(value); setAccountEnrollment('All enrollment'); }} />
        <Filter label="Enrollment" value={accountEnrollment} options={['All enrollment', 'Enrolled', 'Archived']} onChange={(value) => { setAccountEnrollment(value); setAccountMembership('All memberships'); }} />
        <Filter label="ID" value={accountIdentifier} options={['All IDs', 'Available ID', 'Missing ID']} onChange={setAccountIdentifier} />
        <Filter label="Assignments" value={accountAssignments} options={['All assignments', 'Assigned', 'Unassigned']} onChange={setAccountAssignments} />
      </ScrollView><View style={styles.dialogActions}><Button label="Reset filters" onPress={resetAccountFilters} /><Button label="Done" kind="primary" onPress={() => setAccountFiltersOpen(false)} /></View></Pressable></Pressable></Modal> : null}
    </View>
    <View style={styles.directoryMeta}><Text style={styles.resultCount}>{visibleProfessionals.length + visibleAccountPatients.length} accounts</Text><Text style={styles.secondaryText}>{accountViewSummary}</Text></View>
    {desktop ? <View style={styles.table}><View style={styles.tableHead}>
      <View style={[styles.tableHeadCell, styles.personHead]}><ColumnFilter label="Account" active={accountMembership !== 'All memberships' || accountEnrollment !== 'All enrollment'} options={[{ label: 'All account states', selected: accountMembership === 'All memberships' && accountEnrollment === 'All enrollment', onSelect: () => { setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); } }, { label: 'Active membership', selected: accountMembership === 'Active', onSelect: () => { setAccountMembership('Active'); setAccountEnrollment('All enrollment'); } }, { label: 'Deactivated membership', selected: accountMembership === 'Deactivated', onSelect: () => { setAccountMembership('Deactivated'); setAccountEnrollment('All enrollment'); } }, { label: 'Enrolled students', selected: accountEnrollment === 'Enrolled', onSelect: () => { setAccountEnrollment('Enrolled'); setAccountMembership('All memberships'); } }, { label: 'Archived students', selected: accountEnrollment === 'Archived', onSelect: () => { setAccountEnrollment('Archived'); setAccountMembership('All memberships'); } }]} /></View>
      <View style={[styles.tableHeadCell, styles.idTableCell]}><ColumnFilter label="ID" active={accountIdentifier !== 'All IDs'} options={[{ label: 'All IDs', selected: accountIdentifier === 'All IDs', onSelect: () => setAccountIdentifier('All IDs') }, { label: 'ID available', selected: accountIdentifier === 'Available ID', onSelect: () => setAccountIdentifier('Available ID') }, { label: 'ID missing', selected: accountIdentifier === 'Missing ID', onSelect: () => setAccountIdentifier('Missing ID') }]} /></View>
      <View style={[styles.tableHeadCell, styles.roleTableCell]}><ColumnFilter label="Role" active={accountRole !== 'All roles'} options={['All roles', 'Student', 'Therapist', 'Teacher'].map((value) => ({ label: value, selected: accountRole === value, onSelect: () => setAccountRole(value) }))} /></View>
      <View style={[styles.tableHeadCell, styles.statusTableCell]}><ColumnFilter label="Access" active={accountAccess !== 'All access'} options={['All access', 'Active', 'Suspended'].map((value) => ({ label: value, selected: accountAccess === value, onSelect: () => setAccountAccess(value) }))} /></View>
      <View style={[styles.tableHeadCell, styles.setupTableCell]}><ColumnFilter label="Setup" active={accountSetup !== 'All setup'} options={['All setup', 'Pending', 'Completed'].map((value) => ({ label: value, selected: accountSetup === value, onSelect: () => setAccountSetup(value) }))} /></View>
      <View style={[styles.tableHeadCell, styles.assignmentTableCell]}><ColumnFilter label="Assignments" active={accountAssignments !== 'All assignments'} options={['All assignments', 'Assigned', 'Unassigned'].map((value) => ({ label: value, selected: accountAssignments === value, onSelect: () => setAccountAssignments(value) }))} /></View>
      <View style={styles.rowAction} />
    </View>{accountPageProfessionals.map(professionalRow)}{accountPageStudents.map((patient) => <Pressable key={patient.id} onPress={() => { goTo('Students'); setSelection({ kind: 'patient', id: patient.id }); }} style={({ hovered }) => [styles.tableRow, hovered && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View student ${patient.name} in Students`}><View style={styles.personCell}>{avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.guardianContact}</Text></View></View><Text style={[styles.tableCell, styles.idTableCell]}>{patient.studentNumber}</Text><Text style={[styles.tableCell, styles.roleTableCell]}>Student</Text><View style={[styles.tableCell, styles.statusTableCell]}><Status label={studentAccess(patient)} tone={studentAccess(patient) === 'Suspended' ? 'red' : 'green'} /></View><Text style={[styles.tableCell, styles.setupTableCell]}>{studentSetup(patient)}</Text><Text style={[styles.tableCell, styles.assignmentTableCell]}>—</Text><View style={styles.rowAction}><Ionicons name="chevron-forward" size={17} color={C.subtle} /></View></Pressable>)}{accountPagination}</View> : <><View style={styles.mobileRows}>{accountPageProfessionals.map((person) => { const identifier = person.role === 'Therapist' ? person.staffId ?? 'Staff ID unavailable' : person.professionalIdentifier ?? 'School ID unavailable'; const assigned = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length; return <Pressable key={person.id} onPress={() => setSelection({ kind: 'professional', id: person.id })} style={styles.mobileRow}><View style={styles.personCell}>{avatar(person.name)}<View style={styles.personText}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.role} · {person.email}</Text><Text style={styles.secondaryText}>{identifier}</Text></View></View><View style={styles.mobileRowBottom}><Status label={professionalAccess(person)} tone={professionalAccess(person) === 'Active' ? 'green' : 'red'} /><Text style={styles.secondaryText}>Setup {professionalSetup(person).toLowerCase()}</Text><Text style={styles.secondaryText}>{assigned} assigned</Text></View></Pressable>; })}{accountPageStudents.map((patient) => <Pressable key={patient.id} onPress={() => { goTo('Students'); setSelection({ kind: 'patient', id: patient.id }); }} style={styles.mobileRow}><View style={styles.personCell}>{avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>Student · {patient.studentNumber}</Text><Text style={styles.secondaryText}>{patient.guardianContact}</Text></View></View><View style={styles.mobileRowBottom}><Status label={studentAccess(patient)} tone={studentAccess(patient) === 'Suspended' ? 'red' : 'green'} /><Text style={styles.secondaryText}>Setup {studentSetup(patient).toLowerCase()}</Text></View></Pressable>)}</View>{accountPagination}</>}
    {visibleProfessionals.length + visibleAccountPatients.length === 0 ? <EmptyState title="No accounts found" detail={accountSearch || accountFilterTags.length ? 'Try clearing a filter or changing your search.' : 'Create a student or professional account to get started.'} action={accountSearch || accountFilterTags.length ? <Button label="Reset filters" onPress={() => { resetAccountFilters(); setAccountSearch(''); }} /> : <Button label="Add Account" kind="primary" icon="add" onPress={() => setNewAccountOpen(true)} />} /> : null}
  </ScrollView>;

  const patientsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Students" subtitle="View enrollment, manage account access, and oversee Therapist assignments." />
    <View style={styles.patientHeaderNote}><Text style={styles.patientHeaderNoteText}>Students are enrolled by Therapists. Student and guardian details are read-only here.</Text><TouchableOpacity onPress={() => { setPatientEnrollment(patientEnrollment === 'Archived' ? 'Enrolled' : 'Archived'); setSearch(''); }}><Text style={styles.linkText}>{patientEnrollment === 'Archived' ? 'View enrolled' : 'View archived'}</Text></TouchableOpacity></View>
    <View style={styles.requestSection}><View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Student requests</Text><Text style={styles.sectionSub}>Release and account access requests from Therapists</Text></View><View style={styles.paginationActions}><Status label={pendingRequestsOnly ? 'Pending only' : (pendingRequests.length + pendingReleaseRequests.length) + ' pending'} tone={pendingRequests.length + pendingReleaseRequests.length ? 'yellow' : 'green'} /><Button label={pendingRequestsOnly ? 'Show all' : 'Pending only'} kind='text' onPress={() => setPendingRequestsOnly((value) => !value)} /></View></View>
      {releaseRequests.filter((request) => !pendingRequestsOnly || request.status === 'Pending' || request.status === 'More information requested').map((request) => { const patient = patients.find((item) => item.id === request.patientId); const therapist = professionals.find((person) => person.id === request.therapistId); return <Pressable key={request.id} onPress={() => { setReleaseReplacement(''); setReleaseNote(''); setSelection({ kind: 'release', id: request.id }); }} style={({ hovered }) => [styles.requestRow, hovered && styles.rowHover]}><View style={styles.requestMain}><Text style={styles.personName}>Student release · {patient?.name ?? 'Unknown student'}</Text><Text style={styles.secondaryText}>{therapist?.name ?? 'Unknown Therapist'} · {request.reason} · {formatDate(request.submitted)}</Text></View><Status label={request.status} tone={request.status === 'Pending' ? 'yellow' : request.status.startsWith('Approved') ? 'green' : request.status === 'More information requested' ? 'blue' : 'neutral'} />{request.status === 'Pending' || request.status === 'More information requested' ? <Text style={styles.linkText}>View</Text> : null}</Pressable>; })}
      {requests.filter((request) => !pendingRequestsOnly || request.status === 'Pending').map((request) => { const patient = patients.find((item) => item.id === request.patientId); const therapist = professionals.find((person) => person.id === request.therapistId); return <Pressable key={request.id} onPress={() => setSelection({ kind: 'request', id: request.id })} style={({ hovered }) => [styles.requestRow, hovered && styles.rowHover]}><View style={styles.requestMain}><Text style={styles.personName}>{patient?.name ?? 'Unknown student'}</Text><Text style={styles.secondaryText}>{therapist?.name ?? 'Unknown Therapist'} · {formatDate(request.submitted)}</Text></View><Status label={request.status} tone={request.status === 'Pending' ? 'yellow' : request.status === 'Approved' ? 'green' : 'neutral'} />{request.status === 'Pending' ? <Text style={styles.linkText}>View</Text> : null}</Pressable>; })}
      {(pendingRequestsOnly ? pendingRequests.length === 0 && pendingReleaseRequests.length === 0 : requests.length === 0 && releaseRequests.length === 0) ? <Text style={styles.secondaryText}>{pendingRequestsOnly ? 'No pending requests to review.' : 'No requests have been submitted.'}</Text> : null}
    </View>
    <View style={styles.directoryControls}><SearchBox value={search} onChange={setSearch} placeholder="Search student number" /><Filter label="Therapist" value={patientTherapist} options={['All therapists', ...professionals.filter((person) => person.role === 'Therapist').map((person) => person.id)]} getLabel={(id) => id === 'All therapists' ? id : professionals.find((person) => person.id === id)?.name ?? id} onChange={setPatientTherapist} /><Filter label="Access" value={patientAccess} options={['All access', 'Active', 'Suspended']} onChange={setPatientAccess} /><Filter label="Enrollment" value={patientEnrollment} options={['Enrolled', 'Archived', 'All enrollment']} onChange={setPatientEnrollment} /></View>
    <View style={styles.directoryMeta}><Text style={styles.resultCount}>{visiblePatients.length} students</Text><Text style={styles.secondaryText}>Access and enrollment are managed separately.</Text></View>
    {desktop ? <View style={styles.table}><View style={styles.tableHead}><Text style={[styles.tableHeadCell, styles.personHead]}>Student</Text><Text style={styles.tableHeadCell}>Teacher</Text><Text style={styles.tableHeadCell}>Therapist</Text><Text style={styles.tableHeadCell}>Account access</Text><Text style={styles.tableHeadCell}>Enrollment</Text><Text style={styles.tableHeadCell}>Registered</Text><View style={styles.rowAction} /></View>{visiblePatients.map(patientRow)}</View> : <View style={styles.mobileRows}>{visiblePatients.map((patient) => <Pressable key={patient.id} onPress={() => setSelection({ kind: 'patient', id: patient.id })} style={styles.mobileRow}><View style={styles.personCell}>{avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber} · {patient.grade ?? 'Grade not listed'}{patient.section ? ` · ${patient.section}` : ''}</Text></View></View><View style={styles.mobileRowBottom}><Status label={studentAccess(patient)} tone={studentAccess(patient) === 'Active' ? 'green' : 'red'} /><Text style={styles.secondaryText}>{professionals.find((person) => person.id === patient.teacherId)?.name ?? 'No Teacher'} · {activeTherapistFor(patient.therapistId)}</Text></View></Pressable>)}</View>}
    {visiblePatients.length === 0 ? <EmptyState title="No students match your search" detail="Try clearing a filter or searching by the student number." action={<Button label="Clear filters" onPress={() => { setSearch(''); setPatientAccess('All access'); setPatientEnrollment('All enrollment'); setPatientTherapist('All therapists'); }} />} /> : null}
  </ScrollView>;

  const logsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Activity Logs" subtitle="A chronological record of account, student, and request decisions." />
    <View style={styles.directoryControls}><SearchBox value={logSearch} onChange={setLogSearch} placeholder="Search activity, record, or administrator" /><Filter label="Category" value={logCategory} options={['All activity', 'Account', 'Student', 'Request', 'Settings']} onChange={setLogCategory} /></View>
    <View style={styles.logList}>{visibleLogs.map((entry) => <View key={entry.id} style={styles.logRow}><View style={styles.logDate}><Text style={styles.logDateDay}>{formatDate(entry.date)}</Text><Text style={styles.secondaryText}>{formatTimestamp(entry.date).split(', ')[1]}</Text></View>{!entry.read ? <View style={[styles.activityMark, { backgroundColor: C.blue }]} /> : null}<View style={styles.activityCopy}><Text style={styles.activityTitle}>{entry.title}</Text><Text style={styles.secondaryText}>{entry.detail}</Text></View><View style={styles.logActor}><Text style={styles.secondaryText}>{entry.actor}</Text></View></View>)}</View>
    {visibleLogs.length === 0 ? <EmptyState title="No activity found" detail="Try a different category or search term." action={<Button label="Clear filters" onPress={() => { setLogSearch(''); setLogCategory('All activity'); }} />} /> : null}
  </ScrollView>;

  const settingsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Center Profile" subtitle="Center information used to identify this administrative workspace." />
    <View style={styles.settingsPanel}><Text style={styles.sectionTitle}>Center information</Text><Text style={styles.sectionSub}>These changes are local to this demo session.</Text>{([['name', 'Center name'], ['email', 'Administrator email'], ['phone', 'Phone'], ['address', 'Address']] as const).map(([key, label]) => <View key={key} style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><TextInput value={centerSettings[key]} onChangeText={(value) => { setCenterSettings((current) => ({ ...current, [key]: value })); setSettingsSaved(false); }} style={styles.settingInput} accessibilityLabel={label} /></View>)}<View style={styles.settingsAction}><Button label={settingsSaved ? 'Saved' : 'Save settings'} kind="primary" onPress={() => { setSettingsSaved(true); addLog('Center profile updated', `${centerSettings.name} · local demo settings`, 'Settings'); flash('Center profile settings saved in this demo.'); }} /></View></View>
    <View style={styles.settingsPanel}><Text style={styles.sectionTitle}>Administrator profile</Text><View style={styles.profileSummary}>{avatar('Center Admin')}<View><Text style={styles.personName}>Center Admin</Text><Text style={styles.secondaryText}>Administrator · {centerSettings.name}</Text></View></View><Button label="View profile" onPress={() => setShowProfileDetails(true)} /></View>
  </ScrollView>;

  const selectNav = (target: Page) => { goTo(target); };
  const sidebar = (inDrawer = false) => <Pressable nativeID={desktop && !inDrawer ? 'center-admin-sidebar' : undefined} style={[styles.sidebar, desktop && !inDrawer && styles.sidebarRail, desktop && !inDrawer && sidebarExpanded && styles.sidebarRailExpanded, inDrawer && styles.sidebarDrawer]}>
    <View style={[styles.brandLockup, desktop && !inDrawer && !sidebarExpanded && styles.brandLockupRail]}><Image source={require('../../../assets/images/speaksteps-children-mark.png')} style={styles.brandMark} contentFit="contain" />{!desktop || inDrawer || sidebarExpanded ? <View><Text style={styles.brandName}>SpeakSteps</Text><Text style={styles.brandSub}>CENTER ADMIN</Text></View> : null}</View>
    {!desktop || inDrawer || sidebarExpanded ? <Text style={styles.navCaption}>WORKSPACE</Text> : null}{NAV.map((item) => <TouchableOpacity key={item.label} onPress={() => selectNav(item.label)} style={[styles.navItem, desktop && !inDrawer && !sidebarExpanded && styles.navItemRail, page === item.label && styles.navItemActive]} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: page === item.label }}><Ionicons name={page === item.label ? item.activeIcon : item.icon} size={19} color={page === item.label ? C.blue : C.muted} />{!desktop || inDrawer || sidebarExpanded ? <Text style={[styles.navText, page === item.label && styles.navTextActive]}>{item.label}</Text> : null}</TouchableOpacity>)}
    {desktop && !inDrawer ? <TouchableOpacity onPress={() => setSidebarExpanded((expanded) => !expanded)} style={[styles.sidebarPinButton, !sidebarExpanded && styles.navItemRail, sidebarExpanded && styles.navItemActive]} accessibilityRole="button" accessibilityLabel={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'} accessibilityState={{ expanded: sidebarExpanded }}><Octicons name={sidebarExpanded ? 'sidebar-collapse' : 'sidebar-expand'} size={18} color={sidebarExpanded ? C.blue : C.muted} /></TouchableOpacity> : null}

  </Pressable>;

  return <View nativeID="admin-portal-root" style={[styles.appRoot, desktop ? styles.appRootDesktop : styles.appRootCompact]}>
    <Stack.Screen options={{ headerShown: false, title: `SpeakSteps · ${page}` }} />
    <StatusBar barStyle="dark-content" />
    {desktop ? sidebar() : null}
    <View style={styles.workspace}>
      <View style={styles.topbar}>{!desktop ? <IconButton icon="menu-outline" label="Open navigation" onPress={() => setMenuOpen(true)} /> : <View style={styles.breadcrumb}><Text style={styles.breadcrumbRoot}>Center workspace</Text><Ionicons name="chevron-forward" size={13} color={C.subtle} /><Text style={styles.breadcrumbCurrent}>{page}</Text></View>}<View style={styles.topbarRight}><View ref={notificationAnchorRef} collapsable={false}><IconButton icon="notifications-outline" label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onPress={() => setShowNotifications(true)} /></View><View style={styles.adminMenuAnchor}><View style={styles.adminChip}><View style={styles.adminInitial}><Text style={styles.adminInitialText}>CA</Text></View>{desktop ? <Text style={styles.adminChipText}>Center Admin</Text> : null}<Pressable onHoverIn={openProfileMenu} onHoverOut={scheduleProfileMenuClose} onPress={() => { if (!desktop) setShowProfile((visible) => !visible); }} style={styles.adminMenuArrow} accessibilityRole="button" accessibilityLabel="Account options" accessibilityState={{ expanded: showProfile }}><Ionicons name="chevron-down" size={14} color={C.muted} /></Pressable></View>{showProfile ? <Pressable style={styles.profileMenu} onHoverIn={openProfileMenu} onHoverOut={scheduleProfileMenuClose}><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); setShowProfileDetails(true); }} accessibilityRole="button"><Ionicons name="person-outline" size={17} color={C.muted} /><Text style={styles.profileMenuText}>Profile</Text></TouchableOpacity><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); selectNav('Settings'); }} accessibilityRole="button"><Ionicons name="settings-outline" size={17} color={C.muted} /><Text style={styles.profileMenuText}>Settings</Text></TouchableOpacity><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); setConfirmation({ title: 'Sign out of Center Admin?', message: 'You will return to the sign-in screen. Demo changes reset when the app reloads.', actionLabel: 'Sign out', run: () => { setConfirmation(null); router.replace('/(admin)/admin-login' as any); } }); }} accessibilityRole="button"><Ionicons name="log-out-outline" size={17} color={C.red} /><Text style={[styles.profileMenuText, { color: C.red }]}>Log out</Text></TouchableOpacity></Pressable> : null}</View></View></View>
      <View style={styles.content}>{page === 'Dashboard' ? dashboard() : page === 'Accounts' ? accounts() : page === 'Students' ? patientsPage() : page === 'Activity Logs' ? logsPage() : settingsPage()}</View>
    </View>

    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}><Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}><Pressable style={styles.mobileDrawer} onPress={(event) => event.stopPropagation()}>{sidebar(true)}</Pressable></Pressable></Modal>
    <Modal visible={showProfileDetails} transparent animationType="fade" onRequestClose={() => setShowProfileDetails(false)}><Pressable style={styles.overlay} onPress={() => setShowProfileDetails(false)}><Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}><ModalHeader title="Administrator profile" subtitle="Center administration" onClose={() => setShowProfileDetails(false)} /><View style={styles.profileSummary}>{avatar('Center Admin')}<View><Text style={styles.personName}>Center Admin</Text><Text style={styles.secondaryText}>{centerSettings.email}</Text></View></View><Text style={styles.secondaryText}>{centerSettings.name}</Text><View style={styles.dialogActions}><Button label="Close" onPress={() => setShowProfileDetails(false)} /></View></Pressable></Pressable></Modal>

    <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)} onShow={() => notificationAnchorRef.current?.measureInWindow((x, y, anchorWidth, anchorHeight) => { const popoverWidth = Math.min(360, width - 24); setNotificationPosition({ top: y + anchorHeight + 8, left: Math.max(12, Math.min(width - popoverWidth - 12, x + anchorWidth / 2 - popoverWidth / 2)) }); })}>
      <View style={styles.notificationLayer}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNotifications(false)} accessibilityLabel="Close notifications" />
        <Pressable onPress={(event) => event.stopPropagation()} style={[styles.notificationPopover, { top: notificationPosition.top, left: notificationPosition.left }]}>
          <ModalHeader title="Notifications" onClose={() => setShowNotifications(false)} />
          <View style={styles.segmentRow}>
            {(['All', 'Unread'] as const).map((filter) => <TouchableOpacity key={filter} onPress={() => setNotificationFilter(filter)} style={[styles.segment, notificationFilter === filter && styles.segmentActive]}><Text style={[styles.segmentText, notificationFilter === filter && styles.segmentTextActive]}>{filter}</Text></TouchableOpacity>)}
            <TouchableOpacity onPress={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))} style={styles.markAll}><Text style={styles.linkText}>Mark all read</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.notificationList} keyboardShouldPersistTaps="handled">
            {shownNotifications.map((item) => <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={item.title + '. ' + item.detail} onPress={() => openNotification(item)} style={styles.notificationRow}>
              {!item.read ? <View style={styles.unreadMark} /> : null}
              <View style={styles.activityCopy}><Text style={styles.activityTitle}>{item.title}</Text><Text style={styles.secondaryText}>{item.detail}</Text><Text style={styles.activityDate}>{formatTimestamp(item.date)}</Text></View>
            </TouchableOpacity>)}
            {shownNotifications.length === 0 ? <Text style={styles.secondaryText}>You?re all caught up.</Text> : null}
          </ScrollView>
        </Pressable>
      </View>
    </Modal>

    <Modal visible={newAccountOpen} transparent animationType="fade" onRequestClose={() => { setNewAccountOpen(false); setCreatePatientOpen(false); }}><Pressable style={styles.overlay} onPress={() => { setNewAccountOpen(false); setCreatePatientOpen(false); }}><Pressable style={[styles.dialog, styles.formDialog]} onPress={(event) => event.stopPropagation()}>{createPatientOpen ? <CreatePatientDialog teachers={activeTeachers.map(({ id, name }) => ({ id, name }))} therapists={therapistCounts} existingNumbers={patients.map((patient) => patient.studentNumber)} onClose={() => { setCreatePatientOpen(false); setNewAccountOpen(false); }} onCreate={makePatient} onSwitchRole={(role) => { setCreatePatientOpen(false); setAccountNewRole(role); }} /> : <CreateProfessionalDialog key={accountNewRole} role={accountNewRole} existingProfessionals={professionals} onClose={() => setNewAccountOpen(false)} onCreate={makeProfessional} onSwitchRole={(role) => { if (role === 'Student') setCreatePatientOpen(true); else setAccountNewRole(role); }} />}</Pressable></Pressable></Modal>


    <Modal visible={Boolean(selection)} transparent animationType="fade" onRequestClose={() => setSelection(null)}><Pressable style={[styles.overlay, selectedProfessional && styles.professionalDrawerOverlay]} onPress={() => setSelection(null)}><Pressable style={[styles.dialog, selectedProfessional ? styles.professionalDrawer : styles.detailDialog]} onPress={(event) => event.stopPropagation()}><ScrollView style={[styles.detailScroll, selectedProfessional && styles.professionalDrawerScroll]} showsVerticalScrollIndicator={false}>
      {selectedProfessional ? <ProfessionalDetails person={selectedProfessional} students={selectedProfessionalStudents} onClose={() => setSelection(null)} onOpenStudent={(student) => { goTo('Students'); setPatientEnrollment(student.enrollment); setSelection({ kind: 'patient', id: student.id }); }} onResendInvitation={() => resendInvitation(selectedProfessional)} onSuspend={(reason) => setProfessionalStatus(selectedProfessional, 'Suspended', reason)} onReactivate={() => setProfessionalStatus(selectedProfessional, 'Active')} onDeactivate={() => setProfessionalStatus(selectedProfessional, 'Deactivated')} /> : null}
      {selectedPatient ? <><ModalHeader title="Student profile" subtitle="Administrative enrollment and account access" onClose={() => setSelection(null)} /><View style={styles.detailIdentity}>{avatar(selectedPatient.name, C.green)}<View style={styles.personText}><Text style={styles.detailName}>{selectedPatient.name}</Text><Text style={styles.secondaryText}>{selectedPatient.studentNumber}</Text></View><Status label={selectedPatient.enrollment} tone={selectedPatient.enrollment === 'Enrolled' ? 'blue' : 'neutral'} /></View><View style={styles.detailSection}><Text style={styles.fieldLabel}>Student identity · read only</Text><View style={styles.detailGrid}><Detail label="Full name" value={selectedPatient.name} /><Detail label="Student number" value={selectedPatient.studentNumber} /><Detail label="Account setup" value={studentSetup(selectedPatient)} /><Detail label="Grade & section" value={`${selectedPatient.grade ?? '—'} · ${selectedPatient.section ?? '—'}`} /><Detail label="School" value={selectedPatient.school} /><Detail label="Registered" value={formatDate(selectedPatient.registered)} /></View></View><View style={styles.detailSection}><Text style={styles.fieldLabel}>Guardian information · read only</Text><View style={styles.detailGrid}><Detail label="Guardian" value={selectedPatient.guardian} /><Detail label="Contact" value={selectedPatient.guardianContact} /></View><Text style={styles.sourceNote}>Identity information is managed through school records.</Text></View><View style={styles.detailSection}><Text style={styles.fieldLabel}>Teacher assignment</Text><Text style={styles.detailValue}>{professionals.find((person) => person.id === selectedPatient.teacherId)?.name ?? "No Teacher assigned"}</Text><View style={styles.assignmentTrigger}><TouchableOpacity onPress={() => setTeacherChoicesOpen(teacherChoicesOpen === selectedPatient.id ? null : selectedPatient.id)}><Text style={styles.linkText}>Change Teacher</Text></TouchableOpacity></View>{teacherChoicesOpen === selectedPatient.id ? <View style={styles.choiceList}>{activeTeachers.map((teacher) => <TouchableOpacity key={teacher.id} onPress={() => changeTeacher(selectedPatient, teacher.id)} style={styles.choiceRow}><Text style={styles.personName}>{teacher.name}</Text><Text style={styles.secondaryText}>{teacher.email}</Text></TouchableOpacity>)}</View> : null}</View><View style={styles.detailSection}><Text style={styles.fieldLabel}>Therapist assignment</Text><View style={styles.assignmentSummary}><View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{initials(activeTherapistFor(selectedPatient.therapistId))}</Text></View><Text style={styles.personName}>{activeTherapistFor(selectedPatient.therapistId)}</Text>{selectedPatient.therapistId && professionals.find((person) => person.id === selectedPatient.therapistId)?.status === 'Suspended' ? <Status label="Needs reassignment" tone="yellow" /> : null}</View><TouchableOpacity onPress={() => setAssignmentChoicesOpen(assignmentChoicesOpen === selectedPatient.id ? null : selectedPatient.id)} style={styles.assignmentTrigger}><Text style={styles.linkText}>Reassign Therapist</Text><Ionicons name="chevron-down" size={14} color={C.blue} /></TouchableOpacity>{assignmentChoicesOpen === selectedPatient.id ? <View style={styles.choiceList}>{eligibleReplacements(selectedPatient.id).map((person) => <TouchableOpacity key={person.id} onPress={() => reassignPatient(selectedPatient, person.id)} style={styles.choiceRow}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.role}</Text></TouchableOpacity>)}{eligibleReplacements(selectedPatient.id).length === 0 ? <Text style={styles.secondaryText}>No other active Therapists are available.</Text> : null}</View> : null}</View><View style={styles.detailSection}><View style={styles.sectionHeading}><Text style={styles.fieldLabel}>Account access</Text><Status label={studentAccess(selectedPatient)} tone={studentAccess(selectedPatient) === 'Active' ? 'green' : 'red'} /></View><Text style={styles.secondaryText}>Access is separate from enrollment and Therapist assignment.</Text>{studentAccess(selectedPatient) === 'Active' ? <View style={styles.field}><Text style={styles.fieldLabel}>Reason for suspension</Text><TextInput value={patientAccessReason} onChangeText={setPatientAccessReason} placeholder="Explain why access should be suspended" placeholderTextColor={C.subtle} multiline style={[styles.input, { minHeight: 64, paddingTop: 10, textAlignVertical: "top" }]} /></View> : null}{selectedPatient.enrollment === 'Archived' && studentAccess(selectedPatient) === 'Suspended' ? <Text style={styles.sourceNote}>Restore enrollment before reactivating account access.</Text> : null}</View><View style={styles.detailActions}>{studentAccess(selectedPatient) === 'Active' ? <Button label="Suspend access" kind="danger" onPress={() => changePatientAccess(selectedPatient, 'Suspended')} /> : studentAccess(selectedPatient) === 'Suspended' && selectedPatient.enrollment === 'Enrolled' ? <Button label="Reactivate access" onPress={() => changePatientAccess(selectedPatient, 'Active')} /> : null}{selectedPatient.enrollment === 'Enrolled' ? <Button label="Archive student" kind="text" onPress={() => archivePatient(selectedPatient)} /> : <Button label="Restore student" onPress={() => archivePatient(selectedPatient, true)} />}</View></> : null}
      {selectedRelease && selectedReleasePatient ? <><ModalHeader title="Review student release" subtitle={`Request ${selectedRelease.id} · submitted ${formatDate(selectedRelease.submitted)}`} onClose={() => setSelection(null)} /><View style={styles.requestReviewNotice}><Ionicons name="document-text-outline" size={20} color={C.yellow} /><Text style={styles.requestReason}>{selectedRelease.explanation}</Text></View><View style={styles.detailGrid}><Detail label="Student" value={`${selectedReleasePatient.name} · ${selectedReleasePatient.studentNumber}`} /><Detail label="Requesting Therapist" value={selectedReleaseTherapist?.name ?? 'Unavailable'} /><Detail label="Current Therapist" value={activeTherapistFor(selectedReleasePatient.therapistId)} /><Detail label="Reason" value={selectedRelease.reason} /><Detail label="Submitted" value={formatDate(selectedRelease.submitted)} /><Detail label="Supporting document" value={selectedRelease.attachment ?? 'None provided'} /></View><Text style={styles.sourceNote}>The student stays assigned and enrolled until you resolve this request. Releasing a student does not suspend account access.</Text>{selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested' ? <><Text style={styles.fieldLabel}>Replacement Therapist · required to reassign</Text><SelectControl label="Replacement Therapist" value={releaseReplacement} options={['', ...activeTherapists.map((person) => person.id).filter((id) => id !== selectedReleasePatient.therapistId)]} getLabel={(id) => id ? professionals.find((person) => person.id === id)?.name ?? id : 'Choose a Therapist'} onChange={setReleaseReplacement} /><Text style={[styles.fieldLabel, { marginTop: 12 }]}>Decision note</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Add context for the Therapist" placeholderTextColor={C.subtle} multiline style={[styles.input, { minHeight: 68, paddingTop: 10, textAlignVertical: 'top' }]} /></> : <Status label={selectedRelease.status} tone={selectedRelease.status.startsWith('Approved') ? 'green' : 'neutral'} />}<View style={styles.detailActions}>{selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested' ? <><Button label="Request more information" onPress={() => resolveReleaseRequest(selectedRelease, 'More information requested')} /><Button label="Decline request" onPress={() => resolveReleaseRequest(selectedRelease, 'Declined')} /><Button label="Approve & archive" kind="danger" onPress={() => resolveReleaseRequest(selectedRelease, 'Approved & archived')} /><Button label="Approve & reassign" kind="primary" disabled={!releaseReplacement} onPress={() => resolveReleaseRequest(selectedRelease, 'Approved & reassigned')} /></> : null}</View></> : null}
      {selectedRequest && selectedRequestPatient ? <><ModalHeader title="Review suspension request" subtitle={`Request ${selectedRequest.id} · submitted ${formatDate(selectedRequest.submitted)}`} onClose={() => setSelection(null)} /><View style={styles.requestReviewNotice}><Ionicons name="shield-checkmark-outline" size={20} color={C.yellow} /><Text style={styles.requestReason}>{selectedRequest.reason}</Text></View><View style={styles.detailGrid}><Detail label="Student" value={`${selectedRequestPatient.name} · ${selectedRequestPatient.studentNumber}`} /><Detail label="Current access" value={selectedRequestPatient.access} /><Detail label="Assigned Therapist" value={activeTherapistFor(selectedRequestPatient.therapistId)} /><Detail label="Requesting Therapist" value={selectedRequestTherapist?.name ?? 'Unavailable'} /></View><Text style={styles.sourceNote}>Approving suspends student access. Declining leaves their current access unchanged. Both decisions are recorded.</Text><View style={styles.detailActions}>{selectedRequest.status === 'Pending' ? <><Button label="Decline request" onPress={() => resolveRequest(selectedRequest, 'Declined')} /><Button label="Approve suspension" kind="danger" onPress={() => resolveRequest(selectedRequest, 'Approved')} /></> : <Status label={selectedRequest.status} tone={selectedRequest.status === 'Approved' ? 'green' : 'neutral'} />}</View></> : null}
    </ScrollView></Pressable></Pressable></Modal>

    <Modal visible={Boolean(offboardingId)} transparent animationType="fade" onRequestClose={() => { setOffboardingId(null); setOffboardingReason(''); }}><Pressable style={styles.overlay} onPress={() => { setOffboardingId(null); setOffboardingReason(''); }}><Pressable style={[styles.dialog, styles.formDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title={`Deactivate ${offboardingPerson?.name ?? 'Therapist'}`} subtitle={`${offboardingPatients.length} assigned student${offboardingPatients.length === 1 ? '' : 's'} must be reassigned first.`} onClose={() => { setOffboardingId(null); setOffboardingReason(''); }} /><View style={styles.requestReviewNotice}><Ionicons name="git-branch-outline" size={19} color={C.orange} /><Text style={styles.noticeText}>Choose an active replacement Therapist for every enrolled student. Their assignment history stays in the activity log.</Text></View><ScrollView style={styles.offboardingList}>{offboardingPatients.map((patient) => <View key={patient.id} style={styles.offboardingRow}><View style={styles.offboardingPatient}>{avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber}</Text></View></View><SelectControl label={`Replacement Therapist for ${patient.name}`} value={offboardingChoices[patient.id] ?? ''} options={['', ...eligibleReplacements(patient.id).map((person) => person.id)]} getLabel={(id) => id ? professionals.find((person) => person.id === id)?.name ?? id : 'Choose Therapist'} onChange={(id) => setOffboardingChoices((current) => ({ ...current, [patient.id]: id }))} /></View>)}</ScrollView><View style={styles.field}><Text style={styles.fieldLabel}>Reason for deactivation</Text><TextInput value={offboardingReason} onChangeText={setOffboardingReason} placeholder="Enter a reason" placeholderTextColor={C.subtle} multiline style={[styles.input, { minHeight: 58, paddingTop: 10, textAlignVertical: 'top' }]} /></View><View style={styles.dialogActions}><Button label="Cancel" onPress={() => { setOffboardingId(null); setOffboardingReason(''); }} /><Button label="Reassign & deactivate" kind="danger" onPress={finalizeOffboarding} disabled={offboardingPatients.some((patient) => !offboardingChoices[patient.id]) || !offboardingReason.trim()} /></View></Pressable></Pressable></Modal>

    <Modal visible={Boolean(confirmation)} transparent animationType="fade" onRequestClose={() => setConfirmation(null)}><Pressable style={styles.overlay} onPress={() => setConfirmation(null)}><Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}><View style={[styles.confirmIcon, confirmation?.danger && styles.confirmIconDanger]}><Ionicons name={confirmation?.danger ? 'warning-outline' : 'help-circle-outline'} size={22} color={confirmation?.danger ? C.red : C.blue} /></View><Text style={styles.dialogTitle}>{confirmation?.title}</Text><Text style={styles.confirmMessage}>{confirmation?.message}</Text>{confirmation?.requiresReason ? <View style={styles.field}><Text style={styles.fieldLabel}>Reason for deactivation</Text><TextInput value={confirmationReason} onChangeText={setConfirmationReason} placeholder="Enter a reason" placeholderTextColor={C.subtle} multiline style={[styles.input, { minHeight: 58, paddingTop: 10, textAlignVertical: 'top' }]} /></View> : null}<View style={styles.dialogActions}><Button label="Cancel" onPress={() => setConfirmation(null)} /><Button label={confirmation?.actionLabel ?? 'Continue'} kind={confirmation?.danger ? 'danger' : 'primary'} onPress={() => confirmation?.run()} /></View></Pressable></Pressable></Modal>

    {toast ? <View style={styles.toast} accessibilityLiveRegion="polite"><Ionicons name="checkmark-circle" size={19} color={C.green} /><Text style={styles.toastText}>{toast}</Text><TouchableOpacity onPress={() => setToast('')} accessibilityLabel="Dismiss notification"><Ionicons name="close" size={17} color={C.muted} /></TouchableOpacity></View> : null}
  </View>;
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return <View style={styles.modalHeader}><View style={styles.modalHeaderText}><Text style={styles.dialogTitle}>{title}</Text>{subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}</View><TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close dialog"><Ionicons name="close" size={20} color={C.ink} /></TouchableOpacity></View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailCell}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action: React.ReactNode }) {
  return <View style={styles.emptyState}><Ionicons name="search-outline" size={21} color={C.subtle} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.secondaryText}>{detail}</Text>{action}</View>;
}

function SelectControl({ label, value, options, getLabel, onChange }: { label: string; value: string; options: string[]; getLabel: (value: string) => string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  if (Platform.OS === 'web') {
    return <View style={styles.selectFrame}>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} style={webSelectStyle}>
        {options.map((option) => <option key={option} value={option}>{getLabel(option)}</option>)}
      </select>
      <Ionicons name="chevron-down" size={14} color={C.muted} style={styles.selectIcon} />
    </View>;
  }
  return <>
    <TouchableOpacity style={styles.selectFrame} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${getLabel(value)}`}><Text style={styles.selectNativeValue}>{getLabel(value)}</Text><Ionicons name="chevron-down" size={14} color={C.muted} /></TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><Pressable style={styles.overlay} onPress={() => setOpen(false)}><View style={styles.nativeOptions}>{options.map((option) => <TouchableOpacity key={option} onPress={() => { onChange(option); setOpen(false); }} style={styles.nativeOption}><Text style={styles.personName}>{getLabel(option)}</Text>{value === option ? <Ionicons name="checkmark" size={17} color={C.blue} /> : null}</TouchableOpacity>)}</View></Pressable></Modal>
  </>;
}

const webSelectStyle: React.CSSProperties = {
  width: '100%', height: 38, appearance: 'none', border: 'none', backgroundColor: 'transparent',
  color: C.ink, fontFamily: 'Geist-Regular, sans-serif', fontSize: 13, padding: '0 30px 0 11px', cursor: 'pointer',
};

const styles = StyleSheet.create({
  professionalDrawerOverlay: { justifyContent: 'flex-start', alignItems: 'flex-end', padding: 0 },
  professionalDrawer: { width: '100%', maxWidth: 500, height: '100%', maxHeight: '100%', alignSelf: 'stretch', padding: 24, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  professionalDrawerScroll: { flex: 1, flexGrow: 1, maxHeight: '100%' },
  accountPagination: { minHeight: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }, accountPaginationCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 9 }, accountPaginationSummary: { flex: 1, color: C.muted, fontSize: 11 }, accountPaginationControls: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3 }, accountPaginationControlsCompact: { flex: 0 }, accountPaginationSide: { flex: 1 }, pageArrow: { width: 32, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, pageArrowDisabled: { opacity: 0.38 }, doubleChevronSecond: { marginLeft: -8 }, pageNumber: { minWidth: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, pageNumberActive: { backgroundColor: C.blueSoft, borderWidth: 1, borderColor: '#C9E3F4' }, pageNumberText: { color: C.ink, fontSize: 12 }, pageNumberTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' },
  idTableCell: { flex: 1.05, minWidth: 105 }, roleTableCell: { flex: 0.68, minWidth: 72 }, statusTableCell: { flex: 0.95, minWidth: 92 }, setupTableCell: { flex: 0.88, minWidth: 82 }, assignmentTableCell: { flex: 0.8, minWidth: 82 },
  appRoot: { flex: 1, flexDirection: 'row', minHeight: '100vh' as any, backgroundColor: C.page, fontFamily: 'Geist-Regular' as any }, appRootDesktop: { padding: 16, gap: 12 }, appRootCompact: { padding: 0 },
  sidebar: { width: 244, flexShrink: 0, backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.line, paddingTop: 26, paddingHorizontal: 16, paddingBottom: 18 },
  sidebarRail: { width: 76, alignItems: 'center', borderWidth: 1, borderRightWidth: 1, borderColor: C.line, borderRadius: 18, paddingHorizontal: 8, paddingTop: 16, paddingBottom: 14 },
  sidebarRailExpanded: { width: 226, alignItems: 'stretch', paddingHorizontal: 12 },
  sidebarPinButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, paddingHorizontal: 11, marginTop: 'auto' as any, marginBottom: 6 },
  sidebarDrawer: { width: 270, minHeight: '100%' as any, borderRightWidth: 0 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 34 }, brandLockupRail: { justifyContent: 'center', paddingHorizontal: 0, paddingBottom: 28 }, navItemRail: { width: 46, justifyContent: 'center', paddingHorizontal: 0, marginBottom: 8 }, sidebarBottomRail: { width: '100%', alignItems: 'center' },
  brandMark: { width: 42, height: 42 }, brandName: { color: C.blueDeep, fontFamily: 'SourGummy-Bold', fontSize: 21, lineHeight: 24 }, brandSub: { color: C.muted, fontFamily: 'Geist-SemiBold', fontSize: 9, letterSpacing: 1.3, marginTop: 1 },
  navCaption: { color: C.subtle, fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 1.1, marginLeft: 11, marginBottom: 9 }, navItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, paddingHorizontal: 11, marginBottom: 3 }, navItemActive: { backgroundColor: C.blueSoft }, navText: { color: C.muted, fontFamily: 'Geist-Medium', fontSize: 14, flex: 1 }, navTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, navBadge: { color: C.yellow, fontSize: 11, fontFamily: 'Geist-SemiBold', backgroundColor: C.yellowSoft, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }, sidebarBottom: { marginTop: 'auto' as any, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.line }, demoPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: C.blueSoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, marginHorizontal: 8 }, demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue }, demoText: { color: C.blueDeep, fontSize: 11, fontFamily: 'Geist-SemiBold' }, sidebarNote: { color: C.subtle, fontSize: 11, marginVertical: 8, marginHorizontal: 8 },
  workspace: { flex: 1, minWidth: 0, backgroundColor: C.white, overflow: 'hidden', borderWidth: 1, borderColor: '#D9E5EE', borderRadius: 18, ...(Platform.OS === 'web' ? { boxShadow: '0 14px 38px rgba(73, 92, 105, 0.12)' } : { elevation: 2 }) } as any, topbar: { minHeight: 62, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, zIndex: 10 }, breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 9 }, breadcrumbRoot: { color: C.subtle, fontSize: 13 }, breadcrumbCurrent: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 13 }, topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 14 }, centerName: { color: C.muted, fontSize: 12, marginRight: 4 }, iconButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' }, iconBadge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, backgroundColor: C.red }, iconBadgeText: { color: C.white, fontSize: 9, fontFamily: 'Geist-SemiBold' }, adminMenuAnchor: { position: 'relative', zIndex: 20 }, adminChip: { minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 7 }, adminMenuArrow: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }, adminInitial: { width: 29, height: 29, borderRadius: 15, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }, adminInitialText: { color: C.blue, fontSize: 10, fontFamily: 'Geist-SemiBold' }, adminChipText: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium' }, content: { flex: 1, minHeight: 0 },
  pageScroll: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 45, maxWidth: 1500, width: '100%', alignSelf: 'center', gap: 24 }, pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, minHeight: 54 }, pageHeaderText: { flex: 1, minWidth: 0 }, pageTitle: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 27, letterSpacing: -0.55 }, pageSubtitle: { color: C.muted, fontSize: 13, marginTop: 5, lineHeight: 19 },
  button: { minHeight: 44, flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center', borderRadius: 7, paddingHorizontal: 13, paddingVertical: 8 }, button_primary: { backgroundColor: C.blue }, button_secondary: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line }, button_text: { backgroundColor: 'transparent', paddingHorizontal: 7 }, button_danger: { backgroundColor: C.redSoft, borderWidth: 1, borderColor: '#F3D1D4' }, buttonText: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12 }, buttonTextPrimary: { color: C.white }, buttonTextDanger: { color: C.red }, buttonDisabled: { opacity: 0.46 }, mutedText: { color: C.muted },
  metricStrip: { flexDirection: 'row', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, overflow: 'hidden' }, metric: { flex: 1, minWidth: 0, paddingHorizontal: 18, paddingVertical: 16, borderRightWidth: 1, borderRightColor: C.line }, metricCompact: { minWidth: '48%' as any, borderBottomWidth: 1, borderBottomColor: C.line, borderRightWidth: 0 }, metricStripCompact: { flexWrap: 'wrap' }, metricLabel: { color: C.muted, fontSize: 12, fontFamily: 'Geist-Medium' }, metricValueLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, metricValue: { color: C.ink, fontSize: 29, lineHeight: 34, fontFamily: 'Geist-SemiBold', fontVariant: ['tabular-nums'] }, metricFoot: { color: C.subtle, fontSize: 10, marginTop: 5 }, attentionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  attentionPanel: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  caseloadList: { gap: 0 }, caseloadRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 8 }, caseloadTrack: { flex: 1, height: 8, backgroundColor: '#EEF3F6', borderRadius: 4, overflow: 'hidden' }, caseloadFill: { height: '100%', backgroundColor: '#83B84A', borderRadius: 4 },
  activityPanel: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  pagination: { minHeight: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: C.line }, paginationActions: { flexDirection: 'row', gap: 8 },
  profileMenu: { position: 'absolute', top: 50, right: 0, width: 220, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 8, zIndex: 30, ...(Platform.OS === 'web' ? { boxShadow: '0 12px 34px rgba(23,54,77,0.16)' } : { elevation: 8 }) }, profileMenuItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, borderRadius: 7 }, profileMenuText: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 13 },
  assignmentOverview: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 17 }, assignmentOverviewRows: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18 }, assignmentOverviewRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, width: '48%' as any, borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 7 }, assignmentOverviewRowCompact: { width: '100%' as any }, assignmentOverviewName: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium', flex: 1 }, assignmentOverviewCount: { color: C.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  dashboardColumns: { flexDirection: 'row', alignItems: 'flex-start', gap: 30 }, dashboardColumnsCompact: { flexDirection: 'column' }, attentionColumn: { flex: 1.08, minWidth: 0 }, activityColumn: { flex: 0.92, minWidth: 0 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 13 }, sectionTitle: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 16 }, sectionSub: { color: C.muted, fontSize: 11, marginTop: 4, lineHeight: 16 }, attentionCount: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingHorizontal: 2 }, countText: { color: C.red, fontSize: 23, lineHeight: 27, fontFamily: 'Geist-SemiBold', fontVariant: ['tabular-nums'] }, attentionCountLabel: { color: C.red, fontSize: 11, fontFamily: 'Geist-Medium' }, countTextClear: { color: C.green }, attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.line }, attentionIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, attentionCopy: { flex: 1, minWidth: 0 }, attentionTitle: { color: C.ink, fontSize: 13, fontFamily: 'Geist-SemiBold', marginBottom: 3 }, attentionTime: { color: C.subtle, fontSize: 10, marginTop: 5 }, clearState: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 9 }, clearStateText: { color: C.green, fontFamily: 'Geist-Medium', fontSize: 13 }, linkText: { color: C.blue, fontSize: 12, fontFamily: 'Geist-SemiBold' },
  activityItem: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 22, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.line }, activityItemCompact: { paddingVertical: 12 }, activityMark: { position: 'absolute', left: 0, top: 18, width: 7, height: 7, borderRadius: 4 }, activityCopy: { flex: 1, minWidth: 0 }, activityTitle: { color: C.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 4 }, secondaryText: { color: C.muted, fontSize: 11, lineHeight: 16 }, activityDate: { color: C.subtle, fontSize: 10, marginTop: 3, textAlign: 'right' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.blueSoft, borderRadius: 7, paddingVertical: 10, paddingHorizontal: 12, alignSelf: 'flex-start' }, noticeText: { color: C.blueDeep, fontSize: 11, lineHeight: 16, flexShrink: 1 }, directoryControls: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }, accountSearchArea: { gap: 10 }, accountSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, accountFilterTagRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }, accountFilterTag: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#B9DCF2', borderRadius: 15, backgroundColor: '#F1F8FC' }, accountFilterTagText: { color: C.blueDeep, fontSize: 11, fontFamily: 'Geist-Medium' }, accountFilterReset: { marginLeft: 'auto' as any, minHeight: 30, justifyContent: 'center', paddingHorizontal: 6 }, accountFilterResetText: { color: C.blue, fontSize: 11, fontFamily: 'Geist-Medium' }, searchBox: { width: 440, maxWidth: '100%' as any, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, paddingHorizontal: 11 }, searchBoxFullWidth: { width: 0, minWidth: 0, flex: 1 }, accountFiltersButton: { height: 44, minWidth: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 11, borderWidth: 1, borderColor: C.line, borderRadius: 7, backgroundColor: C.white }, accountFiltersButtonText: { color: C.blueDeep, fontSize: 12, fontFamily: 'Geist-Medium' }, accountFiltersCount: { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: C.blueSoft }, accountFiltersCountText: { color: C.blue, fontSize: 10, fontFamily: 'Geist-SemiBold' }, accountFiltersDialog: { maxWidth: 440, maxHeight: '88%' }, accountFiltersDialogBody: { flexGrow: 0, maxHeight: 490 }, accountFiltersDialogContent: { gap: 13, paddingBottom: 4 }, searchInput: { flex: 1, color: C.ink, fontSize: 13, paddingVertical: 0 } as any, filterWrap: { gap: 5 }, filterLabel: { color: C.muted, fontSize: 10, fontFamily: 'Geist-Medium' }, selectFrame: { minWidth: 140, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, overflow: 'hidden', paddingRight: 10 }, selectNativeValue: { color: C.ink, fontSize: 13, paddingLeft: 11, flex: 1 }, selectIcon: { position: 'absolute', right: 10, top: 12, pointerEvents: 'none' as any }, nativeOptions: { width: '88%' as any, maxWidth: 390, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.white }, nativeOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line }, columnFilterWrap: { position: 'relative' }, columnFilterTrigger: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5 }, columnFilterLabel: { color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, columnFilterMenu: { position: 'absolute', top: 33, left: 0, minWidth: 176, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, zIndex: 100, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 22px rgba(23,54,77,0.16)' } : { elevation: 10 }) } as any, columnFilterOption: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E8EFF4' }, columnFilterOptionText: { color: C.ink, fontSize: 11 }, columnFilterOptionSelected: { color: C.blue, fontFamily: 'Geist-SemiBold' }, directoryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, resultCount: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 12 },
  table: { backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, tableHead: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: '#F0F7FB', borderBottomWidth: 1, borderBottomColor: C.line, position: 'relative', zIndex: 10 }, tableHeadCell: { flex: 1, minWidth: 70, color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, personHead: { flex: 2.2 }, tableRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: '#E5EEF4' }, rowHover: { backgroundColor: '#F4F9FC' }, personCell: { flex: 2.2, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: 'Geist-SemiBold', fontSize: 11 }, personText: { flex: 1, minWidth: 0 }, personName: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 12 }, tableCell: { flex: 1, minWidth: 70, color: C.ink, fontSize: 11 }, numberCell: { textAlign: 'center', fontVariant: ['tabular-nums'] }, rowAction: { width: 22, alignItems: 'flex-end' }, status: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 }, statusDot: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 10, fontFamily: 'Geist-SemiBold' }, mobileRows: { gap: 9 }, mobileRow: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 13, gap: 12 }, mobileRowBottom: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 46 },
  patientHeaderNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, paddingHorizontal: 13, backgroundColor: C.blueSoft, borderRadius: 7 }, patientHeaderNoteText: { color: C.blueDeep, fontSize: 11, flex: 1 }, requestSection: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 16 }, requestRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: C.line }, requestMain: { flex: 1 },
  logList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, logRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }, logDate: { width: 120 }, logDateDay: { color: C.ink, fontSize: 11, fontFamily: 'Geist-Medium' }, logActor: { width: 130, alignItems: 'flex-end' },
  settingsPanel: { paddingVertical: 18, paddingHorizontal: 20, backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line }, settingLabel: { color: C.muted, fontSize: 12 }, settingValue: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium', textAlign: 'right', flexShrink: 1 }, settingInput: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12, textAlign: 'right', width: '68%' as any, minHeight: 38, paddingHorizontal: 8, borderWidth: 1, borderColor: C.line, borderRadius: 6, backgroundColor: C.white } as any, settingsAction: { alignSelf: 'flex-end', marginTop: 15 }, profileSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(14, 38, 56, 0.38)', padding: 18 }, mobileDrawer: { alignSelf: 'stretch', maxWidth: 310, width: '88%', height: '100%', marginRight: 'auto', backgroundColor: C.white, borderRadius: 9, overflow: 'hidden' }, dialog: { width: '100%', maxWidth: 610, maxHeight: '88%', backgroundColor: C.white, borderRadius: 11, padding: 23, borderWidth: 1, borderColor: C.line, ...(Platform.OS === 'web' ? { boxShadow: '0 18px 50px rgba(23,54,77,0.17)' } : { elevation: 8 }) } as any, detailDialog: { maxWidth: 650 }, detailScroll: { maxHeight: 520, flexGrow: 0 } as any, formDialog: { maxWidth: 520 }, accountDialog: { height: 520, maxHeight: '88%', overflow: 'hidden' }, confirmDialog: { width: '100%', maxWidth: 430, backgroundColor: C.white, borderRadius: 11, padding: 24, alignItems: 'flex-start', borderWidth: 1, borderColor: C.line }, notificationLayer: { flex: 1 }, notificationPopover: { position: 'absolute', width: 360, maxWidth: '92%', maxHeight: '78%', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 18, ...(Platform.OS === 'web' ? { boxShadow: '0 14px 38px rgba(23,54,77,0.20)' } : { elevation: 10 }) }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, marginBottom: 18 }, modalHeaderText: { flex: 1 }, dialogTitle: { color: C.ink, fontSize: 19, fontFamily: 'Geist-SemiBold' }, closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }, detailIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.line }, detailName: { color: C.ink, fontSize: 17, fontFamily: 'Geist-SemiBold' }, detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, paddingVertical: 12 }, detailCell: { width: '50%', paddingVertical: 10, paddingRight: 12 }, detailLabel: { color: C.subtle, fontSize: 10, marginBottom: 5 }, detailValue: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium' }, detailSection: { paddingTop: 15, paddingBottom: 10, borderTopWidth: 1, borderTopColor: C.line }, fieldLabel: { color: C.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 8 }, linkedPatient: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 40 }, smallAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }, smallAvatarText: { color: C.blue, fontSize: 9, fontFamily: 'Geist-SemiBold' }, assignmentSummary: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 }, assignmentTrigger: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }, choiceList: { borderWidth: 1, borderColor: C.line, borderRadius: 7, marginTop: 3, paddingHorizontal: 10 }, choiceRow: { minHeight: 39, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }, sourceNote: { color: C.subtle, fontSize: 10, lineHeight: 15, marginTop: 7 }, detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: C.line }, requestReviewNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.yellowSoft, padding: 12, borderRadius: 7, marginBottom: 12 }, requestReason: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 18 }, confirmIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, confirmIconDanger: { backgroundColor: C.redSoft }, confirmMessage: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 16 }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 9, marginTop: 15, alignSelf: 'stretch' },
  field: { gap: 6, marginBottom: 14 }, input: { height: 42, paddingHorizontal: 11, borderRadius: 7, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, color: C.ink, fontSize: 13 } as any, roleChoices: { flexDirection: 'row', gap: 9, marginBottom: 14 }, roleChoice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, height: 44, borderWidth: 1, borderColor: C.line, borderRadius: 7 }, roleChoiceActive: { borderColor: C.blue, backgroundColor: C.blueSoft }, roleChoiceText: { color: C.muted, fontSize: 12 }, roleChoiceTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, formHint: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.blueSoft, borderRadius: 7, padding: 10 }, errorText: { color: C.red, fontSize: 11, marginTop: 10 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }, segment: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#F0F6FA' }, segmentActive: { backgroundColor: C.blueSoft }, segmentText: { color: C.muted, fontSize: 11 }, segmentTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, markAll: { marginLeft: 'auto' as any, padding: 6 }, notificationList: { maxHeight: 400 }, notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.line }, unreadMark: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue, marginTop: 5 }, readMark: { backgroundColor: C.line },
  offboardingList: { maxHeight: 360 }, offboardingRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, gap: 9 }, offboardingPatient: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 18, backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, emptyTitle: { color: C.ink, fontSize: 14, fontFamily: 'Geist-SemiBold' }, toast: { position: 'absolute', bottom: 22, right: 24, maxWidth: '90%' as any, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 9px 24px rgba(23,54,77,0.14)' } : { elevation: 5 }) } as any, toastText: { color: C.ink, fontSize: 12, flexShrink: 1, maxWidth: 480 },
});
