import { AssignmentCalendar } from '@/components/assignment-calendar';
import { ProfileEditWarning } from '@/components/profile-edit-warning';
import { reviewStudentNameChange, useStudentNameRequests, type StudentNameRequest } from '@/data/student-name-requests';
import { parseCalendarDate, todayCalendarDate } from '@/data/calendar-date';
import { ListPagination, useListPagination } from '@/components/list-pagination';
import { useLearningActivity } from '@/data/learning-workflow';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFonts } from 'expo-font';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Animated,
  ActivityIndicator,
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
  initialAdminProfile,
  initialActivity,
  initialCareEpisodes,
  initialNotifications,
  initialPatients,
  initialProfessionals,
  initialReleaseRequests,
  initialRequests,
  type ActivityEntry,
  type ArchiveRecord,
  type AssignmentHistory,
  type CareEpisode,
  type CareEpisodeClosureCategory,
  type Patient,
  type PatientAccess,
  type Professional,
  type ProfessionalRole,
  type ProfessionalStatus,
  type RequestAttachment,
  type ReleaseRequest,
  type RequestStatus,
  type SuspensionRequest,
} from '../../data/center-admin';
import CreatePatientDialog from '../../components/admin/CreatePatientDialog';
import CreateProfessionalDialog, { type ProfessionalDraft } from '../../components/admin/CreateProfessionalDialog';
import AccountDetailsActionRow from '../../components/admin/AccountDetailsActionRow';
import AccountDetailsHeader from '../../components/admin/AccountDetailsHeader';
import ProfessionalDetails from '../../components/admin/ProfessionalDetails';
import SupportingAttachments from '../../components/admin/SupportingAttachments';
import SupportingDocumentDropzone from '../../components/admin/SupportingDocumentDropzone';

type Page = 'Dashboard' | 'Accounts' | 'Activity Logs' | 'Settings';
type AccountView = 'Directory' | 'Student Requests' | 'Archive Center';
type AccountRow = { kind: 'professional'; person: Professional } | { kind: 'student'; patient: Patient } | { kind: 'archiveEpisode'; episode: Extract<CareEpisode, { status: 'Closed' }>; patient: Patient };
type AccountSort = { key: 'Account' | 'ID' | 'Access' | 'Setup' | 'Assignments' | 'Date'; direction: 'ascending' | 'descending' };
const ACCOUNT_SORT_OPTIONS: { label: string; key: AccountSort['key']; direction: AccountSort['direction'] }[] = [
  { label: 'Alphabetical (A–Z)', key: 'Account', direction: 'ascending' },
  { label: 'Alphabetical (Z–A)', key: 'Account', direction: 'descending' },
  { label: 'Latest added', key: 'Date', direction: 'descending' },
  { label: 'Oldest added', key: 'Date', direction: 'ascending' },
];
type Selection = { kind: 'professional'; id: string } | { kind: 'patient'; id: string } | { kind: 'archiveEpisode'; id: string } | { kind: 'request'; id: string } | { kind: 'release'; id: string } | null;
const accountViewIcon = (view: AccountView, active: boolean): React.ComponentProps<typeof Ionicons>['name'] => {
  if (view === 'Directory') return active ? 'list' : 'list-outline';
  if (view === 'Student Requests') return active ? 'document-text' : 'document-text-outline';
  return active ? 'archive' : 'archive-outline';
};
type Confirmation = { title: string; message: string; actionLabel: string; danger?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name']; requiresReason?: boolean; requiresEvidence?: boolean; run: () => void | Promise<void> };

type AdminSharedRecords = {
  professionals: Professional[];
  patients: Patient[];
  requests: SuspensionRequest[];
  releaseRequests: ReleaseRequest[];
  careEpisodes: CareEpisode[];
  assignmentHistory: AssignmentHistory[];
  activity: ActivityEntry[];
  notifications: typeof initialNotifications;
  profile: typeof initialAdminProfile;
};

let sharedAdminRecords: AdminSharedRecords = {
  professionals: initialProfessionals,
  patients: initialPatients,
  requests: initialRequests,
  releaseRequests: initialReleaseRequests,
  careEpisodes: initialCareEpisodes,
  assignmentHistory: [],
  activity: initialActivity,
  notifications: initialNotifications,
  profile: initialAdminProfile,
};
const adminRecordListeners = new Set<() => void>();
const subscribeAdminRecords = (listener: () => void) => { adminRecordListeners.add(listener); return () => adminRecordListeners.delete(listener); };
const getAdminRecords = () => sharedAdminRecords;
const updateAdminRecords = <K extends keyof AdminSharedRecords>(key: K, update: React.SetStateAction<AdminSharedRecords[K]>) => {
  const current = sharedAdminRecords[key];
  const next = typeof update === 'function' ? (update as (value: AdminSharedRecords[K]) => AdminSharedRecords[K])(current) : update;
  const records = { ...sharedAdminRecords, [key]: next };
  if (key === 'professionals') records.professionals.filter((person) => professionalAccess(person) === 'Suspended' || professionalMembership(person) === 'Deactivated').forEach((person) => requireArchive(person.archive));
  if (key === 'patients') {
    records.patients.filter((patient) => studentAccess(patient) === 'Suspended' || studentMembership(patient) === 'Deactivated').forEach((patient) => requireArchive(patient.archive));
    if (records.patients.some((patient) => patient.enrollment === 'Archived' && !records.careEpisodes.some((episode) => episode.patientId === patient.id && episode.status === 'Closed' && !episode.restoredAt))) {
      throw new Error('Archived enrollments require a dated closure record.');
    }
  }
  if (key === 'careEpisodes') records.careEpisodes.forEach((episode) => { if (episode.status === 'Closed') requireArchive(episode.archive); });
  sharedAdminRecords = records;
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
const localIsoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const isValidIsoDate = (value: string) => parseCalendarDate(value, 'iso') !== null;
const archiveEpisodeType = (episode: CareEpisode) => episode.closureCategory ?? 'Closure category missing';
const requireArchive = (archive: ArchiveRecord | undefined): ArchiveRecord => {
  if (!archive || !isValidIsoDate(archive.archivedAt.slice(0, 10)) || Number.isNaN(Date.parse(archive.archivedAt)) || !archive.reason.trim()) {
    throw new Error('Archived records require a valid archive date and reason.');
  }
  return archive;
};
const formatTimestamp = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const professionalAccess = (person: Professional) => person.access ?? (person.status === 'Suspended' ? 'Suspended' : 'Active');
const professionalMembership = (person: Professional) => person.membership ?? (person.status === 'Deactivated' ? 'Deactivated' : 'Active');
const professionalSetup = (person: Professional) => person.invitation === 'Expired' ? 'Expired' : person.invitation === 'Completed' ? 'Completed' : 'Pending';
const studentAccess = (student: Patient) => student.access === 'Setup pending' ? 'Active' : student.access;
const studentMembership = (student: Patient) => student.membership ?? 'Active';
const studentSetup = (student: Patient) => student.setup ?? (student.access === 'Setup pending' ? 'Pending' : 'Completed');
const studentAssignmentStatus = (student: Patient) => student.teacherId || student.therapistId ? 'Assigned' : 'Unassigned';
const isFinalRequestStatus = (status: string) => status === 'Declined' || status === 'Approved' || status.startsWith('Approved &');
const primaryRequestStatus = (status: string): 'Pending' | 'Approved' | 'Declined' => status === 'Declined' ? 'Declined' : status === 'Approved' || status.startsWith('Approved &') ? 'Approved' : 'Pending';
const releaseRequestTypeLabel = (request: ReleaseRequest) => request.requestType === 'Transfer' ? 'School transfer' : request.requestType === 'Withdrawal' ? 'Withdrawal' : request.requestType === 'Therapist assignment release' ? 'Therapist assignment release' : 'Enrollment release';
const requestResolutionTime = (request: SuspensionRequest | ReleaseRequest) => {
  if (request.resolvedAt) return new Date(request.resolvedAt).getTime();
  const event = [...(request.events ?? [])].reverse().find((item) => /suspension approved|request declined|enrollment closed|therapist assignment updated/i.test(item.title));
  return event ? new Date(event.date).getTime() : null;
};
const releaseFollowup = (request: ReleaseRequest, now: number) => {
  const days = Math.max(0, Math.floor((now - new Date(`${request.submitted}T12:00:00`).getTime()) / 86400000));
  const count = request.reminderCount ?? 0;
  const day14Recorded = (request.events ?? []).some((event) => event.title.toLowerCase().includes('day 14') && (event.title.toLowerCase().includes('escalat') || event.title.toLowerCase().includes('follow-up flagged')));
  const nextDay = [3, 7, 14][count];
  const open = request.status === 'Pending' || request.status === 'More information requested';
  const waiting = request.origin !== 'Therapist';
  return { days, nextDay: day14Recorded ? undefined : nextDay, due: open && waiting && !day14Recorded && nextDay !== undefined && days >= nextDay, overdue: open && waiting && days >= 14, day14Recorded };
};
const releaseStage = (request: ReleaseRequest) => {
  if (request.status === 'More information requested') return 'Awaiting Supporting Evidence';
  const isSchoolExit = ['Transfer', 'Withdrawal', 'Enrollment release'].includes(request.requestType ?? 'Enrollment release') && request.reason !== 'No longer receiving services';
  if (isSchoolExit && request.guardianConfirmation === 'Disputed') return 'Awaiting Supporting Evidence';
  if (isSchoolExit && request.origin === 'Teacher' && request.guardianConfirmation !== 'Confirmed' && request.guardianConfirmation !== 'Not required') return 'Awaiting Guardian Confirmation';
  if (isSchoolExit && (request.teacherVerification === 'More Information Needed' || request.teacherVerification === 'Unable to Verify')) return 'Awaiting Supporting Evidence';
  if (isSchoolExit && (request.teacherVerification === undefined || request.teacherVerification === 'Pending')) return 'Awaiting Teacher Verification';
  if (isSchoolExit && request.origin === 'Guardian' && request.guardianConfirmation !== 'Confirmed' && request.guardianConfirmation !== 'Not required') return 'Awaiting Guardian Confirmation';
  return request.workflowStage ?? 'Ready for Admin Review';
};

function IconButton({ icon, label, onPress, badge }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; badge?: string }) {
  return <TouchableOpacity onPress={onPress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={label}><Ionicons name={icon} size={19} color={C.ink} />{badge ? <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{badge}</Text></View> : null}</TouchableOpacity>;
}

function TooltipIconButton({ icon, label, hint, onPress, buttonStyle, disabled = false }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; hint: string; onPress: () => void; buttonStyle?: any; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <View style={{ position: 'relative', zIndex: 2 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled} onHoverIn={() => setHovered(!disabled)} onHoverOut={() => setHovered(false)} onPress={onPress} style={[buttonStyle, disabled && { opacity: 0.45 }]}>
      <Ionicons name={icon} size={icon === 'pencil' ? 16 : 19} color={C.muted} />
    </Pressable>
    {Platform.OS === 'web' && hovered ? <View pointerEvents="none" style={{ position: 'absolute', zIndex: 5, right: 0, bottom: 40, width: 190, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 5, backgroundColor: C.ink }}><Text style={{ color: C.white, fontSize: 11, lineHeight: 15 }}>{label}</Text></View> : null}
  </View>;
}

function Button({ label, onPress, kind = 'secondary', disabled = false, icon, loading = false, accent = false }: { label: string; onPress: NonNullable<React.ComponentProps<typeof TouchableOpacity>['onPress']>; kind?: 'primary' | 'secondary' | 'text' | 'danger'; disabled?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name']; loading?: boolean; accent?: boolean }) {
  const iconColor = kind === 'primary' ? C.white : kind === 'danger' ? C.red : C.blue;
  return <TouchableOpacity onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} style={[styles.button, kind === 'primary' ? styles.button_primary : kind === 'danger' ? styles.button_danger : kind === 'text' ? styles.button_text : styles.button_secondary, (disabled || loading) && styles.buttonDisabled]}>{loading ? <ActivityIndicator size="small" color={iconColor} /> : icon ? <Ionicons name={icon} size={16} color={iconColor} /> : null}<Text style={[styles.buttonText, kind === 'primary' && styles.buttonTextPrimary, kind === 'danger' && styles.buttonTextDanger, accent && styles.buttonTextAccent, (disabled || loading) && styles.mutedText]}>{label}</Text></TouchableOpacity>;
}

function Status({ label, tone }: { label: string; tone?: 'green' | 'yellow' | 'red' | 'blue' | 'neutral' }) {
  const color = tone === 'green' ? '#286443' : tone === 'yellow' ? C.yellow : tone === 'red' ? C.red : tone === 'blue' ? C.blue : C.muted;
  const background = tone === 'green' ? '#EEF7F0' : tone === 'yellow' ? '#FFF5DB' : tone === 'red' ? '#FCEEF0' : tone === 'blue' ? '#ECF6FD' : '#F0F4F7';
  return <View style={[styles.status, { backgroundColor: background }]}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.statusText, { color }]}>{label}</Text></View>;
}

function RoleBadge({ role }: { role: 'Student' | 'Therapist' | 'Teacher' }) {
  const backgroundColor = role === 'Student' ? '#EEF7F0' : role === 'Therapist' ? '#ECF6FD' : '#F4EFFA';
  return <View style={[styles.roleBadge, { backgroundColor }]} accessibilityLabel={`Role: ${role}`}><Text style={styles.roleBadgeText}>{role}</Text></View>;
}

function AssignmentBadge({ label }: { label: string }) {
  const accessibilityLabel = label === 'Assigned' || label === 'Unassigned' ? `Assignments: ${label}` : `${label} assigned Students`;
  return <View accessibilityLabel={accessibilityLabel}><Status label={label} tone={label === 'Unassigned' ? 'neutral' : 'green'} /></View>;
}

function SetupStatus({ label, compact = false }: { label: 'Pending' | 'Completed' | 'Expired'; compact?: boolean }) {
  return <Status label={compact ? `Setup ${label.toLowerCase()}` : label} tone={label === 'Completed' ? 'green' : label === 'Expired' ? 'red' : 'yellow'} />;
}

function Filter({ value, options, onChange, label, getLabel = (option) => option }: { value: string; options: string[]; onChange: (value: string) => void; label: string; getLabel?: (value: string) => string }) {
  return <View style={styles.filterWrap}><Text style={styles.filterLabel}>{label}</Text><SelectControl label={label} value={value} options={options} getLabel={getLabel} onChange={onChange} /></View>;
}

function ColumnFilter({ label, active, options, onSort, sortDirection, multiSelect = false, sortEnabled = true, compactMenu = false, indicatorIcon = 'chevron-down' }: { label: string; active?: boolean; options: { label: string; selected: boolean; onSelect: () => void }[]; onSort?: () => void; sortDirection?: 'ascending' | 'descending' | null; multiSelect?: boolean; sortEnabled?: boolean; compactMenu?: boolean; indicatorIcon?: 'chevron-down' | 'arrow-down' }) {
  const [open, setOpen] = useState(false);
  const anchorId = React.useId();
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const anchor = document.getElementById(anchorId)?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(compactMenu ? 108 : 232, window.innerWidth - 16);
      const gap = 5;
      const availableBelow = window.innerHeight - anchor.bottom - gap - 8;
      const availableAbove = anchor.top - gap - 8;
      const menuHeight = options.length * 36 + 10;
      const opensAbove = availableBelow < menuHeight && availableAbove > availableBelow;
      const maxHeight = Math.min(menuHeight, opensAbove ? availableAbove : availableBelow);
      const left = compactMenu ? anchor.left + (anchor.width - width) / 2 : anchor.left;
      setMenuPosition({
        left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
        top: opensAbove ? anchor.top - gap - maxHeight : anchor.bottom + gap,
        width,
        maxHeight,
      });
    }
    setOpen(true);
  };
  const menu = <View style={[styles.columnFilterMenu, compactMenu && styles.roleFilterMenu]}>{options.map((option, index) => <Pressable key={`${option.label}-${index}`} accessibilityRole={multiSelect ? 'checkbox' : 'button'} accessibilityState={{ selected: option.selected, checked: multiSelect ? option.selected : undefined }} onPress={(event) => { event.stopPropagation(); option.onSelect(); if (!multiSelect) setOpen(false); }} style={(state) => [styles.columnFilterOption, 'hovered' in state && state.hovered && styles.rowHover]}><Text style={[styles.columnFilterOptionText, option.selected && styles.columnFilterOptionSelected]}>{option.label}</Text>{option.selected ? <Ionicons name="checkmark" size={15} color={C.blue} /> : null}</Pressable>)}</View>;
  return <View nativeID={anchorId} style={[styles.columnFilterWrap, open && styles.columnFilterWrapOpen]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}><Pressable accessibilityRole="button" accessibilityLabel={sortEnabled ? `Sort by ${label}${sortDirection ? `, ${sortDirection}` : ''}` : `Filter ${label}`} onPress={() => sortEnabled && onSort ? onSort() : toggleMenu()} style={styles.columnFilterTrigger}><Text style={styles.columnFilterLabel}>{label}</Text>{sortEnabled && onSort && sortDirection === 'descending' ? <Ionicons name="arrow-down" size={12} color={C.blue} /> : null}</Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Filter ${label}`} accessibilityState={{ expanded: open }} onPress={toggleMenu} style={{ minWidth: 25, minHeight: 34, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={indicatorIcon} size={12} color={active ? C.blue : C.muted} /></Pressable></View>
    {open ? <Modal transparent visible onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.columnFilterBackdrop} onPress={() => setOpen(false)}>
        <View style={menuPosition ? [styles.columnFilterPosition, menuPosition] : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" style={menuPosition ? { maxHeight: menuPosition.maxHeight } : undefined}>
            {menu}
          </ScrollView>
        </View>
      </Pressable>
    </Modal> : null}
  </View>;
}

function MultiFilter({ label, values, options, onToggle, includeAllOption = false, singleSelect = false }: { label: string; values: string[]; options: string[]; onToggle: (value: string) => void; includeAllOption?: boolean; singleSelect?: boolean }) {
  const [open, setOpen] = useState(false);
  const anchorId = React.useId();
  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const keepDialogOpenOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', keepDialogOpenOnEscape, true);
    window.addEventListener('keyup', closeOnEscape, true);
    return () => {
      window.removeEventListener('keydown', keepDialogOpenOnEscape, true);
      window.removeEventListener('keyup', closeOnEscape, true);
    };
  }, [open, anchorId]);
  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const anchor = document.getElementById(anchorId);
      if (anchor && event.target instanceof Node && !anchor.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open, anchorId]);
  const selectedSummary = values.length === 1 ? values[0] : values.length ? `${values.length} selected` : 'All';
  const menu = <Pressable style={styles.multiFilterMenu}>{includeAllOption ? <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: values.length === 0, selected: values.length === 0 }} onPress={() => { values.forEach((value) => onToggle(value)); setOpen(false); }} style={styles.columnFilterOption}><Text style={[styles.columnFilterOptionText, values.length === 0 && styles.columnFilterOptionSelected]}>All</Text>{values.length === 0 ? <Ionicons name="checkmark" size={15} color={C.blue} /> : null}</TouchableOpacity> : null}{options.map((option) => {
    const selected = values.includes(option);
    return <TouchableOpacity key={option} accessibilityRole={singleSelect ? 'radio' : 'checkbox'} accessibilityState={{ checked: selected, selected }} onPress={() => { onToggle(option); if (singleSelect) setOpen(false); }} style={styles.columnFilterOption}><Text style={[styles.columnFilterOptionText, selected && styles.columnFilterOptionSelected]}>{option}</Text>{selected ? <Ionicons name="checkmark" size={15} color={C.blue} /> : null}</TouchableOpacity>;
  })}</Pressable>;
  return <View style={styles.filterWrap}><Text style={styles.filterLabel}>{label}</Text><View nativeID={anchorId} style={styles.multiFilterAnchor}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label}: ${selectedSummary}`} accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.selectFrame}><Text style={styles.selectNativeValue} numberOfLines={1}>{selectedSummary}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} /></TouchableOpacity>{open && Platform.OS === 'web' ? menu : null}</View>{open && Platform.OS !== 'web' ? <Modal transparent animationType="fade" visible onRequestClose={() => setOpen(false)}><Pressable style={styles.overlay} onPress={() => setOpen(false)}><Pressable onPress={(event) => event.stopPropagation()}>{menu}</Pressable></Pressable></Modal> : null}</View>;
}

function SortHeader({ label, onPress, active, direction, showDirection = true }: { label: string; onPress: () => void; active: boolean; direction: 'ascending' | 'descending'; showDirection?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Sort by ${label}${active ? `, ${direction}` : ''}`} onPress={onPress} style={[styles.columnFilterTrigger, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}><Text style={styles.columnFilterLabel}>{label}</Text>{showDirection ? <Ionicons name={active && direction === 'ascending' ? 'arrow-up' : 'arrow-down'} size={12} color={active ? C.blue : C.subtle} /> : null}</TouchableOpacity>;
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
  const { professionals, patients, requests, releaseRequests, careEpisodes, assignmentHistory, activity: adminActivity, notifications, profile } = useSyncExternalStore(subscribeAdminRecords, getAdminRecords, getAdminRecords);
  const learningActivity = useLearningActivity();
  const activity = [...learningActivity, ...adminActivity];
  const setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>> = (update) => updateAdminRecords('professionals', update);
  const setPatients: React.Dispatch<React.SetStateAction<Patient[]>> = (update) => updateAdminRecords('patients', update);
  const setRequests: React.Dispatch<React.SetStateAction<SuspensionRequest[]>> = (update) => updateAdminRecords('requests', update);
  const setReleaseRequests: React.Dispatch<React.SetStateAction<ReleaseRequest[]>> = (update) => updateAdminRecords('releaseRequests', update);
  const setCareEpisodes: React.Dispatch<React.SetStateAction<CareEpisode[]>> = (update) => updateAdminRecords('careEpisodes', update);
  const setAssignmentHistory: React.Dispatch<React.SetStateAction<AssignmentHistory[]>> = (update) => updateAdminRecords('assignmentHistory', update);
  const setActivity: React.Dispatch<React.SetStateAction<ActivityEntry[]>> = (update) => updateAdminRecords('activity', update);
  const recentActivityViewport = useRef({ scrollTop: 0, height: 0, panelTop: 0 });
  const recentActivityRows = useRef(new Map<string, { top: number; height: number }>());
  const [viewedAlertIds, setViewedAlertIds] = useState<Set<string>>(() => new Set());
  const setNotifications: React.Dispatch<React.SetStateAction<typeof initialNotifications>> = (update) => updateAdminRecords('notifications', update);
  const setAdminProfile = (update: React.SetStateAction<typeof initialAdminProfile>) => updateAdminRecords('profile', update);
  const initialRecordSelection: Selection = recordKind && recordId && ['professional', 'patient', 'request', 'release'].includes(recordKind) ? { kind: recordKind as Exclude<NonNullable<Selection>['kind'], never>, id: recordId } : null;
  const [selection, setSelection] = useState<Selection>(initialRecordSelection);
  const accountDetailPaneRef = useRef<any>(null);
  const accountDetailScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [accountDetailPaneWidth] = useState(() => new Animated.Value(0));
  const [accountDetailPaneOpacity] = useState(() => new Animated.Value(0));
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationSubmitting, setConfirmationSubmitting] = useState(false);
  const confirmationSubmittingRef = useRef(false);
  const [confirmationReason, setConfirmationReason] = useState('');
  const [confirmationEvidence, setConfirmationEvidence] = useState('');
  const confirmationReasonRef = useRef('');
  const confirmationEvidenceRef = useRef('');
  const [prototypeNow] = useState(() => Date.now());
  const [toast, setToast] = useState('');
  const [accountRoles, setAccountRoles] = useState<string[]>(() => {
    const roles = (accountRoleParam ?? '').split(',').filter((role) => ['Student', 'Therapist', 'Teacher'].includes(role));
    return roles;
  });
  const [accountAccess, setAccountAccess] = useState(accountAccessParam ?? 'All access');
  const [accountSetup, setAccountSetup] = useState<string[]>(() => accountSetupParam && accountSetupParam !== 'All setup' ? accountSetupParam.split(',').filter(Boolean) : []);
  const [archiveStatuses, setArchiveStatuses] = useState<string[]>([]);
  const [accountMembership, setAccountMembership] = useState('All memberships');
  const [closurePatient, setClosurePatient] = useState<Patient | null>(null);
  const [closureCategory, setClosureCategory] = useState<Exclude<CareEpisodeClosureCategory, 'Clinical discharge'>>('Authorized withdrawal');
  const [closureReason, setClosureReason] = useState('');
  const [closureEvidence, setClosureEvidence] = useState<RequestAttachment | null>(null);
  const [closureEffectiveDate, setClosureEffectiveDate] = useState('');
  const [closureAuthorizationReference, setClosureAuthorizationReference] = useState('');
  const [reenrollmentPatient, setReenrollmentPatient] = useState<Patient | null>(null);
  const [reenrollmentTherapistId, setReenrollmentTherapistId] = useState('');
  const [reenrollmentTeacherId, setReenrollmentTeacherId] = useState('');
  const [accountEnrollment, setAccountEnrollment] = useState(accountEnrollmentParam ?? 'All enrollment');
  const [accountAssignments, setAccountAssignments] = useState<string[]>([]);
  const [patientTherapist, setPatientTherapist] = useState(therapistParam ?? 'All therapists');
  const [accountSearch, setAccountSearch] = useState(accountSearchParam ?? '');
  const [accountFiltersOpen, setAccountFiltersOpen] = useState(false);
  const [accountPageState, setAccountPageState] = useState({ page: 0, filterKey: '' });
  const [accountSort, setAccountSort] = useState<AccountSort>({ key: 'Account', direction: 'ascending' });
  const [patientTeacher, setPatientTeacher] = useState(teacherParam ?? 'All teachers');
  const [requestTypeFilters, setRequestTypeFilters] = useState<string[]>([]);
  const [requestStatusFilters, setRequestStatusFilters] = useState<string[]>([]);
  const [requestStageFilters, setRequestStageFilters] = useState<string[]>([]);
  const [requestFollowupFilters, setRequestFollowupFilters] = useState<string[]>([]);
  const [requestView, setRequestView] = useState<'Pending' | 'Reviewed' | 'All Requests'>('Pending');
  const studentNameRequests = useStudentNameRequests();
  const [requestSearch, setRequestSearch] = useState('');
  const [requestAction, setRequestAction] = useState('');
  const [requestHistoryExpanded, setRequestHistoryExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationAnchorRef = useRef<React.ElementRef<typeof View>>(null);
  const [notificationPosition, setNotificationPosition] = useState({ top: 72, left: 12 });
  const [showProfile, setShowProfile] = useState(false);
  const profileCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [editingAdminProfile, setEditingAdminProfile] = useState(false);
  const [adminProfileDraft, setAdminProfileDraft] = useState(profile);
  const [adminProfileErrors, setAdminProfileErrors] = useState<{ firstName?: string; lastName?: string; contactNumber?: string }>({});
  const [profileClosePrompt, setProfileClosePrompt] = useState(false);
  const profileSaveInProgress = useRef(false);
  const [attentionPage, setAttentionPage] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState<'All' | 'Unread'>('All');
  const [logCategoriesSelected, setLogCategoriesSelected] = useState<string[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [hoveredArchiveId, setHoveredArchiveId] = useState<string | null>(null);
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
  const [releaseEffectiveDate, setReleaseEffectiveDate] = useState('');
  const [releaseAuthorizationReference, setReleaseAuthorizationReference] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [centerSettings, setCenterSettings] = useState(centerProfile);

  const profileName = `${profile.firstName} ${profile.lastName}`.trim();
  const profileHasChanges = adminProfileDraft.firstName !== profile.firstName || adminProfileDraft.lastName !== profile.lastName || adminProfileDraft.contactNumber !== profile.contactNumber;
  const requestProfileClose = useCallback(() => {
    if (editingAdminProfile && profileHasChanges) {
      setProfileClosePrompt(true);
      return;
    }
    setShowProfileDetails(false);
    setEditingAdminProfile(false);
    setProfileClosePrompt(false);
    setAdminProfileDraft(profile);
    setAdminProfileErrors({});
  }, [editingAdminProfile, profileHasChanges, profile]);
  const startAdminProfileEdit = () => {
    setAdminProfileDraft(profile);
    setAdminProfileErrors({});
    setEditingAdminProfile(true);
  };
  const cancelAdminProfileEdit = () => {
    setAdminProfileDraft(profile);
    setAdminProfileErrors({});
    setEditingAdminProfile(false);
    setProfileClosePrompt(false);
  };
  const saveAdminProfile = () => {
    if (profileSaveInProgress.current) return;
    const next = {
      firstName: adminProfileDraft.firstName.trim(),
      lastName: adminProfileDraft.lastName.trim(),
      contactNumber: adminProfileDraft.contactNumber.trim(),
    };
    const errors: typeof adminProfileErrors = {};
    if (!next.firstName) errors.firstName = 'Enter a first name.';
    if (!next.lastName) errors.lastName = 'Enter a last name.';
    if (next.contactNumber && !/^(09\d{9}|639\d{9})$/.test(next.contactNumber.replace(/[\s()-]/g, '').replace(/^\+/, ''))) {
      errors.contactNumber = 'Enter a Philippine number, such as 0917 123 4567 or +63 917 123 4567.';
    }
    setAdminProfileErrors(errors);
    if (Object.keys(errors).length) return;

    profileSaveInProgress.current = true;
    setAdminProfile(next);
    addLog('Administrator profile updated', 'Name and contact number · local demo session', 'Settings');
    setAdminProfileDraft(next);
    setEditingAdminProfile(false);
    setProfileClosePrompt(false);
    profileSaveInProgress.current = false;
    flash('Profile changes saved in this demo session.');
  };

  useEffect(() => {
    if (!showProfileDetails || Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestProfileClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showProfileDetails, requestProfileClose]);

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

  const closeConfirmation = () => {
    if (confirmationSubmittingRef.current) return;
    setConfirmation(null);
    setConfirmationReason('');
    setConfirmationEvidence('');
    confirmationReasonRef.current = '';
    confirmationEvidenceRef.current = '';
  };

  const submitConfirmation = async () => {
    if (!confirmation || confirmationSubmittingRef.current) return;
    if (confirmation.requiresReason && !confirmationReasonRef.current.trim()) return;
    if (confirmation.requiresEvidence && !confirmationEvidenceRef.current.trim()) return;
    confirmationSubmittingRef.current = true;
    setConfirmationSubmitting(true);
    try {
      await confirmation.run();
    } catch {
      flash('Could not complete this action. Your changes were not confirmed. Try again.');
    } finally {
      confirmationSubmittingRef.current = false;
      setConfirmationSubmitting(false);
    }
  };
  const addLog = (title: string, detail: string, category: ActivityEntry['category'], actor = 'Center admin', metadata?: Pick<ActivityEntry, 'subject' | 'result'>) => {
    setActivity((current) => [{ id: `evt-${Date.now()}`, title, detail, actor, date: new Date().toISOString(), category, read: false, ...metadata }, ...current]);
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
    const recordContext = record?.kind === 'patient' ? { role: 'Student', search: patients.find((patient) => patient.id === record.id)?.name ?? accountSearch } : record?.kind === 'professional' ? { role: professionals.find((person) => person.id === record.id)?.role ?? accountRoles.join(','), search: professionals.find((person) => person.id === record.id)?.name ?? accountSearch } : {};
    const context = view === 'Directory' ? { role: accountRoles.join(',') || 'All roles', search: accountSearch, access: accountAccess, setup: accountSetup.length ? accountSetup.join(',') : 'All setup', membership: accountMembership, enrollment: accountEnrollment, teacher: patientTeacher, therapist: patientTherapist, ...recordContext, ...overrides } : {};
    const recordParams = record ? { recordKind: record.kind, recordId: record.id } : {};
    router.push({ pathname, params: { ...context, ...recordParams } } as any);
  };
  const goToAccountsView = (view: AccountView, record: Selection = null, context: Partial<{ role: string; search: string; access: string; setup: string; membership: string; enrollment: string; teacher: string; therapist: string }> = {}) => {
    setMenuOpen(false);
    pushAccountsRoute(view, record, context);
    if (view === 'Directory') setViewedAlertIds((current) => new Set([...current, ...professionals.filter((person) => person.invitation === 'Pending' || person.invitation === 'Expired').map((person) => person.id), ...patients.filter((student) => studentSetup(student) === 'Pending').map((student) => student.id)]));
    if (view === 'Student Requests') setViewedAlertIds((current) => new Set([...current, ...requests.filter((request) => request.status === 'Pending' || request.status === 'More information requested').map((request) => request.id), ...releaseRequests.filter((request) => request.status === 'Pending' || request.status === 'More information requested').map((request) => request.id)]));
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
  const pendingRequests = requests.filter((request) => request.status === 'Pending' || request.status === 'More information requested');
  const pendingReleaseRequests = releaseRequests.filter((request) => request.status === 'Pending' || request.status === 'More information requested');
  const pendingInvitations = professionals.filter((person) => person.invitation === 'Pending' || person.invitation === 'Expired');
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
      return { key: request.id, title: followup.overdue ? 'Student request overdue' : 'Student request', detail: followup.overdue ? `Awaiting ${request.followupRecipient ?? request.origin ?? 'authorized user'} · ${request.reminderCount ?? 0} reminders recorded · last reminder ${request.lastReminderAt ? formatDate(request.lastReminderAt) : 'none'}.` : `${therapist?.name ?? request.origin ?? 'An authorized user'} submitted a request for ${patient?.name ?? 'a Student'}.`, date: `Submitted ${formatDate(request.submitted)}`, icon: 'document-text-outline' as const, tone: 'yellow' as const, action: 'Review', run: () => { setRequestView('Pending'); setRequestSearch(''); setRequestTypeFilters([]); setRequestStatusFilters([]); setRequestStageFilters([]); setRequestFollowupFilters([]); setReleaseReplacement(''); setReleaseNote(''); goToAccountsView('Student Requests', { kind: 'release', id: request.id }); } };
    }),
    ...pendingRequests.map((request) => {
      const patient = patients.find((item) => item.id === request.patientId);
      const therapist = professionals.find((item) => item.id === request.therapistId);
      return { key: request.id, title: 'Student access request', detail: `${therapist?.name ?? 'A Therapist'} submitted an access suspension request for ${patient?.name ?? 'a Student'}.`, date: `Submitted ${formatDate(request.submitted)}`, icon: 'chatbubble-ellipses-outline' as const, tone: 'yellow' as const, action: 'Review', run: () => { setRequestView('Pending'); setRequestSearch(''); setRequestTypeFilters([]); setRequestStatusFilters([]); setRequestStageFilters([]); setRequestFollowupFilters([]); goToAccountsView('Student Requests', { kind: 'request', id: request.id }); } };
    }),
    ...reassignmentPatients.map((patient) => ({ key: patient.id, title: 'Reassignment needed', detail: `${patient.name} is assigned to suspended Therapist ${activeTherapistFor(patient.therapistId)}.`, date: '', icon: 'git-branch-outline' as const, tone: 'orange' as const, action: 'Review', run: () => { setAccountRoles(['Student']); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setPatientTeacher('All teachers'); setPatientTherapist('All therapists'); setAccountSearch(patient.name); goToAccountsView('Directory', { kind: 'patient', id: patient.id }, { role: 'Student', search: patient.name, enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', teacher: 'All teachers', therapist: 'All therapists' }); } })),
    ...pendingPatientSetups.map((patient) => ({ key: patient.id, title: 'Student account setup pending', detail: `${patient.name} · Guardian invitation setup is pending.`, date: '', icon: 'mail-unread-outline' as const, tone: 'blue' as const, action: 'Review', run: () => { setAccountRoles(['Student']); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(patient.name); goToAccountsView('Directory', { kind: 'patient', id: patient.id }, { role: 'Student', search: patient.name, enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships' }); } })),
    ...pendingInvitations.map((person) => ({ key: person.id, title: person.invitation === 'Expired' ? 'Invitation expired' : 'Account setup pending', detail: `${person.name} · ${person.role} · ${person.email}`, date: '', icon: 'mail-unread-outline' as const, tone: person.invitation === 'Expired' ? 'yellow' as const : 'blue' as const, action: 'Review', run: () => goToAccountsView('Directory', { kind: 'professional', id: person.id }, { role: person.role, setup: person.invitation === 'Expired' ? 'Expired' : 'Pending', search: person.name, access: 'All access', membership: 'All memberships', enrollment: 'All enrollment' }) })),
  ];

  const visibleProfessionals = professionals.filter((person) => {
    const query = accountSearch.trim().toLowerCase();
    const assignedCount = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    const inactive = professionalAccess(person) === 'Suspended' || professionalMembership(person) === 'Deactivated';
    return (accountView === 'Archive Center' ? inactive : !inactive)
      && (!accountRoles.length || accountRoles.includes(person.role))
      && (accountView === 'Archive Center' || accountSetup.length === 0 || accountSetup.includes(professionalSetup(person)))
      && (accountView === 'Archive Center' || accountAssignments.length === 0 || accountAssignments.includes(assignedCount > 0 ? 'Assigned' : 'Unassigned'))
      && (!query || [person.name, person.id, person.email, person.role, professionalAccess(person), professionalMembership(person), professionalSetup(person), person.staffId ?? '', person.professionalIdentifier ?? ''].some((value) => value.toLowerCase().includes(query)));
  });
  const studentDirectoryOnly = accountRoles.length === 1 && accountRoles[0] === 'Student';
  const visibleAccountPatients = patients.filter((patient) => {
    const query = accountSearch.trim().toLowerCase();
    const setupStatus = studentSetup(patient);
    const inactive = studentAccess(patient) === 'Suspended' || studentMembership(patient) === 'Deactivated';
    return (accountView === 'Archive Center' ? inactive : !inactive && patient.enrollment !== 'Archived')
      && (!accountRoles.length || accountRoles.includes('Student'))
      && (accountView === 'Archive Center' || accountSetup.length === 0 || accountSetup.includes(setupStatus))
      && (!query || [patient.name, patient.id, patient.studentNumber, patient.guardianContact, studentAccess(patient), studentMembership(patient), 'student'].some((value) => value.toLowerCase().includes(query)));
  });
  const openArchiveEpisodes = careEpisodes.filter((episode): episode is Extract<CareEpisode, { status: 'Closed' }> => episode.status === 'Closed' && !episode.restoredAt);
  const closedCareEpisodes = openArchiveEpisodes.filter((episode) => {
    const patient = patients.find((item) => item.id === episode.patientId);
    const query = accountSearch.trim().toLowerCase();
    return !!patient && (!accountRoles.length || accountRoles.includes('Student'))
      && (!query || [patient.name, patient.id, patient.studentNumber, patient.guardianContact].some((value) => value.toLowerCase().includes(query)));
  });
  const toggleFilterValue = (values: string[], value: string, setValues: (next: string[]) => void) => setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const accountFilterTags = [
    ...accountRoles.map((value) => ({ label: `Role: ${value}`, clear: () => toggleFilterValue(accountRoles, value, setAccountRoles) })),
    ...(accountView === 'Archive Center' && accountAccess !== 'All access' ? [{ label: `Access: ${accountAccess}`, clear: () => setAccountAccess('All access') }] : []),
    ...accountSetup.map((value) => ({ label: `Setup: ${value}`, clear: () => toggleFilterValue(accountSetup, value, setAccountSetup) })),
    ...(!studentDirectoryOnly ? accountAssignments.map((value) => ({ label: `Assignments: ${value}`, clear: () => toggleFilterValue(accountAssignments, value, setAccountAssignments) })) : []),
  ];
  const resetAccountFilters = () => { setAccountSearch(''); setAccountRoles([]); setAccountAccess('All access'); setAccountSetup([]); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountAssignments([]); setPatientTeacher('All teachers'); setPatientTherapist('All therapists'); };
  const changeAccountRoles = (role: string) => { setAccountRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]); };
  const accountFilterKey = [accountView, accountSearch, accountRoles.join(','), archiveStatuses.join(','), accountAccess, accountSetup.join(','), accountAssignments.join(',')].join('|');
  const accountPage = accountPageState.filterKey === accountFilterKey ? accountPageState.page : 0;
  const setAccountPage = (page: number) => setAccountPageState({ page, filterKey: accountFilterKey });
  const archiveForRow = (row: AccountRow) => row.kind === 'archiveEpisode' ? row.episode.archive : requireArchive(row.kind === 'professional' ? row.person.archive : row.patient.archive);
  const archiveStatus = (row: AccountRow) => row.kind === 'archiveEpisode'
    ? 'Completed'
    : (row.kind === 'professional' ? professionalMembership(row.person) : studentMembership(row.patient)) === 'Deactivated' ? 'Deactivated' : 'Suspended';
  const archiveRecordCount = openArchiveEpisodes.length
    + professionals.filter((person) => professionalAccess(person) === 'Suspended' || professionalMembership(person) === 'Deactivated').length
    + patients.filter((patient) => studentAccess(patient) === 'Suspended' || studentMembership(patient) === 'Deactivated').length;
  const accountRows: AccountRow[] = [
    ...visibleProfessionals.map((person) => ({ kind: 'professional' as const, person })),
    ...visibleAccountPatients.map((patient) => ({ kind: 'student' as const, patient })),
    ...(accountView === 'Archive Center' ? closedCareEpisodes.flatMap((episode) => {
      const patient = patients.find((item) => item.id === episode.patientId);
      return patient ? [{ kind: 'archiveEpisode' as const, episode, patient }] : [];
    }) : []),
  ].filter((row) => accountView !== 'Archive Center' || !archiveStatuses.length || archiveStatuses.includes(archiveStatus(row))).sort((a, b) => {
    const value = (row: AccountRow) => {
      if (accountSort.key === 'Account') return row.kind === 'professional' ? row.person.name : row.patient.name;
      if (accountSort.key === 'ID') return row.kind === 'professional' ? (row.person.role === 'Therapist' ? row.person.staffId ?? '' : row.person.professionalIdentifier ?? '') : row.patient.studentNumber;
      if (accountSort.key === 'Date') return accountView === 'Archive Center' ? archiveForRow(row).archivedAt : new Date(`${(row.kind === 'professional' ? row.person.joined : row.patient.registered).slice(0, 10)}T12:00:00`).getTime();
      if (accountSort.key === 'Access' && accountView === 'Archive Center') return archiveStatus(row);
      if (accountSort.key === 'Access') return row.kind === 'archiveEpisode' ? 'Completed' : row.kind === 'professional' ? professionalMembership(row.person) === 'Deactivated' ? 'Deactivated' : professionalAccess(row.person) : studentMembership(row.patient) === 'Deactivated' ? 'Deactivated' : studentAccess(row.patient);
      if (accountSort.key === 'Setup') return row.kind === 'professional' ? professionalSetup(row.person) : row.kind === 'student' ? studentSetup(row.patient) : '';
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
  const activityLogCategory = (entry: ActivityEntry) => {
    if (entry.category === 'Account') return 'Accounts';
    if (entry.category === 'Request') return 'Requests';
    if (entry.category === 'Settings') return 'Settings';
    if (/assign/i.test(entry.title)) return 'Assignments';
    if (/enroll|withdraw|transfer/i.test(entry.title)) return 'Enrollment';
    return 'Students';
  };
  const activitySubject = (entry: ActivityEntry) => {
    if (entry.subject) return entry.subject;
    const eventText = `${entry.title} ${entry.detail}`.toLocaleLowerCase();
    const patient = patients.find((item) => [item.name, item.studentNumber].some((value) => value && eventText.includes(value.toLocaleLowerCase())));
    if (patient) return { name: patient.name, identifier: patient.studentNumber, type: 'Student' as const };
    const professional = professionals.find((item) => [item.name, item.staffId, item.professionalIdentifier].some((value) => value && eventText.includes(value.toLocaleLowerCase())));
    if (professional) return { name: professional.name, identifier: professional.role === 'Therapist' ? professional.staffId : professional.professionalIdentifier, type: professional.role };
    return null;
  };
  const activityActorDetails = (entry: ActivityEntry) => {
    const actor = entry.actor?.trim();
    if (!actor) return '';
    if (actor.toLocaleLowerCase() === 'center admin' || actor.toLocaleLowerCase() === profileName.toLocaleLowerCase()) return 'Center Admin';
    const professional = professionals.find((item) => item.name.toLocaleLowerCase() === actor.toLocaleLowerCase());
    if (professional) {
      const identifier = professional.role === 'Therapist' ? professional.staffId : professional.professionalIdentifier;
      return [professional.role, identifier].filter(Boolean).join(' · ');
    }
    if (patients.some((item) => item.guardian?.toLocaleLowerCase() === actor.toLocaleLowerCase())) return 'Guardian';
    return '';
  };
  const logCategoryOptions = ['Accounts', 'Assignments', 'Enrollment', 'Requests', 'Students', 'Settings'];
  const activityStatus = (entry: ActivityEntry) => {
    const title = entry.title.toLocaleLowerCase();
    const subject = activitySubject(entry);
    const patient = subject?.type === 'Student' ? patients.find((item) => item.studentNumber === subject.identifier || item.name === subject.name) : undefined;
    const professional = subject && subject.type !== 'Student' ? professionals.find((item) => item.name === subject.name || item.staffId === subject.identifier || item.professionalIdentifier === subject.identifier) : undefined;
    const requestId = `${entry.title} ${entry.detail}`.match(/(?:req|rel)-[\w-]+/i)?.[0];

    if (activityLogCategory(entry) === 'Requests') {
      const request = requests.find((item) => item.id === requestId) ?? requests.find((item) => patient && item.patientId === patient.id);
      const release = releaseRequests.find((item) => item.id === requestId) ?? releaseRequests.find((item) => patient && item.patientId === patient.id);
      return request ? primaryRequestStatus(request.status) : release ? primaryRequestStatus(release.status) : entry.result ?? '';
    }
    if (patient) {
      if (/assign/.test(title)) return studentAssignmentStatus(patient);
      if (/enroll|withdraw|transfer|archiv/.test(title)) return patient.enrollment;
      if (/setup|invitation|created/.test(title)) return studentSetup(patient);
      if (/deactivat/.test(title)) return studentMembership(patient);
      return studentAccess(patient);
    }
    if (professional) {
      if (/setup|invitation|created/.test(title)) return professionalSetup(professional);
      if (/deactivat|reinstat/.test(title)) return professionalMembership(professional);
      return professionalAccess(professional);
    }
    return entry.result ?? '';
  };
  const activityStatusTone = (status: string): 'green' | 'yellow' | 'red' | 'neutral' => {
    const normalized = status.toLocaleLowerCase();
    if (/pending|awaiting|more information/.test(normalized)) return 'yellow';
    if (/suspended|declined|deactivated|expired|archived/.test(normalized)) return 'red';
    if (/approved|active|completed|enrolled|restored|assigned/.test(normalized)) return 'green';
    return 'neutral';
  };
  const activityLogTimestamp = (entry: ActivityEntry) => new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(entry.date));
  const visibleLogs = orderedActivity.filter((entry) => (!logCategoriesSelected.length || logCategoriesSelected.includes(activityLogCategory(entry)))
    && (!logSearch.trim() || [entry.title, entry.detail, entry.actor, entry.category, activityLogCategory(entry), activityStatus(entry), activityLogTimestamp(entry), activitySubject(entry)?.name ?? '', activitySubject(entry)?.identifier ?? '', activitySubject(entry)?.type ?? ''].some((value) => value.toLocaleLowerCase().includes(logSearch.trim().toLocaleLowerCase()))));
  const makeProfessional = (draft: ProfessionalDraft) => {
    const profile = draft.role === 'Teacher' ? (({ lookupStaffId: _lookupStaffId, ...teacherRecord }) => teacherRecord)(draft) : draft;
    const recordIdentifier = draft.role === 'Therapist' ? draft.staffId : draft.professionalIdentifier;
    const person: Professional = { id: `pro-${draft.role.toLowerCase()}-${recordIdentifier}`, ...profile, access: 'Active', membership: 'Active', status: 'Active', invitation: 'Pending', joined: new Date().toISOString().slice(0, 10), invitationUpdated: new Date().toISOString().slice(0, 10) };
    setProfessionals((current) => [person, ...current]);
    addLog(`${draft.role} account created`, `${person.name} · ${draft.role === 'Therapist' ? `Staff ID ${person.staffId}` : `Professional ID ${person.professionalIdentifier}`} · setup pending`, 'Account');
    addNotification('Invitation awaiting setup', `${person.name} can complete account setup after receiving an invitation.`);
    setNewAccountOpen(false); setCreatePatientOpen(false); setAccountRoles([draft.role]); setAccountAccess('All access'); setAccountSetup([]); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountSearch('');
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
    setAccountSearch(''); setAccountRoles(['Student']); setAccountAccess('All access'); setAccountSetup([]); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment');
    setAccountPage(0);
    flash(`${patient.name} added. The setup invitation is simulated.`);
  };

  const resendInvitation = (person: Professional) => {
    if (person.invitation === 'Completed') { flash(`${person.name} has already completed account setup.`); return false; }
    setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, invitation: 'Pending', invitationUpdated: new Date().toISOString().slice(0, 10) } : item));
    addLog('Invitation simulated', `${person.name} · ${person.email}`, 'Account');
    flash(`Follow-up recorded for ${person.name}.`);
    return true;
  };

  const confirmProfessionalFollowup = (person: Professional) => {
    setConfirmation({
      title: 'Follow up on setup?',
      message: `Record a setup follow-up for ${person.name} by marking the invitation as pending. No email will be sent.`,
      actionLabel: 'Send follow-up',
      icon: 'mail-outline',
      run: () => {
        resendInvitation(person);
        setConfirmation(null);
      },
    });
  };

  const recordStudentSetupFollowup = (patient: Patient) => {
    if (studentSetup(patient) === 'Completed') { flash(`${patient.name} has already completed account setup.`); return; }
    addLog('Student setup follow-up recorded', `${patient.name} · ${patient.studentNumber}; no email was sent`, 'Account');
    flash(`Setup follow-up recorded for ${patient.name}. No email was sent.`);
  };

  const setProfessionalStatus = (person: Professional, next: ProfessionalStatus, suspensionReason = '') => {
    const assignedStudents = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled');
    const hasPatients = assignedStudents.length > 0;
    if (next === 'Suspended') {
      if (!suspensionReason.trim()) { flash('Enter a reason to suspend access.'); return; }
      const changedAt = new Date().toISOString();
      setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: 'Suspended', access: 'Suspended', membership: professionalMembership(item), archive: { archivedAt: changedAt, archivedBy: profileName, reason: suspensionReason.trim() }, lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) } : item));
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
      setAccountRoles(['Student']); setSelection(null); setAccountSearch(''); setPatientTeacher(person.id); goToAccountsView('Directory', null, { role: 'Student', search: '', enrollment: 'Enrolled', teacher: person.id, therapist: 'All therapists', access: 'All access', setup: 'All setup' });
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
          const changedAt = new Date().toISOString();
          setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: restoringMembership && accessStillSuspended ? 'Suspended' : 'Active', access: restoringMembership ? professionalAccess(item) : 'Active', membership: restoringMembership ? 'Active' : professionalMembership(item), lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) } : item));
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
        const changedAt = new Date().toISOString();
        setProfessionals((current) => current.map((item) => item.id === person.id ? { ...item, status: next, access: professionalAccess(item), membership: 'Deactivated', archive: { archivedAt: changedAt, archivedBy: profileName, reason: confirmationReasonRef.current.trim() }, lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) } : item));
        addLog('Professional account deactivated', `${person.name} · ${person.role} · ${confirmationReasonRef.current.trim()}`, 'Account');
        setConfirmation(null); setSelection(null);
        flash(`${person.name}’s account is deactivated.`);
      },
    });
  };

  const confirmProfessionalSuspension = (person: Professional) => {
    setConfirmationReason(''); confirmationReasonRef.current = '';
    const hasEnrolledStudents = patients.some((patient) => patient.therapistId === person.id && patient.enrollment === 'Enrolled');
    setConfirmation({
      title: `Suspend access for ${person.name}?`,
      message: `This prevents ${person.name} from signing in. Student assignments and center membership remain unchanged.${person.role === 'Therapist' && hasEnrolledStudents ? ' Assigned Students remain linked and may need reassignment.' : ''}`,
      actionLabel: 'Suspend access',
      danger: true,
      requiresReason: true,
      run: () => {
        setProfessionalStatus(person, 'Suspended', confirmationReasonRef.current.trim());
        setConfirmation(null); setConfirmationReason(''); confirmationReasonRef.current = '';
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
    const changedAt = new Date().toISOString();
    assigned.forEach((patient) => recordAssignmentEnd(patient, patient.therapistId, 'Therapist', `Therapist reassigned during ${person?.name ?? 'professional'} offboarding: ${offboardingReason.trim()}`, changedAt));
    setPatients((current) => current.map((patient) => offboardingChoices[patient.id] ? { ...patient, therapistId: offboardingChoices[patient.id] } : patient));
    setProfessionals((current) => current.map((item) => item.id === offboardingId ? { ...item, status: 'Deactivated', membership: 'Deactivated', archive: { archivedAt: changedAt, archivedBy: profileName, reason: offboardingReason.trim() }, lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) } : item));
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
      recordAssignmentEnd(patient, patient.therapistId, 'Therapist', `Reassigned to ${replacement.name}`);
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
      recordAssignmentEnd(patient, patient.teacherId, 'Teacher', `Teacher changed to ${teacher.name}`);
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
        ? `This prevents ${patient.name} and their Guardian from signing in. Enrollment, identity details, assignments, and therapy status remain unchanged.`
        : `This restores sign-in access for ${patient.name}. It does not start or restore therapy enrollment.`,
      actionLabel,
      danger: next === 'Suspended',
      requiresReason: next === 'Suspended',
      run: () => {
        const changedAt = new Date().toISOString();
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, access: next, archive: next === 'Suspended' ? { archivedAt: changedAt, archivedBy: profileName, reason: confirmationReasonRef.current.trim() } : item.archive, lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) } : item));
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
        const changedAt = new Date().toISOString();
        setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, membership: next, archive: deactivating ? { archivedAt: changedAt, archivedBy: profileName, reason: confirmationReasonRef.current.trim() } : item.archive, lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) } : item));
        addLog(deactivating ? 'Student account deactivated' : 'Student account reactivated', `${patient.name} · ${patient.studentNumber}${deactivating ? ` · ${confirmationReasonRef.current.trim()}` : ''}`, 'Account');
        addNotification(deactivating ? 'Student account deactivated' : 'Student account reactivated', `${patient.name} · ${deactivating ? 'Moved to Archive Center' : 'Membership restored'}`);
        setConfirmation(null); setConfirmationReason(''); setSelection(null);
        flash(`${patient.name}'s account ${deactivating ? 'deactivated' : 'reactivated'}.`);
      },
    });
  };

  const closeEnrollmentRecord = (patient: Patient, details: { category: Exclude<CareEpisodeClosureCategory, 'Clinical discharge'>; reason: string; effectiveDate: string; authorizationReference: string; evidence?: RequestAttachment }) => {
    const now = new Date().toISOString();
    const endedAssignments: AssignmentHistory[] = [
      ...(patient.therapistId ? [{ id: `assignment-${patient.id}-therapist-${details.effectiveDate}`, patientId: patient.id, professionalId: patient.therapistId, role: 'Therapist' as const, endedAt: details.effectiveDate, endReason: `${details.category}: ${details.reason}` }] : []),
      ...(patient.teacherId ? [{ id: `assignment-${patient.id}-teacher-${details.effectiveDate}`, patientId: patient.id, professionalId: patient.teacherId, role: 'Teacher' as const, endedAt: details.effectiveDate, endReason: `${details.category}: ${details.reason}` }] : []),
    ];
    if (endedAssignments.length) setAssignmentHistory((current) => [...endedAssignments, ...current]);
    const existingEpisode = careEpisodes.find((episode) => episode.patientId === patient.id && episode.status === 'Active');
    const closedEpisode: CareEpisode = {
      ...(existingEpisode ?? { id: `episode-${patient.id}-${careEpisodes.length + 1}`, patientId: patient.id }),
      status: 'Closed', archive: { archivedAt: now, archivedBy: profileName, reason: details.reason }, effectiveCloseDate: details.effectiveDate, closureCategory: details.category,
      closureReason: details.reason, closureEvidence: details.evidence, authorizedBy: 'Center Admin', authorizationReference: details.authorizationReference,
      therapistIdAtClose: patient.therapistId,
    };
    setCareEpisodes((current) => existingEpisode
      ? current.map((episode) => episode.id === existingEpisode.id ? closedEpisode : episode)
      : [closedEpisode, ...current]);
    setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, enrollment: 'Archived', therapistId: null, teacherId: undefined, lifecycleUpdatedAt: now, lifecycleEffectiveDate: details.effectiveDate } : item));
    addLog('Student enrollment closed', `${patient.name} · ${patient.studentNumber} · ${details.category} · Effective ${details.effectiveDate} · ${details.reason} · Authorization ${details.authorizationReference}`, 'Student');
    addNotification('Student enrollment closed', `${patient.name} · ${details.category}`);
  };

  const recordAssignmentEnd = (patient: Patient, professionalId: string | undefined | null, role: ProfessionalRole, endReason: string, endedAt = new Date().toISOString()) => {
    if (!professionalId) return;
    setAssignmentHistory((current) => [{ id: `assignment-${patient.id}-${professionalId}-${endedAt}`, patientId: patient.id, professionalId, role, endedAt, endReason }, ...current]);
  };

  const openClosureForm = (patient: Patient) => {
    setClosurePatient(patient);
    setClosureCategory('Authorized withdrawal');
    setClosureReason('');
    setClosureEvidence(null);
    setClosureEffectiveDate('');
    setClosureAuthorizationReference('');
  };
  const closureMinDate = (patientId: string) => {
    const startedAt = careEpisodes.find((episode) => episode.patientId === patientId && episode.status === 'Active')?.startedAt;
    if (!startedAt) return undefined;
    return parseCalendarDate(startedAt, 'iso') ?? parseCalendarDate(localIsoDate(new Date(startedAt)), 'iso') ?? undefined;
  };
  const validClosureDate = (value: string, patientId: string) => {
    const date = parseCalendarDate(value, 'iso');
    const minimum = closureMinDate(patientId);
    return Boolean(date && date <= todayCalendarDate() && (!minimum || date >= minimum));
  };

  const submitClosureForm = () => {
    if (!closurePatient || closurePatient.enrollment !== 'Enrolled') return;
    const validDate = validClosureDate(closureEffectiveDate, closurePatient.id);
    if (!closureReason.trim() || !validDate || !closureAuthorizationReference.trim() || !closureEvidence) { flash('Enter the closure reason, attach a supporting document, choose a valid effective date, and enter the authorization reference.'); return; }
    const details = { category: closureCategory as Exclude<CareEpisodeClosureCategory, 'Clinical discharge'>, reason: closureReason.trim(), effectiveDate: closureEffectiveDate, authorizationReference: closureAuthorizationReference.trim(), evidence: closureEvidence ?? undefined };
    const patient = closurePatient;
    setClosurePatient(null);
    setConfirmation({
      title: `Close enrollment — ${details.category.replace('Authorized ', '')}?`,
      message: `This ends ${patient.name}’s current therapy enrollment for an authorized administrative reason. Account access stays unchanged. Their professional assignments will end and remain in Assignment History. Effective ${details.effectiveDate}. Authorization: ${details.authorizationReference}.`,
      actionLabel: 'Close enrollment', danger: true,
      run: () => {
        closeEnrollmentRecord(patient, details);
        setConfirmation(null); setSelection({ kind: 'patient', id: patient.id });
        flash(`${patient.name}’s enrollment closed in this demo session.`);
      },
    });
  };

  const openReenrollment = (patient: Patient) => {
    if (patient.enrollment !== 'Archived') { flash('This student already has an active enrollment.'); return; }
    if (patients.some((item) => item.id !== patient.id && item.studentNumber === patient.studentNumber && item.enrollment === 'Enrolled')) { flash('An active enrollment already exists for this Student identity.'); return; }
    setReenrollmentPatient(patient); setReenrollmentTherapistId(''); setReenrollmentTeacherId('');
  };

  const completeReenrollment = () => {
    const patient = reenrollmentPatient;
    if (!patient || patient.enrollment !== 'Archived') return;
    const therapist = professionals.find((person) => person.id === reenrollmentTherapistId && person.role === 'Therapist' && eligibleProfessional(person));
    const teacher = professionals.find((person) => person.id === reenrollmentTeacherId && person.role === 'Teacher' && eligibleProfessional(person));
    if (!therapist || !teacher) { flash('Choose an eligible Therapist and Teacher to continue.'); return; }
    if (patients.some((item) => item.id !== patient.id && item.studentNumber === patient.studentNumber && item.enrollment === 'Enrolled')) { flash('An active enrollment already exists for this Student identity.'); return; }
    const now = new Date().toISOString();
    const hasPriorAssignments = assignmentHistory.some((entry) => entry.patientId === patient.id);
    const legacyAssignments: AssignmentHistory[] = !hasPriorAssignments ? [
      ...(patient.therapistId ? [{ id: `legacy-assignment-${patient.id}-therapist`, patientId: patient.id, professionalId: patient.therapistId, role: 'Therapist' as const, endReason: 'Previously linked to the closed episode; end details not recorded.' }] : []),
      ...(patient.teacherId ? [{ id: `legacy-assignment-${patient.id}-teacher`, patientId: patient.id, professionalId: patient.teacherId, role: 'Teacher' as const, endReason: 'Previously linked to the closed episode; end details not recorded.' }] : []),
    ] : [];
    setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, enrollment: 'Enrolled', therapistId: therapist.id, teacherId: teacher.id, lifecycleUpdatedAt: now, lifecycleEffectiveDate: localIsoDate(new Date(now)) } : item));
    setCareEpisodes((current) => [
      { id: `episode-${patient.id}-${careEpisodes.length + 1}`, patientId: patient.id, status: 'Active', startedAt: now },
      ...current.map((episode) => episode.patientId === patient.id && episode.status === 'Closed' && !episode.restoredAt ? { ...episode, restoredAt: now } : episode),
    ]);
    if (legacyAssignments.length) setAssignmentHistory((current) => [...legacyAssignments, ...current]);
    addLog('Student enrollment restored', `${patient.name} · ${patient.studentNumber} · new therapy enrollment · Therapist ${therapist.name} · Teacher ${teacher.name}`, 'Student', profileName, { subject: { name: patient.name, identifier: patient.studentNumber, type: 'Student' }, result: 'Restored' });
    addNotification('Student re-enrollment initiated', `${patient.name} · a new therapy enrollment was started.`);
    setReenrollmentPatient(null); setReenrollmentTherapistId(''); setReenrollmentTeacherId(''); setSelection(null);
    flash(`New therapy enrollment started for ${patient.name} in this demo session.`);
  };

  const confirmRequestDecline = (studentName: string, requestId: string, effect: string, note: string, run: () => void) => {
    setConfirmation({
      title: `Decline request for ${studentName}?`,
      message: `Request ${requestId} will be recorded as declined. ${effect} Administrative note: ${note.trim()}`,
      actionLabel: 'Decline Request',
      danger: true,
      icon: 'close-circle-outline',
      run,
    });
  };

  const resolveRequest = (request: SuspensionRequest, status: Exclude<RequestStatus, 'Pending'>) => {
    if (request.status !== 'Pending' && request.status !== 'More information requested') { flash('This request has already been resolved.'); return; }
    const patient = patients.find((item) => item.id === request.patientId);
    const therapist = professionals.find((item) => item.id === request.therapistId);
    if (!releaseNote.trim()) { flash('Add a short administrative reason before recording this decision.'); return; }
    if (status === 'Approved' && patient?.enrollment === 'Archived') { flash('Restore the Student enrollment before approving this request.'); return; }
    if (status === 'Approved' && patient && (studentSetup(patient) !== 'Completed' || studentAccess(patient) !== 'Active')) { flash('This Student does not currently have active sign-in access to suspend.'); return; }
    const now = new Date().toISOString();
    const decisionText = status === 'Approved' ? 'Suspension approved' : status === 'Declined' ? 'Request declined' : 'More information requested';
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status, ...(status !== 'More information requested' ? { resolvedBy: 'Center Admin', resolvedAt: now, resolutionReason: releaseNote.trim() } : {}), events: [...(item.events ?? []), { id: `event-${Date.now()}`, title: decisionText, detail: status === 'Approved' ? `Student and Guardian sign-in suspended. Enrollment and assignments are unchanged. Reason: ${releaseNote.trim()}` : releaseNote.trim(), actor: 'Center Admin', date: now }] } : item));
    if (status === 'Approved' && patient) setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, access: 'Suspended', archive: { archivedAt: now, archivedBy: profileName, reason: releaseNote.trim() }, lifecycleUpdatedAt: now, lifecycleEffectiveDate: localIsoDate(new Date(now)) } : item));
    if (status === 'More information requested') {
      addLog('Access suspension request needs more information', `${patient?.name ?? 'Student'} \u00B7 ${releaseNote.trim()}`, 'Request');
      addNotification('Access request needs more information', `${patient?.name ?? 'Student'} \u00B7 ${releaseNote.trim()}`);
      setRequestAction(''); setReleaseNote(''); setSelection(null); flash('More information requested. Access remains unchanged.'); return;
    }
    const decision = status === 'Approved' ? 'approved' : 'declined';
    addLog(`Suspension request ${decision}`, `${patient?.name ?? 'Student'} \u00B7 request ${request.id} \u00B7 by ${therapist?.name ?? 'Therapist'}`, 'Request');
    addNotification(`Request ${decision}`, `${patient?.name ?? 'Student'} \u00B7 request ${request.id}`);
    addNotification(status === 'Approved' ? 'Student access suspended' : 'Student access request declined', `${patient?.name ?? 'Student'} \u00B7 ${request.id}`);
    setSelection(null); flash(status === 'Approved' ? `Access suspended for ${patient?.name}.` : `Request declined. ${patient?.name} access is unchanged.`);
  };

  const resolveReleaseRequest = (request: ReleaseRequest, decision: 'More information requested' | 'Approved & reassigned' | 'Approved & archived' | 'Declined') => {
    const patient = patients.find((item) => item.id === request.patientId);
    if (!patient) { flash('This student record is no longer available.'); return; }
    if (request.status !== 'Pending' && request.status !== 'More information requested') { flash('This request has already been resolved.'); return; }
    const stage = releaseStage(request);
    if ((decision.startsWith('Approved') || decision === 'Declined') && stage !== 'Ready for Admin Review') { flash('Wait for the required Guardian or Teacher response before making a final decision.'); return; }
    if (decision === 'Approved & reassigned' && (!releaseReplacement || releaseReplacement === patient.therapistId)) { flash('Choose an active replacement Therapist first.'); return; }
    if ((decision === 'More information requested' || decision === 'Declined' || decision === 'Approved & archived') && !releaseNote.trim()) { flash('Add an administrative note before recording this decision.'); return; }
    if (decision === 'Approved & archived' && (!validClosureDate(releaseEffectiveDate, request.patientId) || !releaseAuthorizationReference.trim())) { flash('Enter a valid effective date and authorization reference before closing enrollment.'); return; }
    if (decision === 'Approved & archived' && (!request.attachment || request.teacherVerification !== 'Verified' || (request.origin !== 'Therapist' && request.guardianConfirmation !== 'Confirmed' && request.guardianConfirmation !== 'Not required'))) { flash('Archival requires verified school evidence, Teacher verification, and any required Guardian confirmation.'); return; }
    if (decision === 'Approved & archived' && (!['Transfer', 'Withdrawal', 'Enrollment release'].includes(request.requestType ?? 'Enrollment release') || request.reason === 'No longer receiving services')) { flash('A Therapist assignment change cannot archive Student enrollment.'); return; }
    if (decision.startsWith('Approved')) {
      const replacementName = professionals.find((person) => person.id === releaseReplacement)?.name;
      const archived = decision === 'Approved & archived';
      setConfirmation({ title: archived ? `Close enrollment - ${patient.name}?` : `Approve reassignment for ${patient.name}?`, message: archived ? `This records an authorized ${request.requestType === 'Transfer' ? 'external transfer' : 'withdrawal'}, ends current assignments, and keeps account access unchanged. Effective ${releaseEffectiveDate}. Authorization: ${releaseAuthorizationReference}. Evidence: ${request.attachment}. Administrative note: ${releaseNote.trim()}` : `Change the SpeakSteps Therapist assignment from ${activeTherapistFor(patient.therapistId)} to ${replacementName}. Enrollment and access stay unchanged.`, actionLabel: archived ? 'Close enrollment' : 'Approve & Reassign', danger: archived, run: () => { applyReleaseDecision(request, decision); setConfirmation(null); setRequestAction(''); } });
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
    if (decision === 'Approved & archived' && (!request.attachment || request.teacherVerification !== 'Verified' || (request.origin !== 'Therapist' && request.guardianConfirmation !== 'Confirmed' && request.guardianConfirmation !== 'Not required') || !['Transfer', 'Withdrawal', 'Enrollment release'].includes(request.requestType ?? 'Enrollment release') || request.reason === 'No longer receiving services')) { flash('This request does not have the required verified school evidence for archival.'); return; }
    const now = new Date().toISOString();
    const resolutionReason = decision === 'Approved & archived' ? `${request.reason} \u00B7 Effective ${releaseEffectiveDate} \u00B7 Authorization ${releaseAuthorizationReference.trim()} \u00B7 Evidence ${request.attachment} \u00B7 ${releaseNote.trim()}` : decision === 'Approved & reassigned' ? `Reassigned to ${professionals.find((person) => person.id === releaseReplacement)?.name ?? 'selected Therapist'}` : releaseNote.trim();
    const resolutionTitle = decision === 'Approved & archived' ? 'Enrollment closed' : decision === 'Approved & reassigned' ? 'Therapist assignment updated' : 'Request declined';
    setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: decision, ...(decision !== 'More information requested' ? { resolvedBy: 'Center Admin', resolvedAt: now, resolutionReason, ...(decision === 'Approved & archived' ? { effectiveCloseDate: releaseEffectiveDate, authorizationReference: releaseAuthorizationReference.trim() } : {}), events: [...(item.events ?? []), { id: `event-${Date.now()}`, title: resolutionTitle, detail: resolutionReason, actor: 'Center Admin', date: now }] } : {}) } : item));
    if (decision === 'Approved & reassigned') {
      const replacement = professionals.find((person) => person.id === releaseReplacement)!;
      recordAssignmentEnd(patient, patient.therapistId, 'Therapist', `Reassigned to ${replacement.name}`);
      setPatients((current) => current.map((item) => item.id === patient.id ? { ...item, therapistId: replacement.id } : item));
      addLog('Student release approved & reassigned', `${patient.name} \u00B7 ${replacement.name}`, 'Request');
      addNotification('Student assignment updated', `${patient.name} is now assigned to ${replacement.name}.`);
    } else if (decision === 'Approved & archived') {
      closeEnrollmentRecord(patient, {
        category: request.reason === 'Transferred to another school' ? 'External transfer' : request.reason === 'Officially withdrawn' ? 'Authorized withdrawal' : 'Other authorized administrative closure',
        reason: `${request.reason} \u00B7 ${releaseNote.trim()}`,
        effectiveDate: releaseEffectiveDate,
        authorizationReference: releaseAuthorizationReference.trim(),
      });
      addLog('Student release approved & archived', `${patient.name} \u00B7 ${request.reason} \u00B7 ${request.attachment}`, 'Request');
      addNotification('Student enrollment archived', `${patient.name} \u00B7 ${patient.studentNumber}`);
    } else if (decision === 'More information requested') {
      addLog('More information requested', `${patient.name} \u00B7 ${releaseNote.trim() || 'Clarification requested'}`, 'Request');
      addNotification('Release request needs more information', `${patient.name} \u00B7 ${releaseNote.trim() || 'Please add supporting context.'}`);
      setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, workflowStage: 'Awaiting Supporting Evidence', events: [...(item.events ?? []), { id: `event-${Date.now()}`, title: 'More information requested', detail: releaseNote.trim(), actor: 'Center admin', date: new Date().toISOString() }] } : item));
    } else {
      addLog('Student release request declined', `${patient.name} \u00B7 ${releaseNote.trim() || 'Existing assignment retained'}`, 'Request');
      addNotification('Student request declined', `${patient.name} \u00B7 ${releaseNote.trim()}`);
    }
    if (decision.startsWith('Approved')) addNotification('Student request resolved', `${patient.name} \u00B7 ${decision.toLowerCase()}.`);
    setReleaseReplacement(''); setReleaseNote(''); setReleaseEffectiveDate(''); setReleaseAuthorizationReference(''); setSelection(null);
    flash(decision === 'More information requested' ? 'More information requested. The current assignment remains unchanged.' : `Release request ${decision.toLowerCase()}.`);
  };

  const recordReleaseReminder = (request: ReleaseRequest) => {
    if (request.status !== 'Pending' && request.status !== 'More information requested') { flash('This request no longer needs a reminder.'); return; }
    if (request.origin === 'Therapist') { flash('This request is not waiting on a Guardian or Teacher response.'); return; }
    const count = request.reminderCount ?? 0;
    const days = Math.floor((prototypeNow - new Date(`${request.submitted}T12:00:00`).getTime()) / 86400000);
    const followup = releaseFollowup(request, prototypeNow);
    const threshold = followup.nextDay;
    if (threshold === undefined || days < threshold) { flash('The next follow-up reminder is not due yet.'); return; }
    const day = threshold;
    const patient = patients.find((item) => item.id === request.patientId);
    const date = new Date(prototypeNow).toISOString();
    const followupTitle = day === 14 ? 'Day 14 admin escalation recorded' : `Day ${day} reminder recorded`;
    setReleaseRequests((current) => current.map((item) => item.id === request.id ? { ...item, reminderCount: count + 1, lastReminderAt: date, events: [...(item.events ?? []), { id: `event-${item.id}-${count + 1}`, title: followupTitle, detail: `${day === 14 ? 'Administrative escalation' : 'Follow-up reminder'} for ${item.followupRecipient ?? item.origin ?? 'authorized user'} recorded. No message was sent.`, actor: 'System simulation', date }] } : item));
    addLog(day === 14 ? 'Student request Day 14 escalation recorded' : 'Student request follow-up recorded', `${patient?.name ?? 'Student'} \u00B7 Day ${day} \u00B7 no message sent`, 'Request');
    flash(`Day ${day} ${day === 14 ? 'escalation' : 'follow-up'} recorded. No message was sent.`);
  };

  const openDashboardMetric = (target: 'accounts' | 'students' | 'requests') => {
    if (target === 'accounts') { setAccountRoles([]); setAccountAccess('All access'); setAccountSetup(['Pending']); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); goToAccountsView('Directory', null, { role: 'All roles', access: 'All access', setup: 'Pending', membership: 'All memberships', enrollment: 'All enrollment' }); }
    else if (target === 'students') { setAccountRoles(['Student']); setAccountEnrollment('Enrolled'); setAccountAccess('All access'); setAccountSetup([]); setPatientTherapist('All therapists'); setPatientTeacher('All teachers'); setAccountSearch(''); goToAccountsView('Directory', null, { role: 'Student', enrollment: 'Enrolled', access: 'All access', setup: 'All setup', membership: 'All memberships', search: '', teacher: 'All teachers', therapist: 'All therapists' }); }
    else { setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setRequestView('Pending'); setRequestSearch(''); setRequestTypeFilters([]); setRequestStageFilters([]); setRequestFollowupFilters([]); setRequestStatusFilters([]); goToAccountsView('Student Requests'); }
  };

  const openNotification = (item: (typeof notifications)[number]) => {
    setNotifications((current) => current.map((note) => note.id === item.id ? { ...note, read: true } : note));
    setShowNotifications(false);
    const student = patients.find((person) => item.detail.includes(person.name));
    const professional = professionals.find((person) => item.detail.includes(person.name));
    const text = `${item.title} ${item.detail}`.toLowerCase();

    if (text.includes('invitation') || text.includes('setup')) {
      if (student) {
        setAccountRoles(['Student']); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(student.name); goToAccountsView('Directory', { kind: 'patient', id: student.id }, { role: 'Student', enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', search: student.name });
      } else {
        setAccountRoles(professional ? [professional.role] : []); setAccountAccess('All access'); setAccountSetup(['Pending']); setAccountMembership('All memberships'); setAccountEnrollment('All enrollment'); setAccountSearch(professional?.name ?? ''); goToAccountsView('Directory', professional ? { kind: 'professional', id: professional.id } : null, { role: professional?.role ?? 'All roles', access: 'All access', setup: 'Pending', membership: 'All memberships', enrollment: 'All enrollment', search: professional?.name ?? '' });
      }
      return;
    }
    if (text.includes('reassign')) {
      setAccountRoles(['Student']); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(student?.name ?? ''); goToAccountsView('Directory', student ? { kind: 'patient', id: student.id } : null, { role: 'Student', enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', search: student?.name ?? '' });
      return;
    }
    if (text.includes('request') || text.includes('suspend') || text.includes('release')) {
      const release = releaseRequests.find((request) => (request.status === 'Pending' || request.status === 'More information requested') && (!student || request.patientId === student.id));
      const access = requests.find((request) => (request.status === 'Pending' || request.status === 'More information requested') && (!student || request.patientId === student.id));
      setRequestView('Pending'); setRequestSearch(''); setRequestTypeFilters([]); setRequestStageFilters([]); setRequestFollowupFilters([]); setRequestStatusFilters([]); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); goToAccountsView('Student Requests', release ? { kind: 'release', id: release.id } : access ? { kind: 'request', id: access.id } : null);
      return;
    }
    if (student) {
      setAccountRoles(['Student']); setAccountEnrollment('All enrollment'); setAccountAccess('All access'); setAccountSearch(student.name); goToAccountsView('Directory', { kind: 'patient', id: student.id }, { role: 'Student', enrollment: 'All enrollment', access: 'All access', setup: 'All setup', membership: 'All memberships', search: student.name });
      return;
    }
    if (professional) {
      setAccountRoles([professional.role]); setAccountSearch(professional.name); goToAccountsView('Directory', { kind: 'professional', id: professional.id }, { role: professional.role, search: professional.name, access: 'All access', setup: 'All setup', membership: 'All memberships', enrollment: 'All enrollment' });
      return;
    }
    goTo('Activity Logs'); setLogSearch(item.title);
  };

  const selectedProfessional = selection?.kind === 'professional' ? professionals.find((person) => person.id === selection.id) : undefined;
  const selectedProfessionalStudents = selectedProfessional ? patients.filter((patient) => (selectedProfessional.role === 'Therapist' ? patient.therapistId === selectedProfessional.id : patient.teacherId === selectedProfessional.id)) : [];
  const selectedArchiveEpisode = selection?.kind === 'archiveEpisode' ? openArchiveEpisodes.find((episode) => episode.id === selection.id) : undefined;
  const selectedPatient = selection?.kind === 'patient' ? patients.find((patient) => patient.id === selection.id) : selectedArchiveEpisode ? patients.find((patient) => patient.id === selectedArchiveEpisode.patientId) : undefined;
  const selectedRequest = selection?.kind === 'request' ? requests.find((request) => request.id === selection.id) : undefined;
  const selectedRelease = selection?.kind === 'release' ? releaseRequests.find((request) => request.id === selection.id) : undefined;
  const selectedRequestPatient = selectedRequest ? patients.find((patient) => patient.id === selectedRequest.patientId) : undefined;
  const selectedRequestTherapist = selectedRequest ? professionals.find((person) => person.id === selectedRequest.therapistId) : undefined;
  const selectedReleasePatient = selectedRelease ? patients.find((patient) => patient.id === selectedRelease.patientId) : undefined;
  const selectedReleaseSubmitter = selectedRelease && selectedReleasePatient ? selectedRelease.origin === 'Guardian' ? selectedReleasePatient.guardian || 'Guardian' : professionals.find((person) => person.id === (selectedRelease.origin === 'Teacher' ? selectedReleasePatient.teacherId : selectedRelease.therapistId))?.name ?? selectedRelease.origin ?? 'Therapist' : '';
  const selectedAccessSubmitter = selectedRequestTherapist?.name ?? 'Therapist';
  const selectedReleaseResolutionEvent = selectedRelease?.events?.slice().reverse().find((event) => /archiv|assignment updated|declined/i.test(event.title));
  const selectedAccessResolutionEvent = selectedRequest?.events?.slice().reverse().find((event) => /suspension approved|request declined/i.test(event.title));
  const inlineAccountDetails = desktop && Boolean(selectedProfessional || selectedPatient || selectedRelease || selectedRequest);
  const selectedRecordKey = selection ? `${selection.kind}:${selection.id}` : '';
  useEffect(() => {
    if (selectedRecordKey) accountDetailScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedRecordKey]);
  useEffect(() => {
    const targetWidth = inlineAccountDetails ? Math.min(520, Math.max(360, width * 0.34)) : 0;
    Animated.parallel([
      Animated.timing(accountDetailPaneWidth, { toValue: targetWidth, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(accountDetailPaneOpacity, { toValue: inlineAccountDetails ? 1 : 0, duration: 170, useNativeDriver: false }),
    ]).start();
  }, [accountDetailPaneOpacity, accountDetailPaneWidth, inlineAccountDetails, width]);
  useEffect(() => {
    if (!inlineAccountDetails || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const pane = accountDetailPaneRef.current as HTMLElement | null;
      if (!(event.target instanceof Element) || pane?.contains(event.target)) return;
      if (event.target.closest('button, a, input, select, textarea, [role="button"], [role="tab"]')) return;
      setSelection(null);
    };
    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, [inlineAccountDetails]);
  useEffect(() => {
    const accountDetailsOpen = page === 'Accounts' && Boolean(selection);
    if (!accountDetailsOpen || confirmation || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setSelection(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [accountView, confirmation, page, selection]);
  const offboardingPerson = professionals.find((person) => person.id === offboardingId);
  const offboardingPatients = patients.filter((patient) => patient.therapistId === offboardingId && patient.enrollment === 'Enrolled');
  const eligibleReplacements = (patientId: string) => activeTherapists.filter((person) => person.id !== patients.find((item) => item.id === patientId)?.therapistId);


  const avatar = (name: string) => <View style={[styles.avatar, { backgroundColor: '#E8EEF2' }]}><Text style={[styles.avatarText, { color: C.muted }]}>{initials(name)}</Text></View>;
  const selectedArchiveRow: AccountRow | null = accountView !== 'Archive Center' ? null
    : selectedArchiveEpisode && selectedPatient ? { kind: 'archiveEpisode', episode: selectedArchiveEpisode, patient: selectedPatient }
    : selectedProfessional ? { kind: 'professional', person: selectedProfessional }
    : selectedPatient && selection?.kind === 'patient' ? { kind: 'student', patient: selectedPatient } : null;
  const selectedArchiveState = selectedArchiveRow ? archiveStatus(selectedArchiveRow) : null;
  const archivedHeaderStates = selectedArchiveState ? [
    { label: 'Archived', tone: 'neutral' as const },
    { label: selectedArchiveState, tone: selectedArchiveState === 'Completed' ? 'green' as const : 'red' as const },
  ] : null;
  const selectedAccountHeader = selectedProfessional ? <AccountDetailsHeader
    name={selectedProfessional.name}
    identifier={`${selectedProfessional.role === 'Therapist' ? 'Staff ID' : 'Professional ID'}: ${selectedProfessional.role === 'Therapist' ? selectedProfessional.staffId || 'Not recorded' : selectedProfessional.professionalIdentifier || 'Unavailable in school records'}`}
    email={selectedProfessional.email}
    avatar={avatar(selectedProfessional.name)}
    states={archivedHeaderStates ?? [
      { label: `Access ${professionalAccess(selectedProfessional).toLowerCase()}`, tone: professionalAccess(selectedProfessional) === 'Active' ? 'green' : 'red' },
      { label: selectedProfessional.invitation === 'Completed' ? 'Setup completed' : selectedProfessional.invitation === 'Expired' ? 'Invitation expired' : 'Setup pending', tone: selectedProfessional.invitation === 'Completed' ? 'green' : selectedProfessional.invitation === 'Expired' ? 'red' : 'yellow' },
      ...(professionalMembership(selectedProfessional) === 'Deactivated' ? [{ label: 'Membership deactivated', tone: 'red' as const }] : []),
    ]}
    onClose={() => setSelection(null)}
  /> : selectedPatient ? <AccountDetailsHeader
    name={selectedPatient.name}
    identifier={`Student Number: ${selectedPatient.studentNumber}`}
    email={selectedPatient.guardianContact.includes('@') ? selectedPatient.guardianContact : undefined}
    avatar={avatar(selectedPatient.name)}
    states={archivedHeaderStates ?? [
      { label: `Access ${studentAccess(selectedPatient).toLowerCase()}`, tone: studentAccess(selectedPatient) === 'Active' ? 'green' : 'red' },
      { label: studentSetup(selectedPatient) === 'Completed' ? 'Setup completed' : 'Setup pending', tone: studentSetup(selectedPatient) === 'Completed' ? 'green' : 'yellow' },
      ...(studentMembership(selectedPatient) === 'Deactivated' ? [{ label: 'Account in Archive Center', tone: 'red' as const }] : []),
    ]}
    onClose={() => setSelection(null)}
  /> : (selectedRelease && selectedReleasePatient) || (selectedRequest && selectedRequestPatient) ? (() => {
    const patient = selectedReleasePatient ?? selectedRequestPatient!;
    const rawStatus = selectedRelease?.status ?? selectedRequest!.status;
    const status = primaryRequestStatus(rawStatus);
    const finalized = isFinalRequestStatus(rawStatus);
    const stage = finalized ? 'Finalized' : selectedRelease ? releaseStage(selectedRelease) : rawStatus === 'More information requested' ? 'Awaiting Supporting Evidence' : 'Ready for Admin Review';
    return <AccountDetailsHeader name={patient.name} identifier={`Student Number: ${patient.studentNumber}`} email={patient.guardianContact.includes('@') ? patient.guardianContact : undefined} avatar={avatar(patient.name)} states={[{ label: status, tone: status === 'Approved' ? 'green' : status === 'Declined' ? 'neutral' : 'yellow' }, { label: stage, tone: stage === 'Ready for Admin Review' || stage === 'Finalized' ? 'blue' : 'yellow' }]} onClose={() => setSelection(null)} />;
  })() : null;
  const searchedStudentId = accountView === 'Directory'
    && Boolean(accountSearch.trim())
    && (!accountRoles.length || accountRoles.includes('Student'))
    && patients.some((patient) => patient.enrollment !== 'Archived' && studentAccess(patient) !== 'Suspended' && studentMembership(patient) === 'Active' && patient.studentNumber.trim().toLowerCase() === accountSearch.trim().toLowerCase());
  const showStudentDetailsColumns = (accountRoles.length === 1 && accountRoles[0] === 'Student') || searchedStudentId;
  const showAssignmentColumn = !showStudentDetailsColumns;
  const professionalRow = (person: Professional) => {
    const assigned = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    const identifier = person.role === 'Therapist' ? person.staffId ?? 'Not recorded' : person.professionalIdentifier ?? 'Unavailable';
    return <Pressable key={person.id} onPress={() => setSelection({ kind: 'professional', id: person.id })} style={(state) => [styles.tableRow, styles.clickableRow, inlineAccountDetails && detailPanelStyles.tableWithPanel, ('hovered' in state && state.hovered) && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View ${person.name}, ${person.role}`}>
      <View style={[styles.personCell, styles.directoryPersonCell, inlineAccountDetails && detailPanelStyles.personColumnWithPanel]}>{inlineAccountDetails ? null : avatar(person.name)}<View style={styles.personText}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.email}</Text></View></View>
      <View style={[styles.tableCell, styles.roleTableCell, styles.centeredBadgeCell, styles.directoryRoleCell]}><RoleBadge role={person.role} /></View>
      <Text style={[styles.tableCell, styles.idTableCell, styles.directoryIdCell, inlineAccountDetails && detailPanelStyles.idColumnWithPanel]} numberOfLines={1}>{identifier}</Text>
      <View style={[styles.tableCell, styles.statusTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.statusColumnWithPanel]}><Status label={professionalMembership(person) === 'Deactivated' ? 'Deactivated' : professionalAccess(person)} tone={professionalAccess(person) === 'Active' && professionalMembership(person) !== 'Deactivated' ? 'green' : 'red'} />{professionalMembership(person) === 'Deactivated' ? <Text style={styles.secondaryText}>Membership deactivated</Text> : null}</View>
      <View style={[styles.tableCell, styles.setupTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.setupColumnWithPanel]}><SetupStatus label={professionalSetup(person)} /></View>
      <View style={[styles.tableCell, styles.assignmentTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.assignmentColumnWithPanel]}><AssignmentBadge label={assigned > 0 ? String(assigned) : 'Unassigned'} /></View>
      <View style={styles.rowAction}><Ionicons name="chevron-forward" size={19} color={C.blueDeep} /></View>
    </Pressable>;
  };
  const accountStudentRow = (patient: Patient) => <Pressable key={patient.id} onPress={() => setSelection({ kind: 'patient', id: patient.id })} style={(state) => [styles.tableRow, styles.clickableRow, inlineAccountDetails && detailPanelStyles.tableWithPanel, ('hovered' in state && state.hovered) && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View Student ${patient.name}, student number ${patient.studentNumber}`}>
    <View style={[styles.personCell, styles.directoryPersonCell, inlineAccountDetails && detailPanelStyles.personColumnWithPanel]}>{inlineAccountDetails ? null : avatar(patient.name)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.guardianContact}</Text></View></View>
    <View style={[styles.tableCell, styles.roleTableCell, styles.centeredBadgeCell, styles.directoryRoleCell]}><RoleBadge role="Student" /></View>
    <Text style={[styles.tableCell, styles.idTableCell, styles.directoryIdCell, inlineAccountDetails && detailPanelStyles.idColumnWithPanel]}>{patient.studentNumber}</Text>
    {showStudentDetailsColumns ? <><Text style={[styles.tableCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]} numberOfLines={1}>{professionals.find((person) => person.id === patient.teacherId)?.name ?? 'Unassigned'}</Text><Text style={[styles.tableCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]} numberOfLines={1}>{professionals.find((person) => person.id === patient.therapistId)?.name ?? 'Unassigned'}</Text><Text style={[styles.tableCell, styles.enrollmentTableCell, inlineAccountDetails && detailPanelStyles.enrollmentColumnWithPanel]}>{patient.enrollment}</Text></> : null}
    <View style={[styles.tableCell, styles.statusTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.statusColumnWithPanel]}><Status label={studentMembership(patient) === 'Deactivated' ? 'Deactivated' : studentAccess(patient)} tone={studentMembership(patient) === 'Deactivated' || studentAccess(patient) === 'Suspended' ? 'red' : 'green'} /></View>
    <View style={[styles.tableCell, styles.setupTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.setupColumnWithPanel]}><SetupStatus label={studentSetup(patient)} /></View>
    <>{showAssignmentColumn ? <View style={[styles.tableCell, styles.assignmentTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.assignmentColumnWithPanel]} /> : null}<View style={styles.rowAction}><Ionicons name="chevron-forward" size={19} color={C.blueDeep} /></View></>
  </Pressable>;
  const mobileAccountRow = (row: AccountRow) => row.kind === 'professional' ? (() => {
    const person = row.person;
    const identifier = person.role === 'Therapist' ? person.staffId ?? 'Staff ID unavailable' : person.professionalIdentifier ?? 'School ID unavailable';
    const assigned = patients.filter((patient) => (person.role === 'Therapist' ? patient.therapistId === person.id : patient.teacherId === person.id) && patient.enrollment === 'Enrolled').length;
    return <Pressable key={person.id} onPress={() => setSelection({ kind: 'professional', id: person.id })} style={(state) => [styles.mobileRow, styles.clickableRow, ('hovered' in state && state.hovered) && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View ${person.name}, ${person.role}`}>
      <View style={styles.personCell}>{avatar(person.name)}<View style={styles.personText}><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{person.role} · {person.email}</Text><Text style={styles.secondaryText}>{identifier}</Text></View></View>
      <View style={styles.mobileRowBottom}><Status label={professionalMembership(person) === 'Deactivated' ? 'Deactivated' : professionalAccess(person)} tone={professionalAccess(person) === 'Active' && professionalMembership(person) !== 'Deactivated' ? 'green' : 'red'} /><><SetupStatus label={professionalSetup(person)} compact /><AssignmentBadge label={assigned > 0 ? String(assigned) : 'Unassigned'} /></></View>
    </Pressable>;
  })() : <Pressable key={row.patient.id} onPress={() => setSelection({ kind: 'patient', id: row.patient.id })} style={(state) => [styles.mobileRow, styles.clickableRow, ('hovered' in state && state.hovered) && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`View Student ${row.patient.name}, ${row.patient.studentNumber}`}>
    <View style={styles.personCell}>{avatar(row.patient.name)}<View style={styles.personText}><Text style={styles.personName}>{row.patient.name}</Text><Text style={styles.secondaryText}>Student · {row.patient.studentNumber}</Text><Text style={styles.secondaryText}>{row.patient.guardianContact}</Text></View></View>
    <View style={styles.mobileRowBottom}><Status label={studentMembership(row.patient) === 'Deactivated' ? 'Deactivated' : studentAccess(row.patient)} tone={studentMembership(row.patient) === 'Deactivated' || studentAccess(row.patient) === 'Suspended' ? 'red' : 'green'} /><SetupStatus label={studentSetup(row.patient)} compact /></View>
    {showStudentDetailsColumns ? <View style={styles.studentMobileDetails}><Text style={styles.secondaryText}>Teacher · {professionals.find((person) => person.id === row.patient.teacherId)?.name ?? 'Unassigned'}</Text><Text style={styles.secondaryText}>Therapist · {professionals.find((person) => person.id === row.patient.therapistId)?.name ?? 'Unassigned'}</Text><Text style={styles.secondaryText}>Enrollment · {row.patient.enrollment}</Text></View> : null}
  </Pressable>;

  const activityLine = (entry: ActivityEntry, compactMode = false) => <Pressable key={entry.id} onPress={() => { setLogSearch(entry.title); setLogCategoriesSelected([]); goTo('Activity Logs'); }} accessibilityRole="button" accessibilityLabel={`View activity log for ${entry.title}`} onLayout={({ nativeEvent }) => { recentActivityRows.current.set(entry.id, { top: nativeEvent.layout.y, height: nativeEvent.layout.height }); markVisibleActivityRead(); }} style={[styles.activityItem, styles.clickableRow, compactMode && styles.activityItemCompact]}>
    {!entry.read ? <View style={[styles.activityMark, { backgroundColor: C.blue }]} /> : null}
    <View style={styles.activityCopy}><Text style={styles.activityTitle}>{entry.title}</Text><Text style={styles.secondaryText}>{entry.detail} · {entry.actor}</Text></View>
    <Text style={styles.activityDate}>{formatTimestamp(entry.date)}</Text>
  </Pressable>;

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
        <ListPagination page={pageIndex} pageCount={pageCount} start={pageIndex * 10} end={Math.min((pageIndex + 1) * 10, attentionItems.length)} total={attentionItems.length} noun="items" onPageChange={setAttentionPage} accent={C.blue} muted={C.muted} border={C.line} />
      </View>

      <View style={styles.assignmentOverview}>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Therapist caseloads</Text><Text style={styles.sectionSub}>Current enrolled assignments; no caseload limit</Text></View><TouchableOpacity onPress={() => goToAccountsView('Directory', null, { role: 'Therapist', access: 'Active', setup: 'All setup', membership: 'Active', enrollment: 'All enrollment' })} accessibilityRole="link"><Text style={styles.linkText}>View accounts</Text></TouchableOpacity></View>
        <View style={styles.caseloadList}>{therapistCounts.map((person) => { const fill = '#287A4B'; return <TouchableOpacity key={person.id} accessibilityRole="link" accessibilityLabel={'View ' + person.name + ' in Accounts. ' + person.assigned + ' enrolled Students'} onPress={() => goToAccountsView('Directory', { kind: 'professional', id: person.id }, { role: 'Therapist', access: 'Active', setup: 'All setup', membership: 'Active', enrollment: 'All enrollment', search: person.name })} style={styles.caseloadRow}><View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{initials(person.name)}</Text></View><Text style={styles.assignmentOverviewName}>{person.name}</Text><View style={styles.caseloadTrack}><View style={[styles.caseloadFill, { width: (person.assigned / maxCaseload * 100) + '%', backgroundColor: fill }]} /></View><Text style={styles.assignmentOverviewCount}>{person.assigned} Students</Text><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>; })}{activeTherapists.length === 0 ? <Text style={styles.secondaryText}>No active Therapists. Student enrollment is unavailable until one is active.</Text> : null}</View>
      </View>

      <View style={styles.activityPanel} onLayout={onRecentActivityPanelLayout}><View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionSub}>Latest changes across your center</Text></View><TouchableOpacity onPress={() => goTo('Activity Logs')} accessibilityRole="link"><Text style={styles.linkText}>View logs</Text></TouchableOpacity></View>{orderedActivity.slice(0, 5).map((entry) => activityLine(entry, true))}{orderedActivity.length === 0 ? <Text style={styles.secondaryText}>Activity will appear here as changes are recorded.</Text> : null}</View>
    </ScrollView>;
  };
  const accountPagination = accountPageCount > 1 ? <View style={[styles.accountPagination, compact && styles.accountPaginationCompact]}>
    <Text style={styles.accountPaginationSummary}>Showing {accountPageIndex * 10 + 1}–{Math.min((accountPageIndex + 1) * 10, accountRows.length)} of {accountRows.length} {accountView === 'Archive Center' ? 'records' : 'accounts'}</Text>
    <View style={[styles.accountPaginationControls, compact && styles.accountPaginationControlsCompact]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="First page" disabled={accountPageIndex === 0} onPress={() => setAccountPage(0)} style={[styles.pageArrow, accountPageIndex === 0 && styles.pageArrowDisabled]}><Ionicons name="chevron-back" size={13} color={accountPageIndex === 0 ? C.subtle : C.muted} /><Ionicons name="chevron-back" size={13} color={accountPageIndex === 0 ? C.subtle : C.muted} style={styles.doubleChevronSecond} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous page" disabled={accountPageIndex === 0} onPress={() => setAccountPage(accountPageIndex - 1)} style={[styles.pageArrow, accountPageIndex === 0 && styles.pageArrowDisabled]}><Ionicons name="chevron-back" size={15} color={accountPageIndex === 0 ? C.subtle : C.muted} /></TouchableOpacity>
      {accountPageNumbers.map((pageNumber) => <TouchableOpacity key={pageNumber} accessibilityRole="button" accessibilityLabel={`Page ${pageNumber + 1}`} accessibilityState={{ selected: pageNumber === accountPageIndex }} onPress={() => setAccountPage(pageNumber)} style={[styles.pageNumber, pageNumber === accountPageIndex && styles.pageNumberActive]}><Text style={[styles.pageNumberText, pageNumber === accountPageIndex && styles.pageNumberTextActive]}>{pageNumber + 1}</Text></TouchableOpacity>)}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next page" disabled={accountPageIndex >= accountPageCount - 1} onPress={() => setAccountPage(accountPageIndex + 1)} style={[styles.pageArrow, accountPageIndex >= accountPageCount - 1 && styles.pageArrowDisabled]}><Ionicons name="chevron-forward" size={15} color={accountPageIndex >= accountPageCount - 1 ? C.subtle : C.muted} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Last page" disabled={accountPageIndex >= accountPageCount - 1} onPress={() => setAccountPage(accountPageCount - 1)} style={[styles.pageArrow, accountPageIndex >= accountPageCount - 1 && styles.pageArrowDisabled]}><Ionicons name="chevron-forward" size={13} color={accountPageIndex >= accountPageCount - 1 ? C.subtle : C.muted} /><Ionicons name="chevron-forward" size={13} color={accountPageIndex >= accountPageCount - 1 ? C.subtle : C.muted} style={styles.doubleChevronSecond} /></TouchableOpacity>
    </View>
    {!compact ? <View style={styles.accountPaginationSide} /> : null}
  </View> : null;
  const archiveDirectoryRow = (row: AccountRow) => {
    const record = row.kind === 'professional' ? row.person : row.patient;
    const role = row.kind === 'professional' ? row.person.role : 'Student';
    const identifier = row.kind === 'professional'
      ? (row.person.role === 'Therapist' ? row.person.staffId : row.person.professionalIdentifier) ?? record.id
      : row.patient.studentNumber;
    const status = archiveStatus(row);
    const archive = archiveForRow(row);
    const selection: Selection = row.kind === 'archiveEpisode'
      ? { kind: 'archiveEpisode', id: row.episode.id }
      : row.kind === 'professional' ? { kind: 'professional', id: row.person.id } : { kind: 'patient', id: row.patient.id };
    const canRestore = row.kind !== 'archiveEpisode' || row.patient.enrollment === 'Archived';
    const restoreRecord = () => {
      if (row.kind === 'archiveEpisode') { openReenrollment(row.patient); return; }
      setConfirmation({
        title: `Restore ${record.name}?`,
        message: row.kind === 'student' && row.patient.enrollment === 'Archived'
          ? 'This restores account access and membership. The student still needs a new therapy enrollment before appearing in Directory.'
          : 'This restores account access and membership and returns the account to Directory. Existing assignments and setup history are preserved.',
        actionLabel: 'Restore',
        run: () => {
          const changedAt = new Date().toISOString();
          const restored = { access: 'Active' as const, membership: 'Active' as const, archive: undefined, lifecycleUpdatedAt: changedAt, lifecycleEffectiveDate: localIsoDate(new Date(changedAt)) };
          if (row.kind === 'professional') {
            setProfessionals((current) => current.map((item) => item.id === record.id ? { ...item, ...restored, status: 'Active' } : item));
          } else {
            setPatients((current) => current.map((item) => item.id === record.id ? { ...item, ...restored } : item));
          }
          addLog('Archived account restored', `Original archive reason: ${archiveForRow(row).reason}`, 'Account', profileName, { subject: { name: record.name, identifier, type: role }, result: 'Restored' });
          setConfirmation(null);
          setSelection(null);
          flash(`${record.name}’s account was restored.`);
        },
      });
    };
    const rowKey = `${selection.kind}-${selection.id}`;
    return <View key={rowKey} style={[styles.tableRow, styles.archiveTableColumns, hoveredArchiveId === rowKey && styles.rowHover]}>
      <Pressable
        onPress={() => setSelection(selection)}
        onHoverIn={() => setHoveredArchiveId(rowKey)}
        onHoverOut={() => setHoveredArchiveId(null)}
        accessibilityRole="button"
        accessibilityLabel={`View ${record.name}, ${role}`}
        style={[StyleSheet.absoluteFill, styles.clickableRow, styles.archiveRowTarget]}
      />
      <View style={styles.personCell}><View style={styles.personText}><Text style={styles.personName}>{record.name}</Text><Text style={styles.secondaryText} numberOfLines={1}>{row.kind === 'professional' ? row.person.email : row.patient.guardianContact}</Text></View></View>
      <View style={[styles.tableCell, styles.roleTableCell, styles.leadingBadgeCell]}><RoleBadge role={role} /></View>
      <Text style={[styles.tableCell, styles.idTableCell]} numberOfLines={1}>{identifier}</Text>
      <View style={[styles.tableCell, styles.statusTableCell, styles.archiveStatusCell, styles.leadingBadgeCell]}><Status label={status} tone={status === 'Completed' ? 'green' : 'red'} /></View>
      <Text style={[styles.tableCell, styles.setupTableCell]}>{formatDate(archive.archivedAt)}</Text>
      <Text style={[styles.tableCell, styles.archiveReasonCell]} numberOfLines={2}>{archive.reason}</Text>
      <View pointerEvents="box-none" style={[styles.tableCell, styles.assignmentTableCell, styles.archiveRowActions]}><Button label="Restore" kind="text" accent disabled={!canRestore} onPress={(event) => { event.stopPropagation(); restoreRecord(); }} /><Pressable accessibilityRole="button" accessibilityLabel={`View ${record.name} details`} onPress={(event) => { event.stopPropagation(); setSelection(selection); }} style={styles.archiveDetailsArrow}><Ionicons name="chevron-forward" size={19} color={C.blueDeep} /></Pressable></View>
    </View>;
  };
  const archiveDirectoryPage = () => <>
    <View style={styles.accountSearchRow}><SearchBox value={accountSearch} onChange={setAccountSearch} placeholder="Search name, ID, or email" fullWidth /></View>
    <View style={styles.directoryMeta}><Text style={styles.resultCount}>{accountRows.length} {accountRows.length === 1 ? 'archived record' : 'archived records'}</Text><Text style={styles.secondaryText}>Therapy history, restricted accounts, and records needing correction</Text></View>
    <ScrollView style={styles.filterableTableLayer} horizontal showsHorizontalScrollIndicator contentContainerStyle={{ width: '100%' as any, minWidth: 980, flexGrow: 1 }}><View style={[styles.table, { width: '100%' as any, minWidth: 980 }]}><View style={[styles.tableHead, styles.archiveTableColumns]}><View style={[styles.tableHeadCell, styles.personHead, { minWidth: 0 }]}><ColumnFilter label="Account" indicatorIcon="arrow-down" active={selectedAccountSort.label !== ACCOUNT_SORT_OPTIONS[0].label} options={ACCOUNT_SORT_OPTIONS.map((option) => ({ label: option.label, selected: selectedAccountSort.label === option.label, onSelect: () => selectAccountSort(option.label) }))} /></View><View style={[styles.tableHeadCell, styles.roleTableCell, styles.leadingBadgeCell]}><ColumnFilter label="Role" compactMenu active={accountRoles.length > 0} multiSelect sortEnabled={false} options={[{ label: 'All', selected: accountRoles.length === 0, onSelect: () => setAccountRoles([]) }, ...['Student', 'Therapist', 'Teacher'].map((role) => ({ label: role, selected: accountRoles.includes(role), onSelect: () => changeAccountRoles(role) }))]} /></View><View style={[styles.tableHeadCell, styles.idTableCell]}><Text style={styles.columnFilterLabel}>ID</Text></View><View style={[styles.tableHeadCell, styles.statusTableCell, styles.archiveStatusCell, styles.leadingBadgeCell]}><ColumnFilter label="Status" compactMenu active={archiveStatuses.length > 0} multiSelect sortEnabled={false} options={[{ label: 'All', selected: archiveStatuses.length === 0, onSelect: () => setArchiveStatuses([]) }, ...['Suspended', 'Deactivated', 'Completed'].map((status) => ({ label: status, selected: archiveStatuses.includes(status), onSelect: () => toggleFilterValue(archiveStatuses, status, setArchiveStatuses) }))]} /></View><View style={[styles.tableHeadCell, styles.setupTableCell]}><Text style={styles.columnFilterLabel}>Date</Text></View><View style={[styles.tableHeadCell, styles.archiveReasonCell]}><Text style={styles.columnFilterLabel}>Archive reason</Text></View><View style={[styles.tableHeadCell, styles.assignmentTableCell]}><Text style={styles.columnFilterLabel}>Actions</Text></View></View>{accountPageRows.map(archiveDirectoryRow)}</View></ScrollView>{accountPagination}
    {accountRows.length === 0 ? <EmptyState title={archiveRecordCount ? 'No matching archive records' : 'No archived records'} detail={archiveRecordCount ? 'Try another name, ID, or email, or clear the filters.' : 'Closed enrollments and restricted accounts will appear here.'} action={accountSearch || accountRoles.length || archiveStatuses.length ? <Button label="Clear search and filters" onPress={() => { setAccountSearch(''); setAccountRoles([]); setArchiveStatuses([]); }} /> : null} /> : null}
  </>;
  const accounts = () => accountView === 'Student Requests' ? studentRequestsPage() : <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title={accountView} subtitle={accountView === 'Directory' ? 'Manage student and professional accounts across your center.' : 'Review therapy history and accounts with restricted access.'} action={accountView === 'Directory' ? <Button label="Add Account" kind="primary" icon="add" onPress={() => { setCreatePatientOpen(true); setNewAccountOpen(true); }} /> : undefined} />
    {accountView === 'Archive Center' ? archiveDirectoryPage() : <>
    <View style={styles.accountSearchArea}>
      <View style={styles.accountSearchRow}>
        <SearchBox value={accountSearch} onChange={setAccountSearch} placeholder="Search names, emails, and IDs" fullWidth />
        {!desktop ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Filters${accountFilterTags.length ? `, ${accountFilterTags.length} active` : ''}`} accessibilityState={{ expanded: accountFiltersOpen }} onPress={() => setAccountFiltersOpen(true)} style={styles.accountFiltersButton}><Ionicons name="filter-outline" size={17} color={C.blueDeep} /><Text style={styles.accountFiltersButtonText}>Filters</Text>{accountFilterTags.length ? <View style={styles.accountFiltersCount}><Text style={styles.accountFiltersCountText}>{accountFilterTags.length}</Text></View> : null}</TouchableOpacity> : null}
      </View>
      {accountFilterTags.length ? <View style={styles.accountFilterTagRow}>{accountFilterTags.map((tag) => <TouchableOpacity key={tag.label} accessibilityRole="button" accessibilityLabel={`Remove ${tag.label} filter`} onPress={tag.clear} style={styles.accountFilterTag}><Text style={styles.accountFilterTagText}>{tag.label}</Text><Ionicons name="close" size={12} color={C.blue} /></TouchableOpacity>)}<TouchableOpacity accessibilityRole="button" onPress={resetAccountFilters} style={styles.accountFilterReset}><Text style={styles.accountFilterResetText}>Reset</Text></TouchableOpacity></View> : null}
      {!desktop ? <Modal visible={accountFiltersOpen} transparent animationType="fade" onRequestClose={() => setAccountFiltersOpen(false)}><Pressable style={styles.overlay} onPress={() => setAccountFiltersOpen(false)}><Pressable style={[styles.dialog, styles.accountFiltersDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title="Filters" subtitle="Choose which accounts to show." onClose={() => setAccountFiltersOpen(false)} /><ScrollView style={styles.accountFiltersDialogBody} contentContainerStyle={styles.accountFiltersDialogContent} showsVerticalScrollIndicator={false}>
        <Filter label="Sort by" value={selectedAccountSort.label} options={ACCOUNT_SORT_OPTIONS.map((option) => option.label)} onChange={selectAccountSort} />
        <MultiFilter label="Role" values={accountRoles} options={['Student', 'Therapist', 'Teacher']} onToggle={(value) => changeAccountRoles(value)} includeAllOption />
        <MultiFilter label="Setup" values={accountSetup} options={['Pending', 'Completed', 'Expired']} onToggle={(value) => toggleFilterValue(accountSetup, value, setAccountSetup)} />
        {!showStudentDetailsColumns ? <MultiFilter label="Assignments" values={accountAssignments} options={['Assigned', 'Unassigned']} onToggle={(value) => toggleFilterValue(accountAssignments, value, setAccountAssignments)} /> : null}
      </ScrollView><View style={styles.dialogActions}><Button label="Reset filters" onPress={resetAccountFilters} /><Button label="Done" kind="primary" onPress={() => setAccountFiltersOpen(false)} /></View></Pressable></Pressable></Modal> : null}
    </View>
    {accountPageCount <= 1 ? <View style={styles.directoryMeta}><Text style={styles.resultCount}>{accountRows.length} {accountRows.length === 1 ? 'account' : 'accounts'}</Text></View> : null}
    {desktop ? <View style={styles.table}><View style={[styles.tableHead, inlineAccountDetails && detailPanelStyles.tableWithPanel]}>
      <View style={[styles.tableHeadCell, styles.personHead, styles.directoryPersonCell, inlineAccountDetails && detailPanelStyles.personColumnWithPanel]}><ColumnFilter label="Account" active={selectedAccountSort.label !== ACCOUNT_SORT_OPTIONS[0].label} options={ACCOUNT_SORT_OPTIONS.map((option) => ({ label: option.label, selected: selectedAccountSort.label === option.label, onSelect: () => selectAccountSort(option.label) }))} /></View>
      <View style={[styles.tableHeadCell, styles.roleTableCell, styles.centeredBadgeCell, styles.directoryRoleCell]}><ColumnFilter label="Role" compactMenu active={accountRoles.length > 0} multiSelect sortEnabled={false} options={[{ label: 'All', selected: accountRoles.length === 0, onSelect: () => setAccountRoles([]) }, ...['Student', 'Therapist', 'Teacher'].map((role) => ({ label: role, selected: accountRoles.includes(role), onSelect: () => changeAccountRoles(role) }))]} /></View>
      <View style={[styles.tableHeadCell, styles.idTableCell, styles.directoryIdCell, inlineAccountDetails && detailPanelStyles.idColumnWithPanel]}><SortHeader label="ID" onPress={() => toggleAccountSort('ID')} active={accountSort.key === 'ID'} direction={accountSort.direction} /></View>
      {showStudentDetailsColumns ? <><View style={[styles.tableHeadCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]}><Text style={styles.columnFilterLabel}>Teacher</Text></View><View style={[styles.tableHeadCell, styles.studentDetailsCell, inlineAccountDetails && detailPanelStyles.studentDataColumnWithPanel]}><Text style={styles.columnFilterLabel}>Therapist</Text></View><View style={[styles.tableHeadCell, styles.enrollmentTableCell, inlineAccountDetails && detailPanelStyles.enrollmentColumnWithPanel]}><Text style={styles.columnFilterLabel}>Enrollment</Text></View></> : null}
      <View style={[styles.tableHeadCell, styles.statusTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.statusColumnWithPanel]}><Text style={styles.columnFilterLabel}>Access</Text></View>
      <View style={[styles.tableHeadCell, styles.setupTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.setupColumnWithPanel]}><ColumnFilter label="Setup" onSort={() => toggleAccountSort('Setup')} sortDirection={accountSort.key === 'Setup' ? accountSort.direction : null} active={accountSetup.length > 0} multiSelect options={['Pending', 'Completed', 'Expired'].map((value) => ({ label: value, selected: accountSetup.includes(value), onSelect: () => toggleFilterValue(accountSetup, value, setAccountSetup) }))} /></View>
      {showAssignmentColumn ? <View style={[styles.tableHeadCell, styles.assignmentTableCell, styles.centeredBadgeCell, inlineAccountDetails && detailPanelStyles.assignmentColumnWithPanel]}><ColumnFilter label="Assignments" onSort={() => toggleAccountSort('Assignments')} sortDirection={accountSort.key === 'Assignments' ? accountSort.direction : null} active={accountAssignments.length > 0} multiSelect options={['Assigned', 'Unassigned'].map((value) => ({ label: value, selected: accountAssignments.includes(value), onSelect: () => toggleFilterValue(accountAssignments, value, setAccountAssignments) }))} /></View> : null}
      <View style={styles.rowAction} />
    </View>{accountPageRows.map((row) => row.kind === 'professional' ? professionalRow(row.person) : accountStudentRow(row.patient))}{accountPagination}</View> : <><View style={styles.mobileRows}>{accountPageRows.map(mobileAccountRow)}</View>{accountPagination}</>}
    {visibleProfessionals.length + visibleAccountPatients.length === 0 ? <EmptyState title="No matching records." detail="Try clearing your search or filters." action={accountSearch || accountFilterTags.length ? <Button label="Clear search and filters" onPress={() => { resetAccountFilters(); setAccountSearch(''); }} /> : null} /> : null}
    </>}
  </ScrollView>;

  const requestTypeOptions = ['School transfer', 'Withdrawal', 'Enrollment release', 'Therapist assignment release', 'Account access suspension'];
  const requestColumnStyles = {
    student: { flex: 1.05, minWidth: 0 },
    type: { flex: 1.18, minWidth: 0 },
    submitter: { flex: 1.16, minWidth: 0 },
    stage: { flex: 1.35, minWidth: 0 },
    status: { flex: 0.9, minWidth: 0 },
  };
  const allRequestStageOptions = ['Awaiting Guardian Confirmation', 'Awaiting Teacher Verification', 'Ready for Admin Review', 'Awaiting Supporting Evidence', 'Finalized'];
  const requestStageOptions = requestView === 'Pending' ? allRequestStageOptions.slice(0, -1) : requestView === 'Reviewed' ? ['Finalized'] : allRequestStageOptions;
  const requestStatusOptions = requestView === 'Pending' ? ['Pending'] : requestView === 'Reviewed' ? ['Approved', 'Declined'] : ['Pending', 'Approved', 'Declined'];
  const requestFollowupOptions = ['Reminder due', 'Overdue'];
  const requestTableHorizontal = !desktop || (inlineAccountDetails && width < 1450);
  const filteredStudentRequests = [...releaseRequests.map((request) => ({ kind: 'release' as const, request })), ...requests.map((request) => ({ kind: 'access' as const, request }))].filter(({ kind, request }) => {
    const patient = patients.find((item) => item.id === request.patientId);
    const finalized = isFinalRequestStatus(request.status);
    const normalizedStatus = primaryRequestStatus(request.status);
    const belongsToView = requestView === 'All Requests' || (requestView === 'Reviewed' ? finalized : !finalized);
    const type = kind === 'access' ? 'Account access suspension' : releaseRequestTypeLabel(request as ReleaseRequest);
    const stage = finalized ? 'Finalized' : kind === 'access' ? request.status === 'More information requested' ? 'Awaiting Supporting Evidence' : 'Ready for Admin Review' : releaseStage(request as ReleaseRequest);
    const follow = kind === 'release' ? releaseFollowup(request as ReleaseRequest, prototypeNow) : null;
    const origin = kind === 'access' ? 'Therapist' : (request as ReleaseRequest).origin ?? 'Therapist';
    const submitter = kind === 'access' ? professionals.find((person) => person.id === (request as SuspensionRequest).therapistId)?.name ?? 'Therapist' : origin === 'Guardian' ? patient?.guardian || 'Guardian' : professionals.find((person) => person.id === (origin === 'Teacher' ? patient?.teacherId : (request as ReleaseRequest).therapistId))?.name ?? origin;
    const haystack = `${patient?.name ?? ''} ${patient?.studentNumber ?? ''} ${request.id} ${submitter}`.toLowerCase();
    const followupMatches = !requestFollowupFilters.length || requestFollowupFilters.some((filter) => filter === 'Overdue' ? !!follow?.overdue : !!follow?.due);
    return !!patient && belongsToView && (!requestStatusFilters.length || requestStatusFilters.includes(normalizedStatus)) && (!requestTypeFilters.length || requestTypeFilters.includes(type)) && (!requestStageFilters.length || requestStageFilters.includes(stage)) && followupMatches && (!requestSearch.trim() || haystack.includes(requestSearch.trim().toLowerCase()));
  }).sort((a, b) => {
    if (requestView === 'Reviewed') {
      const aResolved = requestResolutionTime(a.request);
      const bResolved = requestResolutionTime(b.request);
      if (aResolved !== null && bResolved !== null && aResolved !== bResolved) return bResolved - aResolved;
      if (aResolved !== null && bResolved === null) return -1;
      if (aResolved === null && bResolved !== null) return 1;
      return new Date(b.request.submitted).getTime() - new Date(a.request.submitted).getTime();
    }
    if (requestView === 'All Requests') return new Date(b.request.submitted).getTime() - new Date(a.request.submitted).getTime();
    const priority = ({ kind, request }: typeof a) => {
      if (kind === 'access') return 0;
      const item = request as ReleaseRequest;
      const stage = releaseStage(item);
      if (stage === 'Ready for Admin Review') return 0;
      if (releaseFollowup(item, prototypeNow).overdue) return 1;
      if (stage === 'Awaiting Guardian Confirmation' || stage === 'Awaiting Teacher Verification') return 2;
      return 3;
    };
    return priority(a) - priority(b) || new Date(a.request.submitted).getTime() - new Date(b.request.submitted).getTime();
  });

  const requestFilterTags = [
    ...requestTypeFilters.map((value) => ({ label: `Request type: ${value}`, clear: () => toggleFilterValue(requestTypeFilters, value, setRequestTypeFilters) })),
    ...requestStageFilters.map((value) => ({ label: `Workflow stage: ${value}`, clear: () => toggleFilterValue(requestStageFilters, value, setRequestStageFilters) })),
    ...requestStatusFilters.map((value) => ({ label: `Status: ${value}`, clear: () => toggleFilterValue(requestStatusFilters, value, setRequestStatusFilters) })),
    ...requestFollowupFilters.map((value) => ({ label: `Follow-up: ${value}`, clear: () => toggleFilterValue(requestFollowupFilters, value, setRequestFollowupFilters) })),
  ];
  const hasRequestFilters = requestTypeFilters.length > 0 || requestStageFilters.length > 0 || requestStatusFilters.length > 0 || requestFollowupFilters.length > 0;
  const resetStudentRequestFilters = () => { setRequestSearch(''); setRequestTypeFilters([]); setRequestStageFilters([]); setRequestFollowupFilters([]); setRequestStatusFilters([]); };
  const changeRequestView = (view: 'Pending' | 'Reviewed' | 'All Requests') => {
    if (view === requestView) return;
    setRequestView(view);
    setSelection(null);
    setRequestAction('');
    setReleaseNote('');
    setReleaseReplacement('');
    setReleaseEffectiveDate('');
    setReleaseAuthorizationReference('');
    setRequestHistoryExpanded(false);
    setRequestStatusFilters([]);
    setRequestStageFilters([]);
    if (view === 'Reviewed') setRequestFollowupFilters([]);
  };
  const requestPagination = useListPagination(filteredStudentRequests.length, 10, JSON.stringify([requestView, requestSearch, requestTypeFilters, requestStageFilters, requestStatusFilters, requestFollowupFilters]));
  const logPagination = useListPagination(visibleLogs.length, 10, JSON.stringify([logSearch, logCategoriesSelected]));
  const visibleNameRequests = studentNameRequests.filter((request) => {
    const matchesView = requestView === 'All Requests' || (requestView === 'Pending' ? request.status === 'Pending' : request.status !== 'Pending');
    const query = requestSearch.trim().toLowerCase();
    return matchesView && (!query || [request.currentName, request.proposedName, request.id, request.studentId].some((value) => value.toLowerCase().includes(query)));
  });

  const confirmNameRequest = (request: StudentNameRequest, decision: 'Approved' | 'Declined') => {
    const approve = decision === 'Approved';
    setConfirmation({
      title: approve ? 'Approve this name change?' : 'Decline this name change?',
      message: `${request.currentName} → ${request.proposedName}. ${approve ? 'The guardian can apply this approved name.' : 'The student will keep their current name.'}`,
      actionLabel: approve ? 'Approve name change' : 'Decline name change',
      danger: !approve,
      run: () => {
        const reviewed = reviewStudentNameChange(request.id, decision);
        setConfirmation(null);
        if (!reviewed) { flash('This request has already been reviewed.'); return; }
        addLog('Student name change ' + decision.toLowerCase(), 'Guardian request ' + request.id, 'Request', profileName, {
          subject: { name: request.currentName, identifier: request.studentId, type: 'Student' }, result: decision,
        });
        flash('Name change request ' + decision.toLowerCase() + '.');
      },
    });
  };

  const studentRequestsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Student Requests" subtitle="Review enrollment, assignment, access, and name-change requests." />
    <View style={styles.accountRoleTabs} accessibilityRole="tablist" accessibilityLabel="Filter requests by review status">{(['Pending', 'Reviewed', 'All Requests'] as const).map((view) => { const selected = requestView === view; return <Pressable key={view} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => changeRequestView(view)} style={({ hovered, pressed }) => [styles.accountRoleTab, hovered && styles.accountRoleTabHover, pressed && styles.accountRoleTabPressed]}><Text style={[styles.accountRoleTabText, selected && styles.accountRoleTabTextSelected]}>{view}</Text>{selected ? <View style={styles.accountRoleTabIndicator} /> : null}</Pressable>; })}</View>
    <View style={styles.accountSearchRow}><SearchBox value={requestSearch} onChange={setRequestSearch} placeholder="Search Student, Student Number, or Request ID" fullWidth /></View>
    {visibleNameRequests.length > 0 && (
      <View style={styles.activityPanel}>
        <View style={styles.sectionHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>Name change requests</Text></View>
        {visibleNameRequests.map((request) => (
          <View key={request.id} style={styles.nameRequestRow}>
            <View style={styles.nameRequestCopy}>
              <Text style={styles.personName}>{request.currentName} → {request.proposedName}</Text>
              <Text style={styles.secondaryText}>Guardian · {formatDate(request.submittedAt)} · {request.id}</Text>
            </View>
            <Status label={request.status} tone={request.status === 'Pending' ? 'yellow' : request.status === 'Declined' ? 'red' : 'green'} />
            {request.status === 'Pending' && (
              <View style={styles.nameRequestActions}>
                <Button label="Decline" onPress={() => confirmNameRequest(request, 'Declined')} />
                <Button label="Approve" kind="primary" onPress={() => confirmNameRequest(request, 'Approved')} />
              </View>
            )}
          </View>
        ))}
      </View>
    )}
    {requestFilterTags.length ? <View style={styles.accountFilterTagRow}>{requestFilterTags.map((tag) => <TouchableOpacity key={tag.label} accessibilityRole="button" accessibilityLabel={`Remove ${tag.label} filter`} onPress={tag.clear} style={styles.accountFilterTag}><Text style={styles.accountFilterTagText}>{tag.label}</Text><Ionicons name="close" size={12} color={C.blue} /></TouchableOpacity>)}<TouchableOpacity onPress={resetStudentRequestFilters} style={styles.accountFilterReset} accessibilityRole="button" accessibilityLabel="Reset request search and filters"><Text style={styles.accountFilterResetText}>Reset</Text></TouchableOpacity></View> : null}
    <View style={styles.directoryMeta}><Text style={styles.resultCount}>{filteredStudentRequests.length} {filteredStudentRequests.length === 1 ? 'request' : 'requests'}</Text></View>
    <ScrollView horizontal={requestTableHorizontal} showsHorizontalScrollIndicator={requestTableHorizontal} contentContainerStyle={{ width: '100%' as any, minWidth: requestTableHorizontal ? 1052 : '100%', flexGrow: 1 }}><View style={[styles.requestList, { width: '100%' as any }]}><View style={styles.requestTableHeader}><Text style={[styles.requestColumnHeader, requestColumnStyles.student]}>Student</Text><View style={requestColumnStyles.type}><ColumnFilter label="Request Type" active={requestTypeFilters.length > 0} multiSelect options={requestTypeOptions.map((value) => ({ label: value, selected: requestTypeFilters.includes(value), onSelect: () => toggleFilterValue(requestTypeFilters, value, setRequestTypeFilters) }))} /></View><Text style={[styles.requestColumnHeader, requestColumnStyles.submitter]}>Submitted By</Text><View style={requestColumnStyles.stage}><ColumnFilter label="Workflow Stage" active={requestStageFilters.length > 0} multiSelect options={requestStageOptions.map((value) => ({ label: value, selected: requestStageFilters.includes(value), onSelect: () => toggleFilterValue(requestStageFilters, value, setRequestStageFilters) }))} /></View><View style={requestColumnStyles.status}><ColumnFilter label="Status" active={requestStatusFilters.length > 0 || requestFollowupFilters.length > 0} multiSelect options={[
      { label: 'All statuses', selected: requestStatusFilters.length === 0, onSelect: () => setRequestStatusFilters([]) },
      ...requestStatusOptions.map((value) => ({ label: value, selected: requestStatusFilters.includes(value), onSelect: () => toggleFilterValue(requestStatusFilters, value, setRequestStatusFilters) })),
      ...(requestView !== 'Reviewed' ? requestFollowupOptions.map((value) => ({ label: `Follow-up: ${value}`, selected: requestFollowupFilters.includes(value), onSelect: () => toggleFilterValue(requestFollowupFilters, value, setRequestFollowupFilters) })) : []),
    ]} /></View><View style={styles.rowAction} /></View>{filteredStudentRequests.slice(requestPagination.start, requestPagination.end).map(({ kind, request }) => {
      const patient = patients.find((item) => item.id === request.patientId)!;
      const finalized = isFinalRequestStatus(request.status);
      const stage = finalized ? 'Finalized' : kind === 'access' ? request.status === 'More information requested' ? 'Awaiting Supporting Evidence' : 'Ready for Admin Review' : releaseStage(request as ReleaseRequest);
      const status = primaryRequestStatus(request.status);
      const origin = kind === 'access' ? 'Therapist' : (request as ReleaseRequest).origin ?? 'Therapist';
      const followup = kind === 'release' ? releaseFollowup(request as ReleaseRequest, prototypeNow) : null;
      const submitter = kind === 'access' ? professionals.find((person) => person.id === (request as SuspensionRequest).therapistId)?.name ?? 'Therapist' : origin === 'Guardian' ? patient.guardian || 'Guardian' : professionals.find((person) => person.id === (origin === 'Teacher' ? patient.teacherId : (request as ReleaseRequest).therapistId))?.name ?? origin;
      const typeLabel = kind === 'access' ? 'Account access suspension' : releaseRequestTypeLabel(request as ReleaseRequest);
      const statusTone = status === 'Pending' ? 'yellow' : status === 'Approved' ? 'green' : 'neutral';
      const onOpen = () => { setRequestAction(''); setReleaseReplacement(''); setReleaseNote(''); setReleaseEffectiveDate(''); setReleaseAuthorizationReference(''); setRequestHistoryExpanded(false); setSelection(kind === 'access' ? { kind: 'request', id: request.id } : { kind: 'release', id: request.id }); };
       return <Pressable key={`${kind}-${request.id}`} onPress={onOpen} style={(state) => [styles.requestTableRow, styles.clickableRow, ('hovered' in state && state.hovered) && styles.rowHover]} accessibilityRole="button" accessibilityLabel={`Review ${typeLabel} for ${patient.name}, request ${request.id}`}><View style={[styles.requestTableCell, requestColumnStyles.student]}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber}</Text><Text style={styles.requestId}>ID {request.id}</Text></View><View style={[styles.requestTableCell, requestColumnStyles.type]}><Text style={styles.requestCellPrimary}>{typeLabel}</Text></View><View style={[styles.requestTableCell, requestColumnStyles.submitter]}><Text style={styles.requestCellPrimary}>{submitter}</Text><Text style={styles.secondaryText}>{origin} {'\u00B7'} {formatDate(request.submitted)}</Text></View><View style={[styles.requestTableCell, requestColumnStyles.stage]}><Text style={styles.requestCellPrimary}>{stage}</Text></View><View style={[styles.requestTableCell, requestColumnStyles.status, styles.leadingBadgeCell]}><View style={styles.leadingBadgeCell}><Status label={status} tone={statusTone} /></View>{followup?.overdue ? <Text style={styles.requestStatusMeta}>Follow-up overdue</Text> : followup?.due ? <Text style={styles.requestStatusMeta}>Reminder due</Text> : null}</View><View style={styles.rowAction}><Ionicons name="chevron-forward" size={19} color={C.blueDeep} /></View></Pressable>;
    })}{filteredStudentRequests.length === 0 ? <EmptyState title={requestSearch.trim() ? 'No requests match your search.' : hasRequestFilters ? 'No requests match these filters.' : requestView === 'Pending' ? 'No pending requests.' : requestView === 'Reviewed' ? 'No reviewed requests yet.' : releaseRequests.length + requests.length === 0 ? 'No requests yet.' : 'No requests match these filters.'} detail={requestSearch.trim() ? 'Try another Student name, Student Number, or Request ID.' : hasRequestFilters ? 'Change or clear the selected filters to see more requests.' : requestView === 'Pending' ? 'Requests awaiting a decision or required action will appear here.' : requestView === 'Reviewed' ? 'Finalized requests will appear here after review is complete.' : releaseRequests.length + requests.length === 0 ? 'Student-related administrative requests will appear here.' : 'Change the search or filters to find requests.'} action={releaseRequests.length + requests.length === 0 && !requestSearch.trim() && !hasRequestFilters ? null : <Button label="Reset search and filters" onPress={resetStudentRequestFilters} />} /> : null}</View></ScrollView>
    <ListPagination {...requestPagination} total={filteredStudentRequests.length} noun="requests" accent={C.blue} muted={C.muted} border={C.line} />
  </ScrollView>;
  const logsPage = () => {
    const stacked = width < 760;
    const columns = [
      { label: 'Date & Time', width: 1.05 },
      { label: 'Activity', width: 1.5 },
      { label: 'Category', width: 0.72 },
      { label: 'Record', width: 1.35 },
      { label: 'Performed By', width: 1.15 },
      { label: 'Status', width: 1.3 },
    ];
    const LogContainer = stacked ? View : ScrollView;
    const categoryFilter = <ColumnFilter label="Category" indicatorIcon="chevron-down" sortEnabled={false} active={logCategoriesSelected.length > 0} options={logCategoryOptions.map((value) => ({ label: value, selected: logCategoriesSelected.includes(value), onSelect: () => toggleFilterValue(logCategoriesSelected, value, setLogCategoriesSelected) }))} />;
    const hasFilters = logSearch.trim().length > 0 || logCategoriesSelected.length > 0;
    return <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
      <Header title="Activity Logs" subtitle="A chronological record of account, student, and request decisions." />
      <View style={styles.accountSearchRow}><SearchBox value={logSearch} onChange={setLogSearch} placeholder="Search activity, record, or administrator" fullWidth /></View>
      {hasFilters || stacked ? <View style={styles.logFilterRow}>
        <View style={styles.logActiveFilters}>{logCategoriesSelected.map((value) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={`Remove ${value} category filter`} onPress={() => toggleFilterValue(logCategoriesSelected, value, setLogCategoriesSelected)} style={styles.accountFilterTag}><Text style={styles.accountFilterTagText}>Category: {value}</Text><Ionicons name="close" size={12} color={C.blue} /></TouchableOpacity>)}{hasFilters ? <TouchableOpacity accessibilityRole="button" onPress={() => { setLogSearch(''); setLogCategoriesSelected([]); }} style={styles.accountFilterReset}><Text style={styles.accountFilterResetText}>Reset</Text></TouchableOpacity> : null}</View>
        {stacked ? categoryFilter : null}
      </View> : null}
      {visibleLogs.length ? <LogContainer style={styles.filterableTableLayer} {...(stacked ? {} : { horizontal: true, contentContainerStyle: { flexGrow: 1 } })}>
        <View style={[styles.logList, stacked ? { width: '100%' } : { minWidth: 900, flexGrow: 1 }]}>
          {!stacked ? <View style={styles.logHeader}>
            {columns.map((column) => <View key={column.label} style={{ flex: column.width, minWidth: 0 }}>{column.label === 'Category' ? categoryFilter : <Text style={styles.logHeading}>{column.label}</Text>}</View>)}
          </View> : null}
          {visibleLogs.slice(logPagination.start, logPagination.end).map((entry) => {
            const subject = activitySubject(entry);
            const date = new Date(entry.date);
            const dateLabel = Number.isNaN(date.getTime()) ? entry.date : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
            const timeLabel = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
            const status = activityStatus(entry);
            return <Pressable key={entry.id} style={({ hovered }) => [styles.logRow, stacked && styles.logRowStacked, hovered && styles.logRowHover]}>
              <View style={stacked ? styles.logStackedCell : { flex: columns[0].width, minWidth: 0 }}>{stacked ? <Text style={styles.logHeading}>{columns[0].label}</Text> : null}<Text style={styles.logPrimary}>{dateLabel}</Text>{timeLabel ? <Text style={styles.logSecondary}>{timeLabel}</Text> : null}</View>
              <View style={stacked ? styles.logStackedCell : { flex: columns[1].width, minWidth: 0 }}>{stacked ? <Text style={styles.logHeading}>{columns[1].label}</Text> : null}<Text style={styles.logPrimary}>{entry.title}</Text></View>
              <View style={stacked ? styles.logStackedCell : { flex: columns[2].width, minWidth: 0 }}>{stacked ? <Text style={styles.logHeading}>{columns[2].label}</Text> : null}<Text style={styles.logSecondary}>{activityLogCategory(entry)}</Text></View>
              <View style={stacked ? styles.logStackedCell : { flex: columns[3].width, minWidth: 0 }}>{stacked ? <Text style={styles.logHeading}>{columns[3].label}</Text> : null}<Text style={styles.logPrimary}>{subject?.name || '\u2014'}</Text>{subject?.identifier ? <Text style={styles.logSecondary}>{subject.identifier}{subject.type ? ` \u00B7 ${subject.type}` : ''}</Text> : subject?.type ? <Text style={styles.logSecondary}>{subject.type}</Text> : null}</View>
              <View style={stacked ? styles.logStackedCell : { flex: columns[4].width, minWidth: 0 }}>{stacked ? <Text style={styles.logHeading}>{columns[4].label}</Text> : null}<Text style={styles.logPrimary}>{entry.actor || '\u2014'}</Text>{activityActorDetails(entry) ? <Text style={styles.logSecondary}>{activityActorDetails(entry)}</Text> : null}</View>
              <View style={stacked ? styles.logStackedCell : { flex: columns[5].width, minWidth: 0 }}>{stacked ? <Text style={styles.logHeading}>{columns[5].label}</Text> : null}{status ? <Text style={[styles.logPrimary, { color: activityStatusTone(status) === 'red' ? C.red : activityStatusTone(status) === 'yellow' ? C.yellow : activityStatusTone(status) === 'green' ? C.green : C.ink }]}>{status}</Text> : <Text style={styles.logPrimary}>{'\u2014'}</Text>}</View>
            </Pressable>;
          })}
        </View>
      </LogContainer> : <EmptyState title={activity.length === 0 ? 'No activity recorded yet' : 'No activity matches these filters'} detail={activity.length === 0 ? 'Recorded account, student, and request events will appear here.' : 'Try another search term or category, or clear the current filters.'} action={hasFilters ? <Button label="Clear search and filters" onPress={() => { setLogSearch(''); setLogCategoriesSelected([]); }} /> : null} />}
      <ListPagination {...logPagination} total={visibleLogs.length} noun="entries" accent={C.blue} muted={C.muted} border={C.line} />
    </ScrollView>;
  };

  const settingsPage = () => <ScrollView contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
    <Header title="Center Profile" subtitle="Center information used to identify this administrative workspace." action={<TouchableOpacity accessibilityRole="button" accessibilityLabel="Close Settings and return to Dashboard" onPress={() => goTo('Dashboard')} style={styles.closeButton}><Ionicons name="close" size={19} color={C.ink} /></TouchableOpacity>} />
    <View style={styles.settingsPanel}><Text style={styles.sectionTitle}>Center information</Text><Text style={styles.sectionSub}>These changes are local to this demo session.</Text>{([['name', 'Center name'], ['phone', 'Phone'], ['address', 'Address']] as const).map(([key, label]) => <View key={key} style={[styles.settingRow, compact && styles.settingRowCompact]}><Text style={styles.settingLabel}>{label}</Text><TextInput value={centerSettings[key]} onChangeText={(value) => { setCenterSettings((current) => ({ ...current, [key]: value })); setSettingsSaved(false); }} style={[styles.settingInput, compact && styles.settingInputCompact]} accessibilityLabel={label} /></View>)}<View style={[styles.settingRow, compact && styles.settingRowCompact]}><Text style={styles.settingLabel}>Administrator email</Text><Text style={[styles.settingValue, compact && styles.settingValueCompact]}>{centerSettings.email}</Text></View><Text style={styles.sectionSub}>This development placeholder is not connected to authentication.</Text><View style={styles.settingsAction}><Button label={settingsSaved ? 'Saved' : 'Save settings'} kind="primary" onPress={() => { setSettingsSaved(true); addLog('Center profile updated', `${centerSettings.name} · local demo settings`, 'Settings'); flash('Center profile settings saved in this demo.'); }} /></View></View>
    <View style={styles.settingsPanel}><Text style={styles.sectionTitle}>Administrator profile</Text><View style={styles.profileSummary}>{avatar(profileName)}<View><Text style={styles.personName}>{profileName}</Text><Text style={styles.secondaryText}>Center Administrator · {centerSettings.name}</Text></View></View><Button label="View profile" onPress={() => { setAdminProfileDraft(profile); setShowProfileDetails(true); }} /></View>
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

  const selectedDetailsContent = selectedArchiveRow ? (() => {
    const archive = archiveForRow(selectedArchiveRow);
    const episode = selectedArchiveRow.kind === 'archiveEpisode' ? selectedArchiveRow.episode : null;
    const patient = selectedArchiveRow.kind === 'professional' ? null : selectedArchiveRow.patient;
    const assignments = assignmentHistory.filter((entry) => selectedArchiveRow.kind === 'professional'
      ? entry.professionalId === selectedArchiveRow.person.id
      : entry.patientId === selectedArchiveRow.patient.id);
    return <>
      <View style={styles.archiveDetailSection}>
        <Text style={styles.requestSectionTitle}>Archive overview</Text>
        <View style={styles.detailGrid}>
          <Detail label="Record type" value={episode ? 'Therapy enrollment' : selectedArchiveRow.kind === 'professional' ? 'Professional account' : 'Student account'} />
          <Detail label="Role" value={selectedArchiveRow.kind === 'professional' ? selectedArchiveRow.person.role : 'Student'} />
          <Detail label="Archive status" value={archiveStatus(selectedArchiveRow)} />
          <Detail label="Date archived" value={formatDate(archive.archivedAt)} />
          <Detail label="Archived by" value={archive.archivedBy ?? 'Not recorded'} />
          {episode ? <Detail label="Closure category" value={archiveEpisodeType(episode)} /> : null}
          {episode?.effectiveCloseDate ? <Detail label="Effective date" value={formatDate(episode.effectiveCloseDate)} /> : null}
        </View>
      </View>
      <View style={styles.archiveDetailSection}>
        <Text style={styles.requestSectionTitle}>Reason for archiving</Text>
        <Text style={[styles.requestReason, styles.archiveDetailReason]}>{archive.reason}</Text>
      </View>
      {episode ? <View style={styles.archiveDetailSection}>
        <Text style={styles.requestSectionTitle}>Authorization</Text>
        <View style={styles.detailGrid}>
          <Detail label="Authorized by" value={episode.authorizedBy ?? 'Not recorded'} />
          <Detail label="Reference" value={episode.authorizationReference ?? 'Not recorded'} />
        </View>
      </View> : null}
      {episode?.closureEvidence ? <SupportingAttachments attachments={[episode.closureEvidence]} originalTitle="Enrollment closure" originalSubmitter={episode.authorizedBy ?? 'Center Admin'} originalSubmittedAt={episode.archive.archivedAt} /> : null}
      {patient ? <View style={styles.archiveDetailSection}>
        <Text style={styles.requestSectionTitle}>Student information</Text>
        <View style={styles.detailGrid}>
          <Detail label="Guardian" value={patient.guardian} />
          <Detail label="School" value={patient.school ?? 'Not recorded'} />
          {episode?.therapistIdAtClose ? <Detail label="Previous Therapist" value={professionals.find((person) => person.id === episode.therapistIdAtClose)?.name ?? 'Professional record unavailable'} /> : null}
        </View>
      </View> : null}
      {assignments.length ? <View style={styles.archiveDetailSection}>
        <Text style={styles.requestSectionTitle}>Assignment history</Text>
        {assignments.map((entry) => <View key={entry.id} style={styles.requestEvent}>
          <View style={styles.activityCopy}>
            <Text style={styles.activityTitle}>{selectedArchiveRow.kind === 'professional'
              ? patients.find((item) => item.id === entry.patientId)?.name ?? 'Student record unavailable'
              : professionals.find((person) => person.id === entry.professionalId)?.name ?? 'Professional record unavailable'} · {entry.role}</Text>
            <Text style={styles.secondaryText}>{entry.endReason ?? 'Reason not recorded'}{entry.endedAt ? ` · ${formatDate(entry.endedAt)}` : ''}</Text>
          </View>
        </View>)}
      </View> : null}
    </>;
  })() : <>

       {selectedProfessional ? <><ProfessionalDetails person={selectedProfessional} students={selectedProfessionalStudents} historicalAssignments={assignmentHistory.filter((entry) => entry.professionalId === selectedProfessional.id).map((assignment) => ({ assignment, student: patients.find((patient) => patient.id === assignment.patientId) }))} onOpenStudent={(student) => setSelection({ kind: 'patient', id: student.id })} onResendInvitation={() => confirmProfessionalFollowup(selectedProfessional)} onSuspend={() => confirmProfessionalSuspension(selectedProfessional)} onReactivate={() => setProfessionalStatus(selectedProfessional, 'Active')} onDeactivate={() => setProfessionalStatus(selectedProfessional, 'Deactivated')} /></> : null}
{selectedPatient ? <>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}>
    <Text style={detailPanelStyles.accountDetailSectionTitle}>Student relationships</Text>
    <View style={detailPanelStyles.studentAssignmentBlock}>
      <Text style={detailPanelStyles.studentFieldLabel}>Assigned Teacher</Text>
      <View style={detailPanelStyles.studentAssignmentValue}><Text numberOfLines={1} style={[detailPanelStyles.studentDetailValue, { flex: 1 }]}>{professionals.find((person) => person.id === selectedPatient.teacherId)?.name ?? 'Not assigned'}</Text>{selectedPatient.enrollment === 'Enrolled' && selectedPatient.teacherId && !activeTeachers.some((person) => person.id === selectedPatient.teacherId) ? <Status label="Needs reassignment" tone="yellow" /> : null}{selectedPatient.enrollment === 'Enrolled' ? <TooltipIconButton icon="pencil" label="Change Teacher assignment" hint="Changes the SpeakSteps assignment only. School records stay unchanged." onPress={() => setTeacherChoicesOpen(teacherChoicesOpen === selectedPatient.id ? null : selectedPatient.id)} buttonStyle={detailPanelStyles.assignmentIconButton} /> : null}</View>
      {teacherChoicesOpen === selectedPatient.id ? <View style={styles.choiceList}>{activeTeachers.filter((teacher) => teacher.id !== selectedPatient.teacherId).map((teacher) => <TouchableOpacity key={teacher.id} onPress={() => changeTeacher(selectedPatient, teacher.id)} style={styles.choiceRow}><View><Text style={styles.personName}>{teacher.name}</Text><Text style={styles.secondaryText}>{teacher.email}</Text></View><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>)}{activeTeachers.filter((teacher) => teacher.id !== selectedPatient.teacherId).length === 0 ? <Text style={styles.secondaryText}>No eligible replacement Teachers are available.</Text> : null}</View> : null}
    </View>
    <View style={detailPanelStyles.studentAssignmentBlock}>
      <Text style={detailPanelStyles.studentFieldLabel}>Assigned Therapist</Text>
      <View style={detailPanelStyles.studentAssignmentValue}><Text numberOfLines={1} style={[detailPanelStyles.studentDetailValue, { flex: 1 }]}>{activeTherapistFor(selectedPatient.therapistId)}</Text>{selectedPatient.enrollment === 'Enrolled' && selectedPatient.therapistId && !activeTherapists.some((person) => person.id === selectedPatient.therapistId) ? <Status label="Needs reassignment" tone="yellow" /> : null}{selectedPatient.enrollment === 'Enrolled' ? <TooltipIconButton icon="swap-horizontal" label="Reassign Therapist" hint="Choose an eligible Therapist. The current assignment stays until confirmed." onPress={() => setAssignmentChoicesOpen(assignmentChoicesOpen === selectedPatient.id ? null : selectedPatient.id)} buttonStyle={detailPanelStyles.assignmentIconButton} /> : null}</View>
      {assignmentChoicesOpen === selectedPatient.id ? <View style={styles.choiceList}>{eligibleReplacements(selectedPatient.id).map((person) => <TouchableOpacity key={person.id} accessibilityRole="radio" accessibilityLabel={`Assign ${person.name} as Therapist`} accessibilityState={{ selected: false }} onPress={() => reassignPatient(selectedPatient, person.id)} style={styles.choiceRow}><View><Text style={styles.personName}>{person.name}</Text><Text style={styles.secondaryText}>{patients.filter((item) => item.therapistId === person.id && item.enrollment === 'Enrolled').length} enrolled Students</Text></View><View accessibilityElementsHidden style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.blue, backgroundColor: C.white }} /></TouchableOpacity>)}{eligibleReplacements(selectedPatient.id).length > 0 ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancel Therapist reassignment" onPress={() => setAssignmentChoicesOpen(null)} style={{ minHeight: 38, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ color: C.blue, fontFamily: 'Geist-Medium', fontSize: 12 }}>Cancel</Text></TouchableOpacity> : null}{eligibleReplacements(selectedPatient.id).length === 0 ? <Text style={styles.secondaryText}>No eligible replacement Therapists are available.</Text> : null}</View> : null}
    </View>
  </View>
  <View style={[styles.detailSection, detailPanelStyles.studentDetailSection]}><Text style={detailPanelStyles.accountDetailSectionTitle}>Guardian information</Text><View style={detailPanelStyles.accountDetailGrid}><Detail label="Guardian" value={selectedPatient.guardian || 'Not recorded'} /><Detail label="Registered email or contact" value={selectedPatient.guardianContact || 'Not recorded'} /></View></View>
  <View style={[styles.detailSection, detailPanelStyles.studentDetailSection]}><Text style={detailPanelStyles.accountDetailSectionTitle}>School identity</Text><View style={detailPanelStyles.accountDetailGrid}><Detail label="Grade level" value={selectedPatient.grade ?? 'Not recorded'} /><Detail label="Section" value={selectedPatient.section ?? 'Not recorded'} /><Detail label="School" value={selectedPatient.school || 'Not recorded'} /></View><Text style={styles.sourceNote}>For corrections, use the authorized school-record process.</Text></View>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><View style={styles.sectionHeading}><View style={{ flex: 1, minWidth: 0 }}><Text style={detailPanelStyles.accountDetailSectionTitle}>Therapy enrollment</Text><Text style={styles.secondaryText}>{selectedPatient.enrollment === 'Enrolled' ? 'Account access, enrollment, and therapy status are managed separately.' : 'This therapy enrollment has ended. Re-enroll from Archive Center to begin a new enrollment.'}</Text></View><Text style={styles.detailValue}>{selectedPatient.enrollment === 'Enrolled' ? 'Enrolled' : 'Not enrolled'}</Text></View>{selectedPatient.enrollment === 'Enrolled' ? <AccountDetailsActionRow title="Close enrollment" detail="Requires a documented authorized withdrawal or transfer. Clinical discharge stays with the Therapist." label="Close enrollment" onPress={() => openClosureForm(selectedPatient)} tone="danger" /> : <Text style={styles.sourceNote}>This does not change account access. Historical therapy records and assignments remain available.</Text>}</View>
  <View style={[styles.detailSection, detailPanelStyles.studentDetailSection]}><Text style={detailPanelStyles.accountDetailSectionTitle}>Account record</Text><View style={detailPanelStyles.accountDetailGrid}><Detail label="Therapy status" value={selectedPatient.therapyStatus} /><Detail label="Created" value={formatDate(selectedPatient.registered)} /></View></View>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={detailPanelStyles.accountDetailSectionTitle}>Account actions</Text>{studentMembership(selectedPatient) === 'Deactivated' ? <Text style={styles.sourceNote}>This account is in Archive Center. Account access and enrollment remain separate.</Text> : <>{studentSetup(selectedPatient) === 'Pending' ? <AccountDetailsActionRow title="Follow up on setup" detail="No email is sent." label="Follow up" onPress={() => recordStudentSetupFollowup(selectedPatient)} tone="primary" /> : null}{studentSetup(selectedPatient) === 'Completed' && studentAccess(selectedPatient) === 'Active' ? <AccountDetailsActionRow title="Suspend access" detail="Student and Guardian sign-in will be suspended." label="Suspend access" onPress={() => changePatientAccess(selectedPatient, 'Suspended')} /> : null}{studentSetup(selectedPatient) === 'Completed' && studentAccess(selectedPatient) === 'Suspended' && selectedPatient.enrollment === 'Enrolled' ? <AccountDetailsActionRow title="Restore account access" detail="Restore Student and Guardian sign-in." label="Reactivate access" onPress={() => changePatientAccess(selectedPatient, 'Active')} tone="primary" /> : null}{studentAccess(selectedPatient) === 'Suspended' && selectedPatient.enrollment === 'Archived' ? <Text style={styles.sourceNote}>Restore enrollment before reactivating account access.</Text> : null}</>}</View>
</> : null}{selectedRelease && selectedReleasePatient ? <>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Request overview</Text><View style={styles.detailGrid}><Detail label="Request ID" value={selectedRelease.id} /><Detail label="Request type" value={releaseRequestTypeLabel(selectedRelease)} /><Detail label="Submitted by" value={selectedReleaseSubmitter + ' \u00B7 ' + (selectedRelease.origin ?? 'Therapist')} /><Detail label="Submitted" value={formatDate(selectedRelease.submitted)} /><Detail label="Reason" value={selectedRelease.reason} /></View></View>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Original explanation</Text><Text style={styles.requestReason}>{selectedRelease.explanation}</Text><Text style={styles.sourceNote}>Submitted by {selectedReleaseSubmitter} \u00B7 {selectedRelease.origin ?? 'Therapist'}</Text></View>
  <SupportingAttachments attachments={selectedRelease.attachments} events={selectedRelease.events} originalSubmitter={`${selectedReleaseSubmitter} · ${selectedRelease.origin ?? 'Therapist'}`} originalSubmittedAt={selectedRelease.submitted} />
  {selectedRelease.requestType === 'Therapist assignment release' || selectedRelease.reason === 'No longer receiving services' ? <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Assignment</Text><Detail label="Currently assigned Therapist" value={activeTherapistFor(selectedReleasePatient.therapistId)} /><Text style={styles.sourceNote}>This request changes the Therapist assignment only. Enrollment and account access stay unchanged.</Text></View> : <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Verification and evidence</Text><View style={styles.detailGrid}><Detail label="Guardian confirmation" value={selectedRelease.guardianConfirmation ?? 'Not recorded'} /><Detail label="Teacher verification" value={selectedRelease.teacherVerification ?? 'Not recorded'} /><Detail label="School evidence" value={selectedRelease.attachment ?? 'Not provided'} /></View>{!selectedRelease.attachment || selectedRelease.teacherVerification !== 'Verified' || (selectedRelease.origin !== 'Therapist' && selectedRelease.guardianConfirmation !== 'Confirmed' && selectedRelease.guardianConfirmation !== 'Not required') ? <View style={styles.requestWarning}><Text style={styles.requestWarningTitle}>Archive prerequisites incomplete</Text><Text style={styles.secondaryText}>Required school evidence, Teacher verification, or Guardian confirmation is still missing.</Text></View> : null}</View>}
  {(selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested') && selectedRelease.origin !== 'Therapist' ? <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Follow-up</Text><View style={styles.detailGrid}><Detail label="Responsible party" value={selectedRelease.followupRecipient ?? selectedRelease.origin ?? 'Guardian'} /><Detail label="Request sent" value={formatDate(selectedRelease.submitted)} /><Detail label="Reminders recorded" value={String(selectedRelease.reminderCount ?? 0) + (selectedRelease.lastReminderAt ? ' \u00B7 last ' + formatDate(selectedRelease.lastReminderAt) : '')} /></View>{releaseFollowup(selectedRelease, prototypeNow).overdue ? <Text style={styles.requestOverdue}>Overdue \u00B7 Day 14 escalation {releaseFollowup(selectedRelease, prototypeNow).day14Recorded ? 'recorded' : 'due'}</Text> : null}{releaseFollowup(selectedRelease, prototypeNow).due ? <Button label={releaseFollowup(selectedRelease, prototypeNow).nextDay === 14 ? 'Record Day 14 escalation' : 'Record Day ' + releaseFollowup(selectedRelease, prototypeNow).nextDay + ' reminder'} kind="secondary" onPress={() => recordReleaseReminder(selectedRelease)} /> : <Text style={styles.sourceNote}>{releaseFollowup(selectedRelease, prototypeNow).day14Recorded ? 'Day 14 escalation already recorded. No message was sent.' : 'No message was sent.'}</Text>}</View> : null}
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><View style={styles.sectionHeading}><Text style={styles.requestSectionTitle}>Request history</Text>{(selectedRelease.events ?? []).length > 2 ? <TouchableOpacity onPress={() => setRequestHistoryExpanded((value) => !value)}><Text style={styles.linkText}>{requestHistoryExpanded ? 'Show less' : 'Show older'}</Text></TouchableOpacity> : null}</View>{[...(selectedRelease.events ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, requestHistoryExpanded ? undefined : 2).map((event) => <View key={event.id} style={styles.requestEvent}><View style={styles.requestEventMark} /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{event.title}</Text><Text style={styles.secondaryText}>{event.detail}</Text><Text style={styles.attentionTime}>{event.actor} \u00B7 {formatTimestamp(event.date)}</Text></View></View>)}</View>
  {(selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested') ? <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Choose administrative action</Text>{releaseStage(selectedRelease) !== 'Ready for Admin Review' ? <View style={styles.requestWarning}><Text style={styles.requestWarningTitle}>{releaseStage(selectedRelease)}</Text><Text style={styles.secondaryText}>Waiting on {selectedRelease.followupRecipient ?? 'the required verifier'}. Final decisions are unavailable until verification is complete.</Text></View> : null}<View style={styles.requestActionOptions}>{[
    { id: 'info', label: 'Request More Information', detail: 'Ask the submitter for clarification', show: true },
    { id: 'reassign', label: 'Approve & Reassign', detail: 'Change the Therapist assignment only', show: selectedRelease.requestType === 'Therapist assignment release' && releaseStage(selectedRelease) === 'Ready for Admin Review' },
    { id: 'archive', label: 'Approve & Archive', detail: 'End school enrollment after verification', show: ['Transfer', 'Withdrawal', 'Enrollment release'].includes(selectedRelease.requestType ?? 'Enrollment release') && selectedRelease.reason !== 'No longer receiving services' && releaseStage(selectedRelease) === 'Ready for Admin Review' && !!selectedRelease.attachment && selectedRelease.teacherVerification === 'Verified' && (selectedRelease.origin === 'Therapist' || selectedRelease.guardianConfirmation === 'Confirmed' || selectedRelease.guardianConfirmation === 'Not required') },
    { id: 'decline', label: 'Decline Request', detail: 'Keep enrollment and assignment unchanged', show: releaseStage(selectedRelease) === 'Ready for Admin Review' },
  ].filter((option) => option.show).map((option) => <TouchableOpacity key={option.id} accessibilityRole="radio" accessibilityState={{ selected: requestAction === option.id }} onPress={() => { setRequestAction(requestAction === option.id ? '' : option.id); setReleaseNote(''); setReleaseEffectiveDate(''); setReleaseAuthorizationReference(''); }} style={[styles.requestActionOption, requestAction === option.id && styles.requestActionOptionSelected]}><View style={[styles.radioOuter, requestAction === option.id && styles.radioOuterSelected]}>{requestAction === option.id ? <View style={styles.radioInner} /> : null}</View><View style={{ flex: 1 }}><Text style={styles.requestCellPrimary}>{option.label}</Text><Text style={styles.secondaryText}>{option.detail}</Text></View></TouchableOpacity>)}</View>
  {requestAction === 'info' ? <View style={styles.actionPanel}><Detail label="Recipient" value={selectedRelease.followupRecipient ?? selectedRelease.origin ?? 'Therapist'} /><Text style={styles.fieldLabel}>Information needed</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Describe the needed clarification" placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /></View> : null}
  {requestAction === 'reassign' ? <View style={styles.actionPanel}><Detail label="Current Therapist" value={activeTherapistFor(selectedReleasePatient.therapistId)} /><SelectControl label="Replacement Therapist" value={releaseReplacement} options={['', ...activeTherapists.map((person) => person.id).filter((id) => id !== selectedReleasePatient.therapistId)]} getLabel={(id) => id ? (professionals.find((person) => person.id === id)?.name ?? id) + ' \u00B7 ' + patients.filter((item) => item.therapistId === id && item.enrollment === 'Enrolled').length + ' students' : 'Choose an eligible Therapist'} onChange={setReleaseReplacement} /><Text style={styles.sourceNote}>Caseload is informational; there is no maximum.</Text></View> : null}
  {requestAction === 'archive' ? <View style={styles.actionPanel}><Text style={styles.requestCellPrimary}>This ends the therapy enrollment for an authorized administrative reason and ends its current professional assignments. Account access stays unchanged.</Text><Text style={styles.secondaryText}>Verified evidence: {selectedRelease.attachment} \u00B7 Teacher: {selectedRelease.teacherVerification}</Text><View style={styles.field}><Text style={styles.fieldLabel}>Effective date</Text><EffectiveDateInput value={releaseEffectiveDate} onChange={setReleaseEffectiveDate} minDate={closureMinDate(selectedRelease.patientId)} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Authorization reference</Text><TextInput value={releaseAuthorizationReference} onChangeText={setReleaseAuthorizationReference} placeholder="Approved request or authorization ID" placeholderTextColor={C.subtle} style={styles.input} /></View><Text style={styles.fieldLabel}>Administrative resolution note</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Record the administrative reason" placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /></View> : null}
  {requestAction === 'decline' ? <View style={styles.actionPanel}><Text style={styles.fieldLabel}>Reason for declining</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Enter the administrative reason" placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /></View> : null}
  </View> : <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Administrative resolution</Text><Text style={styles.detailValue}>{primaryRequestStatus(selectedRelease.status)}</Text><Detail label="Resolved by" value={selectedRelease.resolvedBy ?? selectedReleaseResolutionEvent?.actor ?? 'Not recorded'} /><Detail label="Decision date" value={selectedRelease.resolvedAt ? formatTimestamp(selectedRelease.resolvedAt) : selectedReleaseResolutionEvent ? formatTimestamp(selectedReleaseResolutionEvent.date) : 'Not recorded'} /><Detail label="Reason" value={selectedRelease.resolutionReason ?? selectedReleaseResolutionEvent?.detail ?? 'Not recorded on the original request'} /></View>}
</> : null}
{selectedRequest && selectedRequestPatient ? <>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Request overview</Text><View style={styles.detailGrid}><Detail label="Request ID" value={selectedRequest.id} /><Detail label="Request type" value="Account access suspension" /><Detail label="Submitted by" value={selectedAccessSubmitter + ' \u00B7 Therapist'} /><Detail label="Submitted" value={formatDate(selectedRequest.submitted)} /><Detail label="Current access" value={studentAccess(selectedRequestPatient)} /><Detail label="Assigned Therapist" value={activeTherapistFor(selectedRequestPatient.therapistId)} /></View></View>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Original explanation</Text><Text style={styles.requestReason}>{selectedRequest.reason}</Text><Text style={styles.sourceNote}>Submitted by {selectedAccessSubmitter} \u00B7 Therapist</Text></View>
  <SupportingAttachments attachments={selectedRequest.attachments} events={selectedRequest.events} originalSubmitter={`${selectedAccessSubmitter} · Therapist`} originalSubmittedAt={selectedRequest.submitted} />
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Access conditions</Text><Text style={styles.secondaryText}>Approval suspends Student and Guardian sign-in only. Enrollment, assignments, and therapy status remain unchanged.</Text></View>
  <View style={[styles.detailSection, detailPanelStyles.detailSection]}><View style={styles.sectionHeading}><Text style={styles.requestSectionTitle}>Request history</Text>{(selectedRequest.events ?? []).length > 2 ? <TouchableOpacity onPress={() => setRequestHistoryExpanded((value) => !value)}><Text style={styles.linkText}>{requestHistoryExpanded ? 'Show less' : 'Show older'}</Text></TouchableOpacity> : null}</View>{[...(selectedRequest.events ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, requestHistoryExpanded ? undefined : 2).map((event) => <View key={event.id} style={styles.requestEvent}><View style={styles.requestEventMark} /><View style={styles.activityCopy}><Text style={styles.activityTitle}>{event.title}</Text><Text style={styles.secondaryText}>{event.detail}</Text><Text style={styles.attentionTime}>{event.actor} \u00B7 {formatTimestamp(event.date)}</Text></View></View>)}</View>
  {selectedRequest.status === 'Pending' || selectedRequest.status === 'More information requested' ? <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Choose administrative action</Text><View style={styles.requestActionOptions}>{[{ id: 'info', label: 'Request More Information', detail: 'Ask the Therapist for clarification' }, { id: 'suspend', label: 'Approve Suspension', detail: 'Suspend Student and Guardian sign-in only' }, { id: 'decline', label: 'Decline Request', detail: 'Leave current account access unchanged' }].map((option) => <TouchableOpacity key={option.id} accessibilityRole="radio" accessibilityState={{ selected: requestAction === option.id }} onPress={() => { setRequestAction(requestAction === option.id ? '' : option.id); setReleaseNote(''); }} style={[styles.requestActionOption, requestAction === option.id && styles.requestActionOptionSelected]}><View style={[styles.radioOuter, requestAction === option.id && styles.radioOuterSelected]}>{requestAction === option.id ? <View style={styles.radioInner} /> : null}</View><View style={{ flex: 1 }}><Text style={styles.requestCellPrimary}>{option.label}</Text><Text style={styles.secondaryText}>{option.detail}</Text></View></TouchableOpacity>)}</View>{requestAction ? <View style={styles.actionPanel}><Text style={styles.fieldLabel}>{requestAction === 'info' ? 'Information needed' : requestAction === 'decline' ? 'Reason for declining' : 'Reason for suspension'}</Text><TextInput value={releaseNote} onChangeText={setReleaseNote} placeholder="Enter an administrative note" placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /></View> : null}</View> : <View style={[styles.detailSection, detailPanelStyles.detailSection]}><Text style={styles.requestSectionTitle}>Administrative resolution</Text><Text style={styles.detailValue}>{primaryRequestStatus(selectedRequest.status)}</Text><Detail label="Resolved by" value={selectedRequest.resolvedBy ?? selectedAccessResolutionEvent?.actor ?? 'Not recorded'} /><Detail label="Decision date" value={selectedRequest.resolvedAt ? formatTimestamp(selectedRequest.resolvedAt) : selectedAccessResolutionEvent ? formatTimestamp(selectedAccessResolutionEvent.date) : 'Not recorded'} /><Detail label="Reason" value={selectedRequest.resolutionReason ?? selectedAccessResolutionEvent?.detail ?? 'Not recorded on the original request'} /></View>}
</> : null}

    </>;

  const selectedRequestFooter = selectedRelease && requestAction && (selectedRelease.status === 'Pending' || selectedRelease.status === 'More information requested') ? <View style={styles.requestDrawerFooter}><TouchableOpacity accessibilityRole="button" onPress={() => { setRequestAction(''); setReleaseNote(''); setReleaseReplacement(''); }} style={styles.requestCancel}><Text style={styles.requestCancelText}>Cancel</Text></TouchableOpacity><Button label={requestAction === 'info' ? 'Record Information Request' : requestAction === 'reassign' ? 'Confirm Reassignment' : requestAction === 'archive' ? 'Approve & Archive' : 'Decline Request'} kind={requestAction === 'archive' || requestAction === 'decline' ? 'danger' : 'primary'} disabled={requestAction === 'info' || requestAction === 'decline' || requestAction === 'archive' ? !releaseNote.trim() || requestAction === 'archive' && (!validClosureDate(releaseEffectiveDate, selectedRelease.patientId) || !releaseAuthorizationReference.trim() || releaseStage(selectedRelease) !== 'Ready for Admin Review' || !selectedRelease.attachment || selectedRelease.teacherVerification !== 'Verified' || (selectedRelease.origin !== 'Therapist' && selectedRelease.guardianConfirmation !== 'Confirmed' && selectedRelease.guardianConfirmation !== 'Not required')) : requestAction === 'reassign' ? !releaseReplacement || releaseStage(selectedRelease) !== 'Ready for Admin Review' : false} onPress={() => requestAction === 'decline' && selectedReleasePatient ? confirmRequestDecline(selectedReleasePatient.name, selectedRelease.id, 'The Student’s enrollment, assignments, and account access will remain unchanged.', releaseNote, () => { resolveReleaseRequest(selectedRelease, 'Declined'); setConfirmation(null); setRequestAction(''); }) : resolveReleaseRequest(selectedRelease, requestAction === 'info' ? 'More information requested' : requestAction === 'reassign' ? 'Approved & reassigned' : requestAction === 'archive' ? 'Approved & archived' : 'Declined')} /></View> : selectedRequest && requestAction && (selectedRequest.status === 'Pending' || selectedRequest.status === 'More information requested') ? <View style={styles.requestDrawerFooter}><TouchableOpacity accessibilityRole="button" onPress={() => { setRequestAction(''); setReleaseNote(''); }} style={styles.requestCancel}><Text style={styles.requestCancelText}>Cancel</Text></TouchableOpacity><Button label={requestAction === 'info' ? 'Record Information Request' : requestAction === 'suspend' ? 'Approve Suspension' : 'Decline Request'} kind={requestAction === 'suspend' || requestAction === 'decline' ? 'danger' : 'primary'} disabled={!releaseNote.trim()} onPress={() => requestAction === 'suspend' ? setConfirmation({ title: `Suspend access for ${selectedRequestPatient?.name ?? 'this Student'}?`, message: 'Student and Guardian sign-in will be suspended. Enrollment, assignments, and therapy status stay unchanged.', actionLabel: 'Suspend Access', danger: true, run: () => { resolveRequest(selectedRequest, 'Approved'); setConfirmation(null); } }) : requestAction === 'decline' && selectedRequestPatient ? confirmRequestDecline(selectedRequestPatient.name, selectedRequest.id, 'The Student and Guardian’s account access will remain unchanged.', releaseNote, () => { resolveRequest(selectedRequest, 'Declined'); setConfirmation(null); setRequestAction(''); }) : resolveRequest(selectedRequest, 'More information requested')} /></View> : null;

  if (!fontsLoaded) return null;

  return <View nativeID="admin-portal-root" style={[styles.appRoot, desktop ? styles.appRootDesktop : styles.appRootCompact]}>
    <Stack.Screen options={{ headerShown: false, title: `SpeakSteps · ${page}` }} />
    <StatusBar barStyle="dark-content" />
    {desktop ? sidebar() : null}
    <View style={styles.workspace}>
      <View style={styles.topbar}>{!desktop ? <IconButton icon="menu-outline" label="Open navigation" onPress={() => { if (page === 'Accounts') setAccountsExpanded(true); setMenuOpen(true); }} /> : <View style={styles.breadcrumb}><Text style={styles.breadcrumbRoot}>Center workspace</Text><Ionicons name="chevron-forward" size={13} color={C.subtle} />{page === 'Accounts' ? <><Text style={styles.breadcrumbCurrent}>Accounts</Text><Ionicons name="chevron-forward" size={13} color={C.subtle} /><Text style={styles.breadcrumbCurrent}>{accountView}</Text></> : <Text style={styles.breadcrumbCurrent}>{page}</Text>}</View>}<View style={styles.topbarRight}><View ref={notificationAnchorRef} collapsable={false}><IconButton icon="notifications-outline" label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onPress={() => setShowNotifications(true)} /></View><View style={styles.adminMenuAnchor}><View style={styles.adminChip}><View style={styles.adminInitial}><Text style={styles.adminInitialText}>CA</Text></View>{desktop ? <Text style={styles.adminChipText}>Center Admin</Text> : null}<Pressable onHoverIn={openProfileMenu} onHoverOut={scheduleProfileMenuClose} onPress={() => { if (!desktop) setShowProfile((visible) => !visible); }} style={styles.adminMenuArrow} accessibilityRole="button" accessibilityLabel="Account options" accessibilityState={{ expanded: showProfile }}><Ionicons name="chevron-down" size={14} color={C.muted} /></Pressable></View>{showProfile ? <Pressable style={styles.profileMenu} onHoverIn={openProfileMenu} onHoverOut={scheduleProfileMenuClose}><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); setShowProfileDetails(true); }} accessibilityRole="button"><Ionicons name="person-outline" size={17} color={C.muted} /><Text style={styles.profileMenuText}>Profile</Text></TouchableOpacity><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); selectNav('Settings'); }} accessibilityRole="button"><Ionicons name="settings-outline" size={17} color={C.muted} /><Text style={styles.profileMenuText}>Settings</Text></TouchableOpacity><TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfile(false); setConfirmation({ title: 'Sign out of Center Admin?', message: 'You will return to the sign-in screen. Demo changes reset when the app reloads.', actionLabel: 'Sign out', run: () => { setConfirmation(null); router.replace('/(admin)/admin-login' as any); } }); }} accessibilityRole="button"><Ionicons name="log-out-outline" size={17} color={C.red} /><Text style={[styles.profileMenuText, { color: C.red }]}>Log out</Text></TouchableOpacity></Pressable> : null}</View></View></View>
      <View style={[styles.content, inlineAccountDetails && styles.contentSplit]}>
        <View style={styles.contentMain}>{page === 'Dashboard' ? dashboard() : page === 'Accounts' ? accounts() : page === 'Activity Logs' ? logsPage() : settingsPage()}</View>
        <Animated.View ref={accountDetailPaneRef} pointerEvents={inlineAccountDetails ? 'auto' : 'none'} style={[styles.accountDetailPane, { width: accountDetailPaneWidth, opacity: accountDetailPaneOpacity }]}>
          {inlineAccountDetails ? <>
            <View style={detailPanelStyles.accountDetailHeader}>{selectedAccountHeader}</View>
            <ScrollView ref={accountDetailScrollRef} style={styles.accountDetailScroll} contentContainerStyle={styles.accountDetailContent} showsVerticalScrollIndicator={false}>{selectedDetailsContent}</ScrollView>
            {selectedRequestFooter}
          </> : null}
        </Animated.View>
      </View>
    </View>

    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}><Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}><Pressable style={styles.mobileDrawer} onPress={(event) => event.stopPropagation()}>{sidebar(true)}</Pressable></Pressable></Modal>
    <Modal visible={showProfileDetails} transparent animationType="fade" onRequestClose={requestProfileClose}>
      <Pressable style={styles.overlay} onPress={requestProfileClose}>
        <Pressable
          accessibilityRole="dialog"
          accessibilityLabel="My profile"
          accessibilityViewIsModal
          style={styles.profileDialog}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.profileModalHeader}>
            <View style={styles.profileModalHeading}>
              <Text style={styles.dialogTitle}>My profile</Text>
              <Text style={styles.sectionSub}>{editingAdminProfile ? 'Editing profile' : 'Manage your account information.'}</Text>
            </View>
            <TouchableOpacity onPress={requestProfileClose} style={styles.profileCloseButton} accessibilityRole="button" accessibilityLabel="Close profile">
              <Ionicons name="close" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.profileScroll} contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
            {editingAdminProfile ? <ProfileEditWarning /> : null}
            {profileClosePrompt ? <View style={styles.profileDiscardNotice} accessibilityLiveRegion="polite"><Text style={styles.profileDiscardText}>Discard your unsaved profile changes?</Text><View style={styles.profileDiscardActions}><Button label="Keep editing" onPress={() => setProfileClosePrompt(false)} /><Button label="Discard changes" kind="danger" onPress={() => { cancelAdminProfileEdit(); setShowProfileDetails(false); }} /></View></View> : null}
            <View style={styles.profileIdentity}>
              <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{initials(profileName || 'Center Admin')}</Text></View>
              <View style={styles.profileIdentityCopy}>
                <Text style={styles.profileIdentityName}>{profileName || 'Center Admin'}</Text>
                <Text selectable style={styles.profileEmail}>{centerSettings.email}</Text>
                <Status label="Active" tone="green" />
              </View>
            </View>
            <View style={styles.profileSection}>
              <View style={styles.profileSectionHeading}>
                <Text style={styles.profileSectionTitle}>Personal information</Text>
                {editingAdminProfile ? null : <TouchableOpacity onPress={startAdminProfileEdit} accessibilityRole="button" style={styles.profileEditButton}><Ionicons name="pencil-outline" size={14} color={C.blue} /><Text style={styles.profileEditText}>Edit</Text></TouchableOpacity>}
              </View>
              <View style={[styles.profileFields, compact && styles.profileFieldsCompact]}>
                {editingAdminProfile ? <>
                  <View style={[styles.profileField, compact && styles.profileFieldCompact]}>
                    <Text nativeID="admin-first-name-label" style={styles.profileFieldLabel}>First name</Text>
                    <TextInput value={adminProfileDraft.firstName} onChangeText={(value) => { setAdminProfileDraft((current) => ({ ...current, firstName: value })); if (adminProfileErrors.firstName) setAdminProfileErrors((current) => ({ ...current, firstName: undefined })); }} onBlur={() => setAdminProfileErrors((current) => ({ ...current, firstName: adminProfileDraft.firstName.trim() ? undefined : 'Enter a first name.' }))} accessibilityLabel="First name" accessibilityLabelledBy="admin-first-name-label" autoComplete="given-name" autoCapitalize="words" returnKeyType="next" style={[styles.profileInput, adminProfileErrors.firstName && styles.profileInputError]} />
                    {adminProfileErrors.firstName ? <Text accessibilityLiveRegion="polite" style={styles.profileFieldError}>{adminProfileErrors.firstName}</Text> : null}
                  </View>
                  <View style={[styles.profileField, compact && styles.profileFieldCompact]}>
                    <Text nativeID="admin-last-name-label" style={styles.profileFieldLabel}>Last name</Text>
                    <TextInput value={adminProfileDraft.lastName} onChangeText={(value) => { setAdminProfileDraft((current) => ({ ...current, lastName: value })); if (adminProfileErrors.lastName) setAdminProfileErrors((current) => ({ ...current, lastName: undefined })); }} onBlur={() => setAdminProfileErrors((current) => ({ ...current, lastName: adminProfileDraft.lastName.trim() ? undefined : 'Enter a last name.' }))} accessibilityLabel="Last name" accessibilityLabelledBy="admin-last-name-label" autoComplete="family-name" autoCapitalize="words" returnKeyType="next" style={[styles.profileInput, adminProfileErrors.lastName && styles.profileInputError]} />
                    {adminProfileErrors.lastName ? <Text accessibilityLiveRegion="polite" style={styles.profileFieldError}>{adminProfileErrors.lastName}</Text> : null}
                  </View>
                  <View style={[styles.profileField, compact && styles.profileFieldCompact]}>
                    <Text nativeID="admin-contact-label" style={styles.profileFieldLabel}>Contact number <Text style={styles.profileOptional}>(optional)</Text></Text>
                    <TextInput value={adminProfileDraft.contactNumber} onChangeText={(value) => { setAdminProfileDraft((current) => ({ ...current, contactNumber: value })); if (adminProfileErrors.contactNumber) setAdminProfileErrors((current) => ({ ...current, contactNumber: undefined })); }} onBlur={() => { const value = adminProfileDraft.contactNumber.trim(); const digits = value.replace(/[\s()-]/g, '').replace(/^\+/, ''); setAdminProfileErrors((current) => ({ ...current, contactNumber: value && !/^(09\d{9}|639\d{9})$/.test(digits) ? 'Enter a Philippine number, such as 0917 123 4567 or +63 917 123 4567.' : undefined })); }} accessibilityLabel="Contact number, optional" accessibilityLabelledBy="admin-contact-label" keyboardType="phone-pad" autoComplete="tel" placeholder="Not provided" placeholderTextColor={C.subtle} style={[styles.profileInput, adminProfileErrors.contactNumber && styles.profileInputError]} />
                    {adminProfileErrors.contactNumber ? <Text accessibilityLiveRegion="polite" style={styles.profileFieldError}>{adminProfileErrors.contactNumber}</Text> : null}
                  </View>
                </> : <>
                  <View style={[styles.profileField, compact && styles.profileFieldCompact]}><Text style={styles.profileFieldLabel}>First name</Text><Text style={styles.profileFieldValue}>{profile.firstName || 'Not provided'}</Text></View>
                  <View style={[styles.profileField, compact && styles.profileFieldCompact]}><Text style={styles.profileFieldLabel}>Last name</Text><Text style={styles.profileFieldValue}>{profile.lastName || 'Not provided'}</Text></View>
                  <View style={[styles.profileField, compact && styles.profileFieldCompact]}><Text style={styles.profileFieldLabel}>Contact number</Text><Text style={styles.profileFieldValue}>{profile.contactNumber || 'Not provided'}</Text></View>
                </>}
              </View>
              {editingAdminProfile ? <View style={styles.profileActions}><Button label="Cancel" onPress={cancelAdminProfileEdit} /><Button label="Save changes" kind="primary" onPress={saveAdminProfile} /></View> : null}
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>Administrative access</Text>
              <View style={[styles.profileFields, compact && styles.profileFieldsCompact]}>
                <View style={[styles.profileField, compact && styles.profileFieldCompact]}><Text style={styles.profileFieldLabel}>Role</Text><Text style={styles.profileFieldValue}>Center Administrator</Text></View>
                <View style={[styles.profileField, compact && styles.profileFieldCompact]}><Text style={styles.profileFieldLabel}>Account status</Text><Text style={styles.profileFieldValue}>Active</Text></View>
                <View style={[styles.profileField, styles.profileFieldWide]}><Text style={styles.profileFieldLabel}>Assigned institution</Text><Text style={styles.profileFieldValue}>{centerSettings.name}</Text></View>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>

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

    <Modal visible={Boolean(closurePatient)} transparent animationType="fade" onRequestClose={() => setClosurePatient(null)}><Pressable style={styles.overlay} onPress={() => setClosurePatient(null)}><Pressable style={[styles.dialog, styles.formDialog, styles.closureDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title={`Close enrollment — ${closureCategory.replace('Authorized ', '')}`} subtitle="Record an authorized administrative closure" onClose={() => setClosurePatient(null)} /><ScrollView style={styles.closureDialogBody} keyboardShouldPersistTaps="handled"><View style={styles.requestReviewNotice}><Ionicons name="information-circle-outline" size={19} color={C.blue} /><Text style={styles.noticeText}>Clinical discharge is recorded by the Therapist. This form is for an authorized withdrawal, external transfer, or other administrative closure.</Text></View>{closurePatient ? <View style={styles.archiveIdentity}><Text style={styles.personName}>{closurePatient.name}</Text><Text style={styles.secondaryText}>{closurePatient.studentNumber} · {closurePatient.school}</Text></View> : null}<View style={styles.field}><Text style={styles.fieldLabel}>Closure category</Text><SelectControl label="Closure category" value={closureCategory} options={['Authorized withdrawal', 'External transfer', 'Other authorized administrative closure']} getLabel={(value) => value} onChange={(value) => setClosureCategory(value as Exclude<CareEpisodeClosureCategory, 'Clinical discharge'>)} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Documented reason</Text><TextInput value={closureReason} onChangeText={setClosureReason} placeholder="Enter the authorized reason" placeholderTextColor={C.subtle} multiline style={[styles.input, styles.multilineInput]} /></View><View style={styles.field}><View style={styles.closureEvidenceLabelRow}><Text style={styles.fieldLabel}>Supporting document <Text style={styles.requiredMark}>*</Text></Text><Text style={styles.sourceNote}>Required</Text></View><SupportingDocumentDropzone value={closureEvidence} onChange={setClosureEvidence} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Effective date</Text><EffectiveDateInput value={closureEffectiveDate} onChange={setClosureEffectiveDate} minDate={closurePatient ? closureMinDate(closurePatient.id) : undefined} /></View><View style={styles.field}><Text style={styles.fieldLabel}>Authorization reference</Text><TextInput value={closureAuthorizationReference} onChangeText={setClosureAuthorizationReference} placeholder="Authorization or record reference" placeholderTextColor={C.subtle} style={styles.input} /></View></ScrollView><View style={[styles.dialogActions, styles.closureDialogFooter]}><Button label="Cancel" onPress={() => setClosurePatient(null)} /><Button label="Review closure" kind="primary" disabled={!closureReason.trim() || !closureAuthorizationReference.trim() || !closureEvidence || (!closurePatient || !validClosureDate(closureEffectiveDate, closurePatient.id))} onPress={submitClosureForm} /></View></Pressable></Pressable></Modal>

    <Modal visible={Boolean(reenrollmentPatient)} transparent animationType="fade" onRequestClose={() => setReenrollmentPatient(null)}><Pressable style={styles.overlay} onPress={() => setReenrollmentPatient(null)}><Pressable style={[styles.dialog, styles.formDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title="Restore student enrollment?" subtitle="Confirm a new therapy enrollment" onClose={() => setReenrollmentPatient(null)} /><Text style={styles.confirmMessage}>This will begin a new enrollment for {reenrollmentPatient?.name ?? 'this Student'}. Previous therapy records and professional assignments will remain archived.</Text>{reenrollmentPatient ? <View style={styles.archiveIdentity}><Text style={styles.personName}>{reenrollmentPatient.name}</Text><Text style={styles.secondaryText}>{reenrollmentPatient.studentNumber} · {reenrollmentPatient.school}</Text></View> : null}<View style={styles.requestReviewNotice}><Ionicons name="information-circle-outline" size={19} color={C.blue} /><Text style={styles.noticeText}>Next step: verify eligibility and choose the new assigned Therapist and Teacher. The Therapist makes clinical treatment decisions.</Text></View><View style={styles.field}><Text style={styles.fieldLabel}>New Therapist</Text><SelectControl label="New Therapist" value={reenrollmentTherapistId} options={['', ...professionals.filter((person) => person.role === 'Therapist' && eligibleProfessional(person)).map((person) => person.id)]} getLabel={(value) => value ? professionals.find((person) => person.id === value)?.name ?? value : 'Choose an eligible Therapist'} onChange={setReenrollmentTherapistId} /></View><View style={styles.field}><Text style={styles.fieldLabel}>New Teacher</Text><SelectControl label="New Teacher" value={reenrollmentTeacherId} options={['', ...professionals.filter((person) => person.role === 'Teacher' && eligibleProfessional(person)).map((person) => person.id)]} getLabel={(value) => value ? professionals.find((person) => person.id === value)?.name ?? value : 'Choose an eligible Teacher'} onChange={setReenrollmentTeacherId} /></View><View style={styles.dialogActions}><Button label="Cancel" onPress={() => setReenrollmentPatient(null)} /><Button label="Restore" kind="primary" disabled={!reenrollmentTherapistId || !reenrollmentTeacherId} onPress={completeReenrollment} /></View></Pressable></Pressable></Modal>


    <Modal visible={Boolean(selection) && !inlineAccountDetails} transparent animationType="fade" onRequestClose={() => setSelection(null)}><Pressable style={[styles.overlay, (selectedProfessional || selectedPatient || selectedRelease || selectedRequest) && styles.professionalDrawerOverlay]} onPress={() => setSelection(null)}><Pressable style={[styles.dialog, selectedProfessional ? styles.professionalDrawer : (selectedPatient || selectedRelease || selectedRequest) ? [styles.studentDrawer, compact && styles.studentDrawerCompact] : styles.detailDialog, selectedAccountHeader && detailPanelStyles.accountDetailDialog]} onPress={(event) => event.stopPropagation()}>
      {selectedAccountHeader ? <View style={detailPanelStyles.accountDetailHeader}>{selectedAccountHeader}</View> : null}
      <ScrollView ref={accountDetailScrollRef} style={[styles.detailScroll, selectedAccountHeader && detailPanelStyles.accountDetailModalScroll, (selectedProfessional || selectedPatient || selectedRelease || selectedRequest) && styles.professionalDrawerScroll]} contentContainerStyle={selectedAccountHeader ? detailPanelStyles.accountDetailModalContent : undefined} showsVerticalScrollIndicator={false}>{selectedDetailsContent}</ScrollView>
      {selectedRequestFooter}
    </Pressable></Pressable></Modal>

    <Modal visible={Boolean(offboardingId)} transparent animationType="fade" onRequestClose={() => { setOffboardingId(null); setOffboardingReason(''); }}><Pressable style={styles.overlay} onPress={() => { setOffboardingId(null); setOffboardingReason(''); }}><Pressable style={[styles.dialog, styles.formDialog]} onPress={(event) => event.stopPropagation()}><ModalHeader title={`Deactivate ${offboardingPerson?.name ?? 'Therapist'}`} subtitle={`${offboardingPatients.length} assigned student${offboardingPatients.length === 1 ? '' : 's'} must be reassigned first; deactivation then moves this account to Archive Center.`} onClose={() => { setOffboardingId(null); setOffboardingReason(''); }} /><View style={styles.requestReviewNotice}><Ionicons name="git-branch-outline" size={19} color={C.orange} /><Text style={styles.noticeText}>Choose an active replacement Therapist for every enrolled student. Their assignment history stays in the activity log.</Text></View><ScrollView style={styles.offboardingList}>{offboardingPatients.map((patient) => <View key={patient.id} style={styles.offboardingRow}><View style={styles.offboardingPatient}>{avatar(patient.name)}<View style={styles.personText}><Text style={styles.personName}>{patient.name}</Text><Text style={styles.secondaryText}>{patient.studentNumber}</Text></View></View><SelectControl label={`Replacement Therapist for ${patient.name}`} value={offboardingChoices[patient.id] ?? ''} options={['', ...eligibleReplacements(patient.id).map((person) => person.id)]} getLabel={(id) => id ? professionals.find((person) => person.id === id)?.name ?? id : 'Choose Therapist'} onChange={(id) => setOffboardingChoices((current) => ({ ...current, [patient.id]: id }))} /></View>)}</ScrollView><View style={styles.field}><Text style={styles.fieldLabel}>Reason for deactivation</Text><TextInput value={offboardingReason} onChangeText={setOffboardingReason} placeholder="Enter a reason" placeholderTextColor={C.subtle} multiline style={[styles.input, { minHeight: 58, paddingTop: 10, textAlignVertical: 'top' }]} /></View><View style={styles.dialogActions}><Button label="Cancel" onPress={() => { setOffboardingId(null); setOffboardingReason(''); }} /><Button label="Reassign & deactivate" kind="danger" onPress={finalizeOffboarding} disabled={offboardingPatients.some((patient) => !offboardingChoices[patient.id]) || !offboardingReason.trim()} /></View></Pressable></Pressable></Modal>

    <Modal visible={Boolean(confirmation)} transparent animationType="fade" accessibilityViewIsModal onRequestClose={closeConfirmation}>
      <Pressable style={styles.overlay} onPress={closeConfirmation}>
        <Pressable style={styles.confirmDialog} onPress={(event) => event.stopPropagation()}>
          <ScrollView style={styles.confirmBody} contentContainerStyle={styles.confirmBodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.confirmIcon, confirmation?.danger && styles.confirmIconDanger]} accessibilityElementsHidden>
              <Ionicons name={confirmation?.danger ? 'warning-outline' : confirmation?.icon ?? 'help-circle-outline'} size={22} color={confirmation?.danger ? C.red : C.blue} />
            </View>
            <Text style={styles.dialogTitle}>{confirmation?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmation?.message}</Text>
            {confirmation?.requiresReason ? <View style={[styles.field, styles.confirmReasonField]}>
              <View style={styles.requiredFieldLabel}>
                <Text style={[styles.fieldLabel, styles.requiredFieldLabelText]}>Administrative reason</Text>
                <Text style={styles.requiredMark} accessible={false}>*</Text>
              </View>
              <TextInput
                accessibilityLabel="Administrative reason, required"
                value={confirmationReason}
                onChangeText={(value) => { setConfirmationReason(value); confirmationReasonRef.current = value; }}
                placeholder="Describe why this action is needed?"
                placeholderTextColor={C.subtle}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.input, styles.confirmReasonInput]}
              />
            </View> : null}
            {confirmation?.requiresEvidence ? <View style={styles.field}><Text style={styles.fieldLabel}>Verified evidence reference</Text><TextInput value={confirmationEvidence} onChangeText={(value) => { setConfirmationEvidence(value); confirmationEvidenceRef.current = value; }} placeholder="School record or document reference?" placeholderTextColor={C.subtle} style={styles.input} /></View> : null}
          </ScrollView>
          <View style={styles.dialogActions}>
            <Button label="Cancel" onPress={closeConfirmation} disabled={confirmationSubmitting} />
            <Button
              label={confirmation?.actionLabel ?? 'Continue'}
              kind={confirmation?.danger ? 'danger' : 'primary'}
              disabled={Boolean(confirmation?.requiresReason && !confirmationReason.trim()) || Boolean(confirmation?.requiresEvidence && !confirmationEvidence.trim())}
              loading={confirmationSubmitting}
              onPress={submitConfirmation}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    {toast ? <View style={styles.toast} accessibilityLiveRegion="polite"><Ionicons name="checkmark-circle" size={19} color={C.green} /><Text style={styles.toastText}>{toast}</Text><TouchableOpacity onPress={() => setToast('')} accessibilityLabel="Dismiss notification"><Ionicons name="close" size={17} color={C.muted} /></TouchableOpacity></View> : null}
  </View>;
}

function EffectiveDateInput({ value, onChange, minDate }: { value: string; onChange: (date: string) => void; minDate?: Date }) {
  const date = parseCalendarDate(value, 'iso');
  const today = todayCalendarDate();
  const warning = value.length !== 10 ? '' : !date ? 'Enter a valid date in YYYY-MM-DD format.'
    : date > today ? 'The effective date must be today or earlier.'
    : minDate && date < minDate ? 'The effective date cannot be before enrollment began.' : '';
  return <>
    <AssignmentCalendar label="Effective date" format="iso" value={value} onSelect={onChange} isDark={false} minDate={minDate} maxDate={today}
      dateNotice={minDate ? 'Choose a date from the start of enrollment through today.' : 'Choose today or an earlier date.'} />
    {warning ? <Text accessibilityRole="alert" style={{ color: C.red }}>{warning}</Text> : null}
  </>;
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return <View style={styles.modalHeader}><View style={styles.modalHeaderText}><Text style={styles.dialogTitle}>{title}</Text>{subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}</View><TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close dialog"><Ionicons name="close" size={20} color={C.ink} /></TouchableOpacity></View>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailCell}><Text style={[styles.detailLabel, { fontSize: 11, lineHeight: 16, marginBottom: 4 }]}>{label}</Text><Text style={[styles.detailValue, { fontSize: 14, lineHeight: 20 }]}>{value}</Text></View>;
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
  personColumnWithPanel: { flex: 1.8, minWidth: 180, paddingRight: 8 },
  idColumnWithPanel: { flex: 0.75, minWidth: 88 },
  studentDataColumnWithPanel: { flex: 0.82, minWidth: 82 },
  enrollmentColumnWithPanel: { flex: 0.68, minWidth: 74 },
  statusColumnWithPanel: { flex: 0.72, minWidth: 96 },
  setupColumnWithPanel: { flex: 0.68, minWidth: 96 },
  assignmentColumnWithPanel: { flex: 0.7, minWidth: 96 },
  detailSection: { paddingTop: 17, paddingBottom: 14 },
  accountDetailHeader: { paddingHorizontal: 22, paddingTop: 14 },
  accountDetailDialog: { padding: 0, overflow: 'hidden', flexDirection: 'column' as const },
  accountDetailModalScroll: { flex: 1, flexGrow: 1, flexShrink: 1, minHeight: 0, maxHeight: '100%' },
  accountDetailModalContent: { paddingHorizontal: 20, paddingBottom: 20 },
  accountDetailSectionTitle: { color: C.ink, fontFamily: 'Geist-SemiBold' as const, fontSize: 15, lineHeight: 20, marginBottom: 7 },
  accountDetailGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, paddingTop: 2, paddingBottom: 2 },
  studentDetailSection: { paddingTop: 18, paddingBottom: 8, borderTopWidth: 0 },
  studentFieldLabel: { color: C.muted, fontFamily: 'Geist-Medium' as const, fontSize: 12, lineHeight: 17 },
  studentDetailValue: { color: C.ink, fontFamily: 'Geist-Medium' as const, fontSize: 15, lineHeight: 21 },
  studentAssignmentBlock: { paddingBottom: 6 },
  studentAssignmentValue: { minHeight: 38, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9 },
  detailNameLine: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  assignmentNameLine: { minHeight: 36, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 12 },
  assignmentIconButton: { width: 34, height: 34, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 6 },
  accountManagementActions: { borderTopWidth: 0, paddingTop: 10, marginTop: 0, justifyContent: 'flex-start' as const },
};

const styles = StyleSheet.create({
  nameRequestRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  nameRequestCopy: { flexGrow: 1, flexShrink: 1, minWidth: 170, gap: 3 },
  nameRequestActions: { flexDirection: 'row', gap: 8 },
  professionalDrawerOverlay: { justifyContent: 'flex-start', alignItems: 'flex-end', padding: 0 },
  professionalDrawer: { width: '100%', maxWidth: 500, height: '100%', maxHeight: '100%', alignSelf: 'stretch', padding: 24, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  studentDrawer: { width: 560, maxWidth: '100%', height: '100%', maxHeight: '100%', alignSelf: 'stretch', padding: 24, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  studentDrawerCompact: { width: '100%', maxWidth: '100%', borderRadius: 0, padding: 17 },
  professionalDrawerScroll: { flex: 1, flexGrow: 1, maxHeight: '100%' },
  accountPagination: { minHeight: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 10 }, accountPaginationCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 9 }, accountPaginationSummary: { flex: 1, color: '#3C576C', fontSize: 12 }, accountPaginationControls: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 3 }, accountPaginationControlsCompact: { flex: 0 }, accountPaginationSide: { flex: 1 }, pageArrow: { width: 36, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, pageArrowDisabled: { opacity: 0.42, backgroundColor: '#F0F4F7' }, doubleChevronSecond: { marginLeft: -8 }, pageNumber: { minWidth: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, pageNumberActive: { backgroundColor: C.blue, borderWidth: 1, borderColor: C.blue }, pageNumberText: { color: C.ink, fontSize: 12 }, pageNumberTextActive: { color: C.white, fontFamily: 'Geist-SemiBold' },
  roleTableCell: { flex: 0.68, minWidth: 96 }, roleBadge: { backgroundColor: '#F0F4F7', minHeight: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 }, roleBadgeText: { color: '#3C576C', textAlign: 'center', fontSize: 11, fontFamily: 'Geist-SemiBold' }, idTableCell: { flex: 1.05, minWidth: 105 }, studentDetailsCell: { flex: 1.15, minWidth: 125 }, enrollmentTableCell: { flex: 0.9, minWidth: 92 }, statusTableCell: { flex: 0.95, minWidth: 92 }, setupTableCell: { flex: 0.88, minWidth: 96 }, assignmentTableCell: { flex: 0.8, minWidth: 96 },
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
  archiveTabs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: C.line }, archiveRecord: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: C.line, gap: 5 }, archiveRecordHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 9 }, archiveRecordFields: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 2 }, archiveRecordActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }, archiveTextAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }, archiveIdentity: { paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, gap: 3 },
  pageScroll: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 45, maxWidth: 1500, width: '100%', alignSelf: 'center', gap: 24 }, pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, minHeight: 54 }, pageHeaderText: { flex: 1, minWidth: 0 }, pageTitle: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 27, letterSpacing: -0.55 }, pageSubtitle: { color: C.muted, fontSize: 13, marginTop: 5, lineHeight: 19 },
  button: { minHeight: 44, flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center', borderRadius: 7, paddingHorizontal: 13, paddingVertical: 8 }, button_primary: { backgroundColor: C.blue }, button_secondary: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line }, button_text: { backgroundColor: 'transparent', paddingHorizontal: 7 }, button_danger: { backgroundColor: C.redSoft, borderWidth: 1, borderColor: '#F3D1D4' }, buttonText: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12 }, buttonTextPrimary: { color: C.white }, buttonTextDanger: { color: C.red }, buttonTextAccent: { color: C.blue }, buttonDisabled: { opacity: 0.46 }, mutedText: { color: C.muted },
  metricStrip: { flexDirection: 'row', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, overflow: 'hidden' }, metric: { flex: 1, minWidth: 0, paddingHorizontal: 18, paddingVertical: 16, borderRightWidth: 1, borderRightColor: C.line }, metricCompact: { minWidth: '48%' as any, borderBottomWidth: 1, borderBottomColor: C.line, borderRightWidth: 0 }, metricStripCompact: { flexWrap: 'wrap' }, metricLabel: { color: C.muted, fontSize: 12, fontFamily: 'Geist-Medium' }, metricValueLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, metricValue: { color: C.ink, fontSize: 29, lineHeight: 34, fontFamily: 'Geist-SemiBold', fontVariant: ['tabular-nums'] }, metricFoot: { color: C.subtle, fontSize: 10, marginTop: 5 }, attentionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  attentionPanel: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  caseloadList: { gap: 0 }, caseloadRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 8 }, caseloadTrack: { flex: 1, height: 8, backgroundColor: '#EEF3F6', borderRadius: 4, overflow: 'hidden' }, caseloadFill: { height: '100%', backgroundColor: '#83B84A', borderRadius: 4 },
  activityPanel: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  profileMenu: { position: 'absolute', top: 50, right: 0, width: 220, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 8, zIndex: 30, ...(Platform.OS === 'web' ? { boxShadow: '0 12px 34px rgba(23,54,77,0.16)' } : { elevation: 8 }) }, profileMenuItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, borderRadius: 7 }, profileMenuText: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 13 },
  assignmentOverview: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 17 }, assignmentOverviewRows: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18 }, assignmentOverviewRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, width: '48%' as any, borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 7 }, assignmentOverviewRowCompact: { width: '100%' as any }, assignmentOverviewName: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium', flex: 1 }, assignmentOverviewCount: { color: C.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  dashboardColumns: { flexDirection: 'row', alignItems: 'flex-start', gap: 30 }, dashboardColumnsCompact: { flexDirection: 'column' }, attentionColumn: { flex: 1.08, minWidth: 0 }, activityColumn: { flex: 0.92, minWidth: 0 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 13 }, sectionTitle: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 16 }, sectionSub: { color: C.muted, fontSize: 11, marginTop: 4, lineHeight: 16 }, attentionCount: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingHorizontal: 2 }, countText: { color: C.red, fontSize: 23, lineHeight: 27, fontFamily: 'Geist-SemiBold', fontVariant: ['tabular-nums'] }, attentionCountLabel: { color: C.red, fontSize: 11, fontFamily: 'Geist-Medium' }, countTextClear: { color: C.green }, attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.line }, attentionIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, attentionCopy: { flex: 1, minWidth: 0 }, attentionTitle: { color: C.ink, fontSize: 13, fontFamily: 'Geist-SemiBold', marginBottom: 3 }, attentionTime: { color: C.subtle, fontSize: 10, marginTop: 5 }, clearState: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 9 }, clearStateText: { color: C.green, fontFamily: 'Geist-Medium', fontSize: 13 }, linkText: { color: C.blue, fontSize: 12, fontFamily: 'Geist-SemiBold' },
  activityItem: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 22, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.line }, activityItemCompact: { paddingVertical: 12 }, activityMark: { position: 'absolute', left: 0, top: 18, width: 7, height: 7, borderRadius: 4 }, activityCopy: { flex: 1, minWidth: 0 }, activityTitle: { color: C.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 4 }, secondaryText: { color: '#3C576C', fontSize: 12, lineHeight: 17 }, activityDate: { color: C.subtle, fontSize: 10, marginTop: 3, textAlign: 'right' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.blueSoft, borderRadius: 7, paddingVertical: 10, paddingHorizontal: 12, alignSelf: 'flex-start' }, noticeText: { color: C.blueDeep, fontSize: 11, lineHeight: 16, flexShrink: 1 }, directoryControls: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }, accountSearchArea: { gap: 10 }, accountSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, accountFilterTagRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }, accountFilterTag: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#B9DCF2', borderRadius: 15, backgroundColor: '#F1F8FC' }, accountFilterTagText: { color: C.blueDeep, fontSize: 11, fontFamily: 'Geist-Medium' }, accountFilterReset: { marginLeft: 'auto' as any, minHeight: 30, justifyContent: 'center', paddingHorizontal: 6 }, accountFilterResetText: { color: C.blue, fontSize: 11, fontFamily: 'Geist-Medium' }, accountRoleTabs: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: C.line }, accountRoleTab: { flex: 1, minWidth: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, position: 'relative' }, accountRoleTabHover: { backgroundColor: '#F7FAFC' }, accountRoleTabPressed: { backgroundColor: C.blueSoft }, accountRoleTabText: { color: C.muted, fontSize: 12, fontFamily: 'Geist-Medium' }, accountRoleTabTextSelected: { color: C.blue, fontFamily: 'Geist-SemiBold' }, accountRoleTabIndicator: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, backgroundColor: C.blue }, searchBox: { width: 440, maxWidth: '100%' as any, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, paddingHorizontal: 11 }, searchBoxFullWidth: { width: 0, minWidth: 0, flex: 1 }, accountFiltersButton: { height: 44, minWidth: 86, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 11, borderWidth: 1, borderColor: C.line, borderRadius: 7, backgroundColor: C.white }, accountFiltersButtonText: { color: C.blueDeep, fontSize: 12, fontFamily: 'Geist-Medium' }, accountFiltersCount: { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: C.blueSoft }, accountFiltersCountText: { color: C.blue, fontSize: 10, fontFamily: 'Geist-SemiBold' }, accountFiltersDialog: { maxWidth: 440, maxHeight: '88%' }, accountFiltersDialogBody: { flexGrow: 0, maxHeight: 490 }, accountFiltersDialogContent: { gap: 13, paddingBottom: 4 }, searchInput: { flex: 1, color: C.ink, fontSize: 13, paddingVertical: 0 } as any, filterWrap: { gap: 5 }, multiFilterAnchor: { position: 'relative', zIndex: 20 }, filterLabel: { color: C.muted, fontSize: 10, fontFamily: 'Geist-Medium' }, roleFilterLabel: { color: C.ink, fontSize: 12 }, selectFrame: { minWidth: 140, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, overflow: 'hidden', paddingRight: 10 }, roleFilterFrame: { width: 172, height: 54 }, selectNativeValue: { color: C.ink, fontSize: 13, paddingLeft: 11, flex: 1 }, selectIcon: { position: 'absolute', right: 10, top: 12, pointerEvents: 'none' as any }, nativeOptions: { width: '88%' as any, maxWidth: 390, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.white }, nativeOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line }, columnFilterWrap: { position: 'relative' }, columnFilterWrapOpen: { zIndex: 120, elevation: 12 }, columnFilterTrigger: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 5 }, columnFilterLabel: { color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, columnFilterMenu: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, zIndex: 100, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 22px rgba(23,54,77,0.16)' } : { elevation: 10 }) } as any, multiFilterMenu: { position: 'absolute', top: 45, left: 0, minWidth: 190, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, zIndex: 120, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 22px rgba(23,54,77,0.16)' } : { elevation: 12 }) } as any, columnFilterOption: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 5 }, columnFilterOptionText: { color: C.ink, fontSize: 11 }, columnFilterOptionSelected: { color: C.blue, fontFamily: 'Geist-SemiBold' }, directoryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, resultCount: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 12 },
  table: { backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line }, tableHead: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: '#F0F7FB', borderBottomWidth: 1, borderBottomColor: C.line, position: 'relative', zIndex: 10 }, tableHeadCell: { flex: 1, minWidth: 70, color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, personHead: { flex: 2.2 }, tableRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: '#E5EEF4' }, rowHover: { backgroundColor: '#F4F9FC' }, personCell: { flex: 2.2, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: 'Geist-SemiBold', fontSize: 11 }, personText: { flex: 1, minWidth: 0 }, personName: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 12 }, tableCell: { flex: 1, minWidth: 70, color: C.ink, fontSize: 11 }, numberCell: { textAlign: 'center', fontVariant: ['tabular-nums'] }, rowAction: { width: 22, alignItems: 'flex-end' }, status: { maxWidth: '100%', minHeight: 26, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 }, statusDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 }, statusText: { textAlign: 'center', flexShrink: 1, fontSize: 11, fontFamily: 'Geist-SemiBold' }, mobileRows: { gap: 9 }, mobileRow: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 13, gap: 12 }, mobileRowBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9, paddingLeft: 46 }, studentMobileDetails: { gap: 2, paddingLeft: 46 },
  requestMetaControls: { flexDirection: 'row', alignItems: 'center', gap: 10 }, requestFilterActive: { backgroundColor: C.blueSoft, borderColor: C.blueLine }, requestFilterPanel: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, requestList: { width: '100%', alignSelf: 'stretch', borderTopWidth: 1, borderColor: C.line }, requestTableHeader: { width: '100%', minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, backgroundColor: '#F2F7FA', borderBottomWidth: 1, borderBottomColor: C.line, position: 'relative', zIndex: 10, elevation: 2 }, requestColumnHeader: { minWidth: 0, color: C.muted, fontSize: 10, fontFamily: 'Geist-SemiBold' }, requestTableRow: { width: '100%', minWidth: 0, minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: C.line }, requestTableCell: { minWidth: 0, flexShrink: 1, gap: 3, justifyContent: 'center' }, requestCellPrimary: { color: C.ink, fontSize: 11, lineHeight: 16, fontFamily: 'Geist-SemiBold' }, requestId: { color: C.subtle, fontSize: 9 }, requestOverdue: { color: C.yellow, fontSize: 10, fontFamily: 'Geist-SemiBold', marginTop: 3 }, requestStatusMeta: { color: C.yellow, fontSize: 10, marginTop: 4 }, requestSectionTitle: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 13, marginBottom: 5 }, requestWarning: { marginTop: 8, paddingVertical: 9, paddingHorizontal: 10, backgroundColor: C.yellowSoft, borderRadius: 6, gap: 3 }, requestWarningTitle: { color: C.yellow, fontFamily: 'Geist-SemiBold', fontSize: 11 }, requestActionOptions: { gap: 0, marginTop: 4 }, requestActionOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line }, requestActionOptionSelected: { backgroundColor: '#F4FAFE' }, radioOuter: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1.5, borderColor: C.subtle }, radioOuterSelected: { borderColor: C.blue }, radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue }, requestDrawerFooter: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white }, requestCancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, requestCancelText: { color: C.blue, fontFamily: 'Geist-Medium', fontSize: 12 }, actionPanel: { gap: 10, marginTop: 12, padding: 13, backgroundColor: '#F6FAFC', borderRadius: 8, borderWidth: 1, borderColor: C.line }, multilineInput: { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' } as any, assignmentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }, assignmentEdit: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }, requestEvent: { flexDirection: 'row', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line }, requestEventMark: { width: 8, height: 8, marginTop: 4, borderRadius: 4, backgroundColor: C.blue },
  patientHeaderNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, paddingHorizontal: 13, backgroundColor: C.blueSoft, borderRadius: 7 }, patientHeaderNoteText: { color: C.blueDeep, fontSize: 11, flex: 1 }, requestSection: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 16 }, requestRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: C.line }, requestMain: { flex: 1 },
  logList: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  logHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, backgroundColor: '#F0F7FB', borderBottomWidth: 1, borderBottomColor: C.line },
  logHeading: { color: C.muted, fontSize: 11, fontFamily: 'Geist-SemiBold' },
  logFilterRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4, position: 'relative', zIndex: 20 },
  logActiveFilters: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  logRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line, cursor: 'pointer' } as any,
  logRowHover: { backgroundColor: '#F5FAFD' },
  logRowPressed: { backgroundColor: C.blueSoft },
  logRowStacked: { flexWrap: 'wrap', columnGap: 12, rowGap: 8, paddingVertical: 11, paddingRight: 37 },
  logStackedCell: { flexBasis: '45%', flexGrow: 1, minWidth: 0, gap: 2 },
  logPrimary: { color: C.ink, fontSize: 12, lineHeight: 17, fontFamily: 'Geist-Medium' },
  logSecondary: { color: C.muted, fontFamily: 'Geist-Regular', fontSize: 11, lineHeight: 15 },
  clickableRow: { cursor: 'pointer' },
  archiveRowTarget: { zIndex: 1 },
  archiveRowActions: { zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 }, archiveDetailsArrow: { width: 26, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  archiveDetailSection: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: '#C5D9E8', paddingTop: 18, paddingBottom: 18 },
  archiveDetailReason: { flex: 0 },
  raisedFilterControls: { position: 'relative', zIndex: 20 },
  filterableTableLayer: { position: 'relative', zIndex: 0 },
  directoryPersonCell: { flex: 1.65 },
  directoryIdCell: { flex: 0.75, minWidth: 90, paddingLeft: 12 },
  centeredBadgeCell: { flex: 0.85, alignItems: 'center' },
  directoryRoleCell: { minWidth: 110 },
  roleFilterMenu: { paddingHorizontal: 4 },
  columnFilterBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  columnFilterPosition: { position: 'absolute' },
  closureDialog: { overflow: 'hidden' },
  closureDialogBody: { flexGrow: 0, flexShrink: 1, minHeight: 0 },
  closureDialogFooter: { flexShrink: 0, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12, marginTop: 0 },
  closureEvidenceLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  leadingBadgeCell: { alignItems: 'flex-start' },
  archiveTableColumns: { columnGap: 14 },
  archiveStatusCell: { minWidth: 146 },
  archiveReasonCell: { flex: 1.5, minWidth: 145, paddingRight: 10 },
  settingsPanel: { paddingVertical: 18, paddingHorizontal: 20, backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line }, settingRowCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 6 }, settingInputCompact: { width: '100%', textAlign: 'left' }, settingValueCompact: { textAlign: 'left' }, settingLabel: { color: C.muted, fontSize: 12 }, settingValue: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium', textAlign: 'right', flexShrink: 1 }, settingInput: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12, textAlign: 'right', width: '68%' as any, minHeight: 38, paddingHorizontal: 8, borderWidth: 1, borderColor: C.line, borderRadius: 6, backgroundColor: C.white } as any, settingsAction: { alignSelf: 'flex-end', marginTop: 15 }, profileSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  profileDialog: { width: '100%', maxWidth: 620, maxHeight: '88%', flexShrink: 1, backgroundColor: C.white, borderRadius: 11, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 8, borderWidth: 1, borderColor: C.line, ...(Platform.OS === 'web' ? { boxShadow: '0 18px 50px rgba(23,54,77,0.17)' } : { elevation: 8 }) } as any,
  profileModalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingBottom: 12 }, profileModalHeading: { flex: 1, minWidth: 0, paddingTop: 3 }, profileCloseButton: { width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 7, marginTop: -5 }, profileScroll: { flexShrink: 1 }, profileScrollContent: { paddingBottom: 12 },
  profileIdentity: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line }, profileAvatar: { width: 54, height: 54, flexShrink: 0, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F3FA' }, profileAvatarText: { color: C.blue, fontFamily: 'Geist-SemiBold', fontSize: 15 }, profileIdentityCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 3 }, profileIdentityName: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 17, lineHeight: 23 }, profileEmail: { color: C.muted, fontSize: 13, lineHeight: 19, maxWidth: '100%' },
  profileFieldsCompact: { flexDirection: 'column' }, profileFieldCompact: { width: '100%' },
  profileSection: { paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line }, profileSectionHeading: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, profileSectionTitle: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 15, lineHeight: 21 }, profileEditButton: { minWidth: 44, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, borderRadius: 6 }, profileEditText: { color: C.blue, fontFamily: 'Geist-Medium', fontSize: 13 }, profileFields: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 4 }, profileField: { width: '50%', minWidth: 150, paddingHorizontal: 4, paddingTop: 9, paddingBottom: 5 }, profileFieldWide: { width: '100%' }, profileFieldLabel: { color: C.muted, fontSize: 12, lineHeight: 17, marginBottom: 3 }, profileFieldValue: { color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 14, lineHeight: 20, overflow: 'hidden' }, profileOptional: { color: C.subtle, fontFamily: 'Geist-Regular' }, profileInput: { minHeight: 42, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, color: C.ink, fontFamily: 'Geist-Regular', fontSize: 16 } as any, profileInputError: { borderColor: C.red }, profileFieldError: { color: C.red, fontSize: 11, lineHeight: 15, marginTop: 4 }, profileActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  profileDiscardNotice: { marginTop: 12, padding: 12, backgroundColor: '#FFF4D8', borderRadius: 7 }, profileDiscardText: { color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12 }, profileDiscardActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(14, 38, 56, 0.38)', padding: 18 }, mobileDrawer: { alignSelf: 'stretch', maxWidth: 310, width: '88%', height: '100%', marginRight: 'auto', backgroundColor: C.white, borderRadius: 9, overflow: 'hidden' }, dialog: { width: '100%', maxWidth: 610, maxHeight: '88%', backgroundColor: C.white, borderRadius: 11, padding: 23, borderWidth: 1, borderColor: C.line, ...(Platform.OS === 'web' ? { boxShadow: '0 18px 50px rgba(23,54,77,0.17)' } : { elevation: 8 }) } as any, detailDialog: { maxWidth: 650 }, detailScroll: { maxHeight: 520, flexGrow: 0 } as any, formDialog: { maxWidth: 520 }, accountDialog: { height: 520, maxHeight: '88%', overflow: 'hidden' }, confirmDialog: { width: '100%', maxWidth: 533, maxHeight: '90%', flexShrink: 1, backgroundColor: C.white, borderRadius: 11, padding: 30, alignItems: 'flex-start', borderWidth: 1, borderColor: C.line, ...(Platform.OS === 'web' ? { boxShadow: '0 18px 50px rgba(23,54,77,0.17)' } : { elevation: 8 }) } as any, confirmBody: { width: '100%', flexShrink: 1 } as any, confirmBodyContent: { alignItems: 'stretch' }, notificationLayer: { flex: 1 }, notificationPopover: { position: 'absolute', width: 360, maxWidth: '92%', maxHeight: '78%', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 18, ...(Platform.OS === 'web' ? { boxShadow: '0 14px 38px rgba(23,54,77,0.20)' } : { elevation: 10 }) }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, marginBottom: 18 }, modalHeaderText: { flex: 1 }, dialogTitle: { color: C.ink, fontSize: 19, fontFamily: 'Geist-SemiBold' }, closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }, detailIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.line }, detailName: { color: C.ink, fontSize: 17, fontFamily: 'Geist-SemiBold' }, detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, paddingVertical: 12 }, detailCell: { width: '50%', paddingVertical: 10, paddingRight: 12 }, detailLabel: { color: C.subtle, fontSize: 10, marginBottom: 5 }, detailValue: { color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium' }, detailSection: { paddingTop: 15, paddingBottom: 10, borderTopWidth: 1, borderTopColor: C.line }, fieldLabel: { color: C.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 8 }, requiredFieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 }, requiredFieldLabelText: { marginBottom: 0 }, requiredMark: { color: C.red, fontFamily: 'Geist-SemiBold', fontSize: 15, lineHeight: 18 }, confirmReasonField: { width: '100%' }, confirmReasonInput: { width: '100%', height: 104, minHeight: 104, paddingTop: 10, textAlignVertical: 'top' } as any, linkedPatient: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 40 }, smallAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }, smallAvatarText: { color: C.blue, fontSize: 9, fontFamily: 'Geist-SemiBold' }, assignmentSummary: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 }, assignmentTrigger: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }, choiceList: { borderWidth: 1, borderColor: C.line, borderRadius: 7, marginTop: 3, paddingHorizontal: 10 }, choiceRow: { minHeight: 39, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }, sourceNote: { color: C.subtle, fontSize: 10, lineHeight: 15, marginTop: 7 }, detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: C.line }, requestReviewNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.yellowSoft, padding: 12, borderRadius: 7, marginBottom: 12 }, requestReason: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 18 }, confirmIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, confirmIconDanger: { backgroundColor: C.redSoft }, confirmMessage: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 16 }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 9, marginTop: 15, alignSelf: 'stretch' },
  field: { gap: 6, marginBottom: 14 }, input: { height: 42, paddingHorizontal: 11, borderRadius: 7, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, color: C.ink, fontSize: 13 } as any, roleChoices: { flexDirection: 'row', gap: 9, marginBottom: 14 }, roleChoice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, height: 44, borderWidth: 1, borderColor: C.line, borderRadius: 7 }, roleChoiceActive: { borderColor: C.blue, backgroundColor: C.blueSoft }, roleChoiceText: { color: C.muted, fontSize: 12 }, roleChoiceTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, formHint: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.blueSoft, borderRadius: 7, padding: 10 }, errorText: { color: C.red, fontSize: 11, marginTop: 10 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }, segment: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#F0F6FA' }, segmentActive: { backgroundColor: C.blueSoft }, segmentText: { color: C.muted, fontSize: 11 }, segmentTextActive: { color: C.blue, fontFamily: 'Geist-SemiBold' }, markAll: { marginLeft: 'auto' as any, padding: 6 }, notificationList: { maxHeight: 400 }, notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.line }, unreadMark: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.blue, marginTop: 5 }, readMark: { backgroundColor: C.line },
  offboardingList: { maxHeight: 360 }, offboardingRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, gap: 9 }, offboardingPatient: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 18, backgroundColor: C.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }, emptyTitle: { color: C.ink, fontSize: 14, fontFamily: 'Geist-SemiBold' }, toast: { position: 'absolute', bottom: 22, right: 24, maxWidth: '90%' as any, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 9px 24px rgba(23,54,77,0.14)' } : { elevation: 5 }) } as any, toastText: { color: C.ink, fontSize: 12, flexShrink: 1, maxWidth: 480 },
});
