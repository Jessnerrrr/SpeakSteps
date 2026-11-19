import { Ionicons, Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Animated,
  Easing,
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

type Page = 'Dashboard' | 'Accounts' | 'Activity Logs' | 'Settings';
type AccountView = 'Directory' | 'Student Requests' | 'Archive Center';
type AccountRow = { kind: 'professional'; person: Professional } | { kind: 'student'; patient: Patient };
type AccountSort = { key: 'Account' | 'ID' | 'Access' | 'Setup' | 'Assignments' | 'Date'; direction: 'ascending' | 'descending' };
const ACCOUNT_SORT_OPTIONS: { label: string; key: AccountSort['key']; direction: AccountSort['direction'] }[] = [
  { label: 'Alphabetical (A–Z)', key: 'Account', direction: 'ascending' },
  { label: 'Alphabetical (Z–A)', key: 'Account', direction: 'descending' },
  { label: 'Latest added', key: 'Date', direction: 'descending' },
  { label: 'Oldest added', key: 'Date', direction: 'ascending' },
];
type Selection = { kind: 'professional'; id: string } | { kind: 'patient'; id: string } | { kind: 'request'; id: string } | { kind: 'release'; id: string } | null;
const accountViewIcon = (view: AccountView, active: boolean): React.ComponentProps<typeof Ionicons>['name'] => {
  if (view === 'Directory') return active ? 'list' : 'list-outline';
  if (view === 'Student Requests') return active ? 'document-text' : 'document-text-outline';
  return active ? 'archive' : 'archive-outline';
};
type Confirmation = { title: string; message: string; actionLabel: string; danger?: boolean; requiresReason?: boolean; requiresEvidence?: boolean; run: () => void };

type AdminSharedRecords = {
  professionals: Professional[];
  patients: Patient[];
  requests: SuspensionRequest[];
  releaseRequests: ReleaseRequest[];
  activity: ActivityEntry[];
  notifications: typeof initialNotifications;
};

let sharedAdminRecords: AdminSharedRecords = {
  professionals: initialProfessionals,
  patients: initialPatients,
  requests: initialRequests,
  releaseRequests: initialReleaseRequests,
  activity: initialActivity,
  notifications: initialNotifications,
};
const adminRecordListeners = new Set<() => void>();
const subscribeAdminRecords = (listener: () => void) => { adminRecordListeners.add(listener); return () => adminRecordListeners.delete(listener); };
const getAdminRecords = () => sharedAdminRecords;
const updateAdminRecords = <K extends keyof AdminSharedRecords>(key: K, update: React.SetStateAction<AdminSharedRecords[K]>) => {
  const current = sharedAdminRecords[key];
  sharedAdminRecords = { ...sharedAdminRecords, [key]: typeof update === 'function' ? (update as (value: AdminSharedRecords[K]) => AdminSharedRecords[K])(current) : update };
  adminRecordListeners.forEach((listener) => listener());
};

const C = {
  blue: '#0865AD', blueDeep: '#12456C', blueSoft: '#EAF7FF', blueLine: '#C8E5F5',
  ink: '#17364D', muted: '#48657A', subtle: '#60788D', page: '#FFFFFF', white: '#FFFFFF',
  line: '#D9E5EE', green: '#287A4B', greenSoft: '#E8F5EC', yellow: '#8A5B00', yellowSoft: '#FFF4D8',
  orange: '#A94D2D', orangeSoft: '#FFF0E8', red: '#AD3B42', redSoft: '#FDEBED', brown: '#17364D',
};

const NAV: { label: Page; icon: React.ComponentProps<typeof Ionicons>['name']; activeIcon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { label: 'Accounts', icon: 'people-outline', activeIcon: 'people' },
  { label: 'Activity Logs', icon: 'time-outline', activeIcon: 'time' },
];

type AdminNavigationState = { sidebarExpanded: boolean; accountsExpanded: boolean };
let adminNavigationState: AdminNavigationState = { sidebarExpanded: false, accountsExpanded: false };
const adminNavigationListeners = new Set<() => void>();
const subscribeAdminNavigation = (listener: () => void) => { adminNavigationListeners.add(listener); return () => adminNavigationListeners.delete(listener); };
const getAdminNavigation = () => adminNavigationState;
const subscribeViewportReady = () => () => {};
const getViewportReadySnapshot = () => true;
const getViewportReadyServerSnapshot = () => false;
const updateAdminNavigation = (update: Partial<AdminNavigationState>) => {
  adminNavigationState = { ...adminNavigationState, ...update };
  adminNavigationListeners.forEach((listener) => listener());
};
const setAdminAccountsExpanded = (update: React.SetStateAction<boolean>) => {
  updateAdminNavigation({ accountsExpanded: typeof update === 'function' ? update(adminNavigationState.accountsExpanded) : update });
};

const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date.slice(0, 10)}T12:00:00`));
const formatTimestamp = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const professionalAccess = (person: Professional) => person.access ?? (person.status === 'Suspended' ? 'Suspended' : 'Active');
const professionalMembership = (person: Professional) => person.membership ?? (person.status === 'Deactivated' ? 'Deactivated' : 'Active');
const professionalSetup = (person: Professional) => person.invitation === 'Completed' ? 'Completed' : 'Pending';
const studentAccess = (student: Patient) => student.access === 'Setup pending' ? 'Active' : student.access;
const studentMembership = (student: Patient) => student.membership ?? 'Active';
const studentSetup = (student: Patient) => student.setup ?? (student.access === 'Setup pending' ? 'Pending' : 'Completed');
const studentAssignmentStatus = (student: Patient) => student.teacherId || student.therapistId ? 'Assigned' : 'Unassigned';
const releaseFollowup = (request: ReleaseRequest, now: number) => {
  const days = Math.max(0, Math.floor((now - new Date(`${request.submitted}T12:00:00`).getTime()) / 86400000));
  const count = request.reminderCount ?? 0;
  const nextDay = [3, 7, 14][count];
  const open = request.status === 'Pending' || request.status === 'More information requested';
  const waiting = request.origin !== 'Therapist';
  return { days, nextDay, due: open && waiting && nextDay !== undefined && days >= nextDay, overdue: open && waiting && days >= 14 };
};

function IconButton({ icon, label, onPress, badge }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; badge?: string }) {
  return <TouchableOpacity onPress={onPress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label}><Ionicons name={icon} size={19} color={C.ink} />{badge ? <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{badge}</Text></View> : null}</TouchableOpacity>;
}

function Button({ label, onPress, kind = 'secondary', disabled = false, icon }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'text' | 'danger'; disabled?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={[styles.button, kind === 'primary' ? styles.button_primary : kind === 'danger' ? styles.button_danger : kind === 'text' ? styles.button_text : styles.button_secondary, disabled && styles.buttonDisabled]}>{icon ? <Ionicons name={icon} size={16} color={kind === 'primary' ? C.white : C.blue} /> : null}<Text style={[styles.buttonText, kind === 'primary' && styles.buttonTextPrimary, kind === 'danger' && styles.buttonTextDanger, disabled && styles.mutedText]}>{label}</Text></TouchableOpacity>;
}

function Status({ label, tone }: { label: string; tone?: 'green' | 'yellow' | 'red' | 'blue' | 'neutral' }) {
  const color = tone === 'green' ? C.green : tone === 'yellow' ? C.yellow : tone === 'red' ? C.red : tone === 'blue' ? C.blue : C.muted;
  const background = tone === 'green' ? C.greenSoft : tone === 'yellow' ? C.yellowSoft : tone === 'red' ? C.redSoft : tone === 'blue' ? C.blueSoft : '#EDF3F6';
  return <View style={[styles.status, { backgroundColor: background }]}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.statusText, { color }]}>{label}</Text></View>;
}

function Filter({ value, options, onChange, label, getLabel = (option) => option }: { value: string; options: string[]; onChange: (value: string) => void; label: string; getLabel?: (value: string) => string }) {
  return <View style={styles.filterWrap}><Text style={styles.filterLabel}>{label}</Text><SelectControl label={label} value={value} options={options} getLabel={getLabel} onChange={onChange} /></View>;
}

function ColumnFilter({ label, active, options, onSort, sortDirection }: { label: string; active?: boolean; options: { label: string; selected: boolean; onSelect: () => void }[]; onSort?: () => void; sortDirection?: 'ascending' | 'descending' | null }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepOpen = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const closeSoon = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpen(false), 120); };
  const menu = <Pressable onHoverIn={keepOpen} onHoverOut={closeSoon} style={styles.columnFilterMenu}>{options.map((option, index) => <TouchableOpacity key={`${option.label}-${index}`} accessibilityRole="button" accessibilityState={{ selected: option.selected }} onPress={() => { keepOpen(); option.onSelect(); setOpen(false); }} style={styles.columnFilterOption}><Text style={[styles.columnFilterOptionText, option.selected && styles.columnFilterOptionSelected]}>{option.label}</Text>{option.selected ? <Ionicons name="checkmark" size={15} color={C.blue} /> : null}</TouchableOpacity>)}</Pressable>;
  return <View style={styles.columnFilterWrap}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}><Pressable onHoverIn={() => { keepOpen(); setOpen(true); }} onHoverOut={closeSoon} accessibilityRole="button" accessibilityLabel={`Sort by ${label}${sortDirection ? `, ${sortDirection}` : ''}`} onPress={onSort} style={styles.columnFilterTrigger}><Text style={styles.columnFilterLabel}>{label}</Text>{onSort && sortDirection === 'descending' ? <Ionicons name="arrow-down" size={12} color={C.blue} /> : null}</Pressable><Pressable onHoverIn={() => { keepOpen(); setOpen(true); }} onHoverOut={closeSoon} accessibilityRole="button" accessibilityLabel={`Filter ${label}`} accessibilityState={{ expanded: open }} onPress={() => Platform.OS === 'web' ? setOpen(true) : setOpen((value) => !value)} style={{ minWidth: 25, minHeight: 34, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={12} color={active ? C.blue : C.muted} /></Pressable></View>
    {open && Platform.OS === 'web' ? menu : null}
    {open && Platform.OS !== 'web' ? <Modal transparent animationType="fade" visible onRequestClose={() => setOpen(false)}><Pressable style={[styles.overlay, { backgroundColor: 'transparent' }]} onPress={() => setOpen(false)}>{menu}</Pressable></Modal> : null}
  </View>;
}

function SortHeader({ label, onPress, active, direction, showDirection = true }: { label: string; onPress: () => void; active: boolean; direction: 'ascending' | 'descending'; showDirection?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Sort by ${label}${active ? `, ${direction}` : ''}`} onPress={onPress} style={[styles.columnFilterTrigger, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}><Text style={styles.columnFilterLabel}>{label}</Text>{showDirection && active && direction === 'descending' ? <Ionicons name="arrow-down" size={12} color={C.blue} /> : null}</TouchableOpacity>;
}

function SearchBox({ value, onChange, placeholder, fullWidth = false }: { value: string; onChange: (value: string) => void; placeholder: string; fullWidth?: boolean }) {
  return <View style={[styles.searchBox, fullWidth && styles.searchBoxFullWidth]}><Ionicons name="search-outline" size={18} color={C.muted} /><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.subtle} style={styles.searchInput} accessibilityLabel={placeholder} returnKeyType="search" /></View>;
}

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <View style={styles.pageHeader}><View style={styles.pageHeaderText}><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>{action}</View>;
}

export default function AdminDashboardScreen({ initialAccountView }: { initialAccountView?: AccountView } = {}) {
  const { account: accountRouteParam, page: pageRouteParam, role: accountRoleParam, search: accountSearchParam, access: accountAccessParam, setup: accountSetupParam, enrollment: accountEnrollmentParam, teacher: teacherParam, therapist: therapistParam, recordKind, recordId } = useLocalSearchParams<{ account?: string; page?: string; role?: string; search?: string; access?: string; setup?: string; membership?: string; enrollment?: string; teacher?: string; therapist?: string; recordKind?: string; recordId?: string }>();
  const routeAccountView: AccountView | null = initialAccountView ?? (accountRouteParam === 'student-requests' ? 'Student Requests' : accountRouteParam === 'archive-center' ? 'Archive Center' : accountRouteParam === 'directory' ? 'Directory' : null);
  const routePage: Page = pageRouteParam === 'activity-logs' ? 'Activity Logs' : pageRouteParam === 'settings' ? 'Settings' : 'Dashboard';
  const { width } = useWindowDimensions();
  const viewportReady = useSyncExternalStore(subscribeViewportReady, getViewportReadySnapshot, getViewportReadyServerSnapshot);
  const desktop = viewportReady && width >= 1050;
  const compact = !viewportReady || width < 680;
  const page: Page = routeAccountView ? 'Accounts' : routePage;
  const accountView: AccountView = routeAccountView ?? 'Directory';
  const { sidebarExpanded, accountsExpanded } = useSyncExternalStore(subscribeAdminNavigation, getAdminNavigation, getAdminNavigation);
  const setAccountsExpanded = setAdminAccountsExpanded;
  const [menuOpen, setMenuOpen] = useState(false);
  const setSidebarExpanded = (next: boolean) => updateAdminNavigation({ sidebarExpanded: next });
  const { professionals, patients, requests, releaseRequests, activity, notifications } = useSyncExternalStore(subscribeAdminRecords, getAdminRecords, getAdminRecords);
  const setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>> = (update) => updateAdminRecords('professionals', update);
  const setPatients: React.Dispatch<React.SetStateAction<Patient[]>> = (update) => updateAdminRecords('patients', update);
  const setRequests: React.Dispatch<React.SetStateAction<SuspensionRequest[]>> = (update) => updateAdminRecords('requests', update);
  const setReleaseRequests: React.Dispatch<React.SetStateAction<ReleaseRequest[]>> = (update) => updateAdminRecords('releaseRequests', update);
  const setActivity: React.Dispatch<React.SetStateAction<ActivityEntry[]>> = (update) => updateAdminRecords('activity', update);
  const recentActivityViewport = useRef({ scrollTop: 0, height: 0, panelTop: 0 });
  const recentActivityRows = useRef(new Map<string, { top: number; height: number }>());
  const [viewedAlertIds, setViewedAlertIds] = useState<Set<string>>(() => new Set());
  const setNotifications: React.Dispatch<React.SetStateAction<typeof initialNotifications>> = (update) => updateAdminRecords('notifications', update);
  const initialRecordSelection: Selection = recordKind && recordId && ['professional', 'patient', 'request', 'release'].includes(recordKind) ? { kind: recordKind as Exclude<NonNullable<Selection>['kind'], never>, id: recordId } : null;
  const [selection, setSelection] = useState<Selection>(initialRecordSelection);
  const [accountDetailPaneWidth] = useState(() => new Animated.Value(0));
  const [accountDetailPaneOpacity] = useState(() => new Animated.Value(0));
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationReason, setConfirmationReason] = useState('');
  const [confirmationEvidence, setConfirmationEvidence] = useState('');
  const confirmationReasonRef = useRef('');
  const confirmationEvidenceRef = useRef('');
  const [prototypeNow] = useState(() => Date.now());
  const [toast, setToast] = useState('');
  const [accountRole, setAccountRole] = useState(accountRoleParam ?? 'All roles');
  const [accountAccess, setAccountAccess] = useState(accountAccessParam ?? 'All access');
  const [accountSetup, setAccountSetup] = useState(accountSetupParam ?? 'All setup');
  const [accountMembership, setAccountMembership] = useState('All memberships');
  const [accountEnrollment, setAccountEnrollment] = useState(accountEnrollmentParam ?? 'All enrollment');
  const [accountAssignments, setAccountAssignments] = useState('All assignments');
  const [patientTherapist, setPatientTherapist] = useState(therapistParam ?? 'All therapists');
  const [accountSearch, setAccountSearch] = useState(accountSearchParam ?? '');
  const [accountFiltersOpen, setAccountFiltersOpen] = useState(false);
  const [accountPageState, setAccountPageState] = useState({ page: 0, filterKey: '' });
  const [accountSort, setAccountSort] = useState<AccountSort>({ key: 'Account', direction: 'ascending' });
  const [patientTeacher, setPatientTeacher] = useState(teacherParam ?? 'All teachers');
  const [requestTypeFilter, setRequestTypeFilter] = useState('All types');
  const [requestStatusFilter, setRequestStatusFilter] = useState('Open');
  const [requestStageFilter, setRequestStageFilter] = useState('All stages');
  const [requestFollowupFilter, setRequestFollowupFilter] = useState('All follow-ups');
  const [requestAction, setRequestAction] = useState('');
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
  const pushAccountsRoute = (view: AccountView, record: Selection = null, overrides: Partial<{ role: string; search: string; access: string; setup: string; membership: string; enrollment: string; teacher: string; therapist: string }> = {}) => {
    const pathname = view === 'Student Requests' ? '/(admin)/accounts/student-requests' : view === 'Archive Center' ? '/(admin)/accounts/archive-center' : '/(admin)/accounts/directory';
    const recordContext = record?.kind === 'patient' ? { role: 'Student', search: patients.find((patient) => patient.id === record.id)?.name ?? accountSearch } : record?.kind === 'professional' ? { role: professionals.find((person) => person.id === record.id)?.role ?? accountRole, search: professionals.find((person) => person.id === record.id)?.name ?? accountSearch } : {};
    const context = view === 'Directory' ? { role: accountRole, search: accountSearch, access: accountAccess, setup: accountSetup, membership: accountMembership, enrollment: accountEnrollment, teacher: patientTeacher, therapist: patientTherapist, ...recordContext, ...overrides } : {};
    const recordParams = record ? { recordKind: record.kind, recordId: record.id } : {};
    router.push({ pathname, params: { ...context, ...recordParams } } as any);
  };
  const goToAccountsView = (view: AccountView, record: Selection = null, context: Partial<{ role: string; search: string; access: string; setup: string; membership: string; enrollment: string; teacher: string; therapist: string }> = {}) => {
    setMenuOpen(false);
    pushAccountsRoute(view, record, context);
    if (view === 'Directory') setViewedAlertIds((current) => new Set([...current, ...professionals.filter((person) => person.invitation === 'Pending' || person.invitation === 'Failed').map((person) => person.id), ...patients.filter((student) => studentSetup(student) === 'Pending').map((student) => student.id)]));
    if (view === 'Student Requests') setViewedAlertIds((current) => new Set([...current, ...requests.filter((request) => request.status === 'Pending').map((request) => request.id), ...releaseRequests.filter((request) => request.status === 'Pending' || request.status === 'More information requested').map((request) => request.id)]));
  };
  const goTo = (target: Page) => {
    setMenuOpen(false);
    if (target === 'Accounts') { goToAccountsView('Directory'); return; }
    router.push({ pathname: '/(admin)/admin-dashboard', params: { page: target === 'Activity Logs' ? 'activity-logs' : target.toLowerCase() } } as any);
    if (target === 'Activity Logs') setActivity((current) => current.map((entry) => ({ ...entry, read: true })));
  };

  const eligibleProfessional = (person: Professional) => person.status === 'Active' && professionalAccess(person) === 'Active' && professionalMembership(person) === 'Active' && person.invitation === 'Completed';
  const activeTherapists = professionals.filter((person) => person.role === 'Therapist' && eligibleProfessional(person)).sort((a, b) => patients.filter((patient) => patient.therapistId === a.id && patient.enrollment === 'Enrolled').length - patients.filter((patient) => patient.therapistId === b.id && patient.enrollment === 'Enrolled').length || a.name.localeCompare(b.name));
  const activeTeachers = professionals.filter((person) => person.role === 'Teacher' && eligibleProfessional(person));
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
      const followup = releaseFollowup(request, prototypeNow);
      return { key: request.id, title: followup.overdue ? 'Student request overdue' : 'Student request', detail: followup.overdue ? `Awaiting ${request.followupRecipient ?? request.origin ?? 'authorized user'} · ${request.reminderCount ?? 0} reminders recorded · last reminder ${request.lastReminderAt ? formatDate(request.lastReminderAt) : 'none'}.` : `${therapist?.name ?? request.origin ?? 'An authorized user'} submitted a request for ${patient?.name ?? 'a Student'}.`, date: `Submitted ${formatDate(request.submitted)}`, icon: 'document-text-outline' as const, tone: 'yellow' as const, action: 'Review', run: () => { setReleaseReplacement(''); setReleaseNote(''); goToAccountsView('Student Requests', { kind: 'release', id: request.id }); } };
    }),
    ...pendingRequests.map((request) => {
      const patient = patients.find((item) => item.id === request.patientId);
      const therapist = professionals.find((item) => item.id === request.therapistId);
      return { key: request.id, title: 'Student access request', detail: `${therapist?.name ?? 'A Therapist'} submitted an access suspension request for ${patient?.name ?? 'a Student'}.`, date: `Submitted ${formatDate(request.submitted)}`, icon: 'chatbubble-ellipses-outline' as const, tone: 'yellow' as const, action: 'Review', run: () => { setRequestStatusFilter('Open'); goToAccountsView('Student Requests', { kind: 'request', id: request.id }); } };
    }),
    ...reassignmentPatients.map((patient) => ({ key: patient.id, title: 'Reassignment needed', detail: `${patient.name} is assigned to suspended Therapist ${activeTherapistFor(patient.therapistId)}.`, date: '', icon: 'git-branch-outline' as const, tone: 'orange' as const, action: 'Review', run: () => { setAccountRole('Student'); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setPatientTeacher('All teachers'); setPatientTherapist('All therapists'); setAccountSearch(patient.name); goToAccountsView('Directory', { kind: 'patient', id: patient.id }, { role: 'Student', search: patient.name, enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', teacher: 'All teachers', therapist: 'All therapists' }); } })),
    ...pendingPatientSetups.map((patient) => ({ key: patient.id, title: 'Student account setup pending', detail: `${patient.name} · Guardian invitation setup is pending.`, date: '', icon: 'mail-unread-outline' as const, tone: 'blue' as const, action: 'Review', run: () => { setAccountRole('Student'); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(patient.name); goToAccountsView('Directory', { kind: 'patient', id: patient.id }, { role: 'Student', search: patient.name, enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships' }); } })),
    ...pendingInvitations.map((person) => ({ key: person.id, title: person.invitation === 'Failed' ? 'Invitation delivery issue' : 'Account setup pending', detail: `${person.name} · ${person.role} · ${person.email}`, date: '', icon: 'mail-unread-outline' as const, tone: 'blue' as const, action: 'Review', run: () => goToAccountsView('Directory', { kind: 'professional', id: person.id }, { role: person.role, setup: 'Pending', search: person.name, access: 'All access', membership: 'All memberships', enrollment: 'All enrollment' }) })),
  ];

  const visibleProfessionals = professionals.filter((person) => {
    const query = accountSearch.trim().toLowerCase();
    const assignedCount = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    const inactive = professionalAccess(person) === 'Suspended' || professionalMembership(person) === 'Deactivated';
    return (accountView === 'Archive Center' ? inactive : !inactive)
      && (accountRole === 'All roles' || accountRole === person.role)
      && (accountView !== 'Archive Center' || accountAccess === 'All access' || professionalAccess(person) === accountAccess)
      && (accountSetup === 'All setup' || professionalSetup(person) === accountSetup)
      && (accountAssignments === 'All assignments' || (accountAssignments === 'Assigned' ? assignedCount > 0 : assignedCount === 0))
      && (!query || [person.name, person.email, person.role, professionalAccess(person), professionalSetup(person), person.staffId ?? '', person.professionalIdentifier ?? ''].some((value) => value.toLowerCase().includes(query)));
  });
  const visibleAccountPatients = patients.filter((patient) => {
    const query = accountSearch.trim().toLowerCase();
    const setupStatus = studentSetup(patient);
    const inactive = patient.enrollment === 'Archived' || studentAccess(patient) === 'Suspended' || studentMembership(patient) === 'Deactivated';
    return (accountView === 'Archive Center' ? inactive : !inactive)
      && (accountRole === 'All roles' || accountRole === 'Student')
      && (accountView !== 'Archive Center' || accountAccess === 'All access' || studentAccess(patient) === accountAccess)
      && (accountSetup === 'All setup' || accountSetup === setupStatus)
      && (accountAssignments === 'All assignments' || (accountAssignments === 'Assigned' ? studentAssignmentStatus(patient) === 'Assigned' : studentAssignmentStatus(patient) === 'Unassigned'))
      && (!query || [patient.name, patient.studentNumber, patient.guardianContact, 'student'].some((value) => value.toLowerCase().includes(query)));
  });
  const accountFilterTags = [
    ...(accountView === 'Archive Center' && accountAccess !== 'All access' ? [{ label: `Access: ${accountAccess}`, clear: () => setAccountAccess('All access') }] : []),
    ...(accountSetup !== 'All setup' ? [{ label: `Setup: ${accountSetup}`, clear: () => setAccountSetup('All setup') }] : []),
    ...(accountAssignments !== 'All assignments' ? [{ label: `Assignments: ${accountAssignments}`, clear: () => setAccountAssignments('All assignments') }] : []),
  ];
  const accountViewCriteria = [
    ...(accountRole !== 'All roles' ? [accountRole] : []),
    ...accountFilterTags.map(({ label }) => label),
    ...(accountSearch.trim() ? [`Search: “${accountSearch.trim()}”`] : []),
  ];
  const accountViewSummary = accountViewCriteria.length ? `Showing ${accountViewCriteria.join(' · ')}` : 'Showing all accounts';
  const resetAccountFilters = () => { setAccountRole('All roles'); setAccountAccess('All access'); setAccountSetup('All setup'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountAssignments('All assignments'); setPatientTeacher('All teachers'); setPatientTherapist('All therapists'); };
  const changeAccountRole = (role: string) => { setAccountRole(role); if (role === 'Student') setAccountMembership('All memberships'); };
  const accountFilterKey = [accountView, accountSearch, accountRole, accountAccess, accountSetup, accountAssignments].join('|');
  const accountPage = accountPageState.filterKey === accountFilterKey ? accountPageState.page : 0;
  const setAccountPage = (page: number) => setAccountPageState({ page, filterKey: accountFilterKey });
  const accountRows: AccountRow[] = [
    ...visibleProfessionals.map((person) => ({ kind: 'professional' as const, person })),
    ...visibleAccountPatients.map((patient) => ({ kind: 'student' as const, patient })),
  ].sort((a, b) => {
    const value = (row: AccountRow) => {
      if (accountSort.key === 'Account') return row.kind === 'professional' ? row.person.name : row.patient.name;
      if (accountSort.key === 'ID') return row.kind === 'professional' ? (row.person.role === 'Therapist' ? row.person.staffId ?? '' : row.person.professionalIdentifier ?? '') : row.patient.studentNumber;
      if (accountSort.key === 'Date') return new Date(`${(row.kind === 'professional' ? row.person.joined : row.patient.registered).slice(0, 10)}T12:00:00`).getTime();
      if (accountSort.key === 'Access') return row.kind === 'professional' ? professionalAccess(row.person) : studentAccess(row.patient);
      if (accountSort.key === 'Setup') return row.kind === 'professional' ? professionalSetup(row.person) : studentSetup(row.patient);
      return row.kind === 'professional' ? patients.filter((student) => (row.person.role === 'Therapist' ? student.therapistId === row.person.id : student.teacherId === row.person.id) && student.enrollment === 'Enrolled').length : -1;
    };
    const av = value(a); const bv = value(b);
    const comparison = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return accountSort.direction === 'ascending' ? comparison : -comparison;
  });
  const toggleAccountSort = (key: typeof accountSort.key) => setAccountSort((current) => ({ key, direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending' }));
  const selectedAccountSort = ACCOUNT_SORT_OPTIONS.find((option) => option.key === accountSort.key && option.direction === accountSort.direction) ?? ACCOUNT_SORT_OPTIONS[0];
  const selectAccountSort = (label: string) => {
    const option = ACCOUNT_SORT_OPTIONS.find((item) => item.label === label);
    if (option) setAccountSort({ key: option.key, direction: option.direction });
  };
  const accountPageCount = Math.ceil(accountRows.length / 10);
  const accountPageIndex = Math.min(accountPage, Math.max(0, accountPageCount - 1));
  const accountPageRows = accountRows.slice(accountPageIndex * 10, (accountPageIndex + 1) * 10);
  const accountPageNumbers = Array.from({ length: Math.min(5, accountPageCount) }, (_, index) => {
    const first = Math.max(0, Math.min(accountPageIndex - 2, accountPageCount - 5));
    return first + index;
  });
  const orderedActivity = [...activity].sort((a, b) => b.date.localeCompare(a.date));
  const visibleLogs = orderedActivity.filter((entry) => (logCategory === 'All activity' || entry.category === logCategory)
    && (!logSearch.trim() || [entry.title, entry.detail, entry.actor].some((value) => value.toLowerCase().includes(logSearch.trim().toLowerCase()))));

  const makeProfessional = (draft: ProfessionalDraft) => {
    const profile = draft.role === 'Teacher' ? (({ lookupStaffId: _lookupStaffId, ...teacherRecord }) => teacherRecord)(draft) : draft;
    const recordIdentifier = draft.role === 'Therapist' ? draft.staffId : draft.professionalIdentifier;
    const person: Professional = { id: `pro-${draft.role.toLowerCase()}-${recordIdentifier}`, ...profile, access: 'Active', membership: 'Active', status: 'Active', invitation: 'Pending', joined: new Date().toISOString().slice(0, 10), invitationUpdated: new Date().toISOString().slice(0, 10) };
    setProfessionals((current) => [person, ...current]);
    addLog(`${draft.role} account created`, `${person.name} · ${draft.role === 'Therapist' ? `Staff ID ${person.staffId}` : `Professional ID ${person.professionalIdentifier}`} · setup pending`, 'Account');
    addNotification('Invitation awaiting setup', `${person.name} can complete account setup after receiving an invitation.`);
    setNewAccountOpen(false); setCreatePatientOpen(false); setAccountRole(draft.role); setAccountAccess('All access'); setAccountSetup('All setup'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountSearch('');
    setAccountPage(0);
    setSelection({ kind: 'professional', id: person.id });
    flash(`${person.name} added. Account setup is pending.`);
  };

  const makePatient = (record: { studentNumber: string; name: string; grade: string; section: string; guardian: string; guardianEmail: string; guardianPhone: string; school: string }, teacherId: string, therapistId: string) => {
    const patient: Patient = {
      id: `pt-${record.studentNumber}`, name: record.name, studentNumber: record.studentNumber, therapistId,
      access: 'Active', setup: 'Pending', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: new Date().toISOString().slice(0, 10),
      guardian: record.guardian, guardianContact: record.guardianEmail, school: record.school, grade: record.grade, section: record.section, teacherId,
    };
    setPatients((current) => [patient, ...current]);
    addLog('Student account created', `${patient.name} · ${patient.studentNumber}; invitation pending`, 'Student');
    addNotification('Student account created', `${patient.name} is assigned to ${activeTherapistFor(therapistId)}. Guardian setup invitation is pending.`);
    addNotification('New student assignment', `${patient.name} · ${patient.studentNumber} was assigned to ${activeTherapistFor(therapistId)}.`);
    setAccountSearch(''); setAccountRole('Student'); setAccountAccess('All access'); setAccountSetup('All setup'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment');
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
      setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: 'Suspended', access: 'Suspended', membership: professionalMembership(item), lifecycleUpdatedAt: new Date().toISOString() } : item));
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
      setAccountRole('Student'); setSelection(null); setAccountSearch(''); setPatientTeacher(person.id); goToAccountsView('Directory', null, { role: 'Student', search: '', enrollment: 'Enrolled', teacher: person.id, therapist: 'All therapists', access: 'All access', setup: 'All setup' });
      flash(`Reassign ${assignedStudents.length} enrolled student${assignedStudents.length === 1 ? '' : 's'} to another Teacher before deactivating ${person.name}.`);
      return;
    }
    if (next === 'Active') {
      const restoringMembership = professionalMembership(person) === 'Deactivated';
      const accessStillSuspended = professionalAccess(person) === 'Suspended';
      setConfirmation({
        title: `${restoringMembership ? 'Reinstate' : 'Reactivate access for'} ${person.name}?`,
        message: restoringMembership
          ? `Restore ${person.name}’s center membership. ${accessStillSuspended ? 'Suspended sign-in access remains suspended and needs a separate review. ' : ''}Existing setup and Student relationships remain attached to this record.`
          : `Restore sign-in access for ${person.name}. Existing Student relationships remain unchanged.`,
        actionLabel: restoringMembership ? 'Reinstate account' : 'Reactivate access',
        run: () => {
          setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: restoringMembership && accessStillSuspended ? 'Suspended' : 'Active', access: restoringMembership ? professionalAccess(item) : 'Active', membership: restoringMembership ? 'Active' : professionalMembership(item), lifecycleUpdatedAt: new Date().toISOString() } : item));
          addLog(restoringMembership ? 'Professional account reinstated' : 'Professional access reactivated', `${person.name} · ${person.role}`, 'Account');
          setConfirmation(null); setSelection(null);
          flash(`${person.name}’s ${restoringMembership ? 'account is reinstated' : 'access is active again'}.`);
        },
      });
      return;
    }
    const verb = 'Deactivate account';
    setConfirmationReason(''); confirmationReasonRef.current = '';
    setConfirmation({
      title: `${verb}: ${person.name}?`,
      message: `This deactivates ${person.name}’s center membership and moves the account to Archive Center while preserving account history.`,
      actionLabel: verb,
      danger: true,
      requiresReason: true,
      run: () => {
        if (!confirmationReasonRef.current.trim()) { flash('Enter a reason to deactivate this account.'); return; }
        setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: next, access: professionalAccess(item), membership: 'Deactivated', lifecycleUpdatedAt: new Date().toISOString() } : item));
        addLog('Professional account deactivated', `${person.name} · ${person.role} · ${confirmationReasonRef.current.trim()}`, 'Account');
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
    setProfessionals((current) => current.map((item) => item.id === offboardingId ? { ...item, status: 'Deactivated', membership: 'Deactivated', lifecycleUpdatedAt: new Date().toISOString() } : item));
    assigned.forEach((patient) => addLog('Student reassigned', `${patient.name} · ${person?.name} → ${activeTherapistFor(offboardingChoices[patient.id])}`, 'Student'));
    addLog('Professional account deactivated', `${person?.name} · ${offboardingReason.trim()}`, 'Account');
    setOffboardingId(null); setOffboardingReason(''); setSelection(null); setAssignmentChoicesOpen(null);
    flash(`${person?.name} deactivated after student reassignment.`);
  };

  const reassignPatient = (patient: Patient, therapistId: string) => {
    const replacement = professionals.find((person) => person.id === therapistId && person.role === 'Therapist' && eligibleProfessional(person));
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
    if (!teacher || teacher.role !== 'Teacher' || !eligibleProfessional(teacher)) { flash('That Teacher is no longer eligible for assignment.'); return; }
    const previous = professionals.find((person) => person.id === patient.teacherId)?.name ?? 'No Teacher';
    setConfirmation({ title: `Change Assigned Teacher for ${patient.name}?`, message: `Update the SpeakSteps assignment from ${previous} to ${teacher.name}. School identity records will not change.`, actionLabel: 'Change Teacher', run: () => {
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, teacherId } : item));
      addLog('Assigned Teacher changed', `${patient.name} · ${previous} → ${teacher.name}`, 'Student');
      addNotification('Assigned Teacher updated', `${patient.name} is now assigned to ${teacher.name}.`);
      setConfirmation(null); setTeacherChoicesOpen(null); setSelection({ kind: 'patient', id: patient.id }); flash(`${patient.name} is now assigned to ${teacher.name}.`);
    } });
  };

  const changePatientAccess = (patient: Patient, next: PatientAccess) => {
    if (next === 'Setup pending') return;
    setConfirmationReason(''); confirmationReasonRef.current = '';
    const actionLabel = next === 'Suspended' ? 'Suspend access' : 'Reactivate access';
    setConfirmation({
      title: `${actionLabel}: ${patient.name}?`,
      message: next === 'Suspended'
        ? `This prevents ${patient.name} and their Guardian from signing in and moves the account to Archive Center. Enrollment, identity details, assignments, and therapy status remain unchanged.`
        : `This restores account access for ${patient.name}. Archived enrollment must be restored separately.`,
      actionLabel,
      danger: next === 'Suspended',
      requiresReason: next === 'Suspended',
      run: () => {
        if (next === 'Active' && patient.enrollment !== 'Enrolled') { flash('Restore enrollment separately before reactivating account access.'); return; }
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, access: next, lifecycleUpdatedAt: new Date().toISOString() } : item));
        const reason = confirmationReasonRef.current.trim();
        addLog(next === 'Suspended' ? 'Student access suspended' : 'Student access reactivated', `${patient.name} · ${patient.studentNumber}${next === 'Suspended' ? ` · ${reason}` : ''}`, 'Student');
        addNotification(next === 'Suspended' ? 'Student access suspended' : 'Student access reactivated', `${patient.name} · ${next === 'Suspended' ? reason : 'Access restored by Center Admin'}`);
        setConfirmation(null); setConfirmationReason('');  setSelection({ kind: 'patient', id: patient.id });
        flash(`Access ${next === 'Suspended' ? 'suspended' : 'reactivated'} for ${patient.name}.`);
      },
    });
  };

  const changePatientMembership = (patient: Patient, next: 'Active' | 'Deactivated') => {
    const deactivating = next === 'Deactivated';
    setConfirmationReason(''); confirmationReasonRef.current = '';
    setConfirmation({
      title: `${deactivating ? 'Deactivate' : 'Reactivate'} ${patient.name}'s account?`,
      message: deactivating
        ? `This deactivates ${patient.name}'s account membership and moves the account to Archive Center. Enrollment, assignments, and account access are preserved.`
        : `This restores ${patient.name}'s account membership and moves it out of Archive Center if access is active.`,
      actionLabel: deactivating ? 'Deactivate account' : 'Reactivate account',
      danger: deactivating,
      requiresReason: deactivating,
      run: () => {
        if (deactivating && !confirmationReasonRef.current.trim()) { flash('Enter a reason to deactivate this account.'); return; }
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, membership: next, lifecycleUpdatedAt: new Date().toISOString() } : item));
        addLog(deactivating ? 'Student account deactivated' : 'Student account reactivated', `${patient.name} · ${patient.studentNumber}${deactivating ? ` · ${confirmationReasonRef.current.trim()}` : ''}`, 'Account');
        addNotification(deactivating ? 'Student account deactivated' : 'Student account reactivated', `${patient.name} · ${deactivating ? 'Moved to Archive Center' : 'Membership restored'}`);
        setConfirmation(null); setConfirmationReason(''); setSelection(null);
        flash(`${patient.name}'s account ${deactivating ? 'deactivated' : 'reactivated'}.`);
      },
    });
  };

  const archivePatient = (patient: Patient, restore = false) => {
    const next = restore ? 'Enrolled' : 'Archived';
    setConfirmationReason(''); setConfirmationEvidence(''); confirmationReasonRef.current = ''; confirmationEvidenceRef.current = '';
    if (restore) {
      const teacher = professionals.find((person) => person.id === patient.teacherId && person.role === 'Teacher' && eligibleProfessional(person));
      const therapist = professionals.find((person) => person.id === patient.therapistId && person.role === 'Therapist' && eligibleProfessional(person));
      if (!teacher || !therapist) { flash('Choose an eligible Teacher and Therapist in Accounts before restoring this Student.'); return; }
    }
    setConfirmation({
      title: `${restore ? 'Restore' : 'Archive'} ${patient.name}?`,
      message: restore ? 'Confirm current school enrollment and assignment eligibility. Account access and therapy status stay in their current states.' : 'This ends active enrollment and preserves the account, assignments, and history. Add the administrative reason and verified school evidence reference below.',
      actionLabel: restore ? 'Restore Student' : 'Archive Student', danger: !restore, requiresReason: true, requiresEvidence: true,
      run: () => {
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, enrollment: next, lifecycleUpdatedAt: new Date().toISOString() } : item));
        addLog(restore ? 'Student enrollment restored' : 'Student archived', `${patient.name} · ${patient.studentNumber} · ${confirmationReasonRef.current.trim()} · Evidence: ${confirmationEvidenceRef.current.trim()}`, 'Student');
        addNotification(restore ? 'Student enrollment restored' : 'Student enrollment archived', `${patient.name} · ${patient.studentNumber}`);
        setConfirmation(null); setConfirmationReason(''); setConfirmationEvidence(''); setSelection({ kind: 'patient', id: patient.id });
        flash(`${patient.name} ${restore ? 'restored to enrollment' : 'archived'}.`);
      },
    });
  };

  const resolveRequest = (request: SuspensionRequest, status: Exclude<RequestStatus, 'Pending'>) => {
    if (request.status !== 'Pending') { flash('This request has already been resolved.'); return; }
    const patient = patients.find((item) => item.id === request.patientId);
    const therapist = professionals.find((item) => item.id === request.therapistId);
    if (status === 'Approved' && patient?.enrollment === 'Archived') { flash('Restore the student’s enrollment before approving this request.'); return; }
    if (status === 'Approved' && patient && (studentSetup(patient) !== 'Completed' || studentAccess(patient) !== 'Active')) { flash('This Student does not currently have active sign-in access to suspend.'); return; }
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status, events: [...(item.events ?? []), { id: `event-${Date.now()}`, title: status === 'Approved' ? 'Suspension approved' : 'Request declined', detail: 'Center Admin recorded the administrative decision.', actor: 'Center admin', date: new Date().toISOString() }] } : item));
    if (status === 'Approved' && patient) setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, access: 'Suspended', lifecycleUpdatedAt: new Date().toISOString() } : item));
    const decision = status === 'Approved' ? 'approved' : 'declined';
    addLog(`Suspension request ${decision}`, `${patient?.name ?? 'Patient'} · request ${request.id} · by ${therapist?.name ?? 'Therapist'}`, 'Request');
    addNotification(`Request ${decision}`, `${patient?.name ?? 'Patient'} · request ${request.id}`);
    addNotification(status === 'Approved' ? 'Student access suspended' : 'Student access request declined', `${patient?.name ?? 'Student'} · ${request.id}`);
    setSelection(null); flash(status === 'Approved' ? `Access suspended for ${patient?.name}.` : `Request declined. ${patient?.name}’s access is unchanged.`);
  };

  const resolveReleaseRequest = (request: ReleaseRequest, decision: 'More information requested' | 'Approved & reassigned' | 'Approved & archived' | 'Declined') => {
    const patient = patients.find((item) => item.id === request.patientId);
    if (!patient) { flash('This student record is no longer available.'); return; }
    if (request.status !== 'Pending' && request.status !== 'More information requested') { flash('This request has already been resolved.'); return; }
    if ((decision.startsWith('Approved') || decision === 'Declined') && request.workflowStage && request.workflowStage !== 'Ready for Admin Review') { flash('Wait for the required Guardian or Teacher response before making a final decision.'); return; }
    if (decision === 'Approved & reassigned' && (!releaseReplacement || releaseReplacement === patient.therapistId)) { flash('Choose an active replacement Therapist first.'); return; }
    if ((decision === 'More information requested' || decision === 'Declined') && !releaseNote.trim()) { flash('Add a short note so the Therapist knows what needs attention.'); return; }
    if (decision === 'Approved & archived' && (!request.attachment || !['Verified', 'Unable to Verify'].includes(request.teacherVerification ?? 'Pending'))) { flash('Archival requires a verified school evidence reference and a documented Teacher verification outcome.'); return; }
    if (decision === 'Approved & archived' && !['Transfer', 'Withdrawal', 'Enrollment release'].includes(request.requestType ?? 'Enrollment release')) { flash('This request concerns a Therapist assignment and cannot archive enrollment.'); return; }
    if (decision.startsWith('Approved')) {
      const replacementName = professionals.find((person) => person.id === releaseReplacement)?.name;
      const archived = decision === 'Approved & archived';
      setConfirmation({ title: archived ? `Approve and archive ${patient.name}?` : `Approve reassignment for ${patient.name}?`, message: archived ? `School evidence and Teacher verification have been reviewed. This archives enrollment and preserves account access and historical records. Reason: ${request.reason}. Evidence: ${request.attachment}.` : `Change the SpeakSteps Therapist assignment from ${activeTherapistFor(patient.therapistId)} to ${replacementName}. Enrollment and access stay unchanged.`, actionLabel: archived ? 'Approve & Archive' : 'Approve & Reassign', danger: archived, run: () => { applyReleaseDecision(request, decision); setConfirmation(null); setRequestAction(''); } });
      return;
    }
    applyReleaseDecision(request, decision);
  };

  const applyReleaseDecision = (request: ReleaseRequest, decision: ReleaseRequest['status']) => {
    const patient = patients.find((item) => item.id === request.patientId);
    if (!patient) return;
    if (decision === 'Approved & reassigned') {
      const replacement = professionals.find((person) => person.id === releaseReplacement && person.role === 'Therapist' && eligibleProfessional(person));
      if (!replacement || replacement.id === patient.therapistId) { flash('The selected Therapist is no longer eligible. Choose another replacement.'); return; }
    }
    if (decision === 'Approved & archived' && (!request.attachment || request.teacherVerification !== 'Verified' || !['Transfer', 'Withdrawal', 'Enrollment release'].includes(request.requestType ?? 'Enrollment release'))) { flash('This request does not have the required verified school evidence for archival.'); return; }
    setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: decision } : item));
    if (decision === 'Approved & reassigned') {
      const replacement = professionals.find((person) => person.id === releaseReplacement)!;
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, therapistId: replacement.id } : item));
      addLog('Student release approved & reassigned', `${patient.name} · ${replacement.name}`, 'Request');
      addNotification('Student assignment updated', `${patient.name} is now assigned to ${replacement.name}.`);
    } else if (decision === 'Approved & archived') {
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, enrollment: 'Archived', lifecycleUpdatedAt: new Date().toISOString() } : item));
      addLog('Student release approved & archived', `${patient.name} · ${request.reason} · ${request.attachment}`, 'Request');
      addNotification('Student enrollment archived', `${patient.name} · ${patient.studentNumber}`);
    } else if (decision === 'More information requested') {
      addLog('More information requested', `${patient.name} · ${releaseNote.trim() || 'Clarification requested'}`, 'Request');
      addNotification('Release request needs more information', `${patient.name} · ${releaseNote.trim() || 'Please add supporting context.'}`);
      setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, workflowStage: 'Awaiting Supporting Evidence', events: [...(item.events ?? []), { id: `event-${Date.now()}`, title: 'More information requested', detail: releaseNote.trim(), actor: 'Center admin', date: new Date().toISOString() }] } : item));
    } else {
      addLog('Student release request declined', `${patient.name} · ${releaseNote.trim() || 'Existing assignment retained'}`, 'Request');
      addNotification('Student request declined', `${patient.name} · ${releaseNote.trim()}`);
    }
    if (decision.startsWith('Approved')) addNotification('Student request resolved', `${patient.name} · ${decision.toLowerCase()}.`);
    setReleaseReplacement(''); setReleaseNote(''); setSelection(null);
    flash(decision === 'More information requested' ? 'More information requested. The current assignment remains unchanged.' : `Release request ${decision.toLowerCase()}.`);
  };

  const recordReleaseReminder = (request: ReleaseRequest) => {
    if (request.status !== 'Pending' && request.status !== 'More information requested') { flash('This request no longer needs a reminder.'); return; }
    if (request.origin === 'Therapist') { flash('This request is not waiting on a Guardian or Teacher response.'); return; }
    const count = request.reminderCount ?? 0;
    const days = Math.floor((prototypeNow - new Date(`${request.submitted}T12:00:00`).getTime()) / 86400000);
    const threshold = [3, 7, 14][count];
    if (threshold === undefined || days < threshold) { flash('The next follow-up reminder is not due yet.'); return; }
    const day = threshold;
    const patient = patients.find((item) => item.id === request.patientId);
    const date = new Date(prototypeNow).toISOString();
    setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, reminderCount: count + 1, lastReminderAt: date, events: [...(item.events ?? []), { id: `event-${item.id}-${count + 1}`, title: `Day ${day} reminder recorded`, detail: `Follow-up reminder for ${item.followupRecipient ?? item.origin ?? 'authorized user'} recorded in the prototype. No message was sent.`, actor: 'System simulation', date }] } : item));
    addLog('Student request follow-up recorded', `${patient?.name ?? 'Student'} · Day ${day} · no message sent`, 'Request');
    flash(`Day ${day} follow-up recorded in mock state. No message was sent.`);
  };

  const openDashboardMetric = (target: 'accounts' | 'students' | 'requests') => {
    if (target === 'accounts') { setAccountRole('All roles'); setAccountAccess('All access'); setAccountSetup('Pending'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); goToAccountsView('Directory', null, { role: 'All roles', access: 'All access', setup: 'Pending', membership: 'All memberships', enrollment: 'All enrollment' }); }
    else if (target === 'students') { setAccountRole('Student'); setAccountEnrollment('Enrolled'); setAccountAccess('All access'); setAccountSetup('All setup'); setPatientTherapist('All therapists'); setPatientTeacher('All teachers'); setAccountSearch(''); goToAccountsView('Directory', null, { role: 'Student', enrollment: 'Enrolled', access: 'All access', setup: 'All setup', membership: 'All memberships', search: '', teacher: 'All teachers', therapist: 'All therapists' }); }
    else { setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setRequestStatusFilter('Open'); goToAccountsView('Student Requests'); }
  };

  const openNotification = (item: (typeof notifications)[number]) => {
    setNotifications((current) => current.map((note) => note.id === item.id ? { ...note, read: true } : note));
    setShowNotifications(false);
    const student = patients.find((person) => item.detail.includes(person.name));
    const professional = professionals.find((person) => item.detail.includes(person.name));
    const text = `${item.title} ${item.detail}`.toLowerCase();

    if (text.includes('invitation') || text.includes('setup')) {
      if (student) {
        setAccountRole('Student'); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(student.name); goToAccountsView('Directory', { kind: 'patient', id: student.id }, { role: 'Student', enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', search: student.name });
      } else {
        setAccountRole(professional?.role ?? 'All roles'); setAccountAccess('All access'); setAccountSetup('Pending'); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountSearch(professional?.name ?? ''); goToAccountsView('Directory', professional ? { kind: 'professional', id: professional.id } : null, { role: professional?.role ?? 'All roles', access: 'All access', setup: 'Pending', membership: 'All memberships', enrollment: 'All enrollment', search: professional?.name ?? '' });
      }
      return;
    }
    if (text.includes('reassign')) {
      setAccountRole('Student'); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(student?.name ?? ''); goToAccountsView('Directory', student ? { kind: 'patient', id: student.id } : null, { role: 'Student', enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', search: student?.name ?? '' });
      return;
    }
    if (text.includes('request') || text.includes('suspend') || text.includes('release')) {
      const release = releaseRequests.find((request) => (request.status === 'Pending' || request.status === 'More information requested') && (!student || request.patientId === student.id));
      const access = requests.find((request) => request.status === 'Pending' && (!student || request.patientId === student.id));
      setRequestStatusFilter('Open'); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); goToAccountsView('Student Requests', release ? { kind: 'release', id: release.id } : access ? { kind: 'request', id: access.id } : null);
      return;
    }
    if (student) {
      setAccountRole('Student'); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(student.name); goToAccountsView('Directory', { kind: 'patient', id: student.id }, { role: 'Student', enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', search: student.name });
      return;
    }
    if (professional) {
      setAccountRole(professional.role); setAccountSearch(professional.name); goToAccountsView('Directory', { kind: 'professional', id: professional.id }, { role: professional.role, search: professional.name, access: 'All access', setup: 'All setup', membership: 'All memberships', enrollment: 'All enrollment' });
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
  const inlineAccountDetails = desktop && Boolean(selectedProfessional || selectedPatient);
  useEffect(() => {
    const targetWidth = inlineAccountDetails ? Math.min(520, Math.max(360, width * 0.34)) : 0;
    Animated.parallel([
      Animated.timing(accountDetailPaneWidth, { toValue: targetWidth, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(accountDetailPaneOpacity, { toValue: inlineAccountDetails ? 1 : 0, duration: 170, useNativeDriver: false }),
    ]).start();
  }, [accountDetailPaneOpacity, accountDetailPaneWidth, inlineAccountDetails, width]);
  const offboardingPerson = professionals.find((person) => person.id === offboardingId);
  const offboardingPatients = patients.filter((patient) => patient.therapistId === offboardingId && patient.enrollment === 'Enrolled');
  const eligibleReplacements = (patientId: string) => activeTherapists.filter((person) => person.id !== patients.find((item) => item.id === patientId)?.therapistId);

  if (!fontsLoaded) return null;

  const avatar = (name: string, color = C.blue) => <View style={[styles.avatar, { backgroundColor: color === C.blue ? C.blueSoft : color + '18' }]}><Text style={[styles.avatarText, { color }]}>{initials(name)}</Text></View>;
  const searchedStudentId = accountView === 'Directory'
    && Boolean(accountSearch.trim())
    && (accountRole === 'All roles' || accountRole === 'Student')
    && patients.some((patient) => patient.enrollment !== 'Archived' && studentAccess(patient) !== 'Suspended' && studentMembership(patient) === 'Active' && patient.studentNumber.trim().toLowerCase() === accountSearch.trim().toLowerCase());
  const showStudentDetailsColumns = accountRole === 'Student' || searchedStudentId;
  const professionalRow = (person: Professional) => {
    const assigned = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    const identifier = person.role === 'Therapist' ? person.staffId ?? 'Not recorded' : person.professionalIdentifier ?? 'Unavailable';
    return <Pressable key={person.id} onPress={accountView === 'Archive Center' ? undefined : () => setSelection({ kind: 'professional', id: person.id })} style={({ hovered }) => [styles.tableRow, inlineAccountDetails && detailPanelStyles.tableWithPanel, hovered && styles.rowHover]} accessibilityRole={accountView === 'Archive Center' ? 'group' : 'button'} accessibilityLabel={`View ${person.name}, ${person.role}`}>
      <View style={[styles.personCell, inlineAccountDetails && detailPanelStyles.personColumnWithPanel]}>{inlineAccountDetails ? null : avatar(person.name)}<View style={styles.personText}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.email}</Text></View></View>
      <Text style={[styles.tableCell, styles.idTableCell, inlineAccountDetails && detailPanelStyles.idColumnWithPanel]} numberOfLines={1}>{identifier}</Text>
      <View style={[styles.tableCell, styles.statusTableCell, inlineAccountDetails && detailPanelStyles.statusColumnWithPanel]}><Status label={professionalMembership(person) === 'Deactivated' ? 'Deactivated' : professionalAccess(person)} tone={professionalAccess(person) === 'Active' && professionalMembership(person) !== 'Deactivated' ? 'green' : 'red'} />{professionalMembership(person) === 'Deactivated' ? <Text style={styles.secondaryText}>Membership deactivated</Text> : null}</View>
      <View style={[styles.tableCell, styles.setupTableCell, inlineAccountDetails && detailPanelStyles.setupColumnWithPanel]}>{accountView === 'Archive Center' ? <Text style={styles.secondaryText}>{person.lifecycleUpdatedAt ? formatDate(person.lifecycleUpdatedAt) : 'Date not recorded'}</Text> : person.invitation === 'Completed' ? <Text style={styles.secondaryText}>Completed</Text> : <Status label={person.invitation === 'Failed' ? 'Failed' : 'Pending'} tone={person.invitation === 'Failed' ? 'red' : 'yellow'} />}</View>
      {accountView === 'Archive Center' ? <View style={[styles.tableCell, styles.assignmentTableCell, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${person.name} details`} onPress={(event) => { event.stopPropagation(); setSelection({ kind: 'professional', id: person.id }); }} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="eye-outline" size={17} color={C.blueDeep} /></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Start recovery for ${person.name}`} onPress={(event) => { event.stopPropagation(); setProfessionalStatus(person, 'Active'); }} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="refresh-outline" size={17} color={C.blueDeep} /></TouchableOpacity></View> : <Text style={[styles.tableCell, styles.assignmentTableCell, inlineAccountDetails && detailPanelStyles.assignmentColumnWithPanel]}>{assigned}</Text>}
      {accountView === 'Archive Center' ? null : <View style={styles.rowAction}><Ionicons name="chevron-forward" size={17} color={C.subtle} /></View>}
    </Pressable>;
  };
  const accountStudentRow = (patient: Patient) => <Pressable key={patient.id} onPress={accountView === 'Archive Center' ? undefined : () => setSelection({ kind: 'patient', id: patient.id })} style={({ hovered }) => [styles.tableRow, inlineAccountDetails && detailPanelStyles.tableWithPanel, hovered && styles.rowHover]} accessibilityRole={accountView === 'Archive Center' ? 'group' : 'button'} accessibilityLabel={`View Student ${patient.name}, student number ${patient.studentNumber}`}>
    <View style={[styles.personCell, inlineAccountDetails && detailPanelStyles.personColumnWithPanel]}>{inlineAccountDetails ? null : avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.guardianContact}</Text></View></View>
    <Text style={[styles.tableCell, styles.idTableCell, inlineAccountDetails && detailPanelStyles.idColumnWithPanel]}>{patient.studentNumber}</Text>
    {showStudentDetailsColumns ? <><Text style={[styles.tableCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]} numberOfLines={1}>{professionals.find((person) => person.id === patient.teacherId)?.name ?? 'Unassigned'}</Text><Text style={[styles.tableCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]} numberOfLines={1}>{professionals.find((person) => person.id === patient.therapistId)?.name ?? 'Unassigned'}</Text><Text style={[styles.tableCell, styles.enrollmentTableCell, inlineAccountDetails && detailPanelStyles.enrollmentColumnWithPanel]}>{patient.enrollment}</Text></> : null}
    <View style={[styles.tableCell, styles.statusTableCell, inlineAccountDetails && detailPanelStyles.statusColumnWithPanel]}><Status label={studentMembership(patient) === 'Deactivated' ? 'Deactivated' : patient.enrollment === 'Archived' ? 'Archived' : studentAccess(patient)} tone={studentMembership(patient) === 'Deactivated' || patient.enrollment === 'Archived' || studentAccess(patient) === 'Suspended' ? 'red' : 'green'} /></View>
    <View style={[styles.tableCell, styles.setupTableCell, inlineAccountDetails && detailPanelStyles.setupColumnWithPanel]}>{accountView === 'Archive Center' ? <Text style={styles.secondaryText}>{patient.lifecycleUpdatedAt ? formatDate(patient.lifecycleUpdatedAt) : 'Date not recorded'}</Text> : <Text style={styles.secondaryText}>{studentSetup(patient)}</Text>}</View>
    {accountView === 'Archive Center' ? <View style={[styles.tableCell, styles.assignmentTableCell, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${patient.name} details`} onPress={(event) => { event.stopPropagation(); setSelection({ kind: 'patient', id: patient.id }); }} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="eye-outline" size={17} color={C.blueDeep} /></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Start recovery for ${patient.name}`} onPress={(event) => { event.stopPropagation(); if (studentMembership(patient) === 'Deactivated') changePatientMembership(patient, 'Active'); else if (patient.enrollment === 'Archived') archivePatient(patient, true); else changePatientAccess(patient, 'Active'); }} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="refresh-outline" size={17} color={C.blueDeep} /></TouchableOpacity></View> : <><Text style={[styles.tableCell, styles.assignmentTableCell, inlineAccountDetails && detailPanelStyles.assignmentColumnWithPanel]}>{studentAssignmentStatus(patient)}</Text><View style={styles.rowAction}><Ionicons name="chevron-forward" size={17} color={C.subtle} /></View></>}
  </Pressable>;
  const archiveActions = (row: AccountRow) => {
    const name = row.kind === 'professional' ? row.person.name : row.patient.name;
    const view = () => setSelection(row.kind === 'professional' ? { kind: 'professional', id: row.person.id } : { kind: 'patient', id: row.patient.id });
    const restore = () => row.kind === 'professional' ? setProfessionalStatus(row.person, 'Active') : studentMembership(row.patient) === 'Deactivated' ? changePatientMembership(row.patient, 'Active') : row.patient.enrollment === 'Archived' ? archivePatient(row.patient, true) : changePatientAccess(row.patient, 'Active');
    return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${name} details`} onPress={(event) => { event.stopPropagation(); view(); }} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="eye-outline" size={17} color={C.blueDeep} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Start recovery for ${name}`} onPress={(event) => { event.stopPropagation(); restore(); }} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="refresh-outline" size={17} color={C.blueDeep} /></TouchableOpacity>
    </View>;
  };
  const mobileAccountRow = (row: AccountRow) => row.kind === 'professional' ? (() => {
    const person = row.person;
    const identifier = person.role === 'Therapist' ? person.staffId ?? 'Staff ID unavailable' : person.professionalIdentifier ?? 'School ID unavailable';
    const assigned = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    return <Pressable key={person.id} onPress={accountView === 'Archive Center' ? undefined : () => setSelection({ kind: 'professional', id: person.id })} style={({ hovered }) => [styles.mobileRow, hovered && styles.rowHover]} accessibilityRole={accountView === 'Archive Center' ? 'group' : 'button'} accessibilityLabel={`View ${person.name}, ${person.role}`}>
      <View style={styles.personCell}>{avatar(person.name)}<View style={styles.personText}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.role} · {person.email}</Text><Text style={styles.secondaryText}>{identifier}</Text></View></View>
      <View style={styles.mobileRowBottom}><Status label={professionalMembership(person) === 'Deactivated' ? 'Deactivated' : professionalAccess(person)} tone={professionalAccess(person) === 'Active' && professionalMembership(person) !== 'Deactivated' ? 'green' : 'red'} />{accountView === 'Archive Center' ? <Text style={styles.secondaryText}>{person.lifecycleUpdatedAt ? formatDate(person.lifecycleUpdatedAt) : 'Date not recorded'}</Text> : <><Text style={styles.secondaryText}>Setup {professionalSetup(person).toLowerCase()}</Text><Text style={styles.secondaryText}>{assigned} assigned</Text></>}</View>
      {accountView === 'Archive Center' ? <View style={[styles.mobileRowBottom, { justifyContent: 'flex-end' }]}>{archiveActions(row)}</View> : null}
    </Pressable>;
  })() : <Pressable key={row.patient.id} onPress={accountView === 'Archive Center' ? undefined : () => setSelection({ kind: 'patient', id: row.patient.id })} style={({ hovered }) => [styles.mobileRow, hovered && styles.rowHover]} accessibilityRole={accountView === 'Archive Center' ? 'group' : 'button'} accessibilityLabel={`View Student ${row.patient.name}, ${row.patient.studentNumber}`}>
    <View style={styles.personCell}>{avatar(row.patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{row.patient.name}</Text><Text style={styles.secondaryText}>Student · {row.patient.studentNumber}</Text><Text style={styles.secondaryText}>{row.patient.guardianContact}</Text></View></View>
    <View style={styles.mobileRowBottom}><Status label={studentMembership(row.patient) === 'Deactivated' ? 'Deactivated' : row.patient.enrollment === 'Archived' ? 'Archived' : studentAccess(row.patient)} tone={studentMembership(row.patient) === 'Deactivated' || row.patient.enrollment === 'Archived' || studentAccess(row.patient) === 'Suspended' ? 'red' : 'green'} />{accountView === 'Archive Center' ? <Text style={styles.secondaryText}>{row.patient.lifecycleUpdatedAt ? formatDate(row.patient.lifecycleUpdatedAt) : 'Date not recorded'}</Text> : <><Text style={styles.secondaryText}>Setup {studentSetup(row.patient).toLowerCase()}</Text><Text style={styles.secondaryText}>{studentAssignmentStatus(row.patient)}</Text></>}</View>
    {showStudentDetailsColumns ? <View style={styles.studentMobileDetails}><Text style={styles.secondaryText}>Teacher · {professionals.find((person) => person.id === row.patient.teacherId)?.name ?? 'Unassigned'}</Text><Text style={styles.secondaryText}>Therapist · {professionals.find((person) => person.id === row.patient.therapistId)?.name ?? 'Unassigned'}</Text><Text style={styles.secondaryText}>Enrollment · {row.patient.enrollment}</Text></View> : null}
    {accountView === 'Archive Center' ? <View style={[styles.mobileRowBottom, { justifyContent: 'flex-end' }]}>{archiveActions(row)}</View> : null}
  </Pressable>;

  const activityLine = (entry: ActivityEntry, compactMode = false) => <View key={entry.id} onLayout={({ nativeEvent }) => { recentActivityRows.current.set(entry.id, { top: nativeEvent.layout.y, height: nativeEvent.layout.height }); markVisibleActivityRead(); }} style={[styles.activityItem, compactMode && styles.activityItemCompact]}>
    {!entry.read ? <View style={[styles.activityMark, { backgroundColor: C.blue }]} /> : null}
    <View style={styles.activityCopy}><Text style={styles.activityTitle}>{entry.title}</Text><Text style={styles.secondaryText}>{entry.detail} · {entry.actor}</Text></View>
    <Text style={styles.activityDate}>{formatTimestamp(entry.date)}</Text>
  </View>;

  const dashboard = () => {
    const metrics = [
      { label: 'Active Therapists', icon: 'heart-outline' as const, value: professionals.filter((person) => person.role === 'Therapist' && professionalAccess(person) === 'Active' && professionalMembership(person) === 'Active').length, foot: 'Professional accounts', click: () => { goToAccountsView('Directory', null, { role: 'Therapist', access: 'Active', setup: 'All setup', membership: 'Active', enrollment: 'All enrollment' }); } },
      { label: 'Active Teachers', icon: 'school-outline' as const, value: professionals.filter((person) => person.role === 'Teacher' && professionalAccess(person) === 'Active' && professionalMembership(person) === 'Active').length, foot: 'Professional accounts', click: () => { goToAccountsView('Directory', null, { role: 'Teacher', access: 'Active', setup: 'All setup', membership: 'Active', enrollment: 'All enrollment' }); } },
      { label: 'Registered Students', icon: 'people-outline' as const, value: patients.filter((patient) => patient.enrollment === 'Enrolled').length, foot: 'Currently enrolled', click: () => openDashboardMetric('students') },
      { label: 'Account Setups', icon: 'mail-unread-outline' as const, value: pendingAccountSetups, foot: 'Invitations awaiting setup', click: () => openDashboardMetric('accounts'), attention: pendingInvitations.some((person) => !viewedAlertIds.has(person.id)) || pendingPatientSetups.some((student) => !viewedAlertIds.has(student.id)) },
      { label: 'Administrative Requests', icon: 'document-text-outline' as const, value: pendingRequests.length + pendingReleaseRequests.length, foot: 'Student requests to review', click: () => openDashboardMetric('requests'), attention: pendingRequests.some((request) => !viewedAlertIds.has(request.id)) || pendingReleaseRequests.some((request) => !viewedAlertIds.has(request.id)) },
    ];
    const pageCount = Math.max(1, Math.ceil(attentionItems.length / 10));
    const pageIndex = Math.min(attentionPage, pageCount - 1);
    const rows = attentionItems.slice(pageIndex * 10, pageIndex * 10 + 10);
    const maxCaseload = Math.max(1, ...therapistCounts.map((person) => person.assigned));
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
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Therapist caseloads</Text><Text style={styles.sectionSub}>Current enrolled assignments; no caseload limit</Text></View><TouchableOpacity onPress={() => goToAccountsView('Directory', null, { role: 'Therapist', access: 'Active', setup: 'All setup', membership: 'Active', enrollment: 'All enrollment' })} accessibilityRole="link"><Text style={styles.linkText}>View accounts</Text></TouchableOpacity></View>
        <View style={styles.caseloadList}>{therapistCounts.map((person) => { const fill = '#287A4B'; return <TouchableOpacity key={person.id} accessibilityRole="link" accessibilityLabel={'View ' + person.name + ' in Accounts. ' + person.assigned + ' enrolled Students'} onPress={() => goToAccountsView('Directory', { kind: 'professional', id: person.id }, { role: 'Therapist', access: 'Active', setup: 'All setup', membership: 'Active', enrollment: 'All enrollment', search: person.name })} style={styles.caseloadRow}><View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{initials(person.name)}</Text></View><Text style={styles.assignmentOverviewName}>{person.name}</Text><View style={styles.caseloadTrack}><View style={[styles.caseloadFill, { width: (person.assigned / maxCaseload * 100) + '%', backgroundColor: fill }]} /></View><Text style={styles.assignmentOverviewCount}>{person.assigned} Students</Text><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>; })}{activeTherapists.length === 0 ? <Text style={styles.secondaryText}>No active Therapists. Student enrollment is unavailable until one is active.</Text> : null}</View>
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
  const accounts = () => accountView === 'Student Requests' ? studentRequestsPage() : <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title={accountView} subtitle={accountView === 'Directory' ? 'Manage student and professional accounts across your center.' : 'Review inactive accounts and start an eligible recovery.'} action={accountView === 'Directory' ? <Button label="Add Account" kind="primary" icon="add" onPress={() => { setCreatePatientOpen(true); setNewAccountOpen(true); }} /> : undefined} />
    <View style={styles.accountSearchArea}>
      <View style={styles.accountSearchRow}>
        <SearchBox value={accountSearch} onChange={setAccountSearch} placeholder="Search names, emails, and IDs" fullWidth />
        {!desktop ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Filters${accountFilterTags.length ? `, ${accountFilterTags.length} active` : ''}`} accessibilityState={{ expanded: accountFiltersOpen }} onPress={() => setAccountFiltersOpen(true)} style={styles.accountFiltersButton}><Ionicons name="filter-outline" size={17} color={C.blueDeep} /><Text style={styles.accountFiltersButtonText}>Filters</Text>{accountFilterTags.length ? <View style={styles.accountFiltersCount}><Text style={styles.accountFiltersCountText}>{accountFilterTags.length}</Text></View> : null}</TouchableOpacity> : null}
      </View>
      {accountFilterTags.length ? <View style={styles.accountFilterTagRow}>{accountFilterTags.map((tag) => <TouchableOpacity key={tag.label} accessibilityRole="button" accessibilityLabel={`Remove ${tag.label} filter`} onPress={tag.clear} style={styles.accountFilterTag}><Text style={styles.accountFilterTagText}>{tag.label}</Text><Ionicons name="close" size={12} color={C.blue} /></TouchableOpacity>)}<TouchableOpacity accessibilityRole="button" onPress={resetAccountFilters} style={styles.accountFilterReset}><Text style={styles.accountFilterResetText}>Reset</Text></TouchableOpacity></View> : null}
      {!desktop ? <Modal visible={accountFiltersOpen} transparent animationType="fade" onRequestClose={() => setAccountFiltersOpen(false)}><Pressable style={styles.overlay} onPress={() => setAccountFiltersOpen(false)}><Pressable style={[styles.dialog, styles.accountFiltersDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title="Filters" subtitle="Choose which accounts to show." onClose={() => setAccountFiltersOpen(false)} /><ScrollView style={styles.accountFiltersDialogBody} contentContainerStyle={styles.accountFiltersDialogContent} showsVerticalScrollIndicator={false}>
        <Filter label="Sort by" value={selectedAccountSort.label} options={ACCOUNT_SORT_OPTIONS.map((option) => option.label)} onChange={selectAccountSort} />
        {accountView === 'Archive Center' ? <Filter label="Access" value={accountAccess} options={['All access', 'Active', 'Suspended']} onChange={setAccountAccess} /> : null}
        <Filter label="Setup" value={accountSetup} options={['All setup', 'Pending', 'Completed']} onChange={setAccountSetup} />
        <Filter label="Assignments" value={accountAssignments} options={['All assignments', 'Assigned', 'Unassigned']} onChange={setAccountAssignments} />
      </ScrollView><View style={styles.dialogActions}><Button label="Reset filters" onPress={resetAccountFilters} /><Button label="Done" kind="primary" onPress={() => setAccountFiltersOpen(false)} /></View></Pressable></Pressable></Modal> : null}
    </View>
    <View style={styles.accountRoleTabs} accessibilityRole="tablist" accessibilityLabel="Filter accounts by role">
      {(['All roles', 'Student', 'Therapist', 'Teacher'] as const).map((role) => {
        const selected = accountRole === role;
        const label = role === 'All roles' ? 'All' : role;
        return <Pressable key={role} accessibilityRole="tab" accessibilityLabel={role === 'All roles' ? 'All accounts' : role} accessibilityState={{ selected }} onPress={() => changeAccountRole(role)} style={({ hovered, pressed }) => [styles.accountRoleTab, hovered && styles.accountRoleTabHover, pressed && styles.accountRoleTabPressed]}>
          <Text style={[styles.accountRoleTabText, selected && styles.accountRoleTabTextSelected]}>{label}</Text>
          {selected ? <View style={styles.accountRoleTabIndicator} /> : null}
        </Pressable>;
      })}
    </View>
    <View style={styles.directoryMeta}><Text style={styles.resultCount}>{visibleProfessionals.length + visibleAccountPatients.length} {accountView === 'Archive Center' ? 'inactive accounts' : 'accounts'}</Text><Text style={styles.secondaryText}>{accountViewSummary}</Text></View>
    {desktop ? <View style={styles.table}><View style={[styles.tableHead, inlineAccountDetails && detailPanelStyles.tableWithPanel]}>
      <View style={[styles.tableHeadCell, styles.personHead, inlineAccountDetails && detailPanelStyles.personColumnWithPanel]}><ColumnFilter label="Account" active={selectedAccountSort.label !== ACCOUNT_SORT_OPTIONS[0].label} options={ACCOUNT_SORT_OPTIONS.map((option) => ({ label: option.label, selected: selectedAccountSort.label === option.label, onSelect: () => selectAccountSort(option.label) }))} /></View>
      <View style={[styles.tableHeadCell, styles.idTableCell, inlineAccountDetails && detailPanelStyles.idColumnWithPanel]}><SortHeader label="ID" onPress={() => toggleAccountSort('ID')} active={accountSort.key === 'ID'} direction={accountSort.direction} /></View>
      {showStudentDetailsColumns ? <><View style={[styles.tableHeadCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]}><Text style={styles.columnFilterLabel}>Teacher</Text></View><View style={[styles.tableHeadCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]}><Text style={styles.columnFilterLabel}>Therapist</Text></View><View style={[styles.tableHeadCell, styles.enrollmentTableCell, inlineAccountDetails && detailPanelStyles.enrollmentColumnWithPanel]}><Text style={styles.columnFilterLabel}>Enrollment</Text></View></> : null}
      <View style={[styles.tableHeadCell, styles.statusTableCell, inlineAccountDetails && detailPanelStyles.statusColumnWithPanel]}>{accountView === 'Archive Center' ? <ColumnFilter label="Access" onSort={() => toggleAccountSort('Access')} sortDirection={accountSort.key === 'Access' ? accountSort.direction : null} active={accountAccess !== 'All access'} options={['All access', 'Active', 'Suspended'].map((value) => ({ label: value, selected: accountAccess === value, onSelect: () => setAccountAccess(value) }))} /> : <Text style={styles.columnFilterLabel}>Access</Text>}</View>
      <View style={[styles.tableHeadCell, styles.setupTableCell, inlineAccountDetails && detailPanelStyles.setupColumnWithPanel]}>{accountView === 'Archive Center' ? <Text style={{ color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }}>Date</Text> : <ColumnFilter label="Setup" onSort={() => toggleAccountSort('Setup')} sortDirection={accountSort.key === 'Setup' ? accountSort.direction : null} active={accountSetup !== 'All setup'} options={['All setup', 'Pending', 'Completed'].map((value) => ({ label: value, selected: accountSetup === value, onSelect: () => setAccountSetup(value) }))} />}</View>
      <View style={[styles.tableHeadCell, styles.assignmentTableCell, inlineAccountDetails && detailPanelStyles.assignmentColumnWithPanel]}>{accountView === 'Archive Center' ? <Text style={{ color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }}>Actions</Text> : <ColumnFilter label="Assignments" onSort={() => toggleAccountSort('Assignments')} sortDirection={accountSort.key === 'Assignments' ? accountSort.direction : null} active={accountAssignments !== 'All assignments'} options={['All assignments', 'Assigned', 'Unassigned'].map((value) => ({ label: value, selected: accountAssignments === value, onSelect: () => setAccountAssignments(value) }))} />}</View>
      {accountView === 'Archive Center' ? null : <View style={styles.rowAction} />}
    </View>{accountPageRows.map((row) => row.kind === 'professional' ? professionalRow(row.person) : accountStudentRow(row.patient))}{accountPagination}</View> : <><View style={styles.mobileRows}>{accountPageRows.map(mobileAccountRow)}</View>{accountPagination}</>}
    {visibleProfessionals.length + visibleAccountPatients.length === 0 ? <EmptyState title={accountView === 'Archive Center' && !accountSearch && !accountFilterTags.length ? 'No inactive accounts found.' : 'No matching records.'} detail={accountView === 'Archive Center' && !accountSearch && !accountFilterTags.length ? 'Suspended, deactivated, and archived accounts will appear here.' : 'Try clearing your search or filters.'} action={accountSearch || accountFilterTags.length ? <Button label="Clear search and filters" onPress={() => { resetAccountFilters(); setAccountSearch(''); }} /> : null} /> : null}
  </ScrollView>;

  const filteredStudentRequests = [...releaseRequests.map((request) => ({ kind: 'release' as const, request })), ...requests.map((request) => ({ kind: 'access' as const, request }))].filter(({ kind, request }) => {
    const patient = patients.find((item) => item.id === request.patientId);
    const open = kind === 'access' ? request.status === 'Pending' : request.status === 'Pending' || request.status === 'More information requested';
    const type = kind === 'access' ? 'Account access suspension' : (request as ReleaseRequest).requestType ?? 'Enrollment release';
    const stage = kind === 'access' ? 'Ready for Admin Review' : (request as ReleaseRequest).workflowStage ?? 'Ready for Admin Review';
    const days = Math.floor((prototypeNow - new Date(request.submitted + 'T12:00:00').getTime()) / 86400000);
    const reminders = kind === 'release' ? (request as ReleaseRequest).reminderCount ?? 0 : 0;
    const followup = kind === 'release' && (request as ReleaseRequest).origin !== 'Therapist';
    const reminderDue = open && followup && ((reminders === 0 && days >= 3) || (reminders === 1 && days >= 7) || (reminders === 2 && days >= 14));
    const overdue = open && followup && days >= 14;
    return !!patient && (requestStatusFilter === 'All statuses' || (requestStatusFilter === 'Open' ? open : !open)) && (requestTypeFilter === 'All types' || type === requestTypeFilter) && (requestStageFilter === 'All stages' || stage === requestStageFilter) && (requestFollowupFilter === 'All follow-ups' || (requestFollowupFilter === 'Overdue' ? overdue : requestFollowupFilter === 'Reminder due' ? reminderDue : true));
  });

  const studentRequestsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Student Requests" subtitle="Review enrollment, assignment, and access requests using their existing verification history." />
    <View style={styles.directoryControls}><Filter label="Request type" value={requestTypeFilter} options={['All types', 'Enrollment release', 'Therapist assignment release', 'Account access suspension']} onChange={setRequestTypeFilter} /><Filter label="Resolution" value={requestStatusFilter} options={['Open', 'Resolved', 'All statuses']} onChange={setRequestStatusFilter} /><Filter label="Workflow stage" value={requestStageFilter} options={['All stages', 'Awaiting Guardian Confirmation', 'Awaiting Teacher Verification', 'Ready for Admin Review', 'Awaiting Supporting Evidence']} onChange={setRequestStageFilter} /><Filter label="Follow-up" value={requestFollowupFilter} options={['All follow-ups', 'Reminder due', 'Overdue']} onChange={setRequestFollowupFilter} /></View>
    <View style={styles.directoryMeta}><Text style={styles.resultCount}>Student Requests</Text><Text style={styles.secondaryText}>Review the submitted information before deciding</Text></View>
    <View style={styles.requestList}>{filteredStudentRequests.map(({ kind, request }) => {
      const patient = patients.find((item) => item.id === request.patientId)!;
      const stage = kind === 'access' ? 'Ready for Admin Review' : (request as ReleaseRequest).workflowStage ?? 'Ready for Admin Review';
      const status = request.status;
      const origin = kind === 'access' ? 'Therapist' : (request as ReleaseRequest).origin ?? 'Therapist';
      const followup = kind === 'release' ? releaseFollowup(request as ReleaseRequest, prototypeNow) : null;
      const onOpen = () => { setRequestAction(''); setReleaseReplacement(''); setReleaseNote(''); setSelection(kind === 'access' ? { kind: 'request', id: request.id } : { kind: 'release', id: request.id }); };
      return <Pressable key={`${kind}-${request.id}`} onPress={onOpen} style={({ hovered }) => [styles.requestListRow, compact && styles.requestListRowCompact, hovered && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`Review ${kind === 'access' ? 'Student access suspension' : 'Student release'} request for ${patient.name}`}><View style={styles.requestListPrimary}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber} · {kind === 'access' ? 'Account access suspension' : (request as ReleaseRequest).requestType ?? 'Enrollment release'}</Text></View><View style={styles.requestListMeta}><Text style={styles.secondaryText}>{origin} · {formatDate(request.submitted)}</Text><Text style={styles.secondaryText}>{stage}</Text>{followup?.overdue ? <Status label="Overdue follow-up" tone="yellow" /> : followup?.due ? <Text style={styles.secondaryText}>Reminder due · {followup.days} days</Text> : null}</View><Status label={status} tone={status === 'Pending' || status === 'More information requested' ? 'yellow' : status === 'Approved' || status.startsWith('Approved') ? 'green' : 'neutral'} /><Text style={styles.linkText}>Review</Text></Pressable>;
    })}{filteredStudentRequests.length === 0 ? <EmptyState title={releaseRequests.length + requests.length === 0 ? 'No requests yet' : 'No requests match these filters'} detail={releaseRequests.length + requests.length === 0 ? 'Student-related administrative requests will appear here.' : 'Change the filters to find requests, or clear them to review all history.'} action={releaseRequests.length + requests.length === 0 ? null : <Button label="Clear request filters" onPress={() => { setRequestTypeFilter('All types'); setRequestStatusFilter('All statuses'); setRequestStageFilter('All stages'); setRequestFollowupFilter('All follow-ups'); }} />} /> : null}</View>
  </ScrollView>;
  const logsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Activity Logs" subtitle="A chronological record of account, student, and request decisions." />
    <View style={styles.directoryControls}><SearchBox value={logSearch} onChange={setLogSearch} placeholder="Search activity, record, or administrator" /><Filter label="Category" value={logCategory} options={['All activity', 'Account', 'Student', 'Request', 'Settings']} onChange={setLogCategory} /></View>
    <View style={styles.logList}>{visibleLogs.map((entry) => {
      const relatedPatient = patients.find((patient) => entry.detail.includes(patient.name));
      const relatedProfessional = professionals.find((person) => entry.detail.includes(person.name));
      const relatedRequest = relatedPatient && entry.category === 'Request' ? [...releaseRequests.map((request) => ({ kind: 'release' as const, request })), ...requests.map((request) => ({ kind: 'access' as const, request }))].find(({ request }) => request.patientId === relatedPatient.id) : undefined;
      const openRelated = () => {
        if (relatedRequest) goToAccountsView('Student Requests', { kind: relatedRequest.kind === 'release' ? 'release' : 'request', id: relatedRequest.request.id });
        else if (relatedPatient) goToAccountsView('Directory', { kind: 'patient', id: relatedPatient.id }, { role: 'Student', search: relatedPatient.name, enrollment: relatedPatient.enrollment, access: 'All access', setup: 'All setup', membership: 'All memberships' });
        else if (relatedProfessional) goToAccountsView('Directory', { kind: 'professional', id: relatedProfessional.id }, { role: relatedProfessional.role, search: relatedProfessional.name, access: 'All access', setup: 'All setup', membership: 'All memberships', enrollment: 'All enrollment' });
      };
      return <View key={entry.id} style={styles.logRow}><View style={styles.logDate}><Text style={styles.logDateDay}>{formatDate(entry.date)}</Text><Text style={styles.secondaryText}>{formatTimestamp(entry.date).split(', ')[1]}</Text></View>{!entry.read ? <View style={[styles.activityMark, { backgroundColor: C.blue }]} /> : null}<View style={styles.activityCopy}><Text style={styles.activityTitle}>{entry.title}</Text><Text style={styles.secondaryText}>{entry.detail}</Text></View><View style={styles.logActor}><Text style={styles.secondaryText}>{entry.actor}</Text></View>{relatedPatient || relatedProfessional ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open related record for ${relatedPatient?.name ?? relatedProfessional?.name}`} onPress={openRelated} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="eye-outline" size={17} color={C.blueDeep} /></TouchableOpacity> : null}</View>;
    })}</View>
    {visibleLogs.length === 0 ? <EmptyState title="No activity found" detail="Try a different category or search term." action={<Button label="Clear filters" onPress={() => { setLogSearch(''); setLogCategory('All activity'); }} />} /> : null}
  </ScrollView>;

  const settingsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Center Profile" subtitle="Center information used to identify this administrative workspace." />
    <View style={styles.settingsPanel}><Text style={styles.sectionTitle}>Center information</Text><Text style={styles.sectionSub}>These changes are local to this demo session.</Text>{([['name', 'Center name'], ['email', 'Administrator email'], ['phone', 'Phone'], ['address', 'Address']] as const).map(([key, label]) => <View key={key} style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><TextInput value={centerSettings[key]} onChangeText={(value) => { setCenterSettings((current) => ({ ...current, [key]: value })); setSettingsSaved(false); }} style={styles.settingInput} accessibilityLabel={label} /></View>)}<View style={styles.settingsAction}><Button label={settingsSaved ? 'Saved' : 'Save settings'} kind="primary" onPress={() => { setSettingsSaved(true); addLog('Center profile updated', `${centerSettings.name} · local demo settings`, 'Settings'); flash('Center profile settings saved in this demo.'); }} /></View></View>
    <View style={styles.settingsPanel}><Text style={styles.sectionTitle}>Administrator profile</Text><View style={styles.profileSummary}>{avatar('Center Admin')}<View><Text style={styles.personName}>Center Admin</Text><Text style={styles.secondaryText}>Administrator · {centerSettings.name}</Text></View></View><Button label="View profile" onPress={() => setShowProfileDetails(true)} /></View>
  </ScrollView>;

  const selectNav = (target: Page) => goTo(target);
  const selectAccountView = (view: AccountView) => goToAccountsView(view);
  const sidebar = (inDrawer = false) => <Pressable nativeID={desktop && !inDrawer ? 'center-admin-sidebar' : undefined} style={[styles.sidebar, desktop && !inDrawer && styles.sidebarRail, desktop && !inDrawer && sidebarExpanded && styles.sidebarRailExpanded, inDrawer && styles.sidebarDrawer]}>
    <View style={[styles.brandLockup, desktop && !inDrawer && !sidebarExpanded && styles.brandLockupRail]}><Image source={require('../../../assets/images/speaksteps-children-mark.png')} style={styles.brandMark} contentFit="contain" />{!desktop || inDrawer || sidebarExpanded ? <View><Text style={styles.brandName}>SpeakSteps</Text><Text style={styles.brandSub}>CENTER ADMIN</Text></View> : null}</View>
    {!desktop || inDrawer || sidebarExpanded ? <Text style={styles.navCaption}>WORKSPACE</Text> : null}{NAV.map((item) => item.label === 'Accounts' ? desktop && !inDrawer && !sidebarExpanded ? <View key="Accounts" style={{ marginBottom: 3, gap: 3 }} accessibilityRole="list" accessibilityLabel="Account sections">
      {(['Directory', 'Student Requests', 'Archive Center'] as AccountView[]).map((view) => <TouchableOpacity key={view} onPress={() => selectAccountView(view)} style={[styles.navItem, styles.navItemRail, page === 'Accounts' && accountView === view && styles.navItemActive]} accessibilityRole="button" accessibilityLabel={view} accessibilityState={{ selected: page === 'Accounts' && accountView === view }}><Ionicons name={accountViewIcon(view, page === 'Accounts' && accountView === view)} size={19} color={page === 'Accounts' && accountView === view ? C.blue : C.muted} /></TouchableOpacity>)}
    </View> : <View key="Accounts" style={{ marginBottom: 3 }}>
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: page === 'Accounts' ? '#F5F9FC' : 'transparent', marginBottom: 2 }}>
        <TouchableOpacity onPress={() => desktop && !inDrawer && !sidebarExpanded ? setAccountsExpanded((value) => !value) : selectAccountView('Directory')} style={{ flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: desktop && !inDrawer && !sidebarExpanded ? 0 : 11, justifyContent: desktop && !inDrawer && !sidebarExpanded ? 'center' : 'flex-start' }} accessibilityRole="button" accessibilityLabel={desktop && !inDrawer && !sidebarExpanded ? `${accountsExpanded ? 'Hide' : 'Show'} Accounts submodules` : 'Accounts, open Directory'} accessibilityState={{ selected: page === 'Accounts' && accountView === 'Directory', expanded: desktop && !inDrawer && !sidebarExpanded ? accountsExpanded : undefined }}><Ionicons name={page === 'Accounts' ? 'people' : 'people-outline'} size={19} color={page === 'Accounts' ? C.blueDeep : C.muted} />{!desktop || inDrawer || sidebarExpanded ? <Text style={[styles.navText, page === 'Accounts' && { color: C.blueDeep, fontFamily: 'Geist-SemiBold' }]}>Accounts</Text> : null}</TouchableOpacity>
        {(!desktop || inDrawer || sidebarExpanded) ? <TouchableOpacity onPress={() => setAccountsExpanded((value) => !value)} accessibilityRole="button" accessibilityLabel={`${accountsExpanded ? 'Collapse' : 'Expand'} Accounts navigation`} accessibilityState={{ expanded: accountsExpanded }} style={{ width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={accountsExpanded ? 'chevron-down' : 'chevron-forward'} size={15} color={C.muted} /></TouchableOpacity> : null}
      </View>
      {accountsExpanded && (!desktop || inDrawer || sidebarExpanded) ? <View style={{ marginLeft: 19, paddingLeft: 13, borderLeftWidth: 1, borderLeftColor: C.line, marginBottom: 5 }} accessibilityRole="list">
        {(['Directory', 'Student Requests', 'Archive Center'] as AccountView[]).map((view) => <TouchableOpacity key={view} onPress={() => selectAccountView(view)} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, marginVertical: 1, borderRadius: 7, backgroundColor: page === 'Accounts' && accountView === view ? C.blueSoft : 'transparent' }} accessibilityRole="button" accessibilityLabel={view} accessibilityState={{ selected: page === 'Accounts' && accountView === view }}><Ionicons name={accountViewIcon(view, page === 'Accounts' && accountView === view)} size={17} color={page === 'Accounts' && accountView === view ? C.blue : C.subtle} /><Text style={{ flex: 1, color: page === 'Accounts' && accountView === view ? C.blue : C.muted, fontFamily: page === 'Accounts' && accountView === view ? 'Geist-SemiBold' : 'Geist-Medium', fontSize: 14 }}>{view}</Text></TouchableOpacity>)}
      </View> : null}
    </View> : <TouchableOpacity key={item.label} onPress={() => selectNav(item.label)} style={[styles.navItem, desktop && !inDrawer && !sidebarExpanded && styles.navItemRail, page === item.label && styles.navItemActive]} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: page === item.label }}><Ionicons name={page === item.label ? item.activeIcon : item.icon} size={19} color={page === item.label ? C.blue : C.muted} />{!desktop || inDrawer || sidebarExpanded ? <Text style={[styles.navText, page === item.label && styles.navTextActive]}>{item.label}</Text> : null}</TouchableOpacity>)}
    {desktop && !inDrawer ? <TouchableOpacity onPress={() => { setSidebarExpanded(!sidebarExpanded); setAccountsExpanded(!sidebarExpanded && page === 'Accounts'); }} style={[styles.sidebarPinButton, !sidebarExpanded && styles.navItemRail, sidebarExpanded && styles.navItemActive]} accessibilityRole="button" accessibilityLabel={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'} accessibilityState={{ expanded: sidebarExpanded }}><Octicons name={sidebarExpanded ? 'sidebar-collapse' : 'sidebar-expand'} size={18} color={sidebarExpanded ? C.blue : C.muted} /></TouchableOpacity> : null}

  </Pressable>;

  const selectedDetailsContent = <>

      {selectedProfessional ? <ProfessionalDetails person={selectedProfessional} students={selectedProfessionalStudents} onClose={() => setSelection(null)} onOpenStudent={(student) => { goToAccountsView('Directory', { kind: 'patient', id: student.id }, { role: 'Student', enrollment: student.enrollment, search: student.name, access: 'All access', setup: 'All setup', membership: 'All memberships' }); }} onResendInvitation={() => resendInvitation(selectedProfessional)} onSuspend={(reason) => setProfessionalStatus(selectedProfessional, 'Suspended', reason)} onReactivate={() => setProfessionalStatus(selectedProfessional, 'Active')} onDeactivate={() => setProfessionalStatus(selectedProfessional, 'Deactivated')} /> : null}
      {selectedPatient ? <>
         <ModalHeader title="Student Details" subtitle="Administrative profile · school identity" onClose={() => setSelection(null)} />
         <View style={styles.detailIdentity}>{avatar(selectedPatient.name, C.green)}<View style={styles.personText}><View style={detailPanelStyles.detailNameLine}><Text style={styles.detailName}>{selectedPatient.name}</Text>{selectedPatient.therapyStatus === 'In progress' ? <View accessibilityLabel="Therapy active" style={detailPanelStyles.activeDot} /> : null}</View><Text style={styles.secondaryText}>Student Number: {selectedPatient.studentNumber}</Text></View><Status label={selectedPatient.enrollment} tone={selectedPatient.enrollment === 'Enrolled' ? 'blue' : 'neutral'} /></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Student identity</Text><View style={styles.detailGrid}><Detail label="Grade Level" value={selectedPatient.grade ?? 'Not recorded'} /><Detail label="Section" value={selectedPatient.section ?? 'Not recorded'} /><Detail label="School" value={selectedPatient.school || 'Not recorded'} /></View><Text style={styles.sourceNote}>For identity corrections, use the authorized school-record process.</Text></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Guardian information</Text><View style={styles.detailGrid}><Detail label="Guardian" value={selectedPatient.guardian || 'Not recorded'} /><Detail label="Registered email or contact" value={selectedPatient.guardianContact || 'Not recorded'} /></View></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Assigned Teacher</Text><View style={detailPanelStyles.assignmentNameLine}><Text style={styles.detailValue}>{professionals.find((person) => person.id === selectedPatient.teacherId)?.name ?? 'Not assigned'}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit assigned Teacher" onPress={() => setTeacherChoicesOpen(teacherChoicesOpen === selectedPatient.id ? null : selectedPatient.id)} style={detailPanelStyles.assignmentIconButton}><Ionicons name="pencil" size={16} color={C.muted} /></TouchableOpacity></View>{teacherChoicesOpen === selectedPatient.id ? <View style={styles.choiceList}>{activeTeachers.filter((teacher) => teacher.id !== selectedPatient.teacherId).map((teacher) => <TouchableOpacity key={teacher.id} onPress={() => changeTeacher(selectedPatient, teacher.id)} style={styles.choiceRow}><View><Text style={styles.personName}>{teacher.name}</Text><Text style={styles.secondaryText}>{teacher.email}</Text></View><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>)}{activeTeachers.filter((teacher) => teacher.id !== selectedPatient.teacherId).length === 0 ? <Text style={styles.secondaryText}>No eligible replacement Teachers are available.</Text> : null}</View> : null}</View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Assigned Therapist</Text><View style={styles.assignmentSummary}><View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{initials(activeTherapistFor(selectedPatient.therapistId))}</Text></View><Text style={styles.personName}>{activeTherapistFor(selectedPatient.therapistId)}</Text>{selectedPatient.therapistId && !activeTherapists.some((person) => person.id === selectedPatient.therapistId) ? <Status label="Needs reassignment" tone="yellow" /> : null}<TouchableOpacity accessibilityRole="button" accessibilityLabel="Reassign Therapist" onPress={() => setAssignmentChoicesOpen(assignmentChoicesOpen === selectedPatient.id ? null : selectedPatient.id)} style={[detailPanelStyles.assignmentIconButton, { marginLeft: 'auto' as any }]}><Ionicons name="swap-horizontal" size={19} color={C.muted} /></TouchableOpacity></View>{assignmentChoicesOpen === selectedPatient.id ? <View style={styles.choiceList}>{eligibleReplacements(selectedPatient.id).map((person) => <TouchableOpacity key={person.id} onPress={() => reassignPatient(selectedPatient, person.id)} style={styles.choiceRow}><View><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{patients.filter((item) => item.therapistId === person.id && item.enrollment === 'Enrolled').length} assigned Students</Text></View><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>)}{eligibleReplacements(selectedPatient.id).length === 0 ? <Text style={styles.secondaryText}>No eligible replacement Therapists are available.</Text> : null}</View> : null}</View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><View style={styles.sectionHeading}><Text style={styles.fieldLabel}>Account access</Text><Status label={studentMembership(selectedPatient) === 'Deactivated' ? 'Deactivated' : studentSetup(selectedPatient) === 'Pending' ? 'Setup pending' : studentAccess(selectedPatient)} tone={studentMembership(selectedPatient) === 'Deactivated' || studentAccess(selectedPatient) === 'Suspended' ? 'red' : studentSetup(selectedPatient) === 'Pending' ? 'yellow' : 'green'} /></View><Text style={styles.secondaryText}>Access applies to the shared Student and Guardian account. It does not change enrollment or assignments.</Text>{selectedPatient.enrollment === 'Archived' && studentAccess(selectedPatient) === 'Suspended' ? <Text style={styles.sourceNote}>Restore enrollment separately before reactivating access.</Text> : null}</View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><View style={styles.sectionHeading}><View><Text style={styles.fieldLabel}>Student Enrollment</Text><Text style={styles.secondaryText}>Account access and enrollment are managed separately.</Text></View><Status label={selectedPatient.enrollment} tone={selectedPatient.enrollment === 'Enrolled' ? 'blue' : 'neutral'} /></View><View style={styles.detailActions}>{selectedPatient.enrollment === 'Enrolled' ? <Button label="Archive Student" kind="text" onPress={() => archivePatient(selectedPatient)} /> : <Button label="Restore Student" onPress={() => archivePatient(selectedPatient, true)} />}</View></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Account management</Text><View style={[styles.detailActions, detailPanelStyles.accountManagementActions]}>{studentMembership(selectedPatient) === 'Deactivated' ? <Button label="Reactivate account" onPress={() => changePatientMembership(selectedPatient, 'Active')} /> : <>{studentSetup(selectedPatient) === 'Completed' && studentAccess(selectedPatient) === 'Active' ? <Button label="Suspend Access" kind="danger" onPress={() => changePatientAccess(selectedPatient, 'Suspended')} /> : studentSetup(selectedPatient) === 'Completed' && studentAccess(selectedPatient) === 'Suspended' ? <Button label="Reactivate Access" onPress={() => changePatientAccess(selectedPatient, 'Active')} /> : null}<Button label="Deactivate account" kind="danger" onPress={() => changePatientMembership(selectedPatient, 'Deactivated')} /></>}</View></View>
       </> : null}
      {selectedRelease && selectedReleasePatient ? <>
         <ModalHeader title="Review Student Request" subtitle={'Request ' + selectedRelease.id + ' - submitted ' + formatDate(selectedRelease.submitted)} onClose={() => setSelection(null)} />
         <View style={styles.detailIdentity}>{avatar(selectedReleasePatient.name, C.green)}<View style={styles.personText}><Text style={styles.detailName}>{selectedReleasePatient.name}</Text><Text style={styles.secondaryText}>Student Number: {selectedReleasePatient.studentNumber}</Text></View><Status label={selectedRelease.status} tone={selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested' ? 'yellow' : selectedRelease.status.startsWith('Approved') ? 'green' : 'neutral'} /></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Request details</Text><View style={styles.detailGrid}><Detail label="Request type" value={selectedRelease.requestType ?? 'Enrollment release'} /><Detail label="Initiated by" value={selectedRelease.origin ?? 'Therapist'} /><Detail label="Submitted reason" value={selectedRelease.reason} /><Detail label="Workflow stage" value={selectedRelease.workflowStage ?? 'Ready for Admin Review'} /><Detail label="Guardian confirmation" value={selectedRelease.guardianConfirmation ?? 'Not recorded'} /><Detail label="Teacher verification" value={selectedRelease.teacherVerification ?? 'Not recorded'} /></View><Text style={styles.fieldLabel}>Original explanation</Text><Text style={styles.requestReason}>{selectedRelease.explanation}</Text><Text style={styles.fieldLabel}>Supporting evidence</Text><Text style={styles.secondaryText}>{selectedRelease.attachment ?? 'No evidence reference provided'}</Text></View>
         {selectedRelease.workflowStage && selectedRelease.workflowStage !== 'Ready for Admin Review' ? <View style={styles.requestReviewNotice}><Ionicons name="alert-circle-outline" size={19} color={C.yellow} /><Text style={styles.noticeText}>{selectedRelease.workflowStage} - a pending confirmation or verification is not approval.</Text></View> : null}
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Current assignment</Text><Text style={styles.detailValue}>{activeTherapistFor(selectedReleasePatient.therapistId)}</Text><Text style={styles.sourceNote}>The Student remains enrolled and assigned until an authorized decision changes those records. A pending request does not change account access.</Text></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Request history</Text>{(selectedRelease.events ?? []).map((event) => <View key={event.id} style={styles.requestEvent}><View style={styles.requestEventMark} /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{event.title}</Text><Text style={styles.secondaryText}>{event.detail}</Text><Text style={styles.attentionTime}>{event.actor} at {formatTimestamp(event.date)}</Text></View></View>)}{!selectedRelease.events?.length ? <Text style={styles.secondaryText}>No additional events recorded.</Text> : null}<Text style={styles.sourceNote}>Mock activity is held in shared frontend state and resets on reload.</Text></View>
         {selectedRelease.origin !== 'Therapist' && (selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested') ? <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Follow-up</Text><Text style={styles.secondaryText}>Request date: {formatDate(selectedRelease.submitted)} - reminders recorded: {selectedRelease.reminderCount ?? 0} - last reminder: {selectedRelease.lastReminderAt ? formatDate(selectedRelease.lastReminderAt) : 'none'}</Text>{releaseFollowup(selectedRelease, prototypeNow).overdue ? <Status label="Overdue - Admin review" tone="yellow" /> : null}{releaseFollowup(selectedRelease, prototypeNow).due ? <Button label="Record Due Reminder" kind="secondary" onPress={() => recordReleaseReminder(selectedRelease)} /> : <Text style={styles.sourceNote}>{releaseFollowup(selectedRelease, prototypeNow).nextDay ? 'Next follow-up at day ' + releaseFollowup(selectedRelease, prototypeNow).nextDay : 'Reminder schedule complete.'} - No message is sent by this prototype.</Text>}</View> : null}
         {(selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested') ? <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Choose an administrative action</Text><View style={styles.actionChoiceRow}><Button label="Request More Information" kind={requestAction === 'info' ? 'primary' : 'secondary'} onPress={() => setRequestAction(requestAction === 'info' ? '' : 'info')} /><Button label="Approve & Reassign" kind={requestAction === 'reassign' ? 'primary' : 'secondary'} disabled={!!selectedRelease.workflowStage && selectedRelease.workflowStage !== 'Ready for Admin Review'} onPress={() => setRequestAction(requestAction === 'reassign' ? '' : 'reassign')} /></View>{(selectedRelease.requestType === 'Transfer' || selectedRelease.requestType === 'Withdrawal' || selectedRelease.requestType === 'Enrollment release') ? <View style={styles.actionChoiceRow}><Button label="Approve & Archive" kind={requestAction === 'archive' ? 'danger' : 'secondary'} onPress={() => setRequestAction(requestAction === 'archive' ? '' : 'archive')} /><Button label="Decline Request" kind={requestAction === 'decline' ? 'primary' : 'secondary'} disabled={!!selectedRelease.workflowStage && selectedRelease.workflowStage !== 'Ready for Admin Review'} onPress={() => setRequestAction(requestAction === 'decline' ? '' : 'decline')} /></View> : <Button label="Decline Request" kind={requestAction === 'decline' ? 'primary' : 'secondary'} onPress={() => setRequestAction(requestAction === 'decline' ? '' : 'decline')} />}
           {requestAction === 'info' ? <View style={styles.actionPanel}><Text style={styles.fieldLabel}>Clarification recipient</Text><Text style={styles.detailValue}>{selectedRelease.followupRecipient ?? selectedRelease.origin ?? 'Therapist'}</Text><Text style={styles.fieldLabel}>What information is needed?</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Describe what information is needed..." placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /><Button label="Record information request" kind="primary" disabled={!releaseNote.trim()} onPress={() => resolveReleaseRequest(selectedRelease, 'More information requested')} /></View> : null}
           {requestAction === 'reassign' ? <View style={styles.actionPanel}><Text style={styles.fieldLabel}>Proposed Therapist</Text><SelectControl label="Replacement Therapist" value={releaseReplacement} options={['', ...activeTherapists.map((person) => person.id).filter((id) => id !== selectedReleasePatient.therapistId)]} getLabel={(id) => id ? (professionals.find((person) => person.id === id)?.name ?? id) + ' - ' + patients.filter((item) => item.therapistId === id && item.enrollment === 'Enrolled').length + ' Students' : 'Choose an eligible Therapist'} onChange={setReleaseReplacement} /><Text style={styles.sourceNote}>Caseload count is informational; there is no maximum.</Text><Button label="Confirm & Reassign" kind="primary" disabled={!releaseReplacement || !!selectedRelease.workflowStage && selectedRelease.workflowStage !== 'Ready for Admin Review'} onPress={() => resolveReleaseRequest(selectedRelease, 'Approved & reassigned')} /></View> : null}
           {requestAction === 'archive' ? <View style={styles.actionPanel}><View style={styles.requestReviewNotice}><Ionicons name="alert-circle-outline" size={18} color={C.yellow} /><Text style={styles.noticeText}>Archival requires verified school transfer or withdrawal evidence and a Teacher verification outcome. Missing Guardian response is not consent.</Text></View><Text style={styles.secondaryText}>Evidence reference: {selectedRelease.attachment ?? 'Required'}</Text><Text style={styles.secondaryText}>Teacher outcome: {selectedRelease.teacherVerification ?? 'Required'}</Text><Button label="Review archival requirements" kind="danger" disabled={!selectedRelease.attachment || selectedRelease.teacherVerification !== 'Verified' || !!selectedRelease.workflowStage && selectedRelease.workflowStage !== 'Ready for Admin Review'} onPress={() => resolveReleaseRequest(selectedRelease, 'Approved & archived')} /></View> : null}
           {requestAction === 'decline' ? <View style={styles.actionPanel}><Text style={styles.fieldLabel}>Reason for declining</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Explain why this request should be declined..." placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /><Button label="Record Decline" kind="primary" disabled={!releaseNote.trim() || !!selectedRelease.workflowStage && selectedRelease.workflowStage !== 'Ready for Admin Review'} onPress={() => resolveReleaseRequest(selectedRelease, 'Declined')} /></View> : null}
         </View> : <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Administrative resolution</Text><Status label={selectedRelease.status} tone={selectedRelease.status.startsWith('Approved') ? 'green' : 'neutral'} /><Text style={styles.sourceNote}>Resolved Student requests are read-only history.</Text></View>}
       </> : null}
      {selectedRequest && selectedRequestPatient ? <>
         <ModalHeader title="Student Access Suspension Request" subtitle={'Request ' + selectedRequest.id + ' - submitted ' + formatDate(selectedRequest.submitted)} onClose={() => setSelection(null)} />
         <View style={styles.detailIdentity}>{avatar(selectedRequestPatient.name, C.green)}<View style={styles.personText}><Text style={styles.detailName}>{selectedRequestPatient.name}</Text><Text style={styles.secondaryText}>Student Number: {selectedRequestPatient.studentNumber}</Text></View><Status label={selectedRequest.status} tone={selectedRequest.status === 'Pending' ? 'yellow' : selectedRequest.status === 'Approved' ? 'green' : 'neutral'} /></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><View style={styles.detailGrid}><Detail label="Request type" value="Student account access suspension" /><Detail label="Initiated by" value={selectedRequestTherapist?.name ?? 'Therapist'} /><Detail label="Current access" value={studentAccess(selectedRequestPatient)} /><Detail label="Assigned Therapist" value={activeTherapistFor(selectedRequestPatient.therapistId)} /></View><Text style={styles.fieldLabel}>Original explanation</Text><Text style={styles.requestReason}>{selectedRequest.reason}</Text></View>
         <View style={styles.requestReviewNotice}><Ionicons name="information-circle-outline" size={19} color={C.blue} /><Text style={styles.noticeText}>Suspension affects Student and Guardian sign-in only. Enrollment, assignments, therapy status, and historical records remain unchanged.</Text></View>
         <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Request history</Text>{(selectedRequest.events ?? []).map((event) => <View key={event.id} style={styles.requestEvent}><View style={styles.requestEventMark} /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{event.title}</Text><Text style={styles.secondaryText}>{event.detail}</Text><Text style={styles.attentionTime}>{event.actor} · {formatTimestamp(event.date)}</Text></View></View>)}<Text style={styles.sourceNote}>Mock activity is held in shared frontend state and resets on reload.</Text></View>
         {selectedRequest.status === 'Pending' ? <View style={styles.detailActions}><Button label="Decline Request" onPress={() => resolveRequest(selectedRequest, 'Declined')} /><Button label="Approve Suspension" kind="danger" onPress={() => resolveRequest(selectedRequest, 'Approved')} /></View> : <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.fieldLabel}>Administrative resolution</Text><Text style={styles.detailValue}>{selectedRequest.status}</Text><Text style={styles.sourceNote}>Resolved requests are read-only history.</Text></View>}
       </> : null}
    </>;

  return <View nativeID="admin-portal-root" style={[styles.appRoot, desktop ? styles.appRootDesktop : styles.appRootCompact]}>
    <Stack.Screen options={{ headerShown: false, title: `SpeakSteps · ${page}` }} />
    <StatusBar barStyle="dark-content" />
    {desktop ? sidebar() : null}
    <View style={styles.workspace}>
      <View style={styles.topbar}>{!desktop ? <IconButton icon="menu-outline" label="Open navigation" onPress={() => { if (page === 'Accounts') setAccountsExpanded(true); setMenuOpen(true); }} /> : <View style={styles.breadcrumb}><Text style={styles.breadcrumbRoot}>Center workspace</Text><Ionicons name="chevron-forward" size={13} color={C.subtle} />{page === 'Accounts' ? <><Text style={styles.breadcrumbCurrent}>Accounts</Text><Ionicons name="chevron-forward" size={13} color={C.subtle} /><Text style={styles.breadcrumbCurrent}>{accountView}</Text></> : <Text style={styles.breadcrumbCurrent}>{page}</Text>}</View>}<View style={styles.topbarRight}><View ref={notificationAnchorRef} collapsable={false}><IconButton icon="notifications-outline" label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onPress={() => setShowNotifications(true)} /></View><View style={styles.adminMenuAnchor}><View style={styles.adminChip}><View style={styles.adminInitial}><Text style={styles.adminInitialText}>CA</Text></View>{desktop ? <Text style={styles.adminChipText}>Center Admin</Text> : null}<Pressable onHoverIn={openProfileMenu} onHoverOut={scheduleProfileMenuClose} onPress={() => { if (!desktop) setShowProfile((visible) => !visible); }} style={styles.adminMenuArrow} accessibilityRole="button" accessibilityLabel="Account options" accessibilityState={{ expanded: showProfile }}><Ionicons name="chevron-down" size={14} color={C.muted} /></Pressable></View>{showProfile ? <Pressable style={styles.profileMenu} onHoverIn={openProfileMenu} onHoverOut={scheduleProfileMenuClose}><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); setShowProfileDetails(true); }} accessibilityRole="button"><Ionicons name="person-outline" size={17} color={C.muted} /><Text style={styles.profileMenuText}>Profile</Text></TouchableOpacity><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); selectNav('Settings'); }} accessibilityRole="button"><Ionicons name="settings-outline" size={17} color={C.muted} /><Text style={styles.profileMenuText}>Settings</Text></TouchableOpacity><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); setConfirmation({ title: 'Sign out of Center Admin?', message: 'You will return to the sign-in screen. Demo changes reset when the app reloads.', actionLabel: 'Sign out', run: () => { setConfirmation(null); router.replace('/(admin)/admin-login' as any); } }); }} accessibilityRole="button"><Ionicons name="log-out-outline" size={17} color={C.red} /><Text style={[styles.profileMenuText, { color: C.red }]}>Log out</Text></TouchableOpacity></Pressable> : null}</View></View></View>
      <View style={[styles.content, inlineAccountDetails && styles.contentSplit]}>
        <View style={styles.contentMain}>{page === 'Dashboard' ? dashboard() : page === 'Accounts' ? accounts() : page === 'Activity Logs' ? logsPage() : settingsPage()}</View>
        <Animated.View pointerEvents={inlineAccountDetails ? 'auto' : 'none'} style={[styles.accountDetailPane, { width: accountDetailPaneWidth, opacity: accountDetailPaneOpacity }]}>
          {inlineAccountDetails ? <ScrollView style={styles.accountDetailScroll} contentContainerStyle={styles.accountDetailContent} showsVerticalScrollIndicator={false}>{selectedDetailsContent}</ScrollView> : null}
        </Animated.View>
      </View>
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


    <Modal visible={Boolean(selection) && !inlineAccountDetails} transparent animationType="fade" onRequestClose={() => setSelection(null)}><Pressable style={[styles.overlay, (selectedProfessional || selectedPatient || selectedRelease || selectedRequest) && styles.professionalDrawerOverlay]} onPress={() => setSelection(null)}><Pressable style={[styles.dialog, selectedProfessional ? styles.professionalDrawer : (selectedPatient || selectedRelease || selectedRequest) ? [styles.studentDrawer, compact && styles.studentDrawerCompact] : styles.detailDialog]} onPress={(event) => event.stopPropagation()}><ScrollView style={[styles.detailScroll, (selectedProfessional || selectedPatient || selectedRelease || selectedRequest) && styles.professionalDrawerScroll]} showsVerticalScrollIndicator={false}>{selectedDetailsContent}</ScrollView></Pressable></Pressable></Modal>

    <Modal visible={Boolean(offboardingId)} transparent animationType="fade" onRequestClose={() => { setOffboardingId(null); setOffboardingReason(''); }}><Pressable style={styles.overlay} onPress={() => { setOffboardingId(null); setOffboardingReason(''); }}><Pressable style={[styles.dialog, styles.formDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title={`Deactivate ${offboardingPerson?.name ?? 'Therapist'}`} subtitle={`${offboardingPatients.length} assigned student${offboardingPatients.length === 1 ? '' : 's'} must be reassigned first; deactivation then moves this account to Archive Center.`} onClose={() => { setOffboardingId(null); setOffboardingReason(''); }} /><View style={styles.requestReviewNotice}><Ionicons name="git-branch-outline" size={19} color={C.orange} /><Text style={styles.noticeText}>Choose an active replacement Therapist for every enrolled student. Their assignment history stays in the activity log.</Text></View><ScrollView style={styles.offboardingList}>{offboardingPatients.map((patient) => <View key={patient.id} style={styles.offboardingRow}><View style={styles.offboardingPatient}>{avatar(patient.name, C.green)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber}</Text></View></View><SelectControl label={`Replacement Therapist for ${patient.name}`} value={offboardingChoices[patient.id] ?? ''} options={['', ...eligibleReplacements(patient.id).map((person) => person.id)]} getLabel={(id) => id ? professionals.find((person) => person.id === id)?.name ?? id : 'Choose Therapist'} onChange={(id) => setOffboardingChoices((current) => ({ ...current, [patient.id]: id }))} /></View>)}</ScrollView><View style={styles.field}><Text style={styles.fieldLabel}>Reason for deactivation</Text><TextInput value={offboardingReason} onChangeText={setOffboardingReason} placeholder="Enter a reason" placeholderTextColor={C.subtle} multiline style={[styles.input, { minHeight: 58, paddingTop: 10, textAlignVertical: 'top' }]} /></View><View style={styles.dialogActions}><Button label="Cancel" onPress={() => { setOffboardingId(null); setOffboardingReason(''); }} /><Button label="Reassign & deactivate" kind="danger" onPress={finalizeOffboarding} disabled={offboardingPatients.some((patient) => !offboardingChoices[patient.id]) || !offboardingReason.trim()} /></View></Pressable></Pressable></Modal>

    <Modal visible={Boolean(confirmation)} transparent animationType="fade" onRequestClose={() => { setConfirmation(null); setConfirmationReason(''); setConfirmationEvidence(''); confirmationReasonRef.current = ''; confirmationEvidenceRef.current = ''; }}><Pressable style={styles.overlay} onPress={() => { setConfirmation(null); setConfirmationReason(''); setConfirmationEvidence(''); confirmationReasonRef.current = ''; confirmationEvidenceRef.current = ''; }}><Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}><View style={[styles.confirmIcon, confirmation?.danger && styles.confirmIconDanger]}><Ionicons name={confirmation?.danger ? 'warning-outline' : 'help-circle-outline'} size={22} color={confirmation?.danger ? C.red : C.blue} /></View><Text style={styles.dialogTitle}>{confirmation?.title}</Text><Text style={styles.confirmMessage}>{confirmation?.message}</Text>{confirmation?.requiresReason ? <View style={styles.field}><Text style={styles.fieldLabel}>Administrative reason</Text><TextInput value={confirmationReason} onChangeText={(value) => { setConfirmationReason(value); confirmationReasonRef.current = value; }} placeholder="Describe why this action is needed?" placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /></View> : null}{confirmation?.requiresEvidence ? <View style={styles.field}><Text style={styles.fieldLabel}>Verified evidence reference</Text><TextInput value={confirmationEvidence} onChangeText={(value) => { setConfirmationEvidence(value); confirmationEvidenceRef.current = value; }} placeholder="School record or document reference?" placeholderTextColor={C.subtle} style={styles.input} /></View> : null}<View style={styles.dialogActions}><Button label="Cancel" onPress={() => { setConfirmation(null); setConfirmationReason(''); setConfirmationEvidence(''); confirmationReasonRef.current = ''; confirmationEvidenceRef.current = ''; }} /><Button label={confirmation?.actionLabel ?? 'Continue'} kind={confirmation?.danger ? 'danger' : 'primary'} onPress={() => { if (confirmation?.requiresReason && !confirmationReasonRef.current.trim()) { flash('Enter an administrative reason.'); return; } if (confirmation?.requiresEvidence && !confirmationEvidenceRef.current.trim()) { flash('Enter a verified evidence reference.'); return; } confirmation?.run(); }} /></View></Pressable></Pressable></Modal>

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

const detailPanelStyles = {
  tableWithPanel: { columnGap: 12, paddingHorizontal: 16 },
  personColumnWithPanel: { flex: 2.6, minWidth: 180, paddingRight: 8 },
  idColumnWithPanel: { flex: 0.9, minWidth: 88 },
  studentDataColumnWithPanel: { flex: 0.82, minWidth: 82 },
  enrollmentColumnWithPanel: { flex: 0.68, minWidth: 74 },
  statusColumnWithPanel: { flex: 0.72, minWidth: 78 },
  setupColumnWithPanel: { flex: 0.68, minWidth: 74 },
  assignmentColumnWithPanel: { flex: 0.7, minWidth: 76 },
  detailSection: { paddingTop: 17, paddingBottom: 14 },
  detailNameLine: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  assignmentNameLine: { minHeight: 36, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 12 },
  assignmentIconButton: { width: 34, height: 34, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 6 },
  accountManagementActions: { borderTopWidth: 0, paddingTop: 10, marginTop: 0, justifyContent: 'flex-start' as const },
};

const styles = StyleSheet.create({
  professionalDrawerOverlay: { justifyContent: 'flex-start', alignItems: 'flex-end', padding: 0 },
  professionalDrawer: { width: '100%', maxWidth: 500, height: '100%', maxHeight: '100%', alignSelf: 'stretch', padding: 24, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  studentDrawer: { width: 560, maxWidth: '100%', height: '100%', maxHeight: '100%', alignSelf: 'stretch', padding: 24, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  studentDrawerCompact: { width: '100%', maxWidth: '100%', borderRadius: 0, padding: 17 },
  professionalDrawerScroll: { flex: 1, flexGrow: 1, maxHeight: '100%' },
  accountPagination: { minHeight: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }, accountPaginationCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 9 }, accountPaginationSummary: { flex: 1, color: C.muted, fontSize: 11 }, accountPaginationControls: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3 }, accountPaginationControlsCompact: { flex: 0 }, accountPaginationSide: { flex: 1 }, pageArrow: { width: 32, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, pageArrowDisabled: { opacity: 0.38 }, doubleChevronSecond: { marginLeft: -8 }, pageNumber: { minWidth: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, pageNumberActive: { backgroundColor: C.blueSoft, borderWidth: 1, borderColor: '#C9E3F4' }, pageNumberText: { color: C.ink, fontSize: 12 }, pageNumberTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' },
  idTableCell: { flex: 1.05, minWidth: 105 }, studentDetailsCell: { flex: 1.15, minWidth: 125 }, enrollmentTableCell: { flex: 0.9, minWidth: 92 }, statusTableCell: { flex: 0.95, minWidth: 92 }, setupTableCell: { flex: 0.88, minWidth: 82 }, assignmentTableCell: { flex: 0.8, minWidth: 82 },
  appRoot: { flex: 1, flexDirection: 'row', minHeight: '100vh' as any, backgroundColor: C.page, fontFamily: 'Geist-Regular' as any }, appRootDesktop: { padding: 16, gap: 12 }, appRootCompact: { padding: 0 },
  sidebar: { width: 244, flexShrink: 0, backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.line, paddingTop: 26, paddingHorizontal: 16, paddingBottom: 18 },
  sidebarRail: { width: 76, alignItems: 'center', borderWidth: 1, borderRightWidth: 1, borderColor: C.line, borderRadius: 18, paddingHorizontal: 8, paddingTop: 16, paddingBottom: 14 },
  sidebarRailExpanded: { width: 226, alignItems: 'stretch', paddingHorizontal: 12 },
  sidebarPinButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, paddingHorizontal: 11, marginTop: 'auto' as any, marginBottom: 6 },
  sidebarDrawer: { width: 270, minHeight: '100%' as any, borderRightWidth: 0 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 34 }, brandLockupRail: { justifyContent: 'center', paddingHorizontal: 0, paddingBottom: 28 }, navItemRail: { width: 46, justifyContent: 'center', paddingHorizontal: 0, marginBottom: 8 }, sidebarBottomRail: { width: '100%', alignItems: 'center' },
  brandMark: { width: 42, height: 42 }, brandName: { color: C.blueDeep, fontFamily: 'SourGummy-Bold', fontSize: 21, lineHeight: 24 }, brandSub: { color: C.muted, fontFamily: 'Geist-SemiBold', fontSize: 9, letterSpacing: 1.3, marginTop: 1 },
  navCaption: { color: C.subtle, fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 1.1, marginLeft: 11, marginBottom: 9 }, navItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, paddingHorizontal: 11, marginBottom: 3 }, navItemActive: { backgroundColor: C.blueSoft }, navText: { color: C.muted, fontFamily: 'Geist-Medium', fontSize: 14, flex: 1 }, navTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, navBadge: { color: C.yellow, fontSize: 11, fontFamily: 'Geist-SemiBold', backgroundColor: C.yellowSoft, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2 }, sidebarBottom: { marginTop: 'auto' as any, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.line }, demoPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: C.blueSoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, marginHorizontal: 8 }, demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue }, demoText: { color: C.blueDeep, fontSize: 11, fontFamily: 'Geist-SemiBold' }, sidebarNote: { color: C.subtle, fontSize: 11, marginVertical: 8, marginHorizontal: 8 },
  workspace: { flex: 1, minWidth: 0, backgroundColor: C.white, overflow: 'hidden', borderWidth: 1, borderColor: '#D9E5EE', borderRadius: 18, ...(Platform.OS === 'web' ? { boxShadow: '0 14px 38px rgba(73, 92, 105, 0.12)' } : { elevation: 2 }) } as any, topbar: { minHeight: 62, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, zIndex: 10 }, breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 9 }, breadcrumbRoot: { color: C.subtle, fontSize: 13 }, breadcrumbCurrent: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 13 }, topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 14 }, centerName: { color: C.muted, fontSize: 12, marginRight: 4 }, iconButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' }, iconBadge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, backgroundColor: C.red }, iconBadgeText: { color: C.white, fontSize: 9, fontFamily: 'Geist-SemiBold' }, adminMenuAnchor: { position: 'relative', zIndex: 20 }, adminChip: { minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 7 }, adminMenuArrow: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }, adminInitial: { width: 29, height: 29, borderRadius: 15, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }, adminInitialText: { color: C.blue, fontSize: 10, fontFamily: 'Geist-SemiBold' }, adminChipText: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium' }, content: { flex: 1, minHeight: 0 }, contentSplit: { flexDirection: 'row' }, contentMain: { flex: 1, minWidth: 0, minHeight: 0 }, accountDetailPane: { flexShrink: 0, alignSelf: 'stretch', minHeight: 0, overflow: 'hidden', backgroundColor: C.white, borderLeftWidth: 1, borderLeftColor: C.line }, accountDetailScroll: { flex: 1, minHeight: 0 }, accountDetailContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 30 },
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
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.blueSoft, borderRadius: 7, paddingVertical: 10, paddingHorizontal: 12, alignSelf: 'flex-start' }, noticeText: { color: C.blueDeep, fontSize: 11, lineHeight: 16, flexShrink: 1 }, directoryControls: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }, accountSearchArea: { gap: 10 }, accountSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, accountFilterTagRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }, accountFilterTag: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#B9DCF2', borderRadius: 15, backgroundColor: '#F1F8FC' }, accountFilterTagText: { color: C.blueDeep, fontSize: 11, fontFamily: 'Geist-Medium' }, accountFilterReset: { marginLeft: 'auto' as any, minHeight: 30, justifyContent: 'center', paddingHorizontal: 6 }, accountFilterResetText: { color: C.blue, fontSize: 11, fontFamily: 'Geist-Medium' }, accountRoleTabs: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: C.line }, accountRoleTab: { flex: 1, minWidth: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, position: 'relative' }, accountRoleTabHover: { backgroundColor: '#F7FAFC' }, accountRoleTabPressed: { backgroundColor: C.blueSoft }, accountRoleTabText: { color: C.muted, fontSize: 12, fontFamily: 'Geist-Medium' }, accountRoleTabTextSelected: { color: C.blue, fontFamily: 'Geist-SemiBold' }, accountRoleTabIndicator: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, backgroundColor: C.blue }, searchBox: { width: 440, maxWidth: '100%' as any, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, paddingHorizontal: 11 }, searchBoxFullWidth: { width: 0, minWidth: 0, flex: 1 }, accountFiltersButton: { height: 44, minWidth: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 11, borderWidth: 1, borderColor: C.line, borderRadius: 7, backgroundColor: C.white }, accountFiltersButtonText: { color: C.blueDeep, fontSize: 12, fontFamily: 'Geist-Medium' }, accountFiltersCount: { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: C.blueSoft }, accountFiltersCountText: { color: C.blue, fontSize: 10, fontFamily: 'Geist-SemiBold' }, accountFiltersDialog: { maxWidth: 440, maxHeight: '88%' }, accountFiltersDialogBody: { flexGrow: 0, maxHeight: 490 }, accountFiltersDialogContent: { gap: 13, paddingBottom: 4 }, searchInput: { flex: 1, color: C.ink, fontSize: 13, paddingVertical: 0 } as any, filterWrap: { gap: 5 }, filterLabel: { color: C.muted, fontSize: 10, fontFamily: 'Geist-Medium' }, selectFrame: { minWidth: 140, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, overflow: 'hidden', paddingRight: 10 }, selectNativeValue: { color: C.ink, fontSize: 13, paddingLeft: 11, flex: 1 }, selectIcon: { position: 'absolute', right: 10, top: 12, pointerEvents: 'none' as any }, nativeOptions: { width: '88%' as any, maxWidth: 390, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.white }, nativeOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line }, columnFilterWrap: { position: 'relative' }, columnFilterTrigger: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5 }, columnFilterLabel: { color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, columnFilterMenu: { position: 'absolute', top: 33, left: 0, minWidth: 176, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, zIndex: 100, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 22px rgba(23,54,77,0.16)' } : { elevation: 10 }) } as any, columnFilterOption: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E8EFF4' }, columnFilterOptionText: { color: C.ink, fontSize: 11 }, columnFilterOptionSelected: { color: C.blue, fontFamily: 'Geist-SemiBold' }, directoryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, resultCount: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 12 },
  table: { backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, tableHead: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: '#F0F7FB', borderBottomWidth: 1, borderBottomColor: C.line, position: 'relative', zIndex: 10 }, tableHeadCell: { flex: 1, minWidth: 70, color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, personHead: { flex: 2.2 }, tableRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: '#E5EEF4' }, rowHover: { backgroundColor: '#F4F9FC' }, personCell: { flex: 2.2, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: 'Geist-SemiBold', fontSize: 11 }, personText: { flex: 1, minWidth: 0 }, personName: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 12 }, tableCell: { flex: 1, minWidth: 70, color: C.ink, fontSize: 11 }, numberCell: { textAlign: 'center', fontVariant: ['tabular-nums'] }, rowAction: { width: 22, alignItems: 'flex-end' }, status: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 }, statusDot: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 10, fontFamily: 'Geist-SemiBold' }, mobileRows: { gap: 9 }, mobileRow: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 13, gap: 12 }, mobileRowBottom: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 46 }, studentMobileDetails: { gap: 2, paddingLeft: 46 },
  requestList: { borderTopWidth: 1, borderColor: C.line }, requestListRowCompact: { alignItems: 'flex-start', flexWrap: 'wrap', gap: 9 }, requestListRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line }, requestListPrimary: { flex: 1, minWidth: 145, gap: 4 }, requestListMeta: { flex: 1, minWidth: 145, gap: 4 }, actionChoiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 9 }, actionPanel: { gap: 10, marginTop: 12, padding: 13, backgroundColor: '#F6FAFC', borderRadius: 8, borderWidth: 1, borderColor: C.line }, multilineInput: { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' } as any, assignmentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }, assignmentEdit: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }, requestEvent: { flexDirection: 'row', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line }, requestEventMark: { width: 8, height: 8, marginTop: 4, borderRadius: 4, backgroundColor: C.blue },
  patientHeaderNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, paddingHorizontal: 13, backgroundColor: C.blueSoft, borderRadius: 7 }, patientHeaderNoteText: { color: C.blueDeep, fontSize: 11, flex: 1 }, requestSection: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 16 }, requestRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: C.line }, requestMain: { flex: 1 },
  logList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, logRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }, logDate: { width: 120 }, logDateDay: { color: C.ink, fontSize: 11, fontFamily: 'Geist-Medium' }, logActor: { width: 130, alignItems: 'flex-end' },
  settingsPanel: { paddingVertical: 18, paddingHorizontal: 20, backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line }, settingLabel: { color: C.muted, fontSize: 12 }, settingValue: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium', textAlign: 'right', flexShrink: 1 }, settingInput: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12, textAlign: 'right', width: '68%' as any, minHeight: 38, paddingHorizontal: 8, borderWidth: 1, borderColor: C.line, borderRadius: 6, backgroundColor: C.white } as any, settingsAction: { alignSelf: 'flex-end', marginTop: 15 }, profileSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(14, 38, 56, 0.38)', padding: 18 }, mobileDrawer: { alignSelf: 'stretch', maxWidth: 310, width: '88%', height: '100%', marginRight: 'auto', backgroundColor: C.white, borderRadius: 9, overflow: 'hidden' }, dialog: { width: '100%', maxWidth: 610, maxHeight: '88%', backgroundColor: C.white, borderRadius: 11, padding: 23, borderWidth: 1, borderColor: C.line, ...(Platform.OS === 'web' ? { boxShadow: '0 18px 50px rgba(23,54,77,0.17)' } : { elevation: 8 }) } as any, detailDialog: { maxWidth: 650 }, detailScroll: { maxHeight: 520, flexGrow: 0 } as any, formDialog: { maxWidth: 520 }, accountDialog: { height: 520, maxHeight: '88%', overflow: 'hidden' }, confirmDialog: { width: '100%', maxWidth: 430, backgroundColor: C.white, borderRadius: 11, padding: 24, alignItems: 'flex-start', borderWidth: 1, borderColor: C.line }, notificationLayer: { flex: 1 }, notificationPopover: { position: 'absolute', width: 360, maxWidth: '92%', maxHeight: '78%', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 18, ...(Platform.OS === 'web' ? { boxShadow: '0 14px 38px rgba(23,54,77,0.20)' } : { elevation: 10 }) }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, marginBottom: 18 }, modalHeaderText: { flex: 1 }, dialogTitle: { color: C.ink, fontSize: 19, fontFamily: 'Geist-SemiBold' }, closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }, detailIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.line }, detailName: { color: C.ink, fontSize: 17, fontFamily: 'Geist-SemiBold' }, detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, paddingVertical: 12 }, detailCell: { width: '50%', paddingVertical: 10, paddingRight: 12 }, detailLabel: { color: C.subtle, fontSize: 10, marginBottom: 5 }, detailValue: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium' }, detailSection: { paddingTop: 15, paddingBottom: 10, borderTopWidth: 1, borderTopColor: C.line }, fieldLabel: { color: C.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 8 }, linkedPatient: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 40 }, smallAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }, smallAvatarText: { color: C.blue, fontSize: 9, fontFamily: 'Geist-SemiBold' }, assignmentSummary: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 }, assignmentTrigger: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }, choiceList: { borderWidth: 1, borderColor: C.line, borderRadius: 7, marginTop: 3, paddingHorizontal: 10 }, choiceRow: { minHeight: 39, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }, sourceNote: { color: C.subtle, fontSize: 10, lineHeight: 15, marginTop: 7 }, detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: C.line }, requestReviewNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.yellowSoft, padding: 12, borderRadius: 7, marginBottom: 12 }, requestReason: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 18 }, confirmIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, confirmIconDanger: { backgroundColor: C.redSoft }, confirmMessage: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 16 }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 9, marginTop: 15, alignSelf: 'stretch' },
  field: { gap: 6, marginBottom: 14 }, input: { height: 42, paddingHorizontal: 11, borderRadius: 7, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, color: C.ink, fontSize: 13 } as any, roleChoices: { flexDirection: 'row', gap: 9, marginBottom: 14 }, roleChoice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, height: 44, borderWidth: 1, borderColor: C.line, borderRadius: 7 }, roleChoiceActive: { borderColor: C.blue, backgroundColor: C.blueSoft }, roleChoiceText: { color: C.muted, fontSize: 12 }, roleChoiceTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, formHint: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.blueSoft, borderRadius: 7, padding: 10 }, errorText: { color: C.red, fontSize: 11, marginTop: 10 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }, segment: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#F0F6FA' }, segmentActive: { backgroundColor: C.blueSoft }, segmentText: { color: C.muted, fontSize: 11 }, segmentTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, markAll: { marginLeft: 'auto' as any, padding: 6 }, notificationList: { maxHeight: 400 }, notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.line }, unreadMark: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue, marginTop: 5 }, readMark: { backgroundColor: C.line },
  offboardingList: { maxHeight: 360 }, offboardingRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, gap: 9 }, offboardingPatient: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 18, backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, emptyTitle: { color: C.ink, fontSize: 14, fontFamily: 'Geist-SemiBold' }, toast: { position: 'absolute', bottom: 22, right: 24, maxWidth: '90%' as any, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 9px 24px rgba(23,54,77,0.14)' } : { elevation: 5 }) } as any, toastText: { color: C.ink, fontSize: 12, flexShrink: 1, maxWidth: 480 },
});
